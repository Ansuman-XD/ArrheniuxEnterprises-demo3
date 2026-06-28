import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import { Minus, Plus, MessageCircle, Share2, Link2, Check } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { findProduct, allProducts } from "@/data/catalog";
import { waLink, WHATSAPP_NUMBER } from "@/data/site";
import { isLoggedIn } from "@/lib/authStore";
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
  const [qty, setQty] = useState<Record<Size, number>>({
    XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, "3XL": 0,
  });

  const total = useMemo(() => Object.values(qty).reduce((a, b) => a + b, 0), [qty]);
  const moq = product?.moq ?? 20;
  const canOrder = total >= moq;

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

  const bump = (s: Size, d: number) =>
    setQty((q) => ({ ...q, [s]: Math.max(0, (q[s] || 0) + d) }));

  const selectedColor = color ?? product.colors[0];

  const orderMessage = () => {
    const lines = SIZES.filter((s) => qty[s] > 0).map((s) => `• ${s}: ${qty[s]} pcs`);
    return `Hi Arrhenix, I'd like to place an order:

• Product: ${product.name}
• Material: ${product.material}
• Color: ${selectedColor}

Sizes:
${lines.join("\n")}

Total Quantity: ${total} pcs

I'll send my custom logo / artwork in the next message.`;
  };

  const handleOrder = () => {
    if (!canOrder) return;
    if (!isLoggedIn()) {
      navigate(`/auth?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    window.open(waLink(orderMessage()), "_blank", "noreferrer");
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
          <Link to={`/category/${product.categorySlug}`} className="hover:text-ink">{product.categorySlug}</Link>
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
            <span className="inline-block bg-ink text-cream text-[10px] uppercase tracking-widest px-2 py-1">MOQ {moq}</span>
            {product.tier && (
              <span className="inline-block ml-2 bg-primary text-cream text-[10px] uppercase tracking-widest px-2 py-1">{product.tier}</span>
            )}
            <h1 className="font-display text-4xl md:text-6xl leading-none mt-4">{product.name.toUpperCase()}</h1>
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

            {/* Size matrix */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs uppercase tracking-widest font-bold">Sizes & Quantity</h4>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Minimum Order: {moq} pcs</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SIZES.map((s) => (
                  <div key={s} className="flex items-center justify-between border border-border px-3 py-2">
                    <span className="font-condensed text-xl w-10">{s}</span>
                    <div className="inline-flex items-center border border-ink">
                      <button type="button" onClick={() => bump(s, -1)} className="px-2.5 py-1.5" aria-label={`Decrease ${s}`}>
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={qty[s]}
                        onChange={(e) => setQty((q) => ({ ...q, [s]: Math.max(0, Number(e.target.value) || 0) }))}
                        className="w-14 text-center text-sm bg-transparent border-x border-ink py-1.5 font-bold"
                      />
                      <button type="button" onClick={() => bump(s, 1)} className="px-2.5 py-1.5" aria-label={`Increase ${s}`}>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 px-3 py-3 bg-secondary border border-border">
                <span className="text-xs uppercase tracking-widest font-bold">Total Quantity</span>
                <span className="font-display text-2xl">{total} <span className="text-xs font-sans text-muted-foreground">/ {moq} min</span></span>
              </div>
              {!canOrder && (
                <p className="text-xs text-destructive mt-2 font-medium">
                  Minimum order quantity is {moq} pieces. Add {moq - total} more to enable ordering.
                </p>
              )}
            </div>

            <button
              onClick={handleOrder}
              disabled={!canOrder}
              className={`btn-wa mt-6 w-full justify-center text-base !py-4 ${!canOrder ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <MessageCircle className="h-5 w-5" /> Order via WhatsApp
            </button>
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

export default ProductDetail;
