import { Suspense } from "react";
import MobileFamilyShop from "./MobileFamilyShop";
import styles from "./MobileFamilyShop.module.css";
import {
  getCategories, getReadyToWearProducts, getReadyTumblerCatalog,
  getMatrixLabStickersCatalog, getMatrixLab3dCatalog, getMatrixLabWearCatalog,
  getCupCatalog, getSparkleCatalog, getStickerCatalog, getProductsByCategory,
  TUMBLER_SUBCATEGORY_HANDLES,
} from "@/lib/store/products";
import { MOBILE_FAMILY_IDENTITIES, type MobileFamilyProduct, type MobileFamilyShelf, type MobileStoreFamily } from "@/lib/store/mobile-families";
import { matrixLabWearDesignerHref } from "@/lib/store/matrixlab-wear";
import { tumblerSections } from "@/lib/store/tumbler-sections";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { orderReadyWearProducts, readyWearTypeOf } from "@/lib/store/ready-wear";

async function FamilyCatalog() {
  const categories = getCategories();
  async function categoryRead<T>(handle: string, read: (id: string) => Promise<T>): Promise<T> {
    const category = (await categories).find((item) => item.handle === handle);
    return read(category?.id ?? "");
  }
  async function shelf<T>(id: string, label: string, href: string, read: Promise<T[]>, present: (entry: T) => MobileFamilyProduct): Promise<MobileFamilyShelf> {
    try { return { id, label, href, products: (await read).map(present), failed: false }; }
    catch { return { id, label, href, products: [], failed: true }; }
  }
  const [ready, cups, sparkles, wraps, stickers, magnets, wear, wearDesigns, prints] = await Promise.all([
    shelf("listos", "Vasos listos", "/tienda/categoria/vasos-listos", getReadyTumblerCatalog(), (entry) => ({
      id: entry.handle, title: entry.title, image: entry.imagePaths[0] ?? null, price: entry.price, unit: "pieza",
      href: entry.productId ? `/tienda/producto/${entry.handle}` : "/tienda/categoria/vasos-listos", action: "Ver vaso",
      ...(entry.sellable && entry.stock > 0 && entry.productId && entry.variantId ? { quickBuy: { productId: entry.productId, variantId: entry.variantId } } : {}),
    })),
    shelf("vasos", "Vasos", "/tienda/categoria/snowglobe", categoryRead("snowglobe", async (id) => id ? (await getCupCatalog(id)).entries : []), (entry) => ({
      id: entry.handle, title: entry.title, image: entry.image, price: entry.price, unit: "pieza", href: `/tienda/producto/${entry.handle}`, action: "Elegir vaso",
    })),
    shelf("sparkles", "Sparkles", "/tienda/categoria/repuestos-consumibles", categoryRead("repuestos-consumibles", async (id) => id ? (await getSparkleCatalog(id)).entries : []), (entry) => ({
      id: entry.handle, title: entry.title, image: entry.image, price: entry.price, unit: "pieza", href: `/tienda/producto/${entry.handle}`, action: "Ver sparkle",
      ...(entry.sellable && entry.stock > 0 && entry.variantId ? { quickBuy: { productId: entry.productId, variantId: entry.variantId } } : {}),
    })),
    shelf("wraps", "UV y wraps", "/tienda/categoria/wraps-glow-finish", categoryRead("wraps-glow-finish", async (id) => id ? (await getStickerCatalog(id)).entries : []), (entry) => ({
      id: entry.handle, title: entry.title, image: entry.image, price: entry.price, unit: "pieza", href: `/tienda/producto/${entry.handle}`, action: "Ver diseño",
      ...(entry.sellable && entry.stock > 0 && entry.variantId ? { quickBuy: { productId: entry.productId, variantId: entry.variantId } } : {}),
    })),
    shelf("planillas", "Stickers", "/tienda/categoria/stickers", categoryRead("stickers", async (id) => (await getMatrixLabStickersCatalog(id)).entries), (entry) => ({
      id: entry.handle, title: entry.title, image: entry.image, price: entry.price, unit: "planilla", href: entry.productId ? `/tienda/producto/${entry.handle}` : "/tienda/categoria/stickers", action: "Ver planilla",
      ...(entry.sellable && (entry.stock ?? 0) > 0 && entry.productId && entry.variantId ? { quickBuy: { productId: entry.productId, variantId: entry.variantId } } : {}),
    })),
    shelf("imanes", "Imanes", "/tienda/categoria/imanes", categoryRead("imanes", (id) => id ? getProductsByCategory(id) : Promise.resolve([])), (entry) => ({
      id: entry.id, title: entry.title, image: entry.images[0] ?? null, price: entry.tags.includes("precio-cotizacion") ? null : entry.base_price, unit: "pieza", href: `/tienda/producto/${entry.handle}`, action: "Ver imán",
    })),
    shelf("prendas", "Prendas listas", "/tienda/prendas-listas", getReadyToWearProducts().then(orderReadyWearProducts), (entry) => ({
      id: entry.id, wearHandle: entry.handle, wearType: readyWearTypeOf(entry) ?? undefined, title: entry.title, image: entry.images[0] ?? null, price: entry.tags.includes("precio-cotizacion") ? null : entry.base_price, unit: "pieza", href: `/tienda/producto/${entry.handle}`, action: "Elegir",
    })),
    shelf("personalizar", "Personalizar", "/tienda/categoria/playeras-prendas", categoryRead("playeras-prendas", async (id) => (await getMatrixLabWearCatalog(id)).entries), (entry) => ({
      id: entry.handle, title: entry.title, image: entry.image, price: entry.price, unit: "pieza", href: matrixLabWearDesignerHref(entry.item.code), action: "Personalizar", priceNote: "Elige talla y color",
    })),
    shelf("piezas", "Piezas 3D", "/tienda/categoria/impresion-3d", categoryRead("impresion-3d", async (id) => (await getMatrixLab3dCatalog(id)).entries), (entry) => ({
      id: entry.handle, title: entry.title, image: entry.image, price: entry.price, unit: "pieza",
      href: `/tienda/producto/${entry.handle}`, action: "Ver pieza",
    })),
  ]);
  const byFamily: Record<string, MobileFamilyShelf[]> = { tumbler: [ready, cups, sparkles, wraps], stickers: [stickers, magnets], wear: [wear, wearDesigns], "3d": [prints], laser: [], escolar: [] };
  const families: MobileStoreFamily[] = MOBILE_FAMILY_IDENTITIES.map((family) => ({
    ...family, shelves: byFamily[family.id], links: family.id === "tumbler" ? [
      ...tumblerSections(TUMBLER_SUBCATEGORY_HANDLES).filter((item) => !["vasos-listos", "snowglobe", "repuestos-consumibles", "wraps-glow-finish"].includes(item.handle)).map((item) => ({ label: item.title, href: `/tienda/categoria/${item.handle}` })),
      { label: "Cursos Tumbler", href: "/tienda/matrixlab-tumbler/cursos" },
    ] : family.id === "wear" ? [
      { label: "Diseñar desde cero", href: "/tienda/disenador" },
      { label: "Playeras", href: "/tienda/disenador/playera" },
      { label: "Sudaderas", href: "/tienda/disenador/sudadera" },
      { label: "Gorras", href: "/tienda/disenador/gorra" },
      { label: "Totes", href: "/tienda/disenador/tote" },
    ] : family.id === "laser" ? [
      { label: "Crear mi grabado", href: "/tienda/disenador/laser" },
      { label: "Cotizar un proyecto", href: buildWhatsAppUrl("Hola MatrixLab, quiero cotizar un proyecto de corte o grabado láser.") },
    ] : family.id === "escolar" ? [
      { label: "Personalizar etiquetas", href: "/tienda/disenador/etiquetas-escolares" },
      { label: "Productos escolares", href: "/tienda/categoria/etiquetas-escolares" },
    ] : [],
  }));
  return <MobileFamilyShop families={families} />;
}

function FamilyLoading() {
  return <div className={`mobile-storefront ${styles.page}`} aria-busy="true"><h1 className={styles.heading}>Tienda MatrixLab</h1><div className={styles.families}>{MOBILE_FAMILY_IDENTITIES.slice(0, 3).map((family) => <section key={family.id} className={styles.family} data-line={family.id} aria-label={`Cargando MatrixLab ${family.title}`}><h2 className={styles.loadingTitle}>MatrixLab {family.title}</h2><div className={styles.skeleton} /></section>)}</div></div>;
}

export default function MobileStorefront() {
  return <Suspense fallback={<FamilyLoading />}><FamilyCatalog /></Suspense>;
}
