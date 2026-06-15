import type { DesignerProductType } from "@/lib/db/types";

/**
 * Manifiesto de vistas de producto del Laboratorio (Etapa 2).
 *
 * Define, por prenda, la geometría del lienzo (px), el estilo de mockup
 * (GARMENT_MOCKUP_STYLE) y las zonas imprimibles derivadas de ratios
 * (fracción del lienzo). Así el área queda centrada en pecho/espalda y nunca
 * llega a mangas/cuello. El giro usa frames reales si existen, o fallback
 * frente/espalda.
 *
 * Cómo agregar mockups reales por color:
 *   mockupByColor: { rojo: { front: "/images/products/playeras/mockups/rojo-front.png", back: "..." } }
 * Cómo agregar frames 360 (secuencia por color):
 *   framesByColor: { rojo: ["/images/products/playeras/frames/rojo/000.png", ".../010.png"] }
 * Cómo ajustar el área imprimible: edita los ratios en GARMENT_MOCKUP_STYLE.
 */

export type ViewType = "360" | "180" | "frontBack" | "fallback";

export interface StageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StageZone {
  id: "front" | "back";
  label: string;
  safeArea: StageRect;
}

export type MockupKey =
  | "playera"
  | "sudadera"
  | "gorra-trucker"
  | "gorra-clasica"
  | "tote";

export interface PrintAreaRatio {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GarmentMockupStyle {
  neck?: "crew";
  fit?: "regular";
  sleeve?: "short" | "long";
  hood?: boolean;
  pocket?: "kangaroo";
  silhouette: string;
  printAreaAnchor: "chest-center";
  frontPrintAreaRatio: PrintAreaRatio;
  backPrintAreaRatio?: PrintAreaRatio;
}

/**
 * Estilo de mockup por prenda. Los ratios definen el área imprimible como
 * fracción del lienzo (centrada en pecho/espalda, sin tocar mangas/cuello).
 */
export const GARMENT_MOCKUP_STYLE: Record<MockupKey, GarmentMockupStyle> = {
  playera: {
    neck: "crew",
    fit: "regular",
    sleeve: "short",
    silhouette: "realistic-front",
    printAreaAnchor: "chest-center",
    frontPrintAreaRatio: { x: 0.3, y: 0.34, width: 0.4, height: 0.4 },
    backPrintAreaRatio: { x: 0.29, y: 0.3, width: 0.42, height: 0.46 },
  },
  sudadera: {
    hood: true,
    pocket: "kangaroo",
    sleeve: "long",
    silhouette: "hoodie-front",
    printAreaAnchor: "chest-center",
    frontPrintAreaRatio: { x: 0.31, y: 0.34, width: 0.4, height: 0.3 },
    backPrintAreaRatio: { x: 0.3, y: 0.3, width: 0.42, height: 0.46 },
  },
  "gorra-trucker": {
    silhouette: "trucker-front",
    printAreaAnchor: "chest-center",
    frontPrintAreaRatio: { x: 0.36, y: 0.35, width: 0.28, height: 0.2 },
  },
  "gorra-clasica": {
    silhouette: "curved-cap-front",
    printAreaAnchor: "chest-center",
    frontPrintAreaRatio: { x: 0.38, y: 0.37, width: 0.25, height: 0.19 },
  },
  tote: {
    silhouette: "tote-front",
    printAreaAnchor: "chest-center",
    // ~80% del panel frontal útil, centrado.
    frontPrintAreaRatio: { x: 0.315, y: 0.41, width: 0.37, height: 0.46 },
    backPrintAreaRatio: { x: 0.315, y: 0.41, width: 0.37, height: 0.46 },
  },
};

export interface GarmentViewConfig {
  productType: DesignerProductType;
  mockupKey: MockupKey;
  stage: { width: number; height: number };
  zones: StageZone[];
  viewType: ViewType;
  framesByColor?: Record<string, string[]>;
  mockupByColor?: Record<string, { front?: string; back?: string }>;
}

function rect(stage: { width: number; height: number }, r: PrintAreaRatio): StageRect {
  return {
    x: Math.round(stage.width * r.x),
    y: Math.round(stage.height * r.y),
    width: Math.round(stage.width * r.width),
    height: Math.round(stage.height * r.height),
  };
}

function buildZones(
  stage: { width: number; height: number },
  mockupKey: MockupKey,
  withBack: boolean,
): StageZone[] {
  const style = GARMENT_MOCKUP_STYLE[mockupKey];
  const zones: StageZone[] = [
    { id: "front", label: "Frente", safeArea: rect(stage, style.frontPrintAreaRatio) },
  ];
  if (withBack && style.backPrintAreaRatio) {
    zones.push({
      id: "back",
      label: "Espalda",
      safeArea: rect(stage, style.backPrintAreaRatio),
    });
  }
  return zones;
}

const PLAYERA_STAGE = { width: 520, height: 620 };
const SUDADERA_STAGE = { width: 540, height: 640 };
const GORRA_STAGE = { width: 520, height: 480 };
const TOTE_STAGE = { width: 520, height: 600 };

export const GARMENT_VIEWS: Record<string, GarmentViewConfig> = {
  playera: {
    productType: "playera",
    mockupKey: "playera",
    stage: PLAYERA_STAGE,
    zones: buildZones(PLAYERA_STAGE, "playera", true),
    viewType: "360",
  },
  sudadera: {
    productType: "sudadera",
    mockupKey: "sudadera",
    stage: SUDADERA_STAGE,
    zones: buildZones(SUDADERA_STAGE, "sudadera", true),
    viewType: "360",
  },
  "gorra-trucker": {
    productType: "gorra-trucker",
    mockupKey: "gorra-trucker",
    stage: GORRA_STAGE,
    zones: buildZones(GORRA_STAGE, "gorra-trucker", false),
    viewType: "360",
  },
  "gorra-clasica": {
    productType: "gorra-clasica",
    mockupKey: "gorra-clasica",
    stage: GORRA_STAGE,
    zones: buildZones(GORRA_STAGE, "gorra-clasica", false),
    viewType: "360",
  },
  // Legado: /tienda/disenador/gorra reutiliza el mockup trucker.
  gorra: {
    productType: "gorra",
    mockupKey: "gorra-trucker",
    stage: GORRA_STAGE,
    zones: buildZones(GORRA_STAGE, "gorra-trucker", false),
    viewType: "360",
  },
  tote: {
    productType: "tote",
    mockupKey: "tote",
    stage: TOTE_STAGE,
    zones: buildZones(TOTE_STAGE, "tote", true),
    viewType: "180",
  },
};

export function getGarmentView(
  productType: DesignerProductType,
): GarmentViewConfig {
  return GARMENT_VIEWS[productType] ?? GARMENT_VIEWS.playera!;
}

/** Frames del color si existen (para el visor 360). Vacío ⇒ fallback. */
export function getFrames(
  config: GarmentViewConfig,
  colorId: string,
): string[] {
  return config.framesByColor?.[colorId] ?? [];
}
