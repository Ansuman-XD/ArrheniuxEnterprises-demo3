import { products } from "@/data/site";
import { ProductCard } from "../ProductCard";

export const NewReleases = () => (
  <section className="container-x py-20">
    <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-primary">02 — Drops</span>
        <h2 className="font-display text-5xl md:text-6xl mt-2">NEW RELEASES</h2>
      </div>
    </div>
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible">
      {products.slice(0, 8).map((p) => (
        <div key={p.id} className="min-w-[260px] md:min-w-0 snap-start">
          <ProductCard p={p} />
        </div>
      ))}
    </div>
  </section>
);

export const LatestCollection = () => (
  <section className="bg-secondary py-20">
    <div className="container-x">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">03 — Featured</span>
          <h2 className="font-display text-5xl md:text-6xl mt-2">LATEST COLLECTION</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.filter((p) => p.isNew).concat(products.slice(0, 1)).slice(0, 4).map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  </section>
);
