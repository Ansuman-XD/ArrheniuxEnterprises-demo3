import { ProductCard } from "../ProductCard";
import { latestProducts } from "@/data/catalog";

export const LatestCollection = () => {
  const items = latestProducts(9);
  return (
    <section className="bg-secondary py-20">
      <div className="container-x">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">02 — Featured</span>
            <h2 className="font-display text-5xl md:text-6xl mt-2">LATEST COLLECTION</h2>
          </div>
          <p className="max-w-sm text-muted-foreground text-sm">
            The latest 9 styles added to our catalog — engineered for bulk and ready to customize.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((p) => (
            <ProductCard key={p.id} p={p as any} />
          ))}
        </div>
      </div>
    </section>
  );
};
