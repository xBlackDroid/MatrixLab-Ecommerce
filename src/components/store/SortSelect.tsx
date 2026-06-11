"use client";

import { usePathname, useRouter } from "next/navigation";
import { PRODUCT_SORT_OPTIONS, type ProductSort } from "@/lib/validation/store";

const SORT_LABELS: Record<ProductSort, string> = {
  newest: "Más recientes",
  featured: "Destacados",
  price_asc: "Precio: menor a mayor",
  price_desc: "Precio: mayor a menor",
};

export default function SortSelect({ current }: { current: ProductSort }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <label className="flex items-center gap-2 text-sm text-ml-white/60">
      Ordenar por
      <select
        value={current}
        onChange={(event) =>
          router.push(`${pathname}?orden=${event.target.value}`)
        }
        className="glass rounded-full border-white/15 bg-ml-bg/80 px-4 py-2 text-sm text-ml-white outline-none transition focus:border-ml-violet"
      >
        {PRODUCT_SORT_OPTIONS.map((option) => (
          <option key={option} value={option} className="bg-ml-bg">
            {SORT_LABELS[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
