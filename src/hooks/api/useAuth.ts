import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  createOrder,
  createPayment,
  createSampleOrder,
  fetchCustomers,
  fetchCustomer,
  type CreateCustomerInput,
} from "@/lib/api";
import { toCreateOrderInput, type PlaceOrderPayload } from "@/lib/orderMappers";
import { customerToSessionUser, setSession, type AuthResult } from "@/lib/session";
import { queryKeys } from "./queryKeys";

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customer(id ?? ""),
    queryFn: () => fetchCustomer(id!),
    enabled: !!id,
  });
}

export function useSignup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: CreateCustomerInput & { password?: string },
    ): Promise<AuthResult> => {
      const existing = await fetchCustomers();
      if (existing.some((c) => c.email.toLowerCase() === data.email.toLowerCase())) {
        return { ok: false, error: "Email already registered" };
      }
      const customer = await createCustomer({
        name: data.name,
        email: data.email,
        phone: data.phone ?? "",
        address: "",
      });
      const user = customerToSessionUser(customer);
      setSession(user);
      await qc.invalidateQueries({ queryKey: queryKeys.customers });
      return { ok: true, user };
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({
      email,
    }: {
      email: string;
      password: string;
    }): Promise<AuthResult> => {
      const customers = await fetchCustomers();
      const customer = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
      if (!customer) return { ok: false, error: "Invalid email or password" };
      if (customer.status !== "Active") return { ok: false, error: "Account inactive" };
      const user = customerToSessionUser(customer);
      setSession(user);
      return { ok: true, user };
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PlaceOrderPayload) => {
      const body = toCreateOrderInput(payload);
      const order = payload.isSample
        ? await createSampleOrder(body)
        : await createOrder(body);

      if (payload.paid > 0) {
        await createPayment({
          orderId: order.id,
          customer: payload.customerName,
          amount: payload.paid,
          status: payload.paid >= payload.total ? "Paid" : "Partial",
          date: new Date().toISOString().slice(0, 10),
        });
      }

      await qc.invalidateQueries({ queryKey: ["orders"] });
      return order;
    },
  });
}

export function useCustomerOrders(customerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders(customerId),
    queryFn: async () => {
      const { fetchOrders, fetchSampleOrders } = await import("@/lib/api");
      const [orders, samples] = await Promise.all([fetchOrders(), fetchSampleOrders()]);
      if (!customerId) return [];
      return [...orders, ...samples].filter((o) => o.customerId === customerId);
    },
    enabled: !!customerId,
  });
}
