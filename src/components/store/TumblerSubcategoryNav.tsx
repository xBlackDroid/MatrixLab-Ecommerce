import SubcategoryNav from "./SubcategoryNav";
import { TUMBLER_BLOCKS_DISPLAY, tumblerSections } from "@/lib/store/tumbler-sections";

// Same published lines as the storefront; retired subcategories stay retired.
export const TUMBLER_CATALOG_SECTIONS = tumblerSections(TUMBLER_BLOCKS_DISPLAY.map(section => section.handle));

const labels: Record<string, string> = {
  "vasos-listos": "Vasos listos", "repuestos-consumibles": "Sparkle Mix", snowglobe: "Vasos y termos",
  llaveros: "Llaveros", "wraps-glow-finish": "UV y wraps", "magic-flow": "Magic Flow", "accesorios-personalizacion": "Herramientas",
};

export default function TumblerSubcategoryNav({ selected }: { selected: string }) {
  return <SubcategoryNav label="Subcategorías de MatrixLab Tumbler" selected={selected} items={TUMBLER_CATALOG_SECTIONS.map((section) => ({
    id: section.handle, label: labels[section.handle] ?? section.title,
    href: `/tienda/categoria/matrixlab-tumbler?subcategoria=${section.handle}`,
  }))} />;
}
