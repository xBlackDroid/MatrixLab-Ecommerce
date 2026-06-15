/**
 * Motor de colisiones para planillas (cm).
 *
 * Garantiza que las piezas no se encimen y respeten la separación mínima, y
 * que permanezcan dentro del área imprimible. Es lógica pura (sin React/Konva)
 * para poder reutilizarse en cliente y, a futuro, validar en backend.
 */

export interface RectCm {
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
}

export interface PrintableAreaCm {
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
}

/** ¿La pieza queda completamente dentro del área imprimible? */
export function withinPrintable(rect: RectCm, area: PrintableAreaCm): boolean {
  return (
    rect.xCm >= area.xCm - 1e-6 &&
    rect.yCm >= area.yCm - 1e-6 &&
    rect.xCm + rect.widthCm <= area.xCm + area.widthCm + 1e-6 &&
    rect.yCm + rect.heightCm <= area.yCm + area.heightCm + 1e-6
  );
}

/** ¿Dos piezas se traslapan considerando la separación mínima? */
export function overlapsWithSpacing(
  a: RectCm,
  b: RectCm,
  spacingCm: number,
): boolean {
  return (
    a.xCm < b.xCm + b.widthCm + spacingCm &&
    b.xCm < a.xCm + a.widthCm + spacingCm &&
    a.yCm < b.yCm + b.heightCm + spacingCm &&
    b.yCm < a.yCm + a.heightCm + spacingCm
  );
}

/** ¿Se puede colocar `rect` sin salirse ni chocar con `others`? */
export function canPlace(
  rect: RectCm,
  others: RectCm[],
  area: PrintableAreaCm,
  spacingCm: number,
): boolean {
  if (!withinPrintable(rect, area)) return false;
  return !others.some((other) => overlapsWithSpacing(rect, other, spacingCm));
}

/**
 * Busca el primer hueco libre (barrido por filas) para una pieza del tamaño
 * dado. Devuelve la esquina superior izquierda en cm o null si no cabe.
 */
export function findSlot(
  widthCm: number,
  heightCm: number,
  others: RectCm[],
  area: PrintableAreaCm,
  spacingCm: number,
  stepCm = 0.5,
): { xCm: number; yCm: number } | null {
  const maxX = area.xCm + area.widthCm - widthCm;
  const maxY = area.yCm + area.heightCm - heightCm;
  for (let y = area.yCm; y <= maxY + 1e-6; y += stepCm) {
    for (let x = area.xCm; x <= maxX + 1e-6; x += stepCm) {
      const candidate = { xCm: x, yCm: y, widthCm, heightCm };
      if (canPlace(candidate, others, area, spacingCm)) {
        return { xCm: Math.round(x * 100) / 100, yCm: Math.round(y * 100) / 100 };
      }
    }
  }
  return null;
}

/**
 * Calcula las posiciones de relleno (modo repetición) para una pieza de
 * tamaño fijo, respetando separación y márgenes. Grid uniforme.
 */
export function computeRepeatPlacements(
  pieceWidthCm: number,
  pieceHeightCm: number,
  area: PrintableAreaCm,
  spacingCm: number,
): Array<{ xCm: number; yCm: number }> {
  const stepX = pieceWidthCm + spacingCm;
  const stepY = pieceHeightCm + spacingCm;
  const placements: Array<{ xCm: number; yCm: number }> = [];
  if (stepX <= 0 || stepY <= 0) return placements;

  const cols = Math.floor((area.widthCm + spacingCm) / stepX);
  const rows = Math.floor((area.heightCm + spacingCm) / stepY);
  if (cols <= 0 || rows <= 0) return placements;

  // Centra el bloque dentro del área imprimible.
  const usedW = cols * pieceWidthCm + (cols - 1) * spacingCm;
  const usedH = rows * pieceHeightCm + (rows - 1) * spacingCm;
  const offsetX = area.xCm + (area.widthCm - usedW) / 2;
  const offsetY = area.yCm + (area.heightCm - usedH) / 2;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      placements.push({
        xCm: Math.round((offsetX + c * stepX) * 100) / 100,
        yCm: Math.round((offsetY + r * stepY) * 100) / 100,
      });
    }
  }
  return placements;
}

/** Clampa una pieza para que no se salga del área imprimible. */
export function clampToPrintable(rect: RectCm, area: PrintableAreaCm): RectCm {
  return {
    ...rect,
    xCm: Math.min(
      Math.max(rect.xCm, area.xCm),
      area.xCm + area.widthCm - rect.widthCm,
    ),
    yCm: Math.min(
      Math.max(rect.yCm, area.yCm),
      area.yCm + area.heightCm - rect.heightCm,
    ),
  };
}
