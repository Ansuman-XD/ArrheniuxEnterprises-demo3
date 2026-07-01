import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Minus, Plus, MessageCircle, CreditCard } from "lucide-react";
import { Layout } from "@/components/Layout";
import {
  catalog,
  findCategory,
  getSubsForTier,
  findProduct,
  isNonGarmentCategory,
  priceValue,
  productCode,
  PRINT_TYPES,
  findPrintType,
  COURIER_PER_PC,
  GST_RATE,
  BULK_DISCOUNT_PCT,
  BULK_THRESHOLD,
  type Tier,
  type CatalogProduct,
} from "@/data/catalog";
import { waLink } from "@/data/site";
import { getSession, createOrder } from "@/lib/authStore";
import { openRazorpay } from "@/lib/razorpay";
import { toast } from "@/hooks/use-toast";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
type Size = typeof SIZES[number];
const SIZE_STEP = 2; // B2B/Bulk size step of 2

type DraftCustomer = {
  fullName: string;
  company: string;
  gst: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
};

type Draft = {
  catSlug: string;
  tier: Tier | "";
  subSlug: string;
  productId: string;
  color: string;
  unitQty: number;
  sizeQty: Record<Size, number>;
  customer: DraftCustomer;
  printTypeId: string;
};

const EMPTY_CUSTOMER: DraftCustomer = {
  fullName: "", company: "", gst: "", phone: "", email: "",
  address: "", city: "", state: "", pincode: "", notes: "",
};
const EMPTY_SIZES: Record<Size, number> = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0 };
const DRAFT_KEY = "arr_bulk_draft";

const loadDraft = (): Partial<Draft> => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}"); } catch { return {}; }
};
const saveDraft = (d: Partial<Draft>) => localStorage.setItem(DRAFT_KEY, JSON.stringify(d));

const BulkOrder = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const initial = useMemo<Partial<Draft>>(() => {
    const urlPid = params.get("product");
    const urlQty = Number(params.get("qty")) || 0;
    const urlPrint = params.get("print") || "";
    const draft = loadDraft();
    if (urlPid) {
      const p = findProduct(urlPid);
      if (p) {
        const seedQty = Math.max(BULK_THRESHOLD, urlQty);
        return {
          catSlug: p.categorySlug,
          tier: (p.tier as Tier) || "",
          subSlug: p.subSlug,
          productId: p.id,
          color: p.colors[0] || "",
          unitQty: seedQty,
          sizeQty: { ...EMPTY_SIZES },
          customer: (draft.customer as DraftCustomer) || EMPTY_CUSTOMER,
          printTypeId: urlPrint || draft.printTypeId || "none",
        };
      }
    }
    return draft;
  }, [params]);

  const [catSlug, setCatSlug] = useState(initial.catSlug || catalog[0].slug);
  const [tier, setTier] = useState<Tier | "">(initial.tier ?? "");
  const [subSlug, setSubSlug] = useState(initial.subSlug || "");
  const [productId, setProductId] = useState(initial.productId || "");
  const [color, setColor] = useState(initial.color || "");
  const [unitQty, setUnitQty] = useState<number>(initial.unitQty ?? BULK_THRESHOLD);
  const [sizeQty, setSizeQty] = useState<Record<Size, number>>(initial.sizeQty || { ...EMPTY_SIZES });
  const [customer, setCustomer] = useState<DraftCustomer>(initial.customer || EMPTY_CUSTOMER);
  const [printTypeId, setPrintTypeId] = useState<string>(initial.printTypeId || "none");
  const [error, setError] = useState("");

  const cat = findCategory(catSlug)!;
  const showsTierStep = cat.hasTiers;
  const subs = cat.hasTiers ? getSubsForTier(cat, tier || undefined) : (cat.items ?? []);
  const subcat = subs.find((s) => s.slug === subSlug);
  const products: CatalogProduct[] = subcat?.products ?? [];
  const product = products.find((p) => p.id === productId);
  const isGarment = product ? !isNonGarmentCategory(product.categorySlug) : !isNonGarmentCategory(catSlug);
  const printType = findPrintType(printTypeId);

  useEffect(() => {
    if (!cat.hasTiers) setTier("");
    setSubSlug((prev) => (subs.find((s) => s.slug === prev) ? prev : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catSlug, tier]);

  useEffect(() => {
    setProductId((prev) => (products.find((p) => p.id === prev) ? prev : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subSlug]);

  useEffect(() => {
    if (product && !color) setColor(product.colors[0] || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  useEffect(() => {
    saveDraft({ catSlug, tier, subSlug, productId, color, unitQty, sizeQty, customer, printTypeId });
  }, [catSlug, tier, subSlug, productId, color, unitQty, sizeQty, customer, printTypeId]);

  const total = isGarment ? Object.values(sizeQty).reduce((a, b) => a + b, 0) : unitQty;
  const unitPrice = product ? priceValue(product) : 0;
  const printCharge = printType.pricePerPc * total;
  const subtotal = unitPrice * total + printCharge;
  const discountAmt = Math.round((subtotal * BULK_DISCOUNT_PCT) / 100);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const courier = total * COURIER_PER_PC;
  const gst = Math.round((afterDiscount + courier) * GST_RATE);
  const grandTotal = afterDiscount + courier + gst;

  const validate = (): string | null => {
    if (!product) return "Please choose a product.";
    if (total < BULK_THRESHOLD) return `Bulk orders require ${BULK_THRESHOLD}+ pcs. Current total: ${total}.`;
    const c = customer;
    if (!c.fullName || !c.company || !c.phone || !c.email || !c.address || !c.city || !c.state || !c.pincode)
      return "Please complete all required customer fields.";
    return null;
  };

  const buildMessage = () => {
    const lines: string[] = [];
    lines.push("Hi Arrhenix, I'd like to place a *BULK ORDER*:");
    lines.push("");
    lines.push("*Product Details*");
    lines.push(`• Category: ${cat.name}`);
    if (cat.hasTiers && tier) lines.push(`• Tier: ${tier === "premium" ? "Premium" : "Regular"}`);
    if (subcat) lines.push(`• Subcategory: ${subcat.name}`);
    if (product) {
      lines.push(`• Product: ${product.name}`);
      lines.push(`• Code: ${productCode(product)}`);
      lines.push(`• Material: ${product.material}`);
      lines.push(`• Color: ${color || product.colors[0]}`);
    }
    lines.push(`• Print Type: ${printType.label}${printType.pricePerPc ? ` (+₹${printType.pricePerPc}/pc)` : ""}`);
    if (isGarment) {
      lines.push("• Sizes:");
      SIZES.filter((s) => sizeQty[s] > 0).forEach((s) => lines.push(`   - ${s}: ${sizeQty[s]} pcs`));
    }
    lines.push(`• Total Quantity: ${total} pcs`);
    lines.push("");
    lines.push("*Pricing*");
    lines.push(`• Unit Price: ₹${unitPrice}`);
    if (printCharge > 0) lines.push(`• Print Charge: ₹${printCharge}`);
    lines.push(`• Subtotal: ₹${subtotal}`);
    lines.push(`• Bulk Discount (${BULK_DISCOUNT_PCT}%): −₹${discountAmt}`);
    lines.push(`• Courier (₹${COURIER_PER_PC}×${total}): ₹${courier}`);
    lines.push(`• GST 5%: ₹${gst}`);
    lines.push(`• *Grand Total: ₹${grandTotal}*`);
    lines.push("");
    lines.push("*Customer Details*");
    lines.push(`• Name: ${customer.fullName}`);
    lines.push(`• Company: ${customer.company}`);
    if (customer.gst) lines.push(`• GST: ${customer.gst}`);
    lines.push(`• Phone: ${customer.phone}`);
    lines.push(`• Email: ${customer.email}`);
    lines.push(`• Address: ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}`);
    if (customer.notes) {
      lines.push("");
      lines.push(`*Notes*: ${customer.notes}`);
    }
    return lines.join("\n");
  };

  const persistOrder = (mode: "full" | "advance-50", paid: number, ref: string) => {
    const user = getSession();
    if (!user || !product) return null;
    return createOrder({
      userId: user.id,
      productId: product.id,
      productName: product.name,
      productCode: productCode(product),
      qty: total,
      unitPrice,
      subtotal,
      discountPct: BULK_DISCOUNT_PCT,
      discountAmt,
      printType: printType.label,
      printCharge,
      courier,
      gst,
      total: grandTotal,
      paid,
      paymentMode: mode,
      paymentRef: ref,
      kind: "bulk",
      customer: customer as unknown as Record<string, string>,
      sizes: isGarment ? sizeQty : undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    if (!getSession()) {
      navigate(`/auth?next=${encodeURIComponent("/bulk-order")}`);
      return;
    }
    window.open(waLink(buildMessage()), "_blank", "noreferrer");
  };

  const handlePay = (mode: "full" | "advance-50") => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    const user = getSession();
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent("/bulk-order")}`);
      return;
    }
    const amount = mode === "full" ? grandTotal : Math.round(grandTotal / 2);
    openRazorpay({
      amountInr: amount,
      name: "Arrhenix — Bulk Order",
      description: product ? `${product.name} × ${total} pcs (${mode === "full" ? "Full" : "50% Advance"})` : "Bulk",
      prefill: { name: customer.fullName || user.name, email: customer.email || user.email, contact: customer.phone },
      onSuccess: (paymentId) => {
        const o = persistOrder(mode, amount, paymentId);
        if (o) {
          toast({ title: "Payment received", description: `Order #${o.id.slice(0, 8).toUpperCase()} placed.` });
          navigate("/my-orders");
        }
      },
    });
  };

  const bumpSize = (s: Size, d: number) =>
    setSizeQty((q) => ({ ...q, [s]: Math.max(0, (q[s] || 0) + d * SIZE_STEP) }));

  return (
    <Layout>
      <section className="bg-secondary">
        <div className="container-x py-12 md:py-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">{BULK_THRESHOLD}+ pcs</span>
          <h1 className="font-display text-5xl md:text-7xl leading-none mt-3">BULK ORDER</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            For corporate, institutional and event orders of {BULK_THRESHOLD} pieces and above. Auto {BULK_DISCOUNT_PCT}% bulk discount, ₹{COURIER_PER_PC}/pc courier, 5% GST. Pay in full or 50% advance.
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="container-x py-12 grid lg:grid-cols-[1.1fr_1fr] gap-10">
        <div className="space-y-8">
          <div className="border border-border p-5 bg-card">
            <h2 className="font-condensed text-2xl tracking-wide mb-4">SELECT PRODUCT</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Select label="Category" value={catSlug} onChange={setCatSlug}
                options={catalog.map((c) => ({ value: c.slug, label: c.name }))} />
              {showsTierStep && (
                <Select label="Regular / Premium" value={tier} onChange={(v) => setTier(v as Tier | "")}
                  options={[
                    { value: "", label: "Choose tier…" },
                    ...(cat.regular?.length ? [{ value: "regular", label: "Regular" }] : []),
                    ...(cat.premium?.length ? [{ value: "premium", label: "Premium" }] : []),
                  ]} />
              )}
              <Select label="Subcategory" value={subSlug} onChange={setSubSlug}
                options={[{ value: "", label: "Choose subcategory…" }, ...subs.map((s) => ({ value: s.slug, label: s.name }))]} />
              <Select label="Print Type" value={printTypeId} onChange={setPrintTypeId}
                options={PRINT_TYPES.map((pt) => ({
                  value: pt.id,
                  label: pt.pricePerPc ? `${pt.label} (+₹${pt.pricePerPc}/pc)` : pt.label,
                }))} />
            </div>
          </div>

          {subcat && (
            <div className="border border-border p-5 bg-card">
              <h2 className="font-condensed text-2xl tracking-wide mb-4">PICK A PRODUCT</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setProductId(p.id)}
                    className={`text-left bg-secondary border-2 overflow-hidden transition ${productId === p.id ? "border-ink" : "border-transparent hover:border-border"}`}
                  >
                    <div className="aspect-square overflow-hidden">
                      <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-condensed tracking-wide leading-tight">{p.name.toUpperCase()}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{productCode(p)}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.price} / pc</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product && (
            <div className="border border-border p-5 bg-card">
              <h2 className="font-condensed text-2xl tracking-wide mb-1">{product.name.toUpperCase()}</h2>
              <div className="text-[11px] font-mono text-muted-foreground">Code: {productCode(product)}</div>
              <p className="text-sm text-muted-foreground mt-2">{product.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-px bg-border">
                <div className="bg-background p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Material</div>
                  <div className="font-medium mt-1 text-sm">{product.material}</div>
                </div>
                <div className="bg-background p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Unit Price</div>
                  <div className="font-display text-xl mt-1">{product.price}<span className="text-xs font-sans text-muted-foreground">/pc</span></div>
                </div>
              </div>

              {product.colors.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Color</h4>
                  <div className="flex gap-2">
                    {product.colors.map((c) => (
                      <button type="button" key={c} onClick={() => setColor(c)}
                        className={`h-9 w-9 rounded-full border-2 transition ${(color || product.colors[0]) === c ? "border-ink scale-110" : "border-border"}`}
                        style={{ backgroundColor: c }} aria-label={c} />
                    ))}
                  </div>
                </div>
              )}

              {isGarment ? (
                <div className="mt-5">
                  <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Sizes & Quantity (step of {SIZE_STEP})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SIZES.map((s) => (
                      <div key={s} className="flex items-center justify-between border border-border px-3 py-2">
                        <span className="font-condensed text-lg w-10">{s}</span>
                        <div className="inline-flex items-center border border-ink">
                          <button type="button" onClick={() => bumpSize(s, -1)} className="px-2.5 py-1.5"><Minus className="h-3.5 w-3.5" /></button>
                          <input type="number" min={0} step={SIZE_STEP} value={sizeQty[s]}
                            onChange={(e) => setSizeQty((q) => ({ ...q, [s]: Math.max(0, Number(e.target.value) || 0) }))}
                            className="w-14 text-center text-sm bg-transparent border-x border-ink py-1.5 font-bold" />
                          <button type="button" onClick={() => bumpSize(s, 1)} className="px-2.5 py-1.5"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Quantity (step of {SIZE_STEP})</h4>
                  <div className="flex items-center justify-between border border-border px-3 py-3">
                    <span className="font-condensed text-lg">Units</span>
                    <div className="inline-flex items-center border border-ink">
                      <button type="button" onClick={() => setUnitQty((q) => Math.max(SIZE_STEP, q - SIZE_STEP))} className="px-3 py-1.5"><Minus className="h-3.5 w-3.5" /></button>
                      <input type="number" min={SIZE_STEP} step={SIZE_STEP} value={unitQty}
                        onChange={(e) => setUnitQty(Math.max(0, Number(e.target.value) || 0))}
                        className="w-16 text-center text-sm bg-transparent border-x border-ink py-1.5 font-bold" />
                      <button type="button" onClick={() => setUnitQty((q) => q + SIZE_STEP)} className="px-3 py-1.5"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 border border-border bg-secondary">
                <Row label="Unit Price" value={`₹${unitPrice}`} />
                <Row label="Total Quantity" value={`${total} pcs`} />
                {printCharge > 0 && <Row label={`Print (${printType.label})`} value={`+₹${printCharge}`} />}
                <Row label="Subtotal" value={`₹${subtotal.toLocaleString("en-IN")}`} />
                <Row label={`Bulk Discount ${BULK_DISCOUNT_PCT}%`} value={`−₹${discountAmt.toLocaleString("en-IN")}`} />
                <Row label={`Courier (₹${COURIER_PER_PC}×${total})`} value={`₹${courier.toLocaleString("en-IN")}`} />
                <Row label="GST 5%" value={`₹${gst.toLocaleString("en-IN")}`} />
                <div className="flex items-center justify-between px-4 py-3 bg-ink text-cream">
                  <span className="text-xs uppercase tracking-widest font-bold">Grand Total</span>
                  <span className="font-display text-2xl">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Pay full or 50% advance. Final artwork proofing on WhatsApp.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {product ? (
            <div className="bg-secondary overflow-hidden">
              <div className="aspect-square">
                <img src={product.gallery[0] || product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-cols-4 gap-1 p-1">
                {product.gallery.slice(0, 4).map((src, i) => (
                  <img key={i} src={src} alt="" className="aspect-square w-full h-full object-cover" />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-secondary aspect-square flex items-center justify-center text-muted-foreground text-sm uppercase tracking-widest">
              Choose a product to preview
            </div>
          )}

          <div className="border border-border p-5 bg-card">
            <h2 className="font-condensed text-2xl tracking-wide mb-4">CUSTOMER INFORMATION</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Full Name *" value={customer.fullName} onChange={(v) => setCustomer({ ...customer, fullName: v })} />
              <Input label="Company Name *" value={customer.company} onChange={(v) => setCustomer({ ...customer, company: v })} />
              <Input label="GST Number" value={customer.gst} onChange={(v) => setCustomer({ ...customer, gst: v })} />
              <Input label="Mobile Number *" value={customer.phone} onChange={(v) => setCustomer({ ...customer, phone: v })} />
              <Input label="Email Address *" type="email" value={customer.email} onChange={(v) => setCustomer({ ...customer, email: v })} />
              <Input label="Pincode *" value={customer.pincode} onChange={(v) => setCustomer({ ...customer, pincode: v })} />
              <div className="sm:col-span-2">
                <Input label="Complete Address *" value={customer.address} onChange={(v) => setCustomer({ ...customer, address: v })} />
              </div>
              <Input label="City *" value={customer.city} onChange={(v) => setCustomer({ ...customer, city: v })} />
              <Input label="State *" value={customer.state} onChange={(v) => setCustomer({ ...customer, state: v })} />
              <div className="sm:col-span-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Additional Notes</label>
                <textarea
                  value={customer.notes}
                  onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  rows={3}
                  className="mt-1 w-full border border-border rounded-none px-3 py-2 text-sm bg-background focus:outline-none focus:border-ink"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="grid sm:grid-cols-3 gap-2">
            <button type="submit" className="btn-wa justify-center !py-3.5 text-sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp Quote
            </button>
            <button type="button" onClick={() => handlePay("advance-50")} className="btn-bold justify-center !py-3.5 text-sm">
              <CreditCard className="h-4 w-4" /> Pay 50% Advance
            </button>
            <button type="button" onClick={() => handlePay("full")} className="btn-bold justify-center !py-3.5 text-sm">
              <CreditCard className="h-4 w-4" /> Pay in Full
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Login required before payment. Draft selections are saved automatically.
          </p>
        </div>
      </form>
    </Layout>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-4 py-2 border-b border-border last:border-b-0">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const Select = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div>
    <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full border border-border rounded-none px-3 py-2 text-sm bg-background focus:outline-none focus:border-ink"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

const Input = ({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) => (
  <div>
    <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full border border-border rounded-none px-3 py-2 text-sm bg-background focus:outline-none focus:border-ink"
    />
  </div>
);

export default BulkOrder;
