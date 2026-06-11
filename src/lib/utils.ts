import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return mxn.format(Number.isFinite(n) ? n : 0);
}

/** Redondea a 2 decimales para montos en MXN. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
