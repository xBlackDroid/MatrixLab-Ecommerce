/**
 * Líneas CURADAS de la tienda.
 *
 * Una línea curada es un catálogo del Excel que se presenta como la vitrina
 * pública COMPLETA de su categoría: /tienda/categoria/stickers muestra los 110
 * diseños de planilla de MatrixLab Stickers y nada más. Los productos
 * genéricos previos de esa misma categoría ("Sticker personalizado", "Planilla
 * de stickers" del Laboratorio) NO se borran ni se despublican: siguen vivos
 * en la base, en el admin y en su propia ficha, pero quedan fuera de ESTA
 * presentación. Eso es lo que cada catálogo devuelve como `legacyHidden`.
 *
 * Aquí viven las dos consecuencias de esa política que ocurren FUERA de la
 * página de categoría. Son independientes entre sí y cada línea las activa por
 * separado: registrar una línea no implica aplicarle ambas.
 *
 *   1. `restrictRelatedToLine` — PRODUCTOS RELACIONADOS. La ficha sólo
 *      recomienda productos de SU MISMA línea. Se activa donde la mezcla
 *      confunde de verdad: abrir una planilla de $85 recomendaba "Planilla de
 *      stickers" (el producto histórico del Laboratorio, $199) por compartir
 *      categoría — dos "planillas" a precios distintos, una junto a la otra.
 *
 *   2. `unit` — UNIDAD COMERCIAL. Un producto de MatrixLab Stickers se vende
 *      por PLANILLA, no por pieza. El carrito y el resumen necesitan esa
 *      unidad resuelta EN SERVIDOR: el cliente sólo manda ids y cantidad.
 *
 * NO hay ningún handle escrito a mano: la pertenencia se pregunta a los mismos
 * módulos de catálogo que ya definen cada línea, así que agregar o quitar un
 * diseño del Excel se refleja solo.
 */
import type { CommercialUnit } from "@/lib/db/types";
import { matrixLab3dByHandle } from "@/lib/store/matrixlab-3d";
import {
  MATRIXLAB_STICKERS_UNIT_LABEL,
  MATRIXLAB_STICKERS_UNIT_LABEL_PLURAL,
  matrixLabStickerByHandle,
} from "@/lib/store/matrixlab-stickers";
import { matrixLabWearByHandle } from "@/lib/store/matrixlab-wear";

interface CuratedLine {
  /** Id interno de la línea; para depuración y pruebas. */
  id: string;
  /** ¿El handle pertenece al catálogo curado de esta línea? */
  includes: (handle: string) => boolean;
  /**
   * Restringir los productos relacionados a la propia línea. `false` deja el
   * comportamiento de siempre: relacionados de toda la categoría.
   */
  restrictRelatedToLine: boolean;
  /**
   * Unidad comercial propia, o `null` si se vende por unidad genérica y debe
   * conservar el copy compartido ("pieza", "c/u").
   */
  unit: CommercialUnit | null;
}

const CURATED_LINES: readonly CuratedLine[] = [
  {
    id: "matrixlab-stickers",
    includes: (handle) => matrixLabStickerByHandle(handle) !== null,
    // Única línea con el choque de "planillas": la categoría `stickers`
    // contiene además la planilla configurable del Laboratorio, a otro precio.
    restrictRelatedToLine: true,
    // Cada SKU es una colección completa: 1 = 1 planilla, no 1 sticker.
    unit: {
      one: MATRIXLAB_STICKERS_UNIT_LABEL,
      many: MATRIXLAB_STICKERS_UNIT_LABEL_PLURAL,
    },
  },
  {
    id: "matrixlab-wear",
    includes: (handle) => matrixLabWearByHandle(handle) !== null,
    // NO se restringe: en `playeras-prendas` los genéricos son las prendas
    // personalizables del Laboratorio (playera, sudadera, tote), que son la
    // entrada natural al diseñador desde una ficha de Wear. Quitarlas de los
    // relacionados sería una decisión comercial distinta, no un efecto
    // colateral de la corrección de Stickers.
    restrictRelatedToLine: false,
    // Una prenda se vende por pieza: conserva el copy genérico.
    unit: null,
  },
  {
    id: "matrixlab-3d",
    includes: (handle) => matrixLab3dByHandle(handle) !== null,
    // Mismo criterio: "Pieza 3D personalizada" es el CTA del Laboratorio.
    restrictRelatedToLine: false,
    unit: null,
  },
];

/** Línea curada a la que pertenece un handle; `null` si no es de ninguna. */
function lineOf(handle: string): CuratedLine | null {
  if (!handle) return null;
  return CURATED_LINES.find((line) => line.includes(handle)) ?? null;
}

/** Id de la línea curada de un handle (para QA y diagnóstico). */
export function curatedLineIdOf(handle: string): string | null {
  return lineOf(handle)?.id ?? null;
}

/**
 * Unidad comercial de un producto, resuelta SÓLO a partir de su handle —dato
 * del servidor, nunca del cliente—. `null` = sin unidad propia: el consumidor
 * mantiene su copy de siempre, que es lo que corresponde a Tumbler, al
 * Laboratorio y a todo lo que se vende por pieza.
 *
 * Deliberadamente NO se infiere del precio: otro producto puede costar lo
 * mismo sin ser una planilla (los UV Stickers de Tumbler, por ejemplo).
 */
export function commercialUnitOf(handle: string): CommercialUnit | null {
  return lineOf(handle)?.unit ?? null;
}

/**
 * ¿`candidate` puede mostrarse como relacionado de `viewed`?
 *
 * Sólo filtra cuando la ficha abierta pertenece a una línea que declara
 * `restrictRelatedToLine`. En cualquier otro caso —Laboratorio, Tumbler, Wear,
 * 3D, cualquier categoría sin línea curada— devuelve `true` y el
 * comportamiento anterior queda intacto.
 */
export function isRelatedProductVisible(
  viewedHandle: string,
  candidateHandle: string,
): boolean {
  const line = lineOf(viewedHandle);
  if (!line?.restrictRelatedToLine) return true;
  return line.includes(candidateHandle);
}
