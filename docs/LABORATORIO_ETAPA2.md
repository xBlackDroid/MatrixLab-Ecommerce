# MatrixLab Store Core — Etapa 2: Expansión del Laboratorio

Expansión **aditiva y no destructiva** sobre Etapa 1. No se tocó Mercado Pago,
RLS (salvo ampliar un CHECK), pedidos, carrito core, landing ni branding.

## 1. Resumen de cambios

- **Diseñador de prendas v2** (playera, sudadera, gorra trucker, gorra clásica
  ajustable, tote) con: selector de color agrupado, perfil (niño/mujer/hombre)
  y talla (CH/M/G/EG), zonas frente/espalda, **múltiples imágenes** (1 frente,
  2 espalda) con mover/escalar/rotar/centrar/duplicar/eliminar, área máxima en
  cm por perfil/talla, mockups vectoriales más realistas y **visor de giro**
  360/180 con fallback frente-espalda.
- **Laboratorio de planillas** (stickers e imanes): modo libre (hasta 7
  imágenes con motor de colisiones y separación mínima de 2 cm) y modo
  repetición (cuadrado/círculo/rectángulo de 3–10 cm que llena la hoja carta).
- **Laboratorio láser**: plantillas base (termo, taza, vaso, tumbler, llavero,
  tag/placa acrílica, señalética, porta vaso, medalla, tabla, caja), subir
  imagen, agregar texto con fuentes seguras, mover/escalar/rotar.
- **Categoría Insumos** y subcategorías editables desde admin, con inventario y
  checkout normales (sin diseñador).
- **Admin de diseños v2**: familia (prenda/planilla/láser), descarga de varios
  originales y JSON de producción legible.

## 2. Archivos creados

**Config/datos** (`src/lib/designer/`): `product-catalog.ts`,
`color-palettes.ts`, `print-sizes.ts`, `product-views.ts`, `sheet-config.ts`,
`laser-config.ts`.

**Componentes prenda** (`src/components/designer/`): `ColorSwatchGrid.tsx`,
`ProductSpinViewer.tsx`, `GarmentDesigner.tsx`, `MultiAssetCanvas.tsx`,
`PrintZoneSelector.tsx`, `PrintSizeHelper.tsx`, `AssetLayerPanel.tsx`,
`GarmentDisclaimer.tsx`, `DesignerRouter.tsx`, `mockups/GarmentMockups.tsx`.

**Planillas** (`src/components/designer/sheets/`): `SheetDesigner.tsx`,
`FreeLayoutSheet.tsx`, `RepeatLayoutSheet.tsx`, `SheetCanvas.tsx`,
`CollisionEngine.ts`, `SheetDisclaimer.tsx`.

**Láser** (`src/components/designer/laser/`): `LaserDesigner.tsx`,
`LaserCanvas.tsx`, `LaserTemplateSelector.tsx`, `LaserTextTool.tsx`,
`LaserDisclaimer.tsx`.

**Backend/datos**: `supabase/migrations/0004_designer_expansion.sql`,
`supabase/seed_etapa2.sql`, `public/images/products/**` (estructura + README).

## 3. Archivos modificados

- `src/lib/db/types.ts` — tipos `DesignerProductType`, `DesignerKind`,
  `GarmentProfile`, `PlacedAsset`, `SheetPiece`, `LaserEditorElement`; columnas
  `designer_type` y `profile` en `DesignProjectRow`.
- `src/lib/validation/store.ts` — whitelists `DESIGNER_PRODUCT_TYPES`,
  `GARMENT_PROFILES`, `GARMENT_SIZES`, `SHEET_*`.
- `src/lib/validation/designer.ts` — esquemas v2 (garment/sheet/laser) con
  límites de seguridad y unión discriminada `DesignSaveV2Schema`.
- `src/lib/store/products.ts` — `DESIGNER_PRODUCT_HANDLES` ampliado; re-export
  de `DESIGNER_TYPE_TO_HANDLE` desde el catálogo.
- `src/lib/store/mock-data.ts` — categorías/productos/variantes de Etapa 2 para
  navegar sin base de datos.
- `src/lib/whatsapp.ts` — mensajes `designHelp`, `sheetHelp`, `laserQuote`.
- `src/app/api/designs/route.ts` — guarda `designer_type` al crear.
- `src/app/api/designs/[id]/route.ts` — guardado v1 **o** v2.
- `src/app/tienda/disenador/page.tsx` — laboratorio con todas las cards.
- `src/app/tienda/disenador/[productType]/page.tsx` — dispatcher por familia.
- `src/components/store/ProductOptions.tsx` — CTA "Personalizar" para nuevos tipos.
- `src/app/admin/disenos/page.tsx` y `src/components/admin/DesignProjectCard.tsx`
  — vista de diseños v2.

> El componente v1 `DesignerShell.tsx` se conserva (no se borra) pero ya no se
> usa en rutas; los diseños v1 guardados siguen siendo válidos.

## 4. Migración y seed

```sql
-- Después de 0001/0002/0003:
supabase/migrations/0004_designer_expansion.sql   -- amplía CHECK + columnas (aditivo)
-- Después de supabase/seed.sql:
supabase/seed_etapa2.sql                           -- categorías/productos/insumos (idempotente)
```

`0004` solo amplía el CHECK de `product_type`, agrega `designer_type` y
`profile` (nullable) y un índice. No borra nada.

## 5. Nuevas rutas

Diseñador: `/tienda/disenador/{sudadera, gorra-trucker, gorra-clasica,
stickers-planilla, stickers-repeticion, imanes-planilla, imanes-repeticion,
laser}`. Categorías: `/tienda/categoria/{insumos, snowglobe, llaveros,
tags-acrilico, acrilicos, accesorios-personalizacion, repuestos-consumibles}`.
Las rutas de Etapa 1 (playera/gorra/tote) siguen funcionando.

## 6. Cómo agregar mockups reales y frames 360

Ver `public/images/products/README.md`. En resumen, en
`src/lib/designer/product-views.ts` declara `mockupByColor` (PNG por color) o
`framesByColor` (secuencia 360). Sin ellos se usa el mockup vectorial y el
fallback de giro frente/espalda.

## 7. Cómo editar colores y medidas

- **Colores**: `src/lib/designer/color-palettes.ts` — agrega en `MASTER_DEFS` e
  inclúyelo en `PRODUCT_COLOR_IDS` del producto. Se agrupan solos en la UI.
- **Medidas de impresión**: `src/lib/designer/print-sizes.ts` —
  `MAX_PRINT_AREA_CM` (apparel por perfil/talla) y `FIXED_PRINT_AREA_CM`
  (gorras/tote). (Nota: la fuente trae Mujer EG ancho 32 < G 34; se respeta tal
  cual, con comentario.)
- **Hojas**: `src/lib/designer/sheet-config.ts` (área imprimible, separación).
- **Láser**: `src/lib/designer/laser-config.ts` (área, plantillas, fuentes).

## 8. Cómo probar (requiere Supabase + ambos seeds)

**Prendas**: `/tienda/disenador/playera` (o sudadera/gorras/tote) → elige
perfil/talla/color → sube PNG al frente → mueve/escala/rota → cambia a Espalda
→ sube 2 imágenes (la 3ª se bloquea) → "Vista de giro" → Guardar → Agregar al
carrito → en el carrito aparece como personalizado con preview.

**Planillas**: `/tienda/disenador/stickers-planilla` (libre): sube varias
imágenes, arrástralas (no se enciman, separación 2 cm), ajusta tamaño →
Guardar/Agregar. `/tienda/disenador/stickers-repeticion`: sube 1 imagen, elige
forma y tamaño (3–10 cm), ve cuántas caben → Agregar. Igual para imanes.

**Láser**: `/tienda/disenador/laser` → elige plantilla → sube imagen y/o agrega
texto → mueve/escala/rota → Guardar/Agregar o cotiza por WhatsApp.

**Insumos**: `/tienda/categoria/insumos` y subcategorías → producto normal →
Agregar al carrito → checkout normal (Mercado Pago). En admin se editan como
cualquier producto y manejan inventario.

**Admin diseños**: `/admin/disenos` → familia, color/talla/perfil, descarga de
originales y "JSON de producción".

## 9. Checklist de seguridad

- Zod en endpoints nuevos; límites duros en backend: 1 frente / 2 espalda,
  7 imágenes libres, repetición 1 base, tamaños 3–10 cm, separación 2 cm,
  tamaño máx. de `design_json` v2.
- MIME real con sharp; SVG rechazado; rate limiting reutilizado.
- Texto del láser sanitizado en el servidor antes de persistir.
- Sin secretos en cliente; service role solo backend; sin SQL concatenado;
  Mercado Pago intacto; precios desde producto base (nunca del cliente).

## 10. Pendientes para la siguiente etapa

- Mockups/frames reales por color y telas; export de producción de planillas a
  PDF/PNG 300 DPI (función preparada, falta render final).
- Producción física del láser (corte real, materiales).
- Resize por handles en planillas (hoy: mover en lienzo + slider de tamaño).
- Cargar previews v2 al reabrir un diseño guardado (hoy el flujo es de creación).
