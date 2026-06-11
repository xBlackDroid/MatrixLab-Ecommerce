import { isSupabaseConfigured } from "@/lib/security/env";
import { readSessionIdFromCookies } from "@/lib/security/session";
import { getOrderForSession } from "@/lib/store/orders";
import { formatPrice } from "@/lib/utils";
import { UuidSchema } from "@/lib/validation/store";

/**
 * Resumen de pedido para las pantallas de resultado del checkout.
 * Solo se muestra si el pedido pertenece a la sesión actual.
 */
export default async function OrderSummaryCard({
  orderId,
}: {
  orderId: string | undefined;
}) {
  const parsed = UuidSchema.safeParse(orderId ?? "");
  if (!parsed.success || !isSupabaseConfigured()) return null;

  const sessionId = await readSessionIdFromCookies();
  if (!sessionId) return null;

  const result = await getOrderForSession(parsed.data, sessionId);
  if (!result) return null;
  const { order, items } = result;

  return (
    <div className="glass mx-auto mt-8 w-full max-w-md rounded-2xl p-6 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ml-white/60">Pedido</p>
        <p className="font-mono text-sm font-semibold text-ml-violet">
          {order.order_number}
        </p>
      </div>
      <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="text-ml-white/70">
              {item.quantity}× {item.title_snapshot}
              {item.variant_snapshot ? ` (${item.variant_snapshot})` : ""}
              {item.is_custom ? " · Personalizado" : ""}
            </span>
            <span className="shrink-0">{formatPrice(item.total)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between border-t border-white/10 pt-4 font-bold">
        <span>Total</span>
        <span>{formatPrice(order.total)} MXN</span>
      </div>
    </div>
  );
}
