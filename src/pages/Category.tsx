import { useParams, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { categories, products } from "@/data/site";

const CategoryPage = () => {
  const { slug } = useParams();
  const cat = categories.find((c) => c.slug === slug);
  const items = useMemo(() => products.filter((p) => p.category === slug), [slug]);
  // Build a small list including duplicates of items so grids never look empty
  const display = items.length ? items.concat(products.slice(0, Math.max(0, 6 - items.length))) : products;
  const [filter, setFilter] = useState("all");

  const fabrics = ["all", ...Array.from(new Set(display.map((p) => p.fabric)))];
  const filtered = filter === "all" ? display : display.filter((p) => p.fabric === filter);

  if (!cat) {
    return (
      <Layout>
        <div className="container-x py-32 text-center">
          <h1 className="font-display text-4xl">Category not found</h1>
          <Link to="/" className="btn-bold mt-6 inline-flex">Back home</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-secondary">
        <div className="container-x py-12 md:py-16 grid md:grid-cols-2 gap-8 items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Catalog · {cat.fabric}</span>
            <h1 className="font-display text-6xl md:text-8xl leading-none mt-3">{cat.name.toUpperCase()}</h1>
          </div>
          <img src={cat.image} alt={cat.name} loading="lazy" className="w-full max-h-[260px] object-cover" />
        </div>
      </section>

      <section className="container-x py-12">
        <div className="flex gap-2 flex-wrap mb-8">
          {fabrics.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs uppercase tracking-wide border transition ${
                filter === f ? "bg-ink text-cream border-ink" : "border-border hover:border-ink"
              }`}
            >
              {f === "all" ? "All Fabrics" : f}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id + Math.random()} p={p} />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default CategoryPage;
