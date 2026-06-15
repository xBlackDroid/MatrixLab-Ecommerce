import type { DesignerProductType } from "@/lib/db/types";

/**
 * Manifiesto de vistas de producto del Laboratorio (Etapa 2).
 *
 * Define, por prenda, la geometría del lienzo (px), las zonas imprimibles
 * (frente/espalda) y el tipo de giro (360 | 180 | frontBack | fallback).
 *
 * Cómo agregar mockups reales por color:
 *   mockupByColor: { rojo: { front: "/images/products/playeras/mockups/rojo-front.png", back: "..." } }
 * Cómo agregar frames 360 (secuencia de imágenes por color):
 *   framesByColor: { rojo: ["/images/products/playeras/frames/rojo/000.png", ".../010.png", ...] }
 * Si no hay frames ni mockups, se usa el mockup vectorial + fallback de giro
 * (transición frente/espalda con sensación pseudo-3D). Nada se rompe.
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
  /** Rectángulo de área imprimible en coordenadas del lienzo (px). */
  safeArea: StageRect;
}

export type MockupKey =
  | "playera"
  | "sudadera"
  | "gorra-trucker"
  | "gorra-clasica"
  | "tote";

export interface GarmentViewConfig {
  productType: DesignerProductType;
  mockupKey: MockupKey;
  stage: { width: number; height: number };
  zones: StageZone[];
  viewType: ViewType;
  /** Secuencia de frames por color (vacío ⇒ fallback front/back). */
  framesByColor?: Record<string, string[]>;
  /** Mockup PNG por color (vacío ⇒ mockup vectorial). */
  mockupByColor?: Record<string, { front?: string; back?: string }>;
}

const PLAYERA_ZONES: StageZone[] = [
  { id: "front", label: "Frente", safeArea: { x: 158, y: 190, width: 204, height: 268 } },
  { id: "back", label: "Espalda", safeArea: { x: 158, y: 170, width: 204, height: 300 } },
];

export const GARMENT_VIEWS: Record<string, GarmentViewConfig> = {
  playera: {
    productType: "playera",
    mockupKey: "playera",
    stage: { width: 520, height: 620 },
    zones: PLAYERA_ZONES,
    viewType: "360",
  },
  sudadera: {
    productType: "sudadera",
    mockupKey: "sudadera",
    stage: { width: 540, height: 640 },
    zones: [
      { id: "front", label: "Frente", safeArea: { x: 168, y: 214, width: 204, height: 220 } },
      { id: "back", label: "Espalda", safeArea: { x: 168, y: 196, width: 204, height: 286 } },
    ],
    viewType: "360",
  },
  "gorra-trucker": {
    productType: "gorra-trucker",
    mockupKey: "gorra-trucker",
    stage: { width: 520, height: 480 },
    zones: [
      { id: "front", label: "Frente", safeArea: { x: 188, y: 166, width: 144, height: 104 } },
    ],
    viewType: "360",
  },
  "gorra-clasica": {
    productType: "gorra-clasica",
    mockupKey: "gorra-clasica",
    stage: { width: 520, height: 480 },
    zones: [
      { id: "front", label: "Frente", safeArea: { x: 196, y: 178, width: 128, height: 92 } },
    ],
    viewType: "360",
  },
  // Legado: la ruta /tienda/disenador/gorra reutiliza el mockup trucker.
  gorra: {
    productType: "gorra",
    mockupKey: "gorra-trucker",
    stage: { width: 520, height: 480 },
    zones: [
      { id: "front", label: "Frente", safeArea: { x: 188, y: 166, width: 144, height: 104 } },
    ],
    viewType: "360",
  },
  tote: {
    productType: "tote",
    mockupKey: "tote",
    stage: { width: 520, height: 600 },
    zones: [
      { id: "front", label: "Frente", safeArea: { x: 160, y: 250, width: 200, height: 230 } },
      { id: "back", label: "Espalda", safeArea: { x: 160, y: 250, width: 200, height: 230 } },
    ],
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
