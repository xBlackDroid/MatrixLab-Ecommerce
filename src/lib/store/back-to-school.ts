import type { ComponentType, SVGProps } from "react";
import { Backpack, Tags } from "lucide-react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * ---------------------------------------------------------------------------
 * Regreso a Clases
 * ---------------------------------------------------------------------------
 * La línea escolar tiene DOS caminos distintos y ninguno sustituye al otro:
 *
 *   1. Etiquetas personalizadas -> el editor (Etiquetas Escolares Lab), donde
 *      el cliente arma su pack antes de comprarlo.
 *   2. Productos de regreso a clases -> el catálogo de la categoría escolar,
 *      donde se compra lo que ya está listo.
 *
 * Antes el bloque presentaba toda la línea como si sólo fueran etiquetas, así
 * que el catálogo quedaba escondido detrás de un "Ver categoría" genérico.
 * Este módulo es la ÚNICA fuente del nombre, el copy y los dos destinos, para
 * que la home y /tienda no puedan desincronizarse.
 *
 * Ambas rutas ya existían: no se crean categorías ni se toca el editor.
 */
export const BACK_TO_SCHOOL_TITLE = "Regreso a Clases";

/** Partido en dos para el tratamiento de marca (la segunda mitad va en degradado). */
export const BACK_TO_SCHOOL_TITLE_PREFIX = "Regreso a";
export const BACK_TO_SCHOOL_TITLE_HIGHLIGHT = "Clases";

/**
 * Etiqueta corta del bloque. NO repite el título ("Regreso a Clases") porque
 * ambos se leen juntos; nombra la temporada, igual que "Línea creativa" o
 * "Corte & grabado" en los demás bloques.
 */
export const BACK_TO_SCHOOL_BADGE = "Temporada escolar";

/**
 * Una sola frase. La tarjeta de Regreso a Clases vive en la misma rejilla que
 * las otras cinco familias y tiene que medir lo mismo: el copy largo anterior
 * ocupaba tres líneas más y estiraba su fila entera.
 */
export const BACK_TO_SCHOOL_DESCRIPTION =
  "Etiquetas con su nombre y productos con personalidad para comenzar clases.";

export interface BackToSchoolAccess {
  id: string;
  label: string;
  href: string;
  icon: IconComponent;
}

/**
 * Los dos accesos del bloque. Cada uno es un enlace independiente y su destino
 * es DISTINTO: el editor por un lado, el catálogo por el otro.
 *
 * Se presentan como dos pastillas compactas, no como tarjetas anidadas: una
 * tarjeta dentro de otra duplicaba el alto del bloque y desnivelaba la
 * rejilla de familias.
 */
export const BACK_TO_SCHOOL_ACCESSES: BackToSchoolAccess[] = [
  {
    id: "etiquetas",
    label: "Crear etiquetas",
    // Editor existente (Etiquetas Escolares Lab). No cambia.
    href: "/tienda/disenador/etiquetas-escolares",
    icon: Tags,
  },
  {
    id: "productos",
    label: "Explorar regreso a clases",
    // Catálogo real de la categoría escolar (carrito y checkout normales).
    href: "/tienda/categoria/etiquetas-escolares",
    icon: Backpack,
  },
];
