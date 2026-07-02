import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import { Minus, Plus, Share2, Link2, PackageOpen, CreditCard } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductReviews } from "@/components/ProductReviews";
import { PrintPicker } from "@/components/PrintPicker";
import {
  findProduct,
  findCategory,
  findSubcategory,
  allProducts,
  isNonGarmentCategory,
  priceValue,
  getDiscountPct,
  getMOQ,
  COURIER_PER_PC,
  GST_RATE,
  BULK_THRESHOLD,
  productCode,
  supportsPrint,
} from "@/data/catalog";
import { emptyPrint, printPricePerPc, printLabel, type PrintSelection } from "@/data/printOptions";
import { waLink } from "@/data/site";
import { getSession, createOrder } from "@/lib/authStore";
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
  const canPrint = supportsPrint(product.categorySlug);
  const moq = getMOQ(product);
  const code = productCode(product);

  const total = useMemo(
    () => (isGarment ? Object.values(sizeQty).reduce((a, b) => a + b, 0) : unitQty),
    [isGarment, sizeQty, unitQty]
  );

  const unitPrice = priceValue(product);
  const printPerPc = canPrint ? printPricePerPc(printSel) : 0;
  const printCharge = printPerPc * total;
  const printTypeText = canPrint ? printLabel(printSel) : "N/A";
  const subtotal = unitPrice * total + printCharge;
  const discountPct = getDiscountPct(total);
  const discountAmt = Math.round((subtotal * discountPct) / 100);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const courier = total * COURIER_PER_PC;
  const gst = Math.round((afterDiscount + courier) * GST_RATE);
  const grandTotal = afterDiscount + courier + gst;
  const isBulk = total >= BULK_THRESHOLD;
  const meetsMoq = total >= moq;
  const canOrder = meetsMoq;

  const bumpSize = (s: Size, d: number) =>
    setSizeQty((q) => ({ ...q, [s]: Math.max(0, (q[s] || 0) + d) }));

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
    if (isGarment) {
      const sizeLines = SIZES.filter((s) => sizeQty[s] > 0).map((s) => `   - ${s}: ${sizeQty[s]} pcs`);
      lines.push("• Sizes:");
      lines.push(...sizeLines);
    }
    lines.push(`• Total Quantity: ${total} pcs`);
    lines.push("");
    lines.push("*Pricing*");
    lines.push(`• Unit Price: ₹${unitPrice}`);
    if (printCharge > 0) lines.push(`• Print Charge: ₹${printCharge}`);
    lines.push(`• Subtotal: ₹${subtotal}`);
    lines.push(`• Discount: ${discountPct}% (−₹${discountAmt})`);
    lines.push(`• Courier (₹${COURIER_PER_PC} × ${total}): ₹${courier}`);
    lines.push(`• GST 5%: ₹${gst}`);
    lines.push(`• *Paid: ₹${grandTotal}*`);
    lines.push("");
    lines.push("Sharing my logo / artwork / printing instructions in the next messages.");
    return lines.join("\n");
  };

  const handlePay = () => {
    if (!canOrder) return;
    if (isBulk) {
      navigate(`/bulk-order?product=${product.id}&qty=${total}`);
      return;
    }
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
        // Auto-open WhatsApp with completed order summary
        window.open(waLink(orderMessage()), "_blank", "noreferrer");
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
            <span className="inline-block bg-ink text-cream text-[10px] uppercase tracking-widest px-2 py-1">MOQ {moq}–{BULK_THRESHOLD - 1} pcs</span>
            {product.tier && (
              <span className="inline-block ml-2 bg-primary text-cream text-[10px] uppercase tracking-widest px-2 py-1">{product.tier}</span>
            )}
            <h1 className="font-display text-4xl md:text-6xl leading-none mt-4">{product.name.toUpperCase()}</h1>
            <div className="text-[11px] font-mono text-muted-foreground mt-1">Code: {code}</div>
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
                <PrintPicker value={printSel} onChange={setPrintSel} qty={total} />
              </div>
            )}

            {/* Quantity */}
            {isGarment ? (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-widest font-bold">Sizes & Quantity</h4>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">MOQ {moq} · {BULK_THRESHOLD}+ goes to Bulk</span>
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
                          value={sizeQty[s]}
                          onChange={(e) => setSizeQty((q) => ({ ...q, [s]: Math.max(0, Number(e.target.value) || 0) }))}
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
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">MOQ {moq} · {BULK_THRESHOLD}+ goes to Bulk</span>
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
              {printCharge > 0 && <Row label={`Print (${printType.label})`} value={`+₹${printCharge}`} />}
              <Row label="Subtotal" value={`₹${subtotal}`} />
              <Row label="Discount" value={discountPct > 0 ? `${discountPct}% (−₹${discountAmt})` : "—"} />
              <Row label={`Courier (₹${COURIER_PER_PC}×${total})`} value={`₹${courier}`} />
              <Row label="GST 5%" value={`₹${gst}`} />
              <div className="flex items-center justify-between px-4 py-3 bg-ink text-cream">
                <span className="text-xs uppercase tracking-widest font-bold">Final Total</span>
                <span className="font-display text-2xl">₹{grandTotal}</span>
              </div>
            </div>

            {!meetsMoq && total > 0 && (
              <p className="text-xs text-destructive mt-2">Minimum order quantity is {moq} pcs.</p>
            )}

            {isBulk ? (
              <button onClick={handleWa} className="btn-bold mt-6 w-full justify-center text-base !py-4">
                <PackageOpen className="h-5 w-5" /> Continue on Bulk Order page ({BULK_THRESHOLD}+ pcs)
              </button>
            ) : (
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <button
                  onClick={handleWa}
                  disabled={!canOrder}
                  className={`btn-wa justify-center text-sm !py-3.5 ${!canOrder ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <MessageCircle className="h-4 w-4" /> Order via WhatsApp
                </button>
                <button
                  onClick={handlePay}
                  disabled={!canOrder}
                  className={`btn-bold justify-center text-sm !py-3.5 ${!canOrder ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <CreditCard className="h-4 w-4" /> Pay Now (Razorpay)
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2 text-center">
              You can send your custom logo as the next message on WhatsApp · {WHATSAPP_NUMBER ? "Live chat with our team" : ""}
            </p>

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

export default ProductDetail;
