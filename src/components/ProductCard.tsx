import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Product, waLink } from "@/data/site";

export const ProductCard = ({ p }: { p: Product }) => (
  <div className="group flex flex-col bg-card border border-border">
    <Link to={`/product/${p.id}`} className="relative block overflow-hidden bg-secondary">
      <img
        src={p.image}
        alt={p.name}
        loading="lazy"
        className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {p.isNew && (
        <span className="absolute top-3 left-3 bg-ink text-cream text-[10px] font-bold uppercase tracking-widest px-2 py-1">
          New
        </span>
      )}
      {/* <span className="absolute top-3 right-3 bg-cream text-ink text-[10px] font-bold uppercase tracking-widest px-2 py-1 border border-ink">
        MOQ {p.moq}
      </span> */}
    </Link>
    <div className="p-4 flex flex-col gap-2 flex-1">
      <Link to={`/product/${p.id}`}>
        <h3 className="font-condensed text-xl tracking-wide leading-tight">{p.name.toUpperCase()}</h3>
      </Link>
      <p className="text-xs text-muted-foreground">{p.fabric} · {p.gsm}</p>
      {/* <div className="flex gap-1.5 mt-1">
        {p.colors.map((c, i) => (
          <span key={i} className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c }} />
        ))}
      </div> */}
      <div className="flex items-center justify-between mt-auto pt-3">
        <span className="font-display text-lg">{p.price}<span className="text-xs font-sans text-muted-foreground">/pc</span></span>
        <a
          href={waLink(`Hi Arrheniux, I'd like to order: ${p.name}. Quantity: 20+ pieces.`)}
          target="_blank"
          rel="noreferrer"
          className="text-[hsl(var(--whatsapp))] hover:text-ink transition"
          aria-label="Order on WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      </div>
    </div>
  </div>
);
