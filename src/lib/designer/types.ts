import type { PrintZone, ProductTypeId } from "@/lib/db/types";

export type { PrintZone, ProductTypeId };

/** Rectángulo del área segura dentro del stage del mockup. */
export interface SafeArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ZoneConfig {
  id: PrintZone;
  label: string;
  safeArea: SafeArea;
}

export interface BaseColorOption {
  id: string;
  /** Debe coincidir con product_variants.color para mapear variante. */
  label: string;
  hex: string;
  /** Tono de sombras del mockup para dar volumen. */
  shadowHex: string;
}

export interface ProductTypeConfig {
  id: ProductTypeId;
  label: string;
  /** Nombre comercial mostrado en UI. */
  publicName: string;
  stage: { width: number; height: number };
  zones: ZoneConfig[];
  defaultZone: PrintZone;
  baseColors: BaseColorOption[];
  /** Si el producto exige talla (variantes con size). */
  sizeRequired: boolean;
  sizes: string[];
}

/** Estado de transformación del arte dentro del área de impresión. */
export interface DesignTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

/** JSON de coordenadas persistido junto con el archivo original. */
export interface DesignJsonV1 {
  version: 1;
  productType: ProductTypeId;
  zone: PrintZone;
  transform: DesignTransform;
  stage: { width: number; height: number };
  asset: { width: number; height: number } | null;
  baseColor: string | null;
  withinSafeArea: boolean;
}

export interface UploadedDesignAsset {
  assetId: string;
  designProjectId: string;
  /** URL firmada temporal solo para previsualizar en el editor. */
  signedUrl: string;
  width: number;
  height: number;
  fileName: string;
}
