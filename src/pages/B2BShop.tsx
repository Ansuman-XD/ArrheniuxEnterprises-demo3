import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, CreditCard, ChevronLeft, Package } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PrintPicker } from "@/components/PrintPicker";
import { SampleDialog } from "@/components/SampleDialog";
import {
  B2B_SUBCATEGORIES,
  getB2BProducts,
  priceValue,
  productCode,
  BULK_DISCOUNT_PCT,
  B2B_MOQ,
  B2B_STEP,
  supportsPrint,
  type CatalogProduct,
} from "@/data/catalog";
import { emptyPrint, printPricePerPc, printLabel, type PrintSelection } from "@/data/printOptions";
import { waLink } from "@/data/site";
import { createOrder, saveAgentRegistration, type AgentRegistration } from "@/lib/authStore";
import { openRazorpay } from "@/lib/razorpay";
import { toast } from "@/hooks/use-toast";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
type Size = typeof SIZES[number];
const EMPTY_SIZES: Record<Size, number> = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0 };

type View = { step: "subs" } | { step: "products"; subSlug: string } | { step: "detail"; subSlug: string; productId: string };

const AGENT_CODES = ["AGENT2024", "ARR-B2B", "DEALER100"];

type AgentForm = {
  company: string; contactPerson: string; mobile: string; email: string;
  gst: string; address: string; city: string; state: string; pincode: string;
};
const EMPTY_AGENT: AgentForm = { company: "", contactPerson: "", mobile: "", email: "", gst: "", address: "", city: "", state: "", pincode: "" };

const B2BShop = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ step: "subs" });
  const [sizeQty, setSizeQty] = useState<Record<Size, number>>({ ...EMPTY_SIZES });
  const [printSel, setPrintSel] = useState<PrintSelection>(emptyPrint());
  // Verification always starts unverified per session/window.
  const [gateStep, setGateStep] = useState<"code" | "form">("code");
  const [verifiedCode, setVerifiedCode] = useState<string>("");
  const [agent, setAgent] = useState<AgentRegistration | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [agentForm, setAgentForm] = useState<AgentForm>(EMPTY_AGENT);
  const [gateError, setGateError] = useState("");
  const [sampleOpen, setSampleOpen] = useState(false);

  const verifyCode = () => {
    const val = codeInput.trim().toUpperCase();
    if (!val) return setGateError("Please enter your Marketing Agent Code.");
    if (!AGENT_CODES.includes(val)) return setGateError("Invalid marketing agent code.");
    setVerifiedCode(val);
    setGateError("");
    setGateStep("form");
  };

  const submitRegistration = () => {
    const req: (keyof AgentForm)[] = ["company", "contactPerson", "mobile", "email", "gst", "address", "city", "state", "pincode"];
    for (const k of req) if (!agentForm[k].trim()) return setGateError("Please complete all fields.");
    const reg = saveAgentRegistration({ code: verifiedCode, ...agentForm });
    setAgent(reg);
    setGateError("");
  };

  const verified = agent !== null;

  const activeSub = view.step !== "subs" ? B2B_SUBCATEGORIES.find((s) => s.slug === view.subSlug) : null;
  const products = view.step !== "subs" ? getB2BProducts(view.subSlug) : [];
  const product: CatalogProduct | undefined = view.step === "detail" ? products.find((p) => p.id === view.productId) : undefined;
  const canPrint = product ? supportsPrint(product.categorySlug) : false;

  const total = useMemo(() => Object.values(sizeQty).reduce((a, b) => a + b, 0), [sizeQty]);
  const unitPrice = product ? priceValue(product) : 0;
  const perPcPrint = canPrint ? printPricePerPc(printSel) : 0;
  const printCharge = perPcPrint * total;
  const printText = canPrint ? printLabel(printSel) : "N/A";
  const subtotal = unitPrice * total + printCharge;
  const discountAmt = Math.round((subtotal * BULK_DISCOUNT_PCT) / 100);
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const courier = 0;
  const gst = Math.round((afterDiscount + courier) * 0.05);
  const grandTotal = afterDiscount + courier + gst;

  const bumpSize = (s: Size, d: number) =>
    setSizeQty((q) => ({ ...q, [s]: Math.max(0, (q[s] || 0) + d * B2B_STEP) }));

  const resetSelections = () => {
    setSizeQty({ ...EMPTY_SIZES });
    setPrintSel(emptyPrint());
  };

  const openProduct = (id: string) => {
    resetSelections();
    setView({ step: "detail", subSlug: (view as { subSlug: string }).subSlug, productId: id });
  };

  const buildMessage = () => {
    if (!product) return "";
    const lines: string[] = [];
    lines.push("Hi Arrhenix, my payment is complete — *B2B ORDER*:");
    lines.push("");
    lines.push("*Product Details*");
    lines.push(`• B2B Subcategory: ${activeSub?.name}`);
    lines.push(`• Product: ${product.name}`);
    lines.push(`• Code: ${productCode(product)}`);
    if (agent) lines.push(`• Agent Code: ${agent.code} · ${agent.company}`);
    if (canPrint) lines.push(`• Print: ${printText}`);
    lines.push("• Sizes:");
    SIZES.filter((s) => sizeQty[s] > 0).forEach((s) => lines.push(`   - ${s}: ${sizeQty[s]} pcs`));
    lines.push(`• Total: ${total} pcs`);
    lines.push("");
    lines.push("*Pricing*");
    lines.push(`• Unit Price: ₹${unitPrice}`);
    if (printCharge > 0) lines.push(`• Print Charge: ₹${printCharge}`);
    lines.push(`• Subtotal: ₹${subtotal}`);
    lines.push(`• B2B Discount ${BULK_DISCOUNT_PCT}%: −₹${discountAmt}`);
    lines.push(`• Courier: FREE`);
    lines.push(`• GST 5%: ₹${gst}`);
    lines.push(`• *Paid: ₹${grandTotal}*`);
    lines.push("");
    lines.push("Sharing logo / artwork / printing instructions in the next messages.");
    return lines.join("\n");
  };

  const handlePay = () => {
    if (!product || !agent) return;
    if (total < B2B_MOQ) return;
    openRazorpay({
      amountInr: grandTotal,
      name: "Arrhenix — B2B",
      description: `${product.name} × ${total} pcs`,
      prefill: { name: agent.contactPerson, email: agent.email, contact: agent.mobile },
      onSuccess: (paymentId) => {
        const o = createOrder({
          userId: `agent:${agent.id}`,
          productId: product.id,
          productName: product.name,
          productCode: productCode(product),
          productImage: product.image,
          qty: total,
          unitPrice,
          subtotal,
          discountPct: BULK_DISCOUNT_PCT,
          discountAmt,
          printType: printText,
          printCharge,
          courier,
          gst,
          total: grandTotal,
          paid: grandTotal,
          paymentMode: "full",
          paymentRef: paymentId,
          kind: "b2b",
          sizes: sizeQty,
          customer: {
            fullName: agent.contactPerson,
            email: agent.email,
            phone: agent.mobile,
            company: agent.company,
            gst: agent.gst,
            agentCode: agent.code,
            address: `${agent.address}, ${agent.city}, ${agent.state} - ${agent.pincode}`,
          },
        });
        toast({ title: "Payment successful", description: `B2B order #${o.id.slice(0, 8).toUpperCase()} placed.` });
        window.open(waLink(buildMessage()), "_blank", "noreferrer");
        navigate("/");
      },
    });
  };

  if (!verified) {
    return (
      <Layout>
        <section className="container-x py-16 min-h-[60vh] flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-lg border border-border bg-card p-6 shadow-sm animate-scale-in">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">B2B Access</span>
            <h1 className="font-display text-3xl mt-2 leading-none">
              {gateStep === "code" ? "VERIFY TO CONTINUE" : "AGENT REGISTRATION"}
            </h1>
            {gateStep === "code" ? (
              <>
                <p className="text-sm text-muted-foreground mt-3">
                  B2B Shop is restricted to verified marketing agents. Please enter your Marketing Agent Code to continue.
                </p>
                <label className="block mt-5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Marketing Agent Code *
                </label>
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="e.g. AGENT2024"
                  className="mt-1 w-full border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-ink"
                />
                {gateError && <p className="text-xs text-destructive mt-2">{gateError}</p>}
                <button onClick={verifyCode} className="btn-bold mt-4 w-full justify-center !py-3">
                  Verify Agent Code
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mt-3">
                  Agent verified: <span className="font-semibold text-ink">{verifiedCode}</span>. Complete registration to place B2B orders (no user login required).
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <GateField label="Company Name *" value={agentForm.company} onChange={(v) => setAgentForm({ ...agentForm, company: v })} />
                  <GateField label="Contact Person *" value={agentForm.contactPerson} onChange={(v) => setAgentForm({ ...agentForm, contactPerson: v })} />
                  <GateField label="Mobile *" value={agentForm.mobile} onChange={(v) => setAgentForm({ ...agentForm, mobile: v })} />
                  <GateField label="Email *" value={agentForm.email} onChange={(v) => setAgentForm({ ...agentForm, email: v })} />
                  <GateField label="GST Number *" value={agentForm.gst} onChange={(v) => setAgentForm({ ...agentForm, gst: v })} />
                  <GateField label="Pincode *" value={agentForm.pincode} onChange={(v) => setAgentForm({ ...agentForm, pincode: v })} />
                  <div className="sm:col-span-2"><GateField label="Business Address *" value={agentForm.address} onChange={(v) => setAgentForm({ ...agentForm, address: v })} /></div>
                  <GateField label="City *" value={agentForm.city} onChange={(v) => setAgentForm({ ...agentForm, city: v })} />
                  <GateField label="State *" value={agentForm.state} onChange={(v) => setAgentForm({ ...agentForm, state: v })} />
                </div>
                {gateError && <p className="text-xs text-destructive mt-2">{gateError}</p>}
                <button onClick={submitRegistration} className="btn-bold mt-4 w-full justify-center !py-3">
                  Complete Registration & Enter B2B Shop
                </button>
              </>
            )}
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-secondary">
        <div className="container-x py-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">B2B</span>
          <h1 className="font-display text-5xl md:text-7xl leading-none mt-2">B2B SHOP</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Wholesale storefront for corporate buyers. Minimum order {B2B_MOQ} pieces per product · quantities in steps of {B2B_STEP} · auto {BULK_DISCOUNT_PCT}% bulk discount · Courier FREE · 5% GST.
          </p>
        </div>
      </section>

      <section className="container-x py-10">
        {view.step === "subs" && (
          <>
            <h2 className="font-condensed text-3xl tracking-wide mb-6">CHOOSE A SUBCATEGORY</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {B2B_SUBCATEGORIES.map((s) => {
                const first = getB2BProducts(s.slug)[0];
                return (
                  <button
                    key={s.slug}
                    onClick={() => setView({ step: "products", subSlug: s.slug })}
                    className="text-left border border-border bg-card overflow-hidden hover:border-ink transition group"
                  >
                    <div className="aspect-square overflow-hidden bg-secondary">
                      {first && <img src={first.image} alt={s.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />}
                    </div>
                    <div className="p-3">
                      <div className="font-condensed text-lg tracking-wide">{s.name.toUpperCase()}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                        {getB2BProducts(s.slug).length} products
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {view.step === "products" && (
          <>
            <button onClick={() => setView({ step: "subs" })} className="text-xs uppercase tracking-widest inline-flex items-center gap-1 mb-4 hover:text-primary">
              <ChevronLeft className="h-3.5 w-3.5" /> All subcategories
            </button>
            <h2 className="font-condensed text-3xl tracking-wide mb-6">{activeSub?.name.toUpperCase()}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openProduct(p.id)}
                  className="text-left border border-border bg-card overflow-hidden hover:border-ink transition group"
                >
                  <div className="aspect-square overflow-hidden bg-secondary">
                    <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <div className="p-3">
                    <div className="font-condensed text-sm tracking-wide leading-tight line-clamp-2">{p.name.toUpperCase()}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{productCode(p)}</div>
                    <div className="font-display text-lg mt-1">{p.price}<span className="text-[10px] text-muted-foreground">/pc</span></div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {view.step === "detail" && product && (
          <>
            <button onClick={() => setView({ step: "products", subSlug: view.subSlug })} className="text-xs uppercase tracking-widest inline-flex items-center gap-1 mb-4 hover:text-primary">
              <ChevronLeft className="h-3.5 w-3.5" /> Back to {activeSub?.name}
            </button>
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8">
              <div className="bg-secondary aspect-square overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>

              <div>
                <span className="inline-block bg-ink text-cream text-[10px] uppercase tracking-widest px-2 py-1">MOQ {B2B_MOQ}</span>
                <h2 className="font-display text-3xl md:text-5xl leading-none mt-3">{product.name.toUpperCase()}</h2>
                <div className="text-[11px] font-mono text-muted-foreground mt-1">Code: {productCode(product)}</div>
                <p className="mt-3 text-muted-foreground text-sm">{product.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-px bg-border">
                  <div className="bg-background p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Material</div>
                    <div className="font-medium mt-1 text-sm">{product.material}</div>
                  </div>
                  <div className="bg-background p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Unit Price</div>
                    <div className="font-display text-xl mt-1">{product.price}<span className="text-xs text-muted-foreground">/pc</span></div>
                  </div>
                </div>

                {/* Color selection removed from B2B per spec */}

                {/* Print type removed from B2B per spec */}

                <div className="mt-5">
                  <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Sizes & Quantity (step of {B2B_STEP})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {SIZES.map((s) => (
                      <div key={s} className="flex items-center justify-between border border-border px-3 py-2">
                        <span className="font-condensed text-lg w-10">{s}</span>
                        <div className="inline-flex items-center border border-ink">
                          <button onClick={() => bumpSize(s, -1)} className="px-2.5 py-1.5"><Minus className="h-3.5 w-3.5" /></button>
                          <input type="number" min={0} step={B2B_STEP} value={sizeQty[s]}
                            onChange={(e) => setSizeQty((q) => ({ ...q, [s]: Math.max(0, Number(e.target.value) || 0) }))}
                            className="w-14 text-center text-sm bg-transparent border-x border-ink py-1.5 font-bold" />
                          <button onClick={() => bumpSize(s, 1)} className="px-2.5 py-1.5"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border border-border bg-secondary">
                  <Row label="Unit Price" value={`₹${unitPrice}`} />
                  <Row label="Quantity" value={`${total} pcs`} />
                  {printCharge > 0 && <Row label={`Print (${printText})`} value={`+₹${printCharge}`} />}
                  <Row label="Subtotal" value={`₹${subtotal.toLocaleString("en-IN")}`} />
                  <Row label={`B2B Discount ${BULK_DISCOUNT_PCT}%`} value={`−₹${discountAmt.toLocaleString("en-IN")}`} />
                  <Row label="Courier" value="FREE" />
                  <Row label="GST 5%" value={`₹${gst.toLocaleString("en-IN")}`} />
                  <div className="flex justify-between px-4 py-3 bg-ink text-cream">
                    <span className="text-xs uppercase tracking-widest font-bold">Total</span>
                    <span className="font-display text-2xl">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="mt-4 border-2 border-primary/40 bg-primary/5 p-4">
                  <div className="text-[11px] uppercase tracking-widest font-bold text-primary mb-2">Delivery Information</div>
                  <ul className="text-xs space-y-1 text-ink/80">
                    <li>• <strong>Odisha (City to City):</strong> Transport charges are extra and depend on destination.</li>
                    <li>• <strong>Other States:</strong> Additional courier or transport charges will apply.</li>
                  </ul>
                </div>

                {total > 0 && total < B2B_MOQ && (
                  <p className="text-xs text-destructive mt-2">Minimum {B2B_MOQ} pcs required for B2B orders.</p>
                )}

                <button
                  onClick={handlePay}
                  disabled={total < B2B_MOQ}
                  className={`btn-bold mt-5 w-full justify-center !py-3.5 ${total < B2B_MOQ ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <CreditCard className="h-4 w-4" /> Pay Now (Razorpay)
                </button>
                <button
                  onClick={() => setSampleOpen(true)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-ink py-3 text-xs uppercase tracking-widest font-semibold hover:bg-ink hover:text-cream transition"
                >
                  <Package className="h-4 w-4" /> Order Sample Product
                </button>
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  Payment first. WhatsApp will open automatically with your order summary — attach artwork there.
                </p>
              </div>
            </div>
            {product && (
              <SampleDialog product={product} open={sampleOpen} onClose={() => setSampleOpen(false)} isGarment={true} />
            )}
          </>
        )}
      </section>
    </Layout>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between px-4 py-2 border-b border-border last:border-b-0">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

const GateField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
    <input value={value} onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:border-ink" />
  </div>
);

export default B2BShop;
