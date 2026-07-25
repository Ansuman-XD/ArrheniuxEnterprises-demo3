import type { CreateOrderInput, ApiOrder, ApiPaymentMethod } from "@/lib/api";

export type StorefrontOrderKind = "retail" | "bulk" | "b2b";

export type PlaceOrderPayload = {
  kind: StorefrontOrderKind;
  isSample?: boolean;
  customerId?: string | null;
  customerName: string;
  phone: string;
  email: string;
  address?: string;
  productId?: string;
  productCode?: string;
  productName: string;
  category?: string;
  productType?: string;
  subCategory?: string;
  material?: string;
  description?: string;
  printType?: string;
  printLocation?: string;
  uploadedLogo?: string;
  sizes?: Record<string, number>;
  qty: number;
  unitPrice: number;
  gstPct?: number;
  shipping?: number;
  total: number;
  paid: number;
  paymentMode: "full" | "advance-50" | "cod";
  paymentRef?: string;
};

const KIND_TO_TYPE: Record<StorefrontOrderKind, CreateOrderInput["type"]> = {
  retail: "Normal",
  bulk: "Bulk",
  b2b: "B2B",
};

function paymentMethodFromMode(mode: PlaceOrderPayload["paymentMode"]): ApiPaymentMethod {
  if (mode === "cod") return "COD";
  return "UPI";
}

function paymentStatus(paid: number, total: number): CreateOrderInput["paymentStatus"] {
  if (paid >= total) return "Paid";
  if (paid > 0) return "Partial";
  return "Pending";
}

export function toCreateOrderInput(payload: PlaceOrderPayload): CreateOrderInput {
  return {
    customerId: payload.customerId ?? null,
    customer: payload.customerName,
    phone: payload.phone,
    email: payload.email,
    address: payload.address ?? "",
    productId: payload.productId ?? null,
    productCode: payload.productCode ?? "",
    productName: payload.productName,
    category: payload.category ?? "",
    productType: payload.productType ?? "",
    subCategory: payload.subCategory ?? "",
    material: payload.material ?? "",
    description: payload.description ?? "",
    printType: payload.printType ?? "",
    printLocation: "",
    uploadedLogo: payload.uploadedLogo ?? "",
    sizes: payload.sizes ?? {},
    qty: payload.qty,
    unitPrice: payload.unitPrice,
    gstPct: payload.gstPct ?? 5,
    shipping: payload.shipping ?? 0,
    type: KIND_TO_TYPE[payload.kind],
    status: "Placed",
    paymentStatus: paymentStatus(payload.paid, payload.total),
    paymentMethod: paymentMethodFromMode(payload.paymentMode),
    date: new Date().toISOString().slice(0, 10),
  };
}

/** Map API order to legacy storefront order shape for MyOrders UI. */
export type StorefrontOrder = {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productCode?: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  discountPct: number;
  discountAmt: number;
  printType?: string;
  printCharge?: number;
  courier: number;
  gst: number;
  total: number;
  paid: number;
  paymentMode: "full" | "advance-50" | "cod";
  paymentRef?: string;
  status: ApiOrder["status"];
  createdAt: string;
  updatedAt: string;
  expectedDelivery?: string;
  kind: StorefrontOrderKind;
  sizes?: Record<string, number>;
};

export function apiOrderToStorefront(o: ApiOrder, userId: string): StorefrontOrder {
  const subtotal = o.unitPrice * o.qty;
  const gst = Math.round((subtotal + o.shipping) * (o.gstPct / 100));
  const total = subtotal + o.shipping + gst;
  const kind: StorefrontOrderKind =
    o.type === "Bulk" ? "bulk" : o.type === "B2B" ? "b2b" : "retail";

  let paymentMode: StorefrontOrder["paymentMode"] = "full";
  if (o.paymentMethod === "COD") paymentMode = "cod";
  else if (o.paymentStatus === "Partial") paymentMode = "advance-50";

  const paid =
    o.paymentStatus === "Paid"
      ? total
      : o.paymentStatus === "Partial"
        ? Math.round(total / 2)
        : 0;

  return {
    id: o.id,
    userId,
    productId: o.productId ?? "",
    productName: o.productName,
    productCode: o.productCode,
    qty: o.qty,
    unitPrice: o.unitPrice,
    subtotal,
    discountPct: 0,
    discountAmt: 0,
    printType: o.printType,
    courier: o.shipping,
    gst,
    total,
    paid,
    paymentMode,
    status: o.status,
    createdAt: o.date,
    updatedAt: o.date,
    expectedDelivery: new Date(Date.parse(o.date) + 10 * 86400000).toISOString(),
    kind,
    sizes: o.sizes,
  };
}

export type StorefrontReview = {
  id: string;
  name: string;
  subject: "Company" | "Product Quality" | "Service";
  rating: number;
  text: string;
  createdAt: string;
  productId?: string;
  userId?: string;
};

export function apiReviewToStorefront(r: {
  id: string;
  customer: string;
  productId: string | null;
  rating: number;
  comment: string;
  date: string;
}): StorefrontReview {
  return {
    id: r.id,
    name: r.customer,
    subject: "Product Quality",
    rating: r.rating,
    text: r.comment,
    createdAt: r.date,
    productId: r.productId ?? undefined,
  };
}
