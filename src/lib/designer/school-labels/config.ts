/**
 * Configuración de Etiquetas Escolares Lab: paquetes, add-ons y pasos del
 * pedido. Es la fuente de verdad de la UI del laboratorio y de la whitelist de
 * validación (los IDs de add-ons se derivan de aquí).
 *
 * Precios: este laboratorio NO inventa precios. El precio real vive en el
 * producto base / variantes de la tienda y lo edita el admin (ver
 * supabase/seed_school_labels.sql y /admin/productos). Los add-ons quedan
 * preparados para que el admin defina su costo; aquí solo describimos la
 * opción.
 */

export type SchoolPackageId = "elementary" | "ultra";

export interface SchoolPackageOption {
  id: SchoolPackageId;
  name: string;
  description: string;
  /** Coincide con product_variants.option_label en el seed. */
  variantLabel: string;
  highlights: string[];
}

export const SCHOOL_PACKAGES: SchoolPackageOption[] = [
  {
    id: "elementary",
    name: "Elementary",
    description:
      "Pack escolar esencial para identificar útiles y objetos del día a día.",
    variantLabel: "Elementary",
    highlights: [
      "Etiquetas para útiles y objetos personales",
      "Nombre, tipografía y combinación de colores",
      "Listo para regreso a clases",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    description:
      "Pack completo con más opciones de personalización. Puede incluir hasta 2 diseños diferentes.",
    variantLabel: "Ultra",
    highlights: [
      "Más piezas y superficies",
      "Hasta 2 diseños diferentes",
      "Ideal para varios estudiantes o temáticas",
    ],
  },
];

export const SCHOOL_PACKAGE_IDS = SCHOOL_PACKAGES.map((p) => p.id);

export function getSchoolPackage(
  id: string,
): SchoolPackageOption | null {
  return SCHOOL_PACKAGES.find((p) => p.id === id) ?? null;
}

export interface SchoolAddonOption {
  id: string;
  name: string;
  description: string;
  /** true = abre WhatsApp en vez de sumar al diseño (sin precio definido). */
  quoteOnly?: boolean;
}

/**
 * Add-ons opcionales. Quedan preparados para que el admin defina precio/stock
 * desde la tienda; aquí solo guardamos el catálogo de opciones seleccionables.
 */
export const SCHOOL_ADDONS: SchoolAddonOption[] = [
  {
    id: "material-upgrade",
    name: "Upgrade de material",
    description:
      "Mejora el material de las etiquetas si está disponible en catálogo.",
  },
  {
    id: "extra-design",
    name: "Diseño adicional",
    description: "Agrega un segundo diseño (disponible en el paquete Ultra).",
  },
  {
    id: "extra-name",
    name: "Nombre extra",
    description: "Incluye el nombre de otro estudiante en el mismo pedido.",
  },
  {
    id: "extra-labels",
    name: "Etiquetas extra",
    description: "Más piezas para cubrir todos los útiles del ciclo escolar.",
  },
  {
    id: "priority-review",
    name: "Revisión prioritaria",
    description: "Tu diseño pasa primero a revisión (sujeto a disponibilidad).",
  },
  {
    id: "whatsapp-quote",
    name: "Cotizar por WhatsApp",
    description: "¿No sabes qué elegir? Lo armamos contigo por WhatsApp.",
    quoteOnly: true,
  },
];

export const SCHOOL_ADDON_IDS = SCHOOL_ADDONS.map((a) => a.id);

export function getSchoolAddon(id: string): SchoolAddonOption | null {
  return SCHOOL_ADDONS.find((a) => a.id === id) ?? null;
}

/**
 * "Cómo funciona tu pedido" — adaptación del paso a paso del PDF al flujo de la
 * tienda. NO se hardcodea el 50% de anticipo ni métodos de pago antiguos: el
 * checkout actual usa el flujo existente de la tienda.
 */
export const SCHOOL_ORDER_STEPS: Array<{ title: string; text: string }> = [
  {
    title: "Elige tu paquete",
    text: "Selecciona Elementary o Ultra según lo que necesites.",
  },
  {
    title: "Personaliza tu pack",
    text: "Nombre, tipografía, combinación de colores y temática deseada.",
  },
  {
    title: "Guarda tu diseño",
    text: "Tu diseño queda registrado para producción con su código.",
  },
  {
    title: "Agrégalo al carrito o cotiza",
    text: "Súmalo al carrito o cotízalo por WhatsApp si prefieres.",
  },
  {
    title: "Confirmamos diseño y producción",
    text: "Revisamos juntos los detalles antes de producir.",
  },
  {
    title: "Recibe tu pedido",
    text: "Te entregamos en el tiempo acordado para tu pedido.",
  },
];

/** Límites de texto del laboratorio (espejados en la validación de servidor). */
export const SCHOOL_FIELD_LIMITS = {
  name: 60,
  nickname: 40,
  school: 80,
  grade: 20,
  group: 20,
  theme: 200,
  decorativeIcons: 200,
  characterInspiration: 120,
  specialColors: 120,
  designComments: 300,
  notes: 500,
} as const;
