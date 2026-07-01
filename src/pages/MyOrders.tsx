import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Check, Circle } from "lucide-react";
import { Layout } from "@/components/Layout";
import {
  getSession,
  getUserOrders,
  advanceOrder,
  ORDER_STATUSES,
  type Order,
} from "@/lib/authStore";

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tick, setTick] = useState(0);

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
            {orders.map((o) => (
              <div key={o.id} className="border border-border bg-card p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Order #{o.id.slice(0, 8).toUpperCase()} · {new Date(o.createdAt).toLocaleString()}
                    </div>
                    <div className="font-condensed text-2xl tracking-wide mt-1">{o.productName.toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {o.productCode && <>Code: <span className="font-mono">{o.productCode}</span> · </>}
                      {o.qty} pcs · {o.kind === "bulk" ? "Bulk order" : "Retail"}
                      {o.printType && o.printType !== "none" && <> · Print: {o.printType}</>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl">₹{o.total.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Paid ₹{o.paid.toLocaleString("en-IN")} ({o.paymentMode})
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-5 grid grid-cols-5 gap-1">
                  {ORDER_STATUSES.map((s, i) => {
                    const currentIdx = ORDER_STATUSES.indexOf(o.status);
                    const reached = i <= currentIdx;
                    return (
                      <div key={s} className="flex flex-col items-center text-center gap-1.5">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                            reached ? "bg-primary border-primary text-cream" : "border-border text-muted-foreground bg-background"
                          }`}
                        >
                          {reached ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                        </div>
                        <span
                          className={`text-[10px] uppercase tracking-widest ${
                            reached ? "text-ink font-semibold" : "text-muted-foreground"
                          }`}
                        >
                          {s}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {o.status !== "Delivered" && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => bump(o.id)}
                      className="text-[11px] uppercase tracking-widest border border-border px-3 py-1.5 hover:border-ink"
                    >
                      Advance status (demo)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default MyOrders;
