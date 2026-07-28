import { useState, useMemo, useEffect } from "react";
import { X, CreditCard, Package } from "lucide-react";
import { PrintPicker } from "@/components/PrintPicker";
import { ArtworkUpload, artworkSummary, type ArtworkFile } from "@/components/ArtworkUpload";
import { SuccessDialog } from "@/components/SuccessDialog";
import { getDefaultAddress, formatAddress } from "@/lib/authStore";
import {
  type CatalogProduct,
  getAccessoryRules,
  getGstPct,
  getCourierPerPc,
  priceValue,
  supportsPrint,
  isArrheniuxCategory,
  isNonGarmentCategory,
  productCode,
  findCategory,
  findSubcategory,
  getSizesFor,
} from "@/data/catalog";
import { emptyPrint, printPricePerPc, printLabel, type PrintSelection, type PrintMethod } from "@/data/printOptions";
import { openRazorpay } from "@/lib/razorpay";
import { getSession } from "@/lib/session";
import { waLink } from "@/data/site";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCreateOrder } from "@/hooks/api";

const SAMPLE_QTY = 1;

type Props = { product: CatalogProduct; open: boolean; onClose: () => void; isGarment: boolean };

export const SampleDialog = ({ product, open, onClose, isGarment }: Props) => {
  const navigate = useNavigate();
  const createOrderMut = useCreateOrder();
  const rule = getAccessoryRules(product.subSlug);
  const isArr = isArrheniuxCategory(product.categorySlug);
  const isNonGarment = isNonGarmentCategory(product.categorySlug);
  const canPrint = supportsPrint(product.categorySlug) && rule?.print.kind !== "none";
  const cat = findCategory(product.categorySlug);
  const subcat = cat ? findSubcategory(cat, product.tier, product.subSlug) : undefined;
  const SIZES = getSizesFor(product.categorySlug);

  const defaultSize = SIZES[Math.floor(SIZES.length / 2)] || SIZES[0] || "";
  const [size, setSize] = useState<string>(defaultSize);
  useEffect(() => { setSize(defaultSize); }, [defaultSize]);
  const [printSel, setPrintSel] = useState<PrintSelection>(emptyPrint());
  const [artwork, setArtwork] = useState<ArtworkFile[]>([]);
  const [namedColor, setNamedColor] = useState<string>(rule?.namedColors?.[0] || "");
  const [printColor, setPrintColor] = useState<string>(rule?.printColors?.[0] || "");
  const [swatchColor, setSwatchColor] = useState<string>(product.colors[0] || "");
  const [successOrder, setSuccessOrder] = useState<{ id: string; amount: number } | null>(null);

  const restrictedMethods: PrintMethod[] | undefined = rule?.print.kind === "custom"
    ? rule.print.methods.map((m) => ({
        id: m.id,
        label: m.label ?? (m.id === "dtf" ? "DTF Print" : m.id === "sublimation" ? "Sublimation Print" : m.id === "laser" ? "Laser Print" : m.id === "digital" ? "Digital Print" : "Embroidery Print"),
        options: m.options,
      }))
    : undefined;
  const printFreeLabel = rule?.print.kind === "free" ? rule.print.label : null;

  const qty = SAMPLE_QTY;
  const unitPrice = product.samplePrice;   // ← was priceValue(product)
  const printPerPc = canPrint ? printPricePerPc(printSel, restrictedMethods) : 0;
  const printCharge = printPerPc * qty;
  const gstRate = getGstPct(product);
  const courierPerPc = getCourierPerPc(product);
  const courier = courierPerPc * qty;
  const subtotal = unitPrice * qty + printCharge;
  const gst = Math.round((subtotal + courier) * gstRate);
  const total = subtotal + courier + gst;
  const printText = canPrint ? (printFreeLabel || printLabel(printSel, restrictedMethods)) : "N/A";

  const selectedColor = rule?.namedColors ? namedColor : swatchColor;
  const selectedPrintColor = rule?.printColors ? printColor : "";

  const orderMsg = useMemo(() => {
    if (!open) return "";
    const lines: string[] = [];
    lines.push("Hi Arrheniux — my *SAMPLE ORDER* payment is complete:");
    lines.push("");
    lines.push("*Product Details*");
    if (cat) lines.push(`• Category: ${cat.name}`);
    if (subcat) lines.push(`• Subcategory: ${subcat.name}`);
    lines.push(`• Product: ${product.name} (Sample)`);
    lines.push(`• Code: ${productCode(product)}`);
    lines.push(`• Material: ${product.material}`);
    if (selectedColor) lines.push(`• Color: ${selectedColor}`);
    if (selectedPrintColor) lines.push(`• Print Color: ${selectedPrintColor}`);
    if (isGarment) lines.push(`• Size: ${size}`);
    if (canPrint) lines.push(`• Print: ${printText}`);
    if (!isArr) lines.push(`• Artwork Files: ${artworkSummary(artwork)}`);
    lines.push(`• Sample Quantity: ${qty} pc (fixed)`);
    lines.push("");
    lines.push("*Pricing*");
    lines.push(`• Unit Price: ₹${unitPrice}`);
    if (printCharge > 0) lines.push(`• Print Charge: ₹${printCharge}`);
    lines.push(`• Subtotal: ₹${subtotal}`);
    lines.push(courierPerPc > 0 ? `• Courier: ₹${courier}` : `• Courier: FREE`);
    lines.push(`• GST ${Math.round(gstRate * 100)}%: ₹${gst}`);
    lines.push(`• *Paid: ₹${total}*`);
    lines.push("");
    lines.push("Sharing artwork / printing instructions in the next messages.");
    return lines.join("\n");
  }, [open, product, size, printText, canPrint, artwork, subtotal, courier, courierPerPc, gst, gstRate, total, isGarment, selectedColor, selectedPrintColor, cat, subcat, isArr, printCharge, unitPrice, qty]);

  if (!open && !successOrder) return null;

  const handlePay = () => {
    const user = getSession();
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const defaultAddr = getDefaultAddress(user.id);
    if (!defaultAddr) {
      toast({ title: "Add a delivery address", description: "Please save an address before ordering a sample." });
      navigate(`/my-addresses?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    openRazorpay({
      amountInr: total,
      name: "Arrheniux — Sample",
      description: `Sample: ${product.name}`,
      prefill: { name: user.name, email: user.email, contact: defaultAddr.mobile || user.phone },
      onSuccess: async () => {
        try {
          const o = await createOrderMut.mutateAsync({
            kind: "retail",
            isSample: true,
            customerId: user.id,
            customerName: user.name,
            phone: defaultAddr.mobile || user.phone || "",
            email: user.email,
            address: formatAddress(defaultAddr),
            productId: product.id,
            productCode: productCode(product),
            productName: `${product.name} (Sample)`,
            category: cat?.name ?? "",
            subCategory: subcat?.name ?? "",
            material: product.material,
            printType: printText,
            sizes: isGarment ? ({ [size]: qty } as Record<string, number>) : undefined,
            qty,
            unitPrice,
            gstPct: Math.round(gstRate * 100),
            shipping: courier,
            total,
            paid: total,
            uploadedLogo: !isArr ? (artwork[0]?.dataUrl ?? "") : "",
            paymentMode: "full",
          });
          toast({ title: "Sample ordered", description: `Sample #${o.id.slice(0, 8).toUpperCase()} placed.` });
          window.open(waLink(orderMsg), "_blank", "noreferrer");
          setSuccessOrder({ id: o.id, amount: total });
        } catch {
          toast({ title: "Order failed", description: "Payment received but sample order could not be saved.", variant: "destructive" });
        }
      },
    });
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] bg-ink/70 flex items-center justify-center p-3 overflow-y-auto animate-fade-in">
          <div className="bg-cream w-full max-w-2xl border border-border shadow-2xl my-6 animate-scale-in">


        <div className="flex items-center justify-between px-5 py-3 border-b border-border sticky top-0 bg-cream z-10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
              <Package className="h-3 w-3" /> Sample Order · Qty fixed at 1
            </div>
            <h3 className="font-condensed text-xl tracking-wide">{product.name.toUpperCase()}</h3>
            <div className="text-[10px] font-mono text-muted-foreground">Code: {productCode(product)}</div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary transition" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Product & material info */}
          <div className="flex gap-3">
            <img src={product.image} alt={product.name} className="w-24 h-24 object-cover bg-secondary" />
            <div className="flex-1 text-xs space-y-1">
              <div><span className="text-muted-foreground uppercase tracking-widest text-[10px]">Material:</span> <span className="font-medium">{product.material}</span></div>
              <div><span className="text-muted-foreground uppercase tracking-widest text-[10px]">Build:</span> <span className="font-medium">{product.gsm}</span></div>
              <div className="text-muted-foreground leading-snug pt-1">{product.description}</div>
            </div>
          </div>

          {/* Named accessory color */}
          {rule?.namedColors && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Color / Variant</h4>
              <select value={namedColor} onChange={(e) => setNamedColor(e.target.value)}
                className="w-full border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-ink">
                {rule.namedColors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* Product color swatches (garment/others without namedColors) */}
          {!rule?.namedColors && product.colors.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Color</h4>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((c) => (
                  <button key={c} type="button" onClick={() => setSwatchColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition ${swatchColor === c ? "border-ink scale-110" : "border-border"}`}
                    style={{ backgroundColor: c }} aria-label={c} />
                ))}
              </div>
            </div>
          )}

          {isGarment && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Size (one only)</h4>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {SIZES.map((s) => (
                  <button key={s} type="button" onClick={() => setSize(s)}
                    className={`py-2 text-sm border-2 font-bold transition ${size === s ? "border-ink bg-ink text-cream" : "border-border hover:border-ink"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {canPrint && (
            <PrintPicker value={printSel} onChange={setPrintSel} qty={qty} methods={restrictedMethods} freeLabel={printFreeLabel} />
          )}

          {/* Lanyard print color */}
          {rule?.printColors && (
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Print Color</h4>
              <select value={printColor} onChange={(e) => setPrintColor(e.target.value)}
                className="w-full border border-border px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-ink">
                {rule.printColors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {rule?.note && (
            <p className="text-xs italic text-muted-foreground border-l-2 border-primary pl-3">Note: {rule.note}</p>
          )}

          {!isArr && (
            <ArtworkUpload value={artwork} onChange={setArtwork} title="Upload Your Logo / Artwork / Text Design" />
          )}

          {/* Sample quantity - locked */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Sample Quantity</h4>
            <div className="flex items-center justify-between border border-border bg-secondary/40 px-3 py-3">
              <span className="font-condensed text-lg">Units</span>
              <span className="font-display text-xl">{qty} <span className="text-[10px] font-sans uppercase text-muted-foreground tracking-widest">pc · locked</span></span>
            </div>
          </div>

          {/* Billing summary */}
          <div className="border border-border bg-secondary">
            <Row label="Unit Price" value={`₹${unitPrice}`} />
            <Row label="Quantity" value={`${qty} pc`} />
            {printCharge > 0 && <Row label={`Print (${printText})`} value={`+₹${printCharge}`} />}
            <Row label="Subtotal" value={`₹${subtotal}`} />
            <Row label="Courier" value={courierPerPc > 0 ? `₹${courier}` : "FREE"} />
            <Row label={`GST ${Math.round(gstRate * 100)}%`} value={`₹${gst}`} />
            <div className="flex justify-between px-4 py-3 bg-ink text-cream">
              <span className="text-xs uppercase tracking-widest font-bold">Sample Total</span>
              <span className="font-display text-xl">₹{total}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border sticky bottom-0 bg-cream">
          <button onClick={handlePay} className="btn-bold w-full justify-center !py-3">
            <CreditCard className="h-4 w-4" /> Pay ₹{total} & Order Sample
          </button>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Payment first · WhatsApp opens with full sample details · order saved to My Orders.
          </p>
          </div>
          </div>
        </div>
      )}
      <SuccessDialog
        open={!!successOrder}
        onClose={() => { setSuccessOrder(null); onClose(); navigate("/my-orders"); }}
        orderId={successOrder?.id}
        amount={successOrder?.amount}
        title="Sample Order Placed!"
      />
    </>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between px-4 py-2 border-b border-border last:border-b-0">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);
