import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Check, Circle, Download, CreditCard, Star, MessageSquare } from "lucide-react";
import { Layout } from "@/components/Layout";
import {
  getSession,
  getUserOrders,
  advanceOrder,
  updateOrderPayment,
  markOrderReviewed,
  addReview,
  ORDER_STATUSES,
  type Order,
} from "@/lib/authStore";
import { downloadInvoice } from "@/lib/invoice";
import { openRazorpay } from "@/lib/razorpay";
import { toast } from "@/hooks/use-toast";

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tick, setTick] = useState(0);
  const [reviewFor, setReviewFor] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    const u = getSession();
    if (!u) {
      navigate("/auth?next=/my-orders");
      return;
    }
    setOrders(getUserOrders(u.id));
  }, [navigate, tick]);

  const bump = (id: string) => {
    advanceOrder(id);
    setTick((t) => t + 1);
  };

  const payRemaining = (o: Order) => {
    const due = o.total - o.paid;
    if (due <= 0) return;
    openRazorpay({
      amountInr: due,
      name: "Arrhenix — Balance Payment",
      description: `Balance for order #${o.id.slice(0, 8).toUpperCase()}`,
      onSuccess: (ref) => {
        updateOrderPayment(o.id, due, ref);
        toast({ title: "Balance paid", description: "Your invoice has been updated." });
        setTick((t) => t + 1);
      },
    });
  };

  const submitReview = () => {
    if (!reviewFor) return;
    const user = getSession();
    if (!user) return;
    if (reviewText.trim().length < 5) {
      toast({ title: "Add a bit more detail", description: "Reviews need at least 5 characters." });
      return;
    }
    addReview({
      name: user.name,
      subject: "Product Quality",
      rating,
      text: reviewText.trim(),
      productId: reviewFor.productId,
      userId: user.id,
    });
    markOrderReviewed(reviewFor.id);
    toast({ title: "Thanks!", description: "Your review is live on the product page." });
    setReviewFor(null);
    setReviewText("");
    setRating(5);
    setTick((t) => t + 1);
  };

  return (
    <Layout>
      <section className="container-x py-12">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">Your Account</span>
        <h1 className="font-display text-5xl md:text-6xl mt-2">MY ORDERS</h1>

        {orders.length === 0 ? (
          <div className="mt-10 border border-dashed border-border p-10 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No orders yet.</p>
            <Link to="/" className="btn-bold mt-6 inline-flex">Start shopping</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {orders.map((o) => {
              const expected = o.expectedDelivery ? new Date(o.expectedDelivery) : new Date(new Date(o.createdAt).getTime() + 10 * 86400000);
              const due = Math.max(0, o.total - o.paid);
              const paymentPaid = due === 0;
              const delivered = o.status === "Delivered";
              return (
                <div key={o.id} className="border border-border bg-card p-5">
                  <div className="flex flex-col md:flex-row gap-4">
                    {o.productImage && (
                      <div className="w-full md:w-32 h-32 shrink-0 bg-secondary overflow-hidden">
                        <img src={o.productImage} alt={o.productName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Order #{o.id.slice(0, 8).toUpperCase()}
                          </div>
                          <div className="font-condensed text-2xl tracking-wide mt-1">{o.productName.toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                            {o.productCode && <span>Code: <span className="font-mono">{o.productCode}</span></span>}
                            <span>Qty: {o.qty} pcs</span>
                            <span>Ordered: {new Date(o.createdAt).toLocaleDateString()}</span>
                            <span>Expected: {expected.toLocaleDateString()}</span>
                            <span className="uppercase">{o.kind}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge tone={paymentPaid ? "success" : "warn"}>
                              Payment: {paymentPaid ? "Paid" : "Pending Balance"}
                            </Badge>
                            <Badge tone={delivered ? "success" : "info"}>
                              Delivery: {o.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-2xl">₹{o.total.toLocaleString("en-IN")}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Paid ₹{o.paid.toLocaleString("en-IN")}
                          </div>
                          {due > 0 && (
                            <div className="text-[10px] uppercase tracking-widest text-destructive font-semibold mt-0.5">
                              Balance ₹{due.toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-5 gap-1">
                    {ORDER_STATUSES.map((s, i) => {
                      const currentIdx = ORDER_STATUSES.indexOf(o.status);
                      const reached = i <= currentIdx;
                      return (
                        <div key={s} className="flex flex-col items-center text-center gap-1.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                            reached ? "bg-primary border-primary text-cream" : "border-border text-muted-foreground bg-background"
                          }`}>
                            {reached ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                          </div>
                          <span className={`text-[10px] uppercase tracking-widest ${reached ? "text-ink font-semibold" : "text-muted-foreground"}`}>
                            {s}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => downloadInvoice(o)}
                        className="text-[11px] uppercase tracking-widest border border-border px-3 py-1.5 hover:border-ink inline-flex items-center gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> Download Invoice
                      </button>
                      {!paymentPaid && (
                        <button
                          onClick={() => payRemaining(o)}
                          className="text-[11px] uppercase tracking-widest bg-primary text-cream px-3 py-1.5 inline-flex items-center gap-1"
                        >
                          <CreditCard className="h-3.5 w-3.5" /> Pay Remaining ₹{due.toLocaleString("en-IN")}
                        </button>
                      )}
                      {delivered && !o.reviewedAt && (
                        <button
                          onClick={() => { setReviewFor(o); setRating(5); setReviewText(""); }}
                          className="text-[11px] uppercase tracking-widest bg-ink text-cream px-3 py-1.5 inline-flex items-center gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Write Review
                        </button>
                      )}
                      {delivered && o.reviewedAt && (
                        <span className="text-[11px] uppercase tracking-widest text-primary inline-flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Review Submitted
                        </span>
                      )}
                    </div>
                    {o.status !== "Delivered" && (
                      <button
                        onClick={() => bump(o.id)}
                        className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-ink"
                      >
                        Advance status (demo)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Review modal */}
        {reviewFor && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewFor(null)}>
            <div className="bg-card border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-condensed text-2xl tracking-wide">REVIEW: {reviewFor.productName.toUpperCase()}</h3>
              <div className="flex items-center gap-1 mt-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                    <Star className={`h-7 w-7 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                placeholder="Share your experience…"
                className="w-full mt-3 border border-border p-3 text-sm bg-background focus:outline-none focus:border-ink"
              />
              <div className="mt-4 flex gap-2 justify-end">
                <button onClick={() => setReviewFor(null)} className="text-xs uppercase tracking-widest px-3 py-2 border border-border">
                  Cancel
                </button>
                <button onClick={submitReview} className="btn-bold !py-2 text-xs">Submit Review</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

const Badge = ({ tone, children }: { tone: "success" | "warn" | "info"; children: React.ReactNode }) => {
  const cls = tone === "success"
    ? "bg-primary/10 text-primary border-primary/20"
    : tone === "warn"
    ? "bg-destructive/10 text-destructive border-destructive/20"
    : "bg-secondary text-ink border-border";
  return <span className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${cls}`}>{children}</span>;
};

export default MyOrders;
