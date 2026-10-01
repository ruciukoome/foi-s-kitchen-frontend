export const ORDER_STATUSES = [
  "Received",
  "Preparing",
  "Out for delivery",
  "Ready for pickup",
  "Completed",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = { name: string; qty: number; price: number };

export type OrderRow = {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  items: OrderItem[];
  total: number;
  method: string;
  address: string | null;
  preferred_time: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  paid_at?: string | null;
};

/** Plain-language label for how (and whether) an order was paid. */
export function paymentLabel(row: OrderRow) {
  const status = (row.payment_status ?? "unpaid").toLowerCase();
  const via =
    row.payment_method === "paystack"
      ? "Paystack"
      : row.payment_method === "whatsapp"
        ? "WhatsApp"
        : row.payment_method === "email"
          ? "Email"
          : row.payment_method === "manual"
            ? "Manual"
            : null;
  if (status === "paid") return via ? `Paid · ${via}` : "Paid";
  if (status === "pending") return "Payment pending";
  if (status === "failed") return "Payment failed";
  return via ? `Unpaid · ${via}` : "Unpaid";
}

/** Brand-token badge classes per payment state. */
export function paymentBadgeClass(row: OrderRow) {
  switch ((row.payment_status ?? "unpaid").toLowerCase()) {
    case "paid":
      return "bg-sage text-sage-foreground";
    case "pending":
      return "bg-gold/20 text-foreground";
    case "failed":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-secondary text-foreground";
  }
}


/** Brand-token badge classes per status. */
export function statusBadgeClass(status: string) {
  switch (status) {
    case "Preparing":
    case "Out for delivery":
    case "Ready for pickup":
      return "bg-primary text-primary-foreground";
    case "Completed":
      return "bg-sage text-sage-foreground";
    case "Cancelled":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-secondary text-foreground";
  }
}

export function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function summariseItems(items: OrderItem[] | null | undefined) {
  if (!items || items.length === 0) return "No items";
  return items.map((i) => `${i.qty} × ${i.name}`).join(", ");
}
