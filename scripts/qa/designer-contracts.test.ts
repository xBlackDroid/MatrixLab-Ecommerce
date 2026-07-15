/**
 * QA de contratos del Laboratorio: verifica que los payloads que arman los
 * diseñadores del cliente (guardar diseño + agregar al carrito) pasan los
 * schemas Zod REALES del backend. Detecta drift de contrato sin necesidad de
 * levantar Supabase.
 *
 * Correr con: npx tsx scripts/qa/designer-contracts.test.ts
 */
import {
  DesignerCreateSchema,
  DesignSaveV2Schema,
} from "../../src/lib/validation/designer";
import { CartAddItemSchema } from "../../src/lib/validation/cart";

const PRODUCT_ID = "d0000000-0000-4000-8000-000000000003";
const VARIANT_ID = "e0000000-0000-4000-8000-000000000901";
const ASSET_ID = "a0000000-0000-4000-8000-000000000001";
const DESIGN_ID = "f0000000-0000-4000-8000-000000000001";

let failures = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) {
    failures += 1;
    if (detail) console.log(JSON.stringify(detail, null, 2).slice(0, 2000));
  }
}

// ---------------------------------------------------------------------------
// POST /api/designs (creación) — payload de TODOS los diseñadores
// ---------------------------------------------------------------------------
for (const productType of [
  "playera",
  "sudadera",
  "gorra-trucker",
  "gorra-clasica",
  "tote",
  "stickers-planilla",
  "stickers-repeticion",
  "laser",
  "etiquetas-escolares",
] as const) {
  const r = DesignerCreateSchema.safeParse({
    productType,
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
  });
  check(`create design: ${productType}`, r.success, r.error?.issues);
}

// ---------------------------------------------------------------------------
// PATCH /api/designs/[id] — payload v2 de prendas (como buildDesignJson de
// GarmentDesigner: front ≤ 1 asset, back ≤ 2, con stage y withinSafeArea)
// ---------------------------------------------------------------------------
const garmentAsset = {
  assetId: ASSET_ID,
  url: "https://example.supabase.co/storage/v1/object/sign/design-assets/x.png?token=abc",
  x: 260,
  y: 310,
  scale: 0.6,
  rotation: 0,
  widthCm: 24.2,
  heightCm: 24.2,
  withinSafeArea: true,
};
const garmentPayload = {
  designerType: "garment" as const,
  productType: "playera" as const,
  productId: PRODUCT_ID,
  variantId: VARIANT_ID,
  colorId: "blanco",
  profile: "hombre" as const,
  size: "M" as const,
  customerNotes: "quiero el diseño un poco más arriba",
  designJson: {
    version: 2 as const,
    designerType: "garment" as const,
    productType: "playera" as const,
    profile: "hombre" as const,
    size: "M" as const,
    colorId: "blanco",
    stage: { width: 520, height: 620 },
    views: {
      front: {
        printAreaCm: { width: 38, height: 45 },
        assets: [garmentAsset],
      },
      back: {
        printAreaCm: { width: 40, height: 48 },
        assets: [garmentAsset, { ...garmentAsset, x: 300 }],
      },
    },
  },
  previewDataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
};
{
  const r = DesignSaveV2Schema.safeParse(garmentPayload);
  check("save v2: garment (playera, frente+espalda)", r.success, r.error?.issues);
}
{
  // Barrera: 2 imágenes al frente deben RECHAZARSE.
  const bad = structuredClone(garmentPayload);
  bad.designJson.views.front.assets = [garmentAsset, garmentAsset];
  const r = DesignSaveV2Schema.safeParse(bad);
  check("save v2: garment rechaza 2 imágenes al frente", !r.success);
}

// ---------------------------------------------------------------------------
// PATCH — planilla libre (SheetDesigner modo free, como buildDesignJson)
// ---------------------------------------------------------------------------
const sheetFreePayload = {
  designerType: "sheet" as const,
  productType: "stickers-planilla" as const,
  productId: PRODUCT_ID,
  variantId: VARIANT_ID,
  designJson: {
    version: 1 as const,
    designerType: "sheet" as const,
    sheetType: "stickers" as const,
    mode: "free" as const,
    unit: "cm" as const,
    page: { format: "letter" as const, widthCm: 21.59, heightCm: 27.94 },
    printableArea: { xCm: 1, yCm: 1, widthCm: 19.59, heightCm: 25.94 },
    minSpacingCm: 2,
    assets: [
      {
        assetId: ASSET_ID,
        url: "https://example.supabase.co/storage/v1/object/sign/design-assets/x.png?token=abc",
        xCm: 1,
        yCm: 1,
        widthCm: 5,
        heightCm: 5,
        rotation: 0,
        shape: "custom" as const,
      },
    ],
  },
};
{
  const r = DesignSaveV2Schema.safeParse(sheetFreePayload);
  check("save v2: sheet free (stickers-planilla)", r.success, r.error?.issues);
}

// ---------------------------------------------------------------------------
// PATCH — planilla repetición (círculo/cuadrado/rectángulo)
// ---------------------------------------------------------------------------
for (const shape of ["circle", "square", "rectangle"] as const) {
  const r = DesignSaveV2Schema.safeParse({
    designerType: "sheet",
    productType: "stickers-repeticion",
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
    designJson: {
      version: 1,
      designerType: "sheet",
      sheetType: "stickers",
      mode: "repeat",
      unit: "cm",
      page: { format: "letter", widthCm: 21.59, heightCm: 27.94 },
      printableArea: { xCm: 1, yCm: 1, widthCm: 19.59, heightCm: 25.94 },
      minSpacingCm: 2,
      baseAssetId: ASSET_ID,
      shape,
      pieceSizeCm: { width: 5, height: 5 },
      count: 9,
      placements: Array.from({ length: 9 }, (_, i) => ({
        xCm: 1 + (i % 3) * 7,
        yCm: 1 + Math.floor(i / 3) * 7,
      })),
    },
  });
  check(`save v2: sheet repeat (${shape})`, r.success, r.error?.issues);
}

// ---------------------------------------------------------------------------
// PATCH — láser (solo texto)
// ---------------------------------------------------------------------------
{
  const r = DesignSaveV2Schema.safeParse({
    designerType: "laser",
    productType: "laser",
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
    designJson: {
      version: 1,
      designerType: "laser",
      templateId: "termo",
      widthCm: 8,
      heightCm: 20,
      elements: [
        {
          type: "text",
          text: "MatrixLab",
          fontId: "montserrat",
          x: 100,
          y: 120,
          scale: 1,
          rotation: 0,
          fontSize: 32,
        },
      ],
    },
  });
  check("save v2: laser", r.success, r.error?.issues);
}

// ---------------------------------------------------------------------------
// PATCH — etiquetas escolares con imagen propia (transform + overlay)
// ---------------------------------------------------------------------------
{
  const r = DesignSaveV2Schema.safeParse({
    designerType: "school-labels",
    productType: "etiquetas-escolares",
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
    designJson: {
      version: 1,
      designerType: "school-labels",
      productType: "etiquetas-escolares",
      productHandle: "etiquetas-escolares-personalizadas",
      package: "elementary",
      student: { firstName: "Rafa", lastNames: "Castañeda" },
      typographyCode: "001",
      backgroundPreset: "arcoiris",
      addons: ["mini-etiquetas"],
      theme: "espacio",
      customImage: {
        assetId: ASSET_ID,
        fileName: "test-design.png",
        transform: { x: 12, y: -8, scale: 1.4 },
        readabilityOverlay: true,
      },
    },
  });
  check("save v2: school-labels con imagen propia", r.success, r.error?.issues);
}

// ---------------------------------------------------------------------------
// POST /api/cart/items — mismo payload que envían TODOS los diseñadores
// ---------------------------------------------------------------------------
{
  const r = CartAddItemSchema.safeParse({
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
    quantity: 1,
    designProjectId: DESIGN_ID,
  });
  check("cart add: diseño personalizado", r.success, r.error?.issues);
}
{
  // La tienda normal agrega sin diseño.
  const r = CartAddItemSchema.safeParse({
    productId: PRODUCT_ID,
    variantId: VARIANT_ID,
    quantity: 2,
  });
  check("cart add: producto de catálogo", r.success, r.error?.issues);
}

console.log(
  failures === 0
    ? "\nTodos los contratos cliente↔backend son compatibles."
    : `\n${failures} contrato(s) rotos.`,
);
process.exit(failures === 0 ? 0 : 1);
