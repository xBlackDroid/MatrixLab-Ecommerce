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
  description?: string;
  /** true = abre WhatsApp en vez de sumar al diseño (sin precio definido). */
  quoteOnly?: boolean;
}

export interface SchoolAddonGroup {
  id: string;
  label: string;
  options: SchoolAddonOption[];
}

/**
 * Add-ons opcionales, agrupados por categoría (material / extras escolares /
 * producción). El cliente puede elegir varios; se guardan en
 * design_json.addons (por id). NO se muestran precios todavía: el costo lo
 * confirma MatrixLab según el pedido. Seleccionar add-ons NUNCA bloquea el
 * guardado.
 */
export const SCHOOL_ADDON_GROUPS: SchoolAddonGroup[] = [
  {
    id: "material",
    label: "Upgrade de material",
    options: [
      { id: "vinil-blanco", name: "Vinil blanco" },
      { id: "vinil-transparente", name: "Vinil transparente" },
      { id: "vinil-holografico", name: "Vinil holográfico" },
    ],
  },
  {
    id: "escolares",
    label: "Extras escolares",
    options: [
      { id: "tag-acrilico", name: "Tag acrílico personalizado" },
      { id: "planilla-sticker-premium", name: "Planilla Sticker Premium" },
      { id: "planilla-textil", name: "Planilla Textil" },
    ],
  },
  {
    id: "produccion",
    label: "Producción / pedido",
    options: [
      { id: "segundo-diseno", name: "Segundo diseño adicional" },
      { id: "diseno-personaje", name: "Diseño con personaje o temática específica" },
      { id: "ajuste-imagen", name: "Ajuste de imagen/referencia personalizada" },
    ],
  },
];

/** Lista plana de todos los add-ons SELECCIONABLES (deriva de los grupos). */
export const SCHOOL_ADDONS: SchoolAddonOption[] = SCHOOL_ADDON_GROUPS.flatMap(
  (g) => g.options,
);

export const SCHOOL_ADDON_IDS = SCHOOL_ADDONS.map((a) => a.id);

/**
 * Nombres de add-ons retirados del diseñador. Ya NO se ofrecen como opciones
 * nuevas, pero se conservan aquí para que los diseños antiguos sigan mostrando
 * un nombre legible en /admin/disenos y WhatsApp (no romper datos existentes).
 */
const LEGACY_ADDON_NAMES: Record<string, string> = {
  "sticker-premium": "Sticker premium para termo/lonchera/vaso",
  "dtf-textil": "DTF textil para ropa",
  "vinil-textil": "Vinil textil para ropa",
  "extra-lapices": "Etiquetas extra para lápices",
  "extra-lonchera-termo": "Etiquetas extra para lonchera/termo",
  "extra-cuadernos-libros": "Etiquetas extra para cuadernos/libros",
  // IDs aún más antiguos (primera versión del catálogo de add-ons).
  "material-upgrade": "Upgrade de material",
  "extra-design": "Diseño adicional",
  "extra-name": "Nombre extra",
  "extra-labels": "Etiquetas extra",
  "priority-review": "Revisión prioritaria",
};

export function getSchoolAddon(id: string): SchoolAddonOption | null {
  return SCHOOL_ADDONS.find((a) => a.id === id) ?? null;
}

/**
 * Nombre legible de un add-on por id. Resuelve opciones actuales, luego ids
 * legacy (compat. con diseños antiguos); si no existe, devuelve el id.
 */
export function getSchoolAddonName(id: string): string {
  return getSchoolAddon(id)?.name ?? LEGACY_ADDON_NAMES[id] ?? id;
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
  lastNames: 80,
  theme: 200,
  decorativeIcons: 200,
  characterInspiration: 120,
  specialColors: 120,
  designComments: 300,
  notes: 500,
} as const;
