import type {
  ProductTypeConfig,
  ProductTypeId,
  SafeArea,
} from "@/lib/designer/types";

/**
 * Configuración de mockups y zonas imprimibles.
 * Coordenadas en el espacio del stage (px lógicos del canvas).
 * Extensible en etapa 2 (ej. grabado láser) agregando nuevos configs.
 */

export const PRODUCT_TYPE_CONFIGS: Record<ProductTypeId, ProductTypeConfig> = {
  playera: {
    id: "playera",
    label: "Playera",
    publicName: "Playera personalizada",
    stage: { width: 520, height: 620 },
    zones: [
      {
        id: "front",
        label: "Frente",
        safeArea: { x: 158, y: 190, width: 204, height: 268 },
      },
      {
        id: "back",
        label: "Espalda",
        safeArea: { x: 158, y: 170, width: 204, height: 300 },
      },
    ],
    defaultZone: "front",
    baseColors: [
      { id: "blanco", label: "Blanco", hex: "#f1f2f4", shadowHex: "#d4d6da" },
      { id: "negro", label: "Negro", hex: "#23252b", shadowHex: "#101218" },
    ],
    sizeRequired: true,
    sizes: ["CH", "M", "G", "XG"],
  },
  gorra: {
    id: "gorra",
    label: "Gorra",
    publicName: "Gorra personalizada",
    stage: { width: 520, height: 480 },
    zones: [
      {
        id: "front",
        label: "Frente",
        safeArea: { x: 188, y: 168, width: 144, height: 104 },
      },
    ],
    defaultZone: "front",
    baseColors: [
      { id: "negro", label: "Negro", hex: "#23252b", shadowHex: "#101218" },
      {
        id: "azul-marino",
        label: "Azul marino",
        hex: "#1d2a44",
        shadowHex: "#101a2e",
      },
      { id: "beige", label: "Beige", hex: "#d9c7a8", shadowHex: "#bca984" },
    ],
    sizeRequired: false,
    sizes: [],
  },
  tote: {
    id: "tote",
    label: "Tote bag",
    publicName: "Tote bag personalizada",
    stage: { width: 520, height: 600 },
    zones: [
      {
        id: "front",
        label: "Frente",
        safeArea: { x: 160, y: 250, width: 200, height: 230 },
      },
    ],
    defaultZone: "front",
    baseColors: [
      { id: "natural", label: "Natural", hex: "#e8ddc4", shadowHex: "#cdbf9f" },
      { id: "negro", label: "Negro", hex: "#23252b", shadowHex: "#101218" },
    ],
    sizeRequired: false,
    sizes: [],
  },
};

export function isProductTypeId(value: string): value is ProductTypeId {
  return value === "playera" || value === "gorra" || value === "tote";
}

export function getProductTypeConfig(
  productType: ProductTypeId,
): ProductTypeConfig {
  return PRODUCT_TYPE_CONFIGS[productType];
}

export function getZoneConfig(config: ProductTypeConfig, zoneId: string) {
  return config.zones.find((zone) => zone.id === zoneId) ?? config.zones[0];
}

/**
 * Bounding box (sin rotación exacta: usa el AABB de la imagen rotada) para
 * advertir cuando el arte se sale del área imprimible.
 */
export function isWithinSafeArea(params: {
  safeArea: SafeArea;
  centerX: number;
  centerY: number;
  drawWidth: number;
  drawHeight: number;
  rotationDeg: number;
}): boolean {
  const { safeArea, centerX, centerY, drawWidth, drawHeight, rotationDeg } =
    params;
  const rad = (Math.abs(rotationDeg) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const bboxW = drawWidth * cos + drawHeight * sin;
  const bboxH = drawWidth * sin + drawHeight * cos;
  return (
    centerX - bboxW / 2 >= safeArea.x &&
    centerY - bboxH / 2 >= safeArea.y &&
    centerX + bboxW / 2 <= safeArea.x + safeArea.width &&
    centerY + bboxH / 2 <= safeArea.y + safeArea.height
  );
}
