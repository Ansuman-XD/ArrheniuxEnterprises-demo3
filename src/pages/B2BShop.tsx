import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, MessageCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import {
  catalog,
  allProducts,
  priceValue,
  productCode,
  COURIER_PER_PC,
  GST_RATE,
  BULK_DISCOUNT_PCT,
  type CatalogProduct,
} from "@/data/catalog";
import { waLink } from "@/data/site";

const STEP = 2; // B2B size step of 2

const B2BShop = () => {
  const [catSlug, setCatSlug] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, number>>({});

  const products: CatalogProduct[] = useMemo(() => {
    const all = allProducts();
    return catSlug === "all" ? all : all.filter((p) => p.categorySlug === catSlug);
  }, [catSlug]);

  const bump = (id: string, dir: 1 | -1) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + dir * STEP) }));

  const items = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ product: allProducts().find((p) => p.id === id)!, qty }));

  const totalQty = items.reduce((a, b) => a + b.qty, 0);
  const subtotal = items.reduce((a, i) => a + priceValue(i.product) * i.qty, 0);
  const discount = Math.round((subtotal * BULK_DISCOUNT_PCT) / 100);
  const afterDisc = subtotal - discount;
  const courier = totalQty * COURIER_PER_PC;
  const gst = Math.round((afterDisc + courier) * GST_RATE);
  const grand = afterDisc + courier + gst;

  const order = () => {
    if (totalQty === 0) return;
    const lines = [
      "Hi Arrhenix, I'd like a B2B quote:",
      "",
      "*Cart*",
      ...items.map(
        (i) => `• ${i.product.name} [${productCode(i.product)}] — ${i.qty} pcs @ ${i.product.price}`
      ),
      "",
      `Subtotal: ₹${subtotal}`,
      `B2B Discount (${BULK_DISCOUNT_PCT}%): −₹${discount}`,
      `Courier (₹${COURIER_PER_PC} × ${totalQty}): ₹${courier}`,
      `GST (5%): ₹${gst}`,
      `*Grand Total: ₹${grand}*`,
    ];
    window.open(waLink(lines.join("\n")), "_blank", "noreferrer");
  };

  return (
    <Layout>
      <section className="bg-secondary">
        <div className="container-x py-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">B2B</span>
          <h1 className="font-display text-5xl md:text-7xl leading-none mt-2">B2B SHOP</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Wholesale storefront for corporate buyers. Quantities update in steps of {STEP}.
            Auto {BULK_DISCOUNT_PCT}% discount, ₹{COURIER_PER_PC}/pc courier, 5% GST.
          </p>
        </div>
      </section>

      <section className="container-x py-10 grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <div className="flex gap-2 flex-wrap mb-5">
            <button
              onClick={() => setCatSlug("all")}
              className={`text-xs uppercase tracking-widest px-3 py-1.5 border ${
                catSlug === "all" ? "bg-ink text-cream border-ink" : "border-border hover:border-ink"
              }`}
            >
              All
            </button>
            {catalog.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCatSlug(c.slug)}
                className={`text-xs uppercase tracking-widest px-3 py-1.5 border ${
                  catSlug === c.slug ? "bg-ink text-cream border-ink" : "border-border hover:border-ink"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((p) => {
              const qty = cart[p.id] || 0;
              return (
                <div key={p.id} className="border border-border bg-card overflow-hidden">
                  <Link to={`/product/${p.id}`} className="block aspect-square overflow-hidden bg-secondary">
                    <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition" />
                  </Link>
                  <div className="p-3">
                    <div className="font-condensed text-sm tracking-wide leading-tight line-clamp-2">{p.name.toUpperCase()}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{productCode(p)}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-display text-lg">{p.price}<span className="text-[10px] text-muted-foreground">/pc</span></span>
                      <div className="inline-flex items-center border border-ink">
                        <button onClick={() => bump(p.id, -1)} className="px-2 py-1"><Minus className="h-3 w-3" /></button>
                        <span className="w-10 text-center text-xs font-bold border-x border-ink py-1">{qty}</span>
                        <button onClick={() => bump(p.id, 1)} className="px-2 py-1"><Plus className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart */}
        <aside className="border border-border bg-card p-5 h-fit lg:sticky lg:top-24">
          <h3 className="font-condensed text-2xl tracking-wide">CART</h3>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">Add products in steps of {STEP}.</p>
          ) : (
            <>
              <ul className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((i) => (
                  <li key={i.product.id} className="flex justify-between text-xs border-b border-border pb-1.5">
                    <span className="truncate pr-2">{i.product.name}</span>
                    <span className="font-mono shrink-0">{i.qty}×{i.product.price}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-sm space-y-1">
                <Row label="Subtotal" value={`₹${subtotal.toLocaleString("en-IN")}`} />
                <Row label={`Discount ${BULK_DISCOUNT_PCT}%`} value={`−₹${discount.toLocaleString("en-IN")}`} />
                <Row label={`Courier (₹${COURIER_PER_PC}×${totalQty})`} value={`₹${courier.toLocaleString("en-IN")}`} />
                <Row label="GST 5%" value={`₹${gst.toLocaleString("en-IN")}`} />
                <div className="flex justify-between font-display text-xl pt-2 border-t border-border">
                  <span>Total</span><span>₹{grand.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <button onClick={order} className="btn-wa w-full justify-center mt-4">
                <MessageCircle className="h-4 w-4" /> Quote via WhatsApp
              </button>
            </>
          )}
        </aside>
      </section>
    </Layout>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default B2BShop;
