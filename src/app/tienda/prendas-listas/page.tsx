import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Palette, Shirt } from "lucide-react";
import ProductGrid from "@/components/store/ProductGrid";
import { getReadyToWearProducts } from "@/lib/store/products";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * PRENDAS LISTAS — vitrina de MatrixLab Wear que NO pasa por el Laboratorio.
 *
 * POR QUÉ EXISTE ESTA RUTA Y NO SE REUSÓ UNA
 * Ninguna ruta previa publicaba prendas comprables tal cual:
 *
 *   * `/tienda/categoria/playeras-prendas` devuelve ANTES de la grilla y
 *     renderiza `MatrixLabWearCatalog`: 100 DISEÑOS con color, talla y precio
 *     "Por definir". Alimentan al diseñador, no se compran.
 *   * `/tienda/categoria/gorras` sí muestra grilla, pero mezcla la gorra con
 *     inventario real junto a la trucker y la clásica, cuya única variante es
 *     `sobre_pedido` con stock 0.
 *
 * Esta página es la vista mínima que faltaba: misma grilla, misma tarjeta,
 * mismas fichas de producto. No duplica lógica de catálogo ni de carrito —la
 * talla, el color y el alta al carrito siguen viviendo en
 * `/tienda/producto/<handle>`, a donde apunta cada tarjeta.
 *
 * La selección la decide el inventario, no una lista quemada: ver
 * `getReadyToWearProducts`.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prendas listas",
  description:
    "Playeras, gorras y tote bags con talla, color y precio definidos, listas para comprar sin pasar por el diseñador.",
};

export default async function PrendasListasPage() {
  const products = await getReadyToWearProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link
        href="/tienda"
        className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-violet"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a la tienda
      </Link>

      <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-violet">
            <Shirt className="h-4 w-4" aria-hidden />
            MatrixLab Wear
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            Prendas <span className="text-gradient">listas</span>
          </h1>
          <p className="mt-3 max-w-2xl text-ml-white/65">
            Prendas con talla, color y precio ya definidos. Eliges tu variante
            en la ficha y la agregas al carrito: sin diseñar nada y sin esperar
            producción.
          </p>
        </div>

        {/* Puente de vuelta al Laboratorio: quien llegó buscando algo propio no
            se queda sin salida si su prenda no está en esta vitrina. */}
        <Link
          href="/tienda/disenador"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 font-semibold text-ml-white/85 transition hover:border-white/30 hover:text-ml-white"
        >
          <Palette className="h-5 w-5" aria-hidden />
          Prefiero diseñar la mía
        </Link>
      </div>

      <div className="mt-10">
        <ProductGrid
          products={products}
          /* El vacío NO promete stock futuro: la vitrina se arma con lo que
             haya en inventario y puede quedarse sin piezas por completo. */
          emptyMessage="Ahora mismo no hay prendas con inventario listo. Puedes crear la tuya en el Laboratorio o escribirnos por WhatsApp para revisar existencias."
        />
      </div>

      <div className="glass mt-10 rounded-2xl p-6 text-center">
        <p className="text-ml-white/70">
          ¿Buscas una prenda, talla o color que no aparece aquí?
        </p>
        <a
          href={buildWhatsAppUrl(
            "Hola MatrixLab, quiero preguntar por prendas listas (playeras, gorras o tote bags).",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-ml-violet px-7 py-3 font-semibold text-ml-bg shadow-glow-violet transition hover:bg-ml-violet/90"
        >
          Preguntar por WhatsApp
        </a>
      </div>
    </div>
  );
}
