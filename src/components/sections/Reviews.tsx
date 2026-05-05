import { Star } from "lucide-react";
import { reviews } from "@/data/site";

export const Reviews = () => (
  <section className="bg-ink text-cream py-20">
    <div className="container-x">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent">07 — Reviews</span>
          <h2 className="font-display text-5xl md:text-6xl mt-2">CLIENT REACTIONS</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-accent text-accent" />
            ))}
          </div>
          <div>
            <div className="font-display text-2xl">4.9 / 5</div>
            <div className="text-xs text-cream/60 uppercase tracking-wide">Google Reviews · 380+ ratings</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((r) => (
          <div key={r.name} className="border border-cream/15 p-6 flex flex-col gap-3 hover:border-accent transition">
            <div className="flex">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-cream/85 text-sm leading-relaxed">"{r.text}"</p>
            <div className="mt-auto pt-3 border-t border-cream/10">
              <div className="font-condensed text-lg tracking-wide">{r.name.toUpperCase()}</div>
              <div className="text-xs text-cream/50">{r.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
