// Demo Razorpay integration — replace VITE_RAZORPAY_KEY_ID with a real
// rzp_test_... / rzp_live_... key when ready. Falls back to a simulated
// confirm dialog when the demo placeholder is used or the SDK fails to load.

declare global {
  interface Window {
    Razorpay?: new (opts: unknown) => { open: () => void };
  }
}

const KEY: string =
  (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined) ||
  "rzp_test_DEMO";

const loadSdk = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

export type RzpOptions = {
  amountInr: number;   // rupees
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
};

export const openRazorpay = async (opts: RzpOptions) => {
  const amountPaise = Math.max(1, Math.round(opts.amountInr * 100));

  // Demo mode: no real key → simulate
  if (KEY === "rzp_test_DEMO") {
    const ok = window.confirm(
      `Demo payment — Razorpay test key not configured yet.\n\nSimulate a successful payment of ₹${opts.amountInr.toLocaleString(
        "en-IN"
      )} for "${opts.description}"?`
    );
    if (ok) opts.onSuccess(`demo_${Date.now()}`);
    else opts.onDismiss?.();
    return;
  }

  const ready = await loadSdk();
  if (!ready || !window.Razorpay) {
    alert("Payment gateway failed to load. Please try again.");
    opts.onDismiss?.();
    return;
  }

  const rzp = new window.Razorpay({
    key: KEY,
    amount: amountPaise,
    currency: "INR",
    name: opts.name,
    description: opts.description,
    prefill: opts.prefill,
    theme: { color: "#1a1a1a" },
    handler: (resp: { razorpay_payment_id: string }) =>
      opts.onSuccess(resp.razorpay_payment_id),
    modal: { ondismiss: () => opts.onDismiss?.() },
  });
  rzp.open();
};
