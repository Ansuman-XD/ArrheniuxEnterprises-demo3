import { useEffect, useState } from "react";
import { Star, Lock, CheckCircle2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  addReview,
  getReviewsForProduct,
  getSession,
  hasPurchased,
  type Review,
} from "@/lib/authStore";

export const ProductReviews = ({ productId }: { productId: string }) => {
  const nav = useNavigate();
  const loc = useLocation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setReviews(getReviewsForProduct(productId));
  }, [productId]);

  const user = getSession();
  const purchased = user ? hasPurchased(user.id, productId) : false;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) {
      nav(`/auth?next=${encodeURIComponent(loc.pathname)}`);
      return;
    }
    if (!purchased) {
      setError("Only verified buyers of this product can leave a review.");
      return;
    }
    if (text.trim().length < 5) {
      setError("Please write a short review (5+ chars).");
      return;
    }
    const r = addReview({
      name: user.name,
      subject: "Product Quality",
      rating,
      text: text.trim(),
      productId,
      userId: user.id,
    });
    setReviews((prev) => [r, ...prev]);
    setText("");
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <section className="container-x py-16 border-t border-border">
      <h2 className="font-display text-4xl md:text-5xl mb-6">PRODUCT REVIEWS</h2>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8">
        <div className="space-y-4">
          {reviews.length === 0 && (
            <p className="text-muted-foreground text-sm">No reviews yet. Be the first verified buyer to review.</p>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="border border-border p-4 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Verified Buyer
                </span>
              </div>
              <p className="text-sm mt-2">{r.text}</p>
              <div className="text-xs text-muted-foreground mt-2">
                {r.name} · {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="border border-border p-5 bg-secondary h-fit">
          <h3 className="font-condensed text-xl tracking-wide">WRITE A REVIEW</h3>
          {!user ? (
            <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> Log in to review.
            </p>
          ) : !purchased ? (
            <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> Only verified buyers of this product can review.
            </p>
          ) : (
            <p className="text-xs text-primary mt-2 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> You've bought this product — thanks for reviewing.
            </p>
          )}
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-6 w-6 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Share your experience…"
            className="w-full mt-3 border border-border p-3 text-sm bg-background focus:outline-none focus:border-ink"
          />
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          {done && <p className="text-xs text-primary mt-2">Thanks — your review is live.</p>}
          <button className="btn-bold mt-3 w-full justify-center">Submit Review</button>
        </form>
      </div>
    </section>
  );
};
