import { useState, useMemo } from "react";
import { X, CreditCard, Minus, Plus } from "lucide-react";
import { PrintPicker } from "@/components/PrintPicker";
import { ArtworkUpload, artworkSummary, type ArtworkFile } from "@/components/ArtworkUpload";
import {
  type CatalogProduct,
  getAccessoryRules,
  getGstPct,
  getCourierPerPc,
  priceValue,
  supportsPrint,
  isArrheniuxCategory,
  productCode,
} from "@/data/catalog";
import { emptyPrint, printPricePerPc, printLabel, type PrintSelection, type PrintMethod } from "@/data/printOptions";
import { openRazorpay } from "@/lib/razorpay";
import { getSession, createOrder } from "@/lib/authStore";
import { waLink } from "@/data/site";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

type Props = { product: CatalogProduct; open: boolean; onClose: () => void; isGarment: boolean };

export const SampleDialog = ({ product, open, onClose, isGarment }: Props) => {
  const navigate = useNavigate();
  const rule = getAccessoryRules(product.subSlug);
  const canPrint = supportsPrint(product.categorySlug) && rule?.print.kind !== "none";
  const [size, setSize] = useState<string>("M");
  const [qty, setQty] = useState<number>(1);
  const [printSel, setPrintSel] = useState<PrintSelection>(emptyPrint());
  const [artwork, setArtwork] = useState<ArtworkFile[]>([]);
  const [namedColor, setNamedColor] = useState<string>(rule?.namedColors?.[0] || "");

  const restrictedMethods: PrintMethod[] | undefined = rule?.print.kind === "custom"
    ? rule.print.methods.map((m) => ({
        id: m.id,
        label: m.label ?? (m.id === "dtf" ? "DTF Print" : m.id === "sublimation" ? "Sublimation Print" : m.id === "laser" ? "Laser Print" : m.id === "digital" ? "Digital Print" : "Embroidery Print"),
        options: m.options,
      }))
    : undefined;
  const printFreeLabel = rule?.print.kind === "free" ? rule.print.label : null;

  const unitPrice = priceValue(product);
  const printPerPc = canPrint ? printPricePerPc(printSel, restrictedMethods) : 0;
  const printCharge = printPerPc * qty;
  const gstRate = getGstPct(product);
  const courierPerPc = getCourierPerPc(product);
  const courier = courierPerPc * qty;
  const subtotal = unitPrice * qty + printCharge;
  const gst = Math.round((subtotal + courier) * gstRate);
  const total = subtotal + courier + gst;
  const printText = canPrint ? (printFreeLabel || printLabel(printSel, restrictedMethods)) : "N/A";

  const orderMsg = useMemo(() => {
    if (!open) return "";
    const lines: string[] = [];
    lines.push("Hi Arrhenix — my *SAMPLE ORDER* payment is complete:");
    lines.push("");
    lines.push(`• Product: ${product.name} (Sample)`);
    lines.push(`• Code: ${productCode(product)}`);
    if (rule?.namedColors) lines.push(`• Color: ${namedColor}`);
    if (isGarment) lines.push(`• Size: ${size}`);
    lines.push(`• Sample Quantity: ${qty} pc(s)`);
    if (canPrint) lines.push(`• Print: ${printText}`);
    lines.push(`• Artwork Files: ${artworkSummary(artwork)}`);
    lines.push("");
    lines.push(`• Subtotal: ₹${subtotal}`);
    lines.push(courierPerPc > 0 ? `• Courier: ₹${courier}` : `• Courier: FREE`);
    lines.push(`• GST ${Math.round(gstRate * 100)}%: ₹${gst}`);
    lines.push(`• *Paid: ₹${total}*`);
    lines.push("");
    lines.push("Sharing artwork / printing instructions in the next messages.");
    return lines.join("\n");
  }, [open, product, size, qty, printText, canPrint, artwork, subtotal, courier, courierPerPc, gst, gstRate, total, isGarment, namedColor, rule]);

  if (!open) return null;

  const handlePay = () => {
    const user = getSession();
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    openRazorpay({
      amountInr: total,
      name: "Arrhenix — Sample",
      description: `Sample: ${product.name}`,
      prefill: { name: user.name, email: user.email, contact: user.phone },
      onSuccess: (paymentId) => {
        const o = createOrder({
          userId: user.id,
          productId: product.id,
          productName: `${product.name} (Sample)`,
          productCode: productCode(product),
          productImage: product.image,
          qty,
          unitPrice,
          subtotal,
          discountPct: 0,
          discountAmt: 0,
          printType: printText,
          printCharge,
          courier,
          gst,
          total,
          paid: total,
          paymentMode: "full",
          paymentRef: paymentId,
          kind: "retail",
          sizes: isGarment ? ({ [size]: qty } as Record<string, number>) : undefined,
          customer: { fullName: user.name, email: user.email, phone: user.phone || "" },
        });
        toast({ title: "Sample ordered", description: `Sample #${o.id.slice(0, 8).toUpperCase()} placed.` });
        window.open(waLink(orderMsg), "_blank", "noreferrer");
        onClose();
        navigate("/my-orders");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-ink/70 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-cream w-full max-w-lg border border-border shadow-2xl my-6">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Sample Order</div>
            <h3 className="font-condensed text-xl tracking-wide">{product.name.toUpperCase()}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[75vh] overflow-y-auto">
          {rule?.namedColors && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Color</h4>
              <select value={namedColor} onChange={(e) => setNamedColor(e.target.value)}
                className="w-full border border-border px-3 py-2.5 text-sm bg-background">
                {rule.namedColors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {isGarment && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Size (one only)</h4>
              <div className="grid grid-cols-4 gap-1.5">
                {SIZES.map((s) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={`py-2 text-sm border-2 font-bold ${size === s ? "border-ink bg-ink text-cream" : "border-border hover:border-ink"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {canPrint && (
            <PrintPicker value={printSel} onChange={setPrintSel} qty={qty} methods={restrictedMethods} freeLabel={printFreeLabel} />
          )}

          {!isArrheniuxCategory(product.categorySlug) && (
            <ArtworkUpload value={artwork} onChange={setArtwork} title="Upload Your Logo / Artwork / Text Design" />
          )}

          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Sample Quantity</h4>
            <div className="flex items-center justify-between border border-border px-3 py-2">
              <span className="font-condensed text-lg">Units</span>
              <div className="inline-flex items-center border border-ink">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-2.5 py-1.5"><Minus className="h-3.5 w-3.5" /></button>
                <input type="number" min={1} value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-14 text-center text-sm bg-transparent border-x border-ink py-1.5 font-bold" />
                <button onClick={() => setQty((q) => q + 1)} className="px-2.5 py-1.5"><Plus className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>

          <div className="border border-border bg-secondary">
            <Row label="Unit Price" value={`₹${unitPrice}`} />
            <Row label="Quantity" value={`${qty} pc(s)`} />
            {printCharge > 0 && <Row label="Print Charge" value={`+₹${printCharge}`} />}
            <Row label="Subtotal" value={`₹${subtotal}`} />
            <Row label={courierPerPc > 0 ? `Courier` : "Courier"} value={courierPerPc > 0 ? `₹${courier}` : "FREE"} />
            <Row label={`GST ${Math.round(gstRate * 100)}%`} value={`₹${gst}`} />
            <div className="flex justify-between px-4 py-3 bg-ink text-cream">
              <span className="text-xs uppercase tracking-widest font-bold">Sample Total</span>
              <span className="font-display text-xl">₹{total}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border">
          <button onClick={handlePay} className="btn-bold w-full justify-center !py-3">
            <CreditCard className="h-4 w-4" /> Pay ₹{total} & Order Sample
          </button>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between px-4 py-2 border-b border-border last:border-b-0">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);
