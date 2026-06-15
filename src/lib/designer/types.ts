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

/**
 * Imagen colocada en un lienzo del diseñador v2 (prenda multi-imagen, hoja
 * o láser). `localUrl` es el objectURL del archivo subido (evita "tainted
 * canvas" al exportar la preview); `assetId` es el id del archivo en
 * uploaded_assets (lo autoritativo para producción).
 */
export interface PlacedAsset {
  /** Id local único en el editor. */
  id: string;
  /** Id del archivo en uploaded_assets (storage seguro). */
  assetId: string;
  /** objectURL para render/preview sin contaminar el canvas. */
  localUrl: string;
  /** URL firmada (opcional, referencia que puede expirar). */
  remoteUrl?: string;
  naturalWidth: number;
  naturalHeight: number;
  /** Centro del asset en coords del lienzo (px). */
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fileName: string;
}

/** Elemento de imagen en el editor láser. */
export interface LaserImageElement {
  id: string;
  type: "image";
  assetId: string;
  localUrl: string;
  remoteUrl?: string;
  naturalWidth: number;
  naturalHeight: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

/** Elemento de texto en el editor láser. */
export interface LaserTextElement {
  id: string;
  type: "text";
  text: string;
  fontId: string;
  fontFamily: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fontSize: number;
}

export type LaserEditorElement = LaserImageElement | LaserTextElement;

/** Pieza en una planilla (stickers/imanes). Coordenadas en cm (esquina sup-izq). */
export interface SheetPiece {
  id: string;
  assetId: string;
  localUrl: string;
  remoteUrl?: string;
  naturalWidth: number;
  naturalHeight: number;
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
  rotation: number;
  fileName: string;
}
