import { useMemo, useState, useEffect } from "react";
import { Star } from "lucide-react";
import { reviews as seedReviews } from "@/data/site";
import { getReviews, type Review } from "@/lib/authStore";
import { ReviewForm } from "@/components/ReviewForm";

type Item = { name: string; role?: string; rating: number; text: string };

export const Reviews = () => {
  const [userReviews, setUserReviews] = useState<Review[]>([]);

  useEffect(() => {
    setUserReviews(getReviews());
  }, []);

  const items: Item[] = useMemo(() => {
    const fromUsers: Item[] = userReviews.map((r) => ({
      name: r.name,
      role: r.subject,
      rating: r.rating,
      text: r.text,
    }));
    return [...fromUsers, ...seedReviews];
  }, [userReviews]);

  // Duplicate for seamless marquee
  const marquee = [...items, ...items];

  return (
    <section id="reviews" className="bg-ink text-cream py-20 overflow-hidden">
      <div className="container-x">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent">07 — Reactions</span>
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
              <div className="text-xs text-cream/60 uppercase tracking-wide">{items.length}+ reactions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative group">
        <style>{`
          @keyframes arr-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .arr-marquee-track { animation: arr-marquee 60s linear infinite; }
          .arr-marquee-wrap:hover .arr-marquee-track { animation-play-state: paused; }
        `}</style>
        <div className="arr-marquee-wrap">
          <div className="arr-marquee-track flex gap-4 w-max px-5 md:px-10">
            {marquee.map((r, i) => (
              <div
                key={i}
                className="w-[320px] shrink-0 border border-cream/15 p-6 flex flex-col gap-3 hover:border-accent transition bg-ink"
              >
                <div className="flex">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-cream/85 text-sm leading-relaxed line-clamp-5">"{r.text}"</p>
                <div className="mt-auto pt-3 border-t border-cream/10">
                  <div className="font-condensed text-lg tracking-wide">{r.name.toUpperCase()}</div>
                  {r.role && <div className="text-xs text-cream/50">{r.role}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-x mt-12 max-w-2xl">
        <ReviewForm onSubmitted={(r) => setUserReviews((prev) => [r, ...prev])} />
      </div>
    </section>
  );
};
