import { cn } from "@/lib/utils";

/** Badge genérico de estados para el panel admin (whitelist visual). */

const STYLES: Record<string, string> = {
  // Pedidos
  pendiente_pago: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  pagado: "border-ml-cyan/40 bg-ml-cyan/10 text-ml-cyan",
  pago_rechazado: "border-ml-coral/40 bg-ml-coral/10 text-ml-coral",
  revisando_diseno: "border-ml-violet/40 bg-ml-violet/10 text-ml-violet",
  en_produccion: "border-ml-violet/40 bg-ml-violet/10 text-ml-violet",
  listo: "border-ml-cyan/40 bg-ml-cyan/10 text-ml-cyan",
  enviado: "border-ml-cyan/40 bg-ml-cyan/10 text-ml-cyan",
  entregado: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  cancelado: "border-white/20 bg-white/5 text-ml-white/60",
  // Pagos
  pending: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  in_process: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  approved: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  rejected: "border-ml-coral/40 bg-ml-coral/10 text-ml-coral",
  cancelled: "border-white/20 bg-white/5 text-ml-white/60",
  refunded: "border-ml-coral/40 bg-ml-coral/10 text-ml-coral",
  // Catálogo
  disponible: "border-ml-cyan/40 bg-ml-cyan/10 text-ml-cyan",
  agotado: "border-ml-coral/40 bg-ml-coral/10 text-ml-coral",
  sobre_pedido: "border-ml-violet/40 bg-ml-violet/10 text-ml-violet",
  oculto: "border-white/20 bg-white/5 text-ml-white/60",
  proximamente: "border-white/20 bg-white/5 text-ml-white/70",
  activa: "border-ml-cyan/40 bg-ml-cyan/10 text-ml-cyan",
  oculta: "border-white/20 bg-white/5 text-ml-white/60",
  // Diseños
  draft: "border-white/20 bg-white/5 text-ml-white/60",
  added_to_cart: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  ordered: "border-ml-violet/40 bg-ml-violet/10 text-ml-violet",
  production_ready: "border-ml-cyan/40 bg-ml-cyan/10 text-ml-cyan",
  in_review: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  in_production: "border-ml-violet/40 bg-ml-violet/10 text-ml-violet",
  completed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
};

const LABELS: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  pago_rechazado: "Pago rechazado",
  revisando_diseno: "Revisando diseño",
  en_produccion: "En producción",
  listo: "Listo",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  pending: "Pendiente",
  in_process: "En proceso",
  approved: "Aprobado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  disponible: "Disponible",
  agotado: "Agotado",
  sobre_pedido: "Sobre pedido",
  oculto: "Oculto",
  proximamente: "Próximamente",
  activa: "Activa",
  oculta: "Oculta",
  draft: "Borrador",
  added_to_cart: "En carrito",
  ordered: "Con pedido",
  production_ready: "Listo p/ producción",
  in_review: "Revisando",
  in_production: "Producción",
  completed: "Listo",
};

export default function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[status] ?? "border-white/20 bg-white/5 text-ml-white/70",
        className,
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
