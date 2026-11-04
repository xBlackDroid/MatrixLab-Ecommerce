import type { ImageWatermarkBrand } from "./image-watermark";

export type MobileFamilyId = "tumbler" | "stickers" | "wear" | "3d" | "laser" | "escolar";

export interface MobileFamilyProduct {
  id: string;
  title: string;
  image: string | null;
  href: string;
  price: number | null;
  unit: "pieza" | "planilla";
  action: string;
  priceNote?: string;
  wearHandle?: string;
  wearType?: "sudaderas" | "gorras" | "playeras" | "totes";
  quickBuy?: { productId: string; variantId: string };
}

export interface MobileFamilyShelf {
  id: string;
  label: string;
  href: string;
  products: MobileFamilyProduct[];
  failed: boolean;
}

export interface MobileFamilyLink { label: string; href: string; }

export interface MobileStoreFamily {
  id: MobileFamilyId;
  title: string;
  description: string;
  logo: string;
  brand: ImageWatermarkBrand;
  href: string;
  shelves: MobileFamilyShelf[];
  links: MobileFamilyLink[];
}

/** Same family order, identities and destinations as the desktop storefront. */
export const MOBILE_FAMILY_IDENTITIES = [
  { id: "tumbler", title: "Tumbler", description: "Vasos listos e insumos para crear.", logo: "/images/categories/matrixlab-tumbler.png", brand: "tumbler", href: "/tienda/categoria/matrixlab-tumbler" },
  { id: "stickers", title: "Stickers", description: "Stickers e imanes con tu estilo.", logo: "/images/categories/matrixlab-stickers.png", brand: "stickers", href: "/tienda/categoria/stickers" },
  { id: "wear", title: "Wear", description: "Compra una prenda o crea la tuya.", logo: "/images/categories/matrixlab-wear.png", brand: "wear", href: "/tienda/prendas-listas" },
  { id: "3d", title: "3D", description: "Piezas, detalles e ideas en 3D.", logo: "/images/categories/impresion-3d.png", brand: "3d", href: "/tienda/categoria/impresion-3d" },
  { id: "laser", title: "Laser", description: "Tu idea, grabada a tu manera.", logo: "/images/categories/matrixlab-laser.png", brand: "laser", href: "/tienda/disenador/laser" },
  { id: "escolar", title: "Regreso a clases", description: "Etiquetas y productos escolares.", logo: "/images/categories/etiquetas-escolares.png", brand: "escolar", href: "/tienda/disenador/etiquetas-escolares" },
] as const satisfies readonly Omit<MobileStoreFamily, "shelves" | "links">[];
