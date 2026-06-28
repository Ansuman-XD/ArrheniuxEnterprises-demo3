import { Link } from "react-router-dom";
import { catalog } from "@/data/catalog";

export const CategoriesGrid = () => (
  <section className="container-x py-20">
    <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-primary">01 — Catalog</span>
        <h2 className="font-display text-5xl md:text-6xl mt-2">BROWSE CATEGORIES</h2>
      </div>
      <p className="max-w-sm text-muted-foreground text-sm">
        {catalog.length} product categories, organised by Regular and Premium tiers. Every piece is fully customizable — fabric, fit, colour, print and embroidery.
      </p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {catalog.map((c) => (
        <Link
          key={c.slug}
          to={`/category/${c.slug}`}
          className="group relative block bg-secondary overflow-hidden aspect-[4/5]"
        >
          <img src={c.image} alt={c.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-2xl text-cream leading-tight">{c.name.toUpperCase()}</h3>
            <p className="text-xs text-cream/70 mt-0.5">{c.hasTiers ? "Regular · Premium" : "Browse items"}</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);
