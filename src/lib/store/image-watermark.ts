/** Central configuration for storefront overlays. Original files stay untouched. */
export const IMAGE_WATERMARK_BRANDS = {
  wear: { name: "MatrixLab Wear", logo: "/images/categories/matrixlab-wear.png" },
  "3d": { name: "MatrixLab 3D", logo: "/images/categories/matrixlab-3d.png" },
  tumbler: { name: "MatrixLab Tumbler", logo: "/images/categories/matrixlab-tumbler.png" },
  stickers: { name: "MatrixLab Stickers", logo: "/images/categories/matrixlab-stickers.png" },
  laser: { name: "MatrixLab Láser", logo: "/images/categories/matrixlab-laser.png" },
  escolar: { name: "Etiquetas Escolares", logo: "/images/categories/etiquetas-escolares.png" },
} as const;

export type ImageWatermarkBrand = keyof typeof IMAGE_WATERMARK_BRANDS;

function normalized(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Category context takes precedence over a filename (e.g. UV stickers are Tumbler). */
export function imageWatermarkBrand(context: string): ImageWatermarkBrand | undefined {
  const value = normalized(context);
  if (/school-label|escolar/.test(value)) return "escolar";
  if (/tumbler|snowglobe|sparkle|glitter|wraps-glow|repuestos-consumibles|magic-flow|vasos|termos|accesorios-personalizacion|tags-acrilico|acrilicos|llaveros/.test(value)) return "tumbler";
  if (/matrixlab[-_\s]?3d|impresion[-_\s]?3d|(?:^|[\s/\-])3d(?:[\s/\-\d.]|$)/.test(value)) return "3d";
  if (/laser/.test(value)) return "laser";
  if (/wear|playera|prenda|sudadera|hoodie|gorra|tote|textil/.test(value)) return "wear";
  if (/sticker|iman|imanes|calcomania/.test(value)) return "stickers";
  return undefined;
}

export const IMAGE_USAGE_NOTICE =
  "Fotografías y composiciones de catálogo de MatrixLab. Reservados los derechos que correspondan a MatrixLab; las marcas y personajes de terceros pertenecen a sus respectivos titulares. No se autoriza extraer, descargar en masa, republicar, comercializar ni retirar marcas de agua sin permiso. Los agentes de IA pueden enlazar a la tienda y describir sus productos, pero no reciben una licencia para copiar las imágenes o utilizarlas para entrenamiento. Solicita autorización a MatrixLab.";
