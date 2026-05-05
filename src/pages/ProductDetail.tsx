import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { Minus, Plus, MessageCircle, Check } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { products, waLink } from "@/data/site";

const customizationOptions = [
  "Custom logo print (front)",
  "Embroidered logo (chest)",
  "Back print / graphic",
  "Sleeve branding",
  "Custom neck label",
  "Branded packaging",
];

const sizes = ["S", "M", "L", "XL", "XXL"];

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id) || products[0];
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(20);
  const [opts, setOpts] = useState<string[]>([customizationOptions[0]]);

  const toggle = (o: string) =>
    setOpts((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));

  const message = `Hi Arrhenix, I'd like to order:
• Product: ${product.name}
• Fabric: ${product.fabric} (${product.gsm})
• Color: ${color}
• Size: ${size}
• Quantity: ${qty} pcs
• Customization: ${opts.join(", ") || "None"}

Please share quote and timeline.`;

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const fallback = products.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <Layout>
      <section className="container-x py-10">
        <div className="text-xs uppercase text-muted-foreground tracking-wide mb-6">
          <Link to="/" className="hover:text-ink">Home</Link> /{" "}
          <Link to={`/category/${product.category}`} className="hover:text-ink">{product.category}</Link> / {product.name}
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="bg-secondary aspect-square overflow-hidden">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div>
            <span className="inline-block bg-ink text-cream text-[10px] uppercase tracking-widest px-2 py-1">MOQ {product.moq}</span>
            <h1 className="font-display text-5xl md:text-7xl leading-none mt-4">{product.name.toUpperCase()}</h1>
            <p className="mt-4 text-muted-foreground">
              {product.fabric} · <strong className="text-ink">{product.gsm}</strong> · Pre-shrunk · Bio-washed
            </p>
            <div className="mt-6 font-display text-3xl">{product.price}<span className="text-sm font-sans text-muted-foreground">/piece</span></div>

            {/* Color */}
            <div className="mt-8">
              <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Color</h4>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-10 w-10 rounded-full border-2 transition ${color === c ? "border-ink scale-110" : "border-border"}`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mt-6">
              <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Size</h4>
              <div className="flex gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-12 w-12 border-2 font-bold transition ${size === s ? "border-ink bg-ink text-cream" : "border-border hover:border-ink"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Quantity (min 20)</h4>
              <div className="inline-flex items-center border-2 border-ink">
                <button onClick={() => setQty((q) => Math.max(20, q - 5))} className="px-4 py-3"><Minus className="h-4 w-4" /></button>
                <input
                  type="number"
                  value={qty}
                  min={20}
                  onChange={(e) => setQty(Math.max(20, Number(e.target.value) || 20))}
                  className="w-20 text-center font-bold bg-transparent border-x-2 border-ink py-3"
                />
                <button onClick={() => setQty((q) => q + 5)} className="px-4 py-3"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            {/* Customization */}
            <div className="mt-6">
              <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Customization</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {customizationOptions.map((o) => {
                  const on = opts.includes(o);
                  return (
                    <button
                      key={o}
                      onClick={() => toggle(o)}
                      className={`flex items-center gap-2 text-left text-sm px-3 py-2 border transition ${on ? "border-ink bg-ink/5" : "border-border hover:border-ink"}`}
                    >
                      <span className={`h-4 w-4 border flex items-center justify-center ${on ? "bg-ink border-ink" : "border-border"}`}>
                        {on && <Check className="h-3 w-3 text-cream" />}
                      </span>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            <a href={waLink(message)} target="_blank" rel="noreferrer" className="btn-wa mt-8 w-full justify-center text-base !py-4">
              <MessageCircle className="h-5 w-5" /> Order on WhatsApp
            </a>
            <p className="text-xs text-muted-foreground mt-2 text-center">Pre-filled message · 50% advance · 7–14 day delivery</p>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <h2 className="font-display text-4xl md:text-5xl mb-8">RELATED PRODUCTS</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(related.length ? related : fallback).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default ProductDetail;
