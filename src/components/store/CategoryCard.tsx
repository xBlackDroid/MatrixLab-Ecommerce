import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  CupSoda,
  Magnet,
  Shirt,
  Sparkles,
  Sticker,
  Wand2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CategoryRow } from "@/lib/db/types";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  stickers: Sticker,
  imanes: Magnet,
  "playeras-prendas": Shirt,
  gorras: Sparkles,
  "grabado-laser": Zap,
  "impresion-3d": Box,
  "disenador-tshirt-lab": Wand2,
  // Línea de vasos, termos, snow globe e insumos.
  "matrixlab-tumbler": CupSoda,
};

export default function CategoryCard({ category }: { category: CategoryRow }) {
  const Icon = CATEGORY_ICONS[category.handle] ?? Sparkles;
  // La categoría del diseñador lleva directo al laboratorio interactivo.
  const href =
    category.handle === "disenador-tshirt-lab"
      ? "/tienda/disenador"
      : `/tienda/categoria/${category.handle}`;

  return (
    <Link
      href={href}
      className="group glass flex flex-col gap-4 rounded-2xl p-6 transition hover:-translate-y-1 hover:border-ml-cyan/40 hover:shadow-glow-cyan"
    >
      {/* Si la categoría tiene logo/imagen (verificada en servidor: solo llega
          aquí si el archivo existe o es una URL remota del admin) se muestra;
          si no, cae al icono de la categoría. */}
      {category.image_url ? (
        <Image
          src={category.image_url}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-xl border border-white/10 object-cover"
          aria-hidden
        />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ml-violet/15 text-ml-violet transition group-hover:bg-ml-cyan/15 group-hover:text-ml-cyan">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      )}
      <div>
        <h3 className="text-lg font-semibold">{category.title}</h3>
        {category.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-ml-white/60">
            {category.description}
          </p>
        )}
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-ml-violet transition group-hover:gap-2.5 group-hover:text-ml-cyan">
        Explorar
        <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  );
}
