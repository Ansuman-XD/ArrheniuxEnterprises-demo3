import { ProductCard } from "../ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewCollectionProducts } from "@/hooks/api";

export const LatestCollection = () => {
  const { products: items, isLoading, isError } = useNewCollectionProducts(9);

  return (
    <section className="bg-secondary py-20">
      <div className="container-x">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">02 — New Collection</span>
            <h2 className="font-display text-5xl md:text-6xl mt-2">NEW COLLECTION</h2>
          </div>
          <p className="max-w-sm text-muted-foreground text-sm">
            The latest 9 styles added to our catalog — engineered for bulk and ready to customize.
          </p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col bg-card border border-border">
                <Skeleton className="w-full aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-muted-foreground text-sm">Could not load new collection items.</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No new collection items yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((p) => (
              <ProductCard key={p.id} p={p as any} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
