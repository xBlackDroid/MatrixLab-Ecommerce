# Assets de producto del Laboratorio

Estructura lista para subir mockups e imágenes reales. Mientras no existan, el
diseñador usa mockups vectoriales (Konva) — que ya diferencian la silueta por
perfil (niño / mujer / hombre) en playera y sudadera — y el visor de giro cae en
fallback frente/espalda. Nada se rompe al dejar carpetas vacías.

## Mockups por color (PNG) — auto-resueltos

El lienzo **arma la ruta automáticamente** con `getMockupSrc()` y carga el PNG si
existe; si no, hace *fallback* al mockup vectorial. **No hay que declarar nada en
código.** Convención (`<color>` = id de color de `src/lib/designer/color-palettes.ts`,
p. ej. `blanco`, `negro`, `rojo`, `azul-marino`):

Prendas con frente y espalda (playera, sudadera, tote):

```
public/images/products/playeras/mockups/front/<color>.png
public/images/products/playeras/mockups/back/<color>.png
public/images/products/sudaderas/mockups/front/<color>.png
public/images/products/sudaderas/mockups/back/<color>.png
```

Gorras (solo frente):

```
public/images/products/gorras/trucker/mockups/<color>.png
public/images/products/gorras/clasica/mockups/<color>.png
```

Recomendado: PNG con **fondo transparente**, prenda **centrada**, en la relación
de aspecto del lienzo (playera 520×620, sudadera 540×640, gorra 520×480,
tote 520×600).

## Frames 360 (secuencia de imágenes por color)

Numera los frames y declara el arreglo en `framesByColor` (en `product-views.ts`):

```
public/images/products/playeras/frames/rojo/000.png
public/images/products/playeras/frames/rojo/010.png
...
```

```ts
// product-views.ts
framesByColor: {
  rojo: [
    "/images/products/playeras/frames/rojo/000.png",
    "/images/products/playeras/frames/rojo/010.png",
    // ...
  ],
}
```

El visor `ProductSpinViewer` usará los frames automáticamente cuando existan; si
no, mantiene el fallback frente/espalda.

## Carpetas

- `playeras/`, `sudaderas/`, `gorras/trucker/`, `gorras/clasica/`, `totes/`
  → `mockups/` (con `front/` y `back/`) y `frames/`
- `laser/templates/` → ilustraciones opcionales de plantillas láser
- `insumos/` → fotos de productos de la línea MatrixLab Tumbler (la carpeta
  conserva su nombre histórico; no hace falta mover archivos)
