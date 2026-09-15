/**
 * ---------------------------------------------------------------------------
 * Tamaño visual de los logos de familia
 * ---------------------------------------------------------------------------
 * Los PNG de `public/images/categories` NO traen el mismo aire alrededor: el
 * de MatrixLab 3D deja ~15% de lienzo transparente y el escolar no deja nada.
 * Pintados en una caja del mismo tamaño se ven claramente desiguales aunque
 * `width` y `height` coincidan.
 *
 * La corrección es un factor por logo: la caja es la misma para todos (misma
 * posición y mismo encuadre) y la imagen se escala DESDE SU CENTRO con el
 * inverso de la fracción que ocupa. Así el contenido acaba midiendo lo mismo
 * en los seis, sin deformar nada (el escalado es uniforme) y sin mover el
 * centro óptico, porque todos están centrados en su lienzo (49-50%).
 *
 * Los valores salen de medir el canal alfa; para recalcularlos tras cambiar un
 * logo: `node scripts/qa/logo-bbox.mjs`.
 */
const LOGO_CONTENT_SCALE: Record<string, number> = {
  // ocupa 89.9% del lienzo
  "/images/categories/matrixlab-stickers.png": 1.112,
  // 98.6%
  "/images/categories/matrixlab-wear.png": 1.014,
  // 97.5%
  "/images/categories/matrixlab-tumbler.png": 1.025,
  // 84.8% — el que más aire transparente traía
  "/images/categories/impresion-3d.png": 1.179,
  // 98.2%
  "/images/categories/matrixlab-laser.png": 1.018,
  // 100% — sin margen, es la referencia
  "/images/categories/etiquetas-escolares.png": 1,
};

/**
 * Factor que iguala el tamaño visual de un logo. Un archivo sin medir
 * devuelve 1: se pinta tal cual, nunca roto.
 */
export function categoryLogoScale(src: string): number {
  return Object.hasOwn(LOGO_CONTENT_SCALE, src) ? LOGO_CONTENT_SCALE[src] : 1;
}
