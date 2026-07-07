import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import { Minus, Plus, Share2, Link2, PackageOpen, CreditCard, Star, Package } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductReviews } from "@/components/ProductReviews";
import { PrintPicker } from "@/components/PrintPicker";
import { ArtworkUpload, artworkSummary, type ArtworkFile } from "@/components/ArtworkUpload";
import { SampleDialog } from "@/components/SampleDialog";
import {
  findProduct,
  findCategory,
  findSubcategory,
  allProducts,
  isNonGarmentCategory,
  isArrheniuxCategory,
  priceValue,
  getDiscountPct,
  getMOQ,
  getMaxQty,
  getAccessoryRules,
  getGstPct,
  getCourierPerPc,
  productCode,
  supportsPrint,
  isWelcomeKitCategory,
  WELCOME_KIT_ITEMS,
  WELCOME_KIT_MIN,
  WELCOME_KIT_MIN_ITEMS,
  welcomeKitUnitPrice,
} from "@/data/catalog";
import { emptyPrint, printPricePerPc, printLabel, encodePrint, type PrintSelection, type PrintMethod } from "@/data/printOptions";
import { waLink } from "@/data/site";
import { getSession, createOrder, getReviewsForProduct } from "@/lib/authStore";
import { openRazorpay } from "@/lib/razorpay";
import { toast } from "@/hooks/use-toast";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
type Size = typeof SIZES[number];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const product = findProduct(id);

  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState<string | null>(null);
  const [sizeQty, setSizeQty] = useState<Record<Size, number>>({
    XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0,
  });
  const [unitQty, setUnitQty] = useState(1);
  const [printSel, setPrintSel] = useState<PrintSelection>(emptyPrint());
  // Welcome-kit config
  const [kitItems, setKitItems] = useState<string[]>(["tshirt"]);
  const [kitQtyManual, setKitQtyManual] = useState<number>(20);

  if (!product) {
    return (
      <Layout>
        <div className="container-x py-32 text-center">
          <h1 className="font-display text-4xl">Product not found</h1>
          <Link to="/" className="btn-bold mt-6 inline-flex">Back home</Link>
        </div>
      </Layout>
    );
  }

  const cat = findCategory(product.categorySlug);
  const subcat = cat ? findSubcategory(cat, product.tier, product.subSlug) : undefined;
  const isGarment = !isNonGarmentCategory(product.categorySlug);
  const isKit = isWelcomeKitCategory(product.categorySlug);
  const canPrint = supportsPrint(product.categorySlug);
  const isArr = isArrheniuxCategory(product.categorySlug);
  const rule = getAccessoryRules(product.subSlug);
  const moq = isKit ? WELCOME_KIT_MIN : getMOQ(product);
  const maxQty = isKit ? 80 : getMaxQty(product);
  const bulkThreshold = maxQty + 1;
  const code = productCode(product);
  const gstRate = getGstPct(product);
  const gstPctLabel = Math.round(gstRate * 100);
  const courierPerPc = getCourierPerPc(product);

  // Reviews aggregate
  const reviews = getReviewsForProduct(product.id);
  const reviewCount = reviews.length;
  const avgRating = reviewCount ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;

  // Print methods restricted per accessory rule (if any)
  const restrictedMethods: PrintMethod[] | undefined = rule?.print.kind === "custom"
    ? rule.print.methods.map((m) => ({
        id: m.id,
        label: m.label ?? (m.id === "dtf" ? "DTF Print" : m.id === "sublimation" ? "Sublimation Print" : m.id === "laser" ? "Laser Print" : m.id === "digital" ? "Digital Print" : "Embroidery Print"),
        options: m.options,
      }))
    : undefined;
  const printDisabled = rule?.print.kind === "none";
  const printFreeLabel = rule?.print.kind === "free" ? rule.print.label : null;

  const kitIncludesTshirt = kitItems.includes("tshirt");
  const kitSizeTotal = Object.values(sizeQty).reduce((a, b) => a + b, 0);
  const kitQty = kitIncludesTshirt ? kitSizeTotal : kitQtyManual;
  const kitEnoughItems = kitItems.length >= WELCOME_KIT_MIN_ITEMS;

  const total = useMemo(() => {
    if (isKit) return kitQty;
    return isGarment ? kitSizeTotal : unitQty;
  }, [isKit, kitQty, isGarment, kitSizeTotal, unitQty]);

  const unitPrice = priceValue(product);
  const printPerPc = canPrint ? printPricePerPc(printSel, restrictedMethods) : 0;
  const printCharge = printPerPc * total;
  const printTypeText = canPrint ? printLabel(printSel, restrictedMethods) : "N/A";
  const subtotal = unitPrice * total + printCharge;
  const discountPct = isKit ? 0 : getDiscountPct(total, product);
  const discountAmt = Math.round((subtotal * discountPct) / 100);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const courier = total * courierPerPc;
  const gst = Math.round((afterDiscount + courier) * gstRate);
  const grandTotal = afterDiscount + courier + gst;
  const isBulk = total > maxQty;
  const meetsMoq = total >= moq;
  const canOrder = meetsMoq && total <= maxQty && (!isKit || kitEnoughItems);

  const bumpSize = (s: Size, d: number) =>
    setSizeQty((q) => {
      let next = Math.max(0, (q[s] || 0) + d);
      if (isArr) next = Math.min(ARR_SIZE_MAX, next);
      return { ...q, [s]: next };
    });

  const selectedColor = color ?? product.colors[0];

  const orderMessage = () => {
    const lines: string[] = [];
    lines.push("Hi Arrhenix, my payment is complete — here is my order:");
    lines.push("");
    lines.push("*Product Details*");
    if (cat) lines.push(`• Category: ${cat.name}`);
    if (product.tier) lines.push(`• Tier: ${product.tier === "premium" ? "Premium" : "Regular"}`);
    if (subcat) lines.push(`• Subcategory: ${subcat.name}`);
    lines.push(`• Product: ${product.name}`);
    lines.push(`• Product Code: ${code}`);
    lines.push(`• Material: ${product.material}`);
    lines.push(`• Color: ${selectedColor}`);
    if (canPrint) lines.push(`• Print: ${printTypeText}`);
    if (isKit) {
      lines.push(`• Kit Items: ${kitItems.map((id) => WELCOME_KIT_ITEMS.find((k) => k.id === id)?.label).filter(Boolean).join(", ")}`);
      lines.push(`• Free Custom Tote Bag Included`);
    }
    if (isGarment || (isKit && kitIncludesTshirt)) {
      const sizeLines = SIZES.filter((s) => sizeQty[s] > 0).map((s) => `   - ${s}: ${sizeQty[s]} pcs`);
      if (sizeLines.length) {
        lines.push(isKit ? "• T-Shirt Sizes:" : "• Sizes:");
        lines.push(...sizeLines);
      }
    }
    lines.push(isKit ? `• Total Kits: ${total}` : `• Total Quantity: ${total} pcs`);
    lines.push("");
    lines.push("*Pricing*");
    lines.push(`• Unit Price: ₹${unitPrice}`);
    if (printCharge > 0) lines.push(`• Print Charge: ₹${printCharge}`);
    lines.push(`• Subtotal: ₹${subtotal}`);
    lines.push(`• Discount: ${discountPct}% (−₹${discountAmt})`);
    lines.push(courierPerPc > 0 ? `• Courier (₹${courierPerPc} × ${total}): ₹${courier}` : `• Courier: FREE`);
    lines.push(`• GST ${gstPctLabel}%: ₹${gst}`);
    lines.push(`• *Paid: ₹${grandTotal}*`);
    lines.push("");
    lines.push("Sharing my logo / artwork / printing instructions in the next messages.");
    return lines.join("\n");
  };

  // Build ?...=... payload for Bulk Order with full state preserved
  const bulkRedirectHref = () => {
    const p = new URLSearchParams();
    p.set("product", product.id);
    p.set("qty", String(total));
    if (selectedColor) p.set("color", selectedColor);
    if (isGarment) {
      const sz = SIZES.filter((s) => sizeQty[s] > 0).map((s) => `${s}:${sizeQty[s]}`).join(",");
      if (sz) p.set("sizes", sz);
    }
    const pr = encodePrint(printSel);
    if (pr) p.set("print", pr);
    return `/bulk-order?${p.toString()}`;
  };

  const handlePay = () => {
    if (isBulk) {
      navigate(bulkRedirectHref());
      return;
    }
    if (!canOrder) return;
    const user = getSession();
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    openRazorpay({
      amountInr: grandTotal,
      name: "Arrhenix",
      description: `${product.name} × ${total} pcs`,
      prefill: { name: user.name, email: user.email, contact: user.phone },
      onSuccess: (paymentId) => {
        const o = createOrder({
          userId: user.id,
          productId: product.id,
          productName: product.name,
          productCode: code,
          productImage: product.image,
          qty: total,
          unitPrice,
          subtotal,
          discountPct,
          discountAmt,
          printType: printTypeText,
          printCharge,
          courier,
          gst,
          total: grandTotal,
          paid: grandTotal,
          paymentMode: "full",
          paymentRef: paymentId,
          kind: "retail",
          sizes: isGarment ? sizeQty : undefined,
          customer: { fullName: user.name, email: user.email, phone: user.phone || "" },
        });
        toast({ title: "Payment successful", description: `Order #${o.id.slice(0, 8).toUpperCase()} placed.` });
        window.open(waLink(orderMessage()), "_blank", "noreferrer");
        navigate("/my-orders");
      },
    });
  };

  const handleSample = () => {
    const user = getSession();
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    const amount = samplePrice(product);
    openRazorpay({
      amountInr: amount,
      name: "Arrhenix — Sample",
      description: `Sample: ${product.name}`,
      prefill: { name: user.name, email: user.email, contact: user.phone },
      onSuccess: (paymentId) => {
        const sampleCourier = courierPerPc;
        const gstSample = Math.round((unitPrice + sampleCourier) * gstRate);
        const o = createOrder({
          userId: user.id,
          productId: product.id,
          productName: `${product.name} (Sample)`,
          productCode: code,
          productImage: product.image,
          qty: 1,
          unitPrice,
          subtotal: unitPrice,
          discountPct: 0,
          discountAmt: 0,
          printType: "N/A",
          printCharge: 0,
          courier: sampleCourier,
          gst: gstSample,
          total: amount,
          paid: amount,
          paymentMode: "full",
          paymentRef: paymentId,
          kind: "retail",
          customer: { fullName: user.name, email: user.email, phone: user.phone || "" },
        });
        toast({ title: "Sample ordered", description: `Sample #${o.id.slice(0, 8).toUpperCase()} placed.` });
        navigate("/my-orders");
      },
    });
  };

  const productUrl = typeof window !== "undefined" ? window.location.href : "";
  const handleShareWa = () => {
    const msg = `Check out this product from Arrhenix: ${product.name} — ${productUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noreferrer");
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      toast({ title: "Link copied", description: "Product link copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually." });
    }
  };

  const related = allProducts()
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 4);

  return (
    <Layout>
      <section className="container-x py-10">
        <div className="text-xs uppercase text-muted-foreground tracking-wide mb-6">
          <Link to="/" className="hover:text-ink">Home</Link> /{" "}
          <Link to={`/category/${product.categorySlug}`} className="hover:text-ink">{cat?.name ?? product.categorySlug}</Link>
          {" "}/ {product.name}
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <div className="flex gap-3">
            <div className="hidden md:flex flex-col gap-2 w-20">
              {product.gallery.slice(0, 6).map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`bg-secondary aspect-square overflow-hidden border-2 transition ${activeImg === i ? "border-ink" : "border-transparent hover:border-border"}`}
                >
                  <img src={src} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex-1">
              <div className="bg-secondary aspect-square overflow-hidden">
                <img src={product.gallery[activeImg] || product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="md:hidden flex gap-2 mt-2 overflow-x-auto">
                {product.gallery.slice(0, 6).map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`bg-secondary w-16 h-16 shrink-0 overflow-hidden border-2 ${activeImg === i ? "border-ink" : "border-transparent"}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Info */}
          <div>
            <span className="inline-block bg-ink text-cream text-[10px] uppercase tracking-widest px-2 py-1">MOQ {moq}–{maxQty} pcs</span>
            {product.tier && (
              <span className="inline-block ml-2 bg-primary text-cream text-[10px] uppercase tracking-widest px-2 py-1">{product.tier}</span>
            )}
            {rule?.oem && (
              <span className="inline-block ml-2 bg-secondary text-ink border border-border text-[10px] uppercase tracking-widest px-2 py-1">OEM Brand</span>
            )}
            <h1 className="font-display text-4xl md:text-6xl leading-none mt-4">{product.name.toUpperCase()}</h1>

            {/* Code + rating */}
            <div className="mt-1 flex items-center flex-wrap gap-x-4 gap-y-1">
              <div className="text-[11px] font-mono text-muted-foreground">Code: {code}</div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(avgRating) ? "fill-accent text-accent" : "text-border"}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {reviewCount ? `${avgRating.toFixed(1)} · ${reviewCount} review${reviewCount === 1 ? "" : "s"}` : "No reviews yet"}
                </span>
              </div>
            </div>

            <p className="mt-4 text-muted-foreground">{product.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-px bg-border">
              <div className="bg-background p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Material</div>
                <div className="font-medium mt-1 text-sm">{product.material}</div>
              </div>
              <div className="bg-background p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Price</div>
                <div className="font-display text-xl mt-1">{product.price}<span className="text-xs font-sans text-muted-foreground">/pc</span></div>
              </div>
            </div>

            {/* Discount notice / Free tote banner for Welcome Kits */}
            {isKit ? (
              <div className="mt-5 border-2 border-primary bg-primary/10 p-4">
                <div className="text-[11px] uppercase tracking-widest font-bold text-primary mb-1">Complimentary</div>
                <p className="text-sm font-semibold text-ink">Free Custom Tote Bag Included with Every Welcome Kit</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Kit MOQ: {WELCOME_KIT_MIN} · Max {maxQty}. Above {maxQty} kits, order through Bulk Order.
                </p>
              </div>
            ) : (
              <div className="mt-5 border border-border bg-secondary/60 p-4">
                <div className="text-[11px] uppercase tracking-widest font-bold text-primary mb-2">Quantity Discount Policy</div>
                {rule && !rule.discountEnabled ? (
                  <p className="text-sm text-muted-foreground">No quantity discount on this product.</p>
                ) : (
                  <ul className="text-xs space-y-1 text-ink/80">
                    <li>• 5–9 pieces → No Discount</li>
                    <li>• 10–24 pieces → 10% Discount</li>
                    <li>• 25–49 pieces → 20% Discount</li>
                    <li>• 50–80 pieces → 30% Discount</li>
                    <li>• 80+ pieces → 40% Discount (Bulk Order only)</li>
                  </ul>
                )}
                <div className="mt-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
                  Minimum Order Quantity: {moq} pcs · Maximum Order Quantity: {maxQty} pcs
                  <br />
                  If you need more than {maxQty} pieces, please place your order through the Bulk Order section.
                </div>
              </div>
            )}

            {/* Color */}
            {product.colors.length > 0 && (
              <div className="mt-6">
                <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Color</h4>
                <div className="flex gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`h-10 w-10 rounded-full border-2 transition ${selectedColor === c ? "border-ink scale-110" : "border-border"}`}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Print type */}
            {canPrint && (
              <div className="mt-6">
                <PrintPicker
                  value={printSel}
                  onChange={setPrintSel}
                  qty={total}
                  methods={restrictedMethods}
                  freeLabel={printFreeLabel}
                  disabled={printDisabled}
                />
              </div>
            )}

            {/* Quantity / Kit builder */}
            {isKit ? (
              <div className="mt-6 space-y-5">
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Customize Combined Product</h4>
                  <p className="text-[11px] text-muted-foreground mb-3">Build your own welcome kit. Select at least {WELCOME_KIT_MIN_ITEMS} products.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {WELCOME_KIT_ITEMS.map((it) => {
                      const checked = kitItems.includes(it.id);
                      const isTshirt = it.id === "tshirt";
                      return (
                        <label key={it.id} className={`flex items-center gap-2 border px-3 py-2 text-sm cursor-pointer transition ${checked ? "border-ink bg-secondary" : "border-border"}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setKitItems((prev) => prev.includes(it.id) ? prev.filter((x) => x !== it.id) : [...prev, it.id]);
                            }}
                            className="h-4 w-4 accent-primary"
                          />
                          <span>{isTshirt ? "Custom T-Shirt" : it.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {!kitEnoughItems && (
                    <p className="text-xs text-destructive mt-2">Please select at least {WELCOME_KIT_MIN_ITEMS} products.</p>
                  )}
                </div>

                {kitIncludesTshirt ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs uppercase tracking-widest font-bold">T-Shirt Sizes</h4>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Total kits = total shirts ({kitSizeTotal})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SIZES.map((s) => (
                        <div key={s} className="flex items-center justify-between border border-border px-3 py-2">
                          <span className="font-condensed text-xl w-10">{s}</span>
                          <div className="inline-flex items-center border border-ink">
                            <button type="button" onClick={() => bumpSize(s, -1)} className="px-2.5 py-1.5"><Minus className="h-3.5 w-3.5" /></button>
                            <input type="number" min={0} value={sizeQty[s]}
                              onChange={(e) => setSizeQty((q) => ({ ...q, [s]: Math.max(0, Number(e.target.value) || 0) }))}
                              className="w-14 text-center text-sm bg-transparent border-x border-ink py-1.5 font-bold" />
                            <button type="button" onClick={() => bumpSize(s, 1)} className="px-2.5 py-1.5"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Kit Quantity *</h4>
                    <div className="flex items-center justify-between border border-border px-3 py-3">
                      <span className="font-condensed text-xl">Kits</span>
                      <div className="inline-flex items-center border border-ink">
                        <button type="button" onClick={() => setKitQtyManual((q) => Math.max(WELCOME_KIT_MIN, q - 1))} className="px-3 py-1.5"><Minus className="h-3.5 w-3.5" /></button>
                        <input type="number" min={WELCOME_KIT_MIN} value={kitQtyManual}
                          onChange={(e) => setKitQtyManual(Math.max(0, Number(e.target.value) || 0))}
                          className="w-16 text-center text-sm bg-transparent border-x border-ink py-1.5 font-bold" />
                        <button type="button" onClick={() => setKitQtyManual((q) => q + 1)} className="px-3 py-1.5"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : isGarment ? (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-widest font-bold">Sizes & Quantity</h4>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {isArr ? `Max ${ARR_SIZE_MAX} per size` : `MOQ ${moq} · ${maxQty}+ goes to Bulk`}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SIZES.map((s) => (
                    <div key={s} className="flex items-center justify-between border border-border px-3 py-2">
                      <span className="font-condensed text-xl w-10">{s}</span>
                      <div className="inline-flex items-center border border-ink">
                        <button type="button" onClick={() => bumpSize(s, -1)} className="px-2.5 py-1.5" aria-label={`Decrease ${s}`}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={isArr ? ARR_SIZE_MAX : undefined}
                          value={sizeQty[s]}
                          onChange={(e) => {
                            let v = Math.max(0, Number(e.target.value) || 0);
                            if (isArr) v = Math.min(ARR_SIZE_MAX, v);
                            setSizeQty((q) => ({ ...q, [s]: v }));
                          }}
                          className="w-14 text-center text-sm bg-transparent border-x border-ink py-1.5 font-bold"
                        />
                        <button type="button" onClick={() => bumpSize(s, 1)} className="px-2.5 py-1.5" aria-label={`Increase ${s}`}>
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-widest font-bold">Quantity</h4>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">MOQ {moq} · {maxQty}+ goes to Bulk</span>
                </div>
                <div className="flex items-center justify-between border border-border px-3 py-3">
                  <span className="font-condensed text-xl">Units</span>
                  <div className="inline-flex items-center border border-ink">
                    <button type="button" onClick={() => setUnitQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5" aria-label="Decrease">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={unitQty}
                      onChange={(e) => setUnitQty(Math.max(0, Number(e.target.value) || 0))}
                      className="w-16 text-center text-sm bg-transparent border-x border-ink py-1.5 font-bold"
                    />
                    <button type="button" onClick={() => setUnitQty((q) => q + 1)} className="px-3 py-1.5" aria-label="Increase">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing breakdown */}
            <div className="mt-5 border border-border bg-secondary">
              <Row label="Product Price" value={`₹${unitPrice} / pc`} />
              <Row label="Quantity" value={`${total} pcs`} />
              {printCharge > 0 && <Row label={`Print (${printTypeText})`} value={`+₹${printCharge}`} />}
              <Row label="Subtotal" value={`₹${subtotal}`} />
              <Row label="Discount" value={discountPct > 0 ? `${discountPct}% (−₹${discountAmt})` : "—"} />
              <Row label={courierPerPc > 0 ? `Courier (₹${courierPerPc}×${total})` : "Courier"} value={courierPerPc > 0 ? `₹${courier}` : "FREE"} />
              <Row label={`GST ${gstPctLabel}%`} value={`₹${gst}`} />
              <div className="flex items-center justify-between px-4 py-3 bg-ink text-cream">
                <span className="text-xs uppercase tracking-widest font-bold">Final Total</span>
                <span className="font-display text-2xl">₹{grandTotal}</span>
              </div>
            </div>

            {!meetsMoq && total > 0 && (
              <p className="text-xs text-destructive mt-2">Minimum order quantity is {moq} pcs.</p>
            )}

            {isBulk ? (
              <button onClick={handlePay} className="btn-bold mt-6 w-full justify-center text-base !py-4">
                <PackageOpen className="h-5 w-5" /> Continue on Bulk Order page ({maxQty}+ pcs)
              </button>
            ) : (
              <button
                onClick={handlePay}
                disabled={!canOrder}
                className={`btn-bold mt-6 w-full justify-center text-sm !py-3.5 ${!canOrder ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <CreditCard className="h-4 w-4" /> Pay Now (Razorpay)
              </button>
            )}
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Complete payment first. WhatsApp will auto-open with your order — attach logo, artwork or instructions there.
            </p>

            {/* Sample */}
            <button
              onClick={handleSample}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-ink py-3 text-xs uppercase tracking-widest font-semibold hover:bg-ink hover:text-cream transition"
            >
              <Package className="h-4 w-4" /> Order Sample Product — ₹{samplePrice(product)}
            </button>

            {/* Share */}
            <div className="mt-6 flex gap-2">
              <button onClick={handleShareWa} className="flex-1 inline-flex items-center justify-center gap-2 border border-border py-2.5 text-xs uppercase tracking-wide hover:border-ink transition">
                <Share2 className="h-4 w-4" /> Share via WhatsApp
              </button>
              <button onClick={handleCopy} className="flex-1 inline-flex items-center justify-center gap-2 border border-border py-2.5 text-xs uppercase tracking-wide hover:border-ink transition">
                <Link2 className="h-4 w-4" /> Copy Product Link
              </button>
            </div>
          </div>
        </div>

        {/* Product info sections */}
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          <InfoBlock title="Product Overview">
            <p>{product.name} is engineered for corporate, institutional and event orders. Built in-house with strict QC, pre-shrunk fabric, and bio-washed for a premium hand-feel. Made to hold up to daily wash cycles while retaining color and shape.</p>
          </InfoBlock>
          <InfoBlock title="Product Specifications">
            <ul className="space-y-1 list-disc pl-4">
              <li>Material: {product.material}</li>
              <li>Build: {product.gsm}</li>
              <li>Product Code: {code}</li>
              {product.tier && <li>Tier: {product.tier === "premium" ? "Premium" : "Regular"}</li>}
              <li>Minimum Order Quantity: {moq} pcs</li>
              <li>Maximum Order Quantity: {maxQty} pcs</li>
              <li>GST: {gstPctLabel}%</li>
            </ul>
          </InfoBlock>
          <InfoBlock title="Design Guidelines">
            <ul className="space-y-1 list-disc pl-4">
              <li>Submit artwork in vector (AI/EPS/SVG) or 300 DPI PNG with transparent background.</li>
              <li>Chest logo max area 4×4 inch · Back print max A3.</li>
              <li>Provide Pantone codes for exact color matching wherever possible.</li>
              <li>Embroidery supports 1–3 thread colors; complex gradients render better in DTF.</li>
            </ul>
          </InfoBlock>
          <InfoBlock title="Wash Care Instructions">
            <ul className="space-y-1 list-disc pl-4">
              <li>Machine wash cold with similar colors. Do not bleach.</li>
              <li>Wash inside-out to protect prints and embroidery.</li>
              <li>Tumble dry low. Warm iron; do not iron directly on print area.</li>
              <li>Do not dry-clean.</li>
            </ul>
          </InfoBlock>
        </div>
      </section>

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="container-x py-16">
          <h2 className="font-display text-4xl md:text-5xl mb-8">RELATED PRODUCTS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} p={p as any} />
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-4 py-2 border-b border-border last:border-b-0">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const InfoBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-border p-5 bg-card">
    <h3 className="font-condensed text-xl tracking-wide mb-3">{title.toUpperCase()}</h3>
    <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
  </div>
);

export default ProductDetail;
