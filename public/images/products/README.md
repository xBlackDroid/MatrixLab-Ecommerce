# Assets de producto del Laboratorio

Estructura lista para subir mockups e imágenes reales. Mientras no existan,
el diseñador usa mockups vectoriales (Konva) y el visor de giro cae en
fallback frente/espalda. Nada se rompe al dejar carpetas vacías.

## Mockups por color (PNG)

Coloca imágenes por producto y declara su ruta en
`src/lib/designer/product-views.ts` → `mockupByColor`:

```
public/images/products/playeras/mockups/rojo-front.png
public/images/products/playeras/mockups/rojo-back.png
```

```ts
// product-views.ts
mockupByColor: {
  rojo: {
    front: "/images/products/playeras/mockups/rojo-front.png",
    back: "/images/products/playeras/mockups/rojo-back.png",
  },
}
```

## Frames 360 (secuencia de imágenes por color)

Numera los frames y declara el arreglo en `framesByColor`:

```
public/images/products/playeras/frames/rojo/000.png
public/images/products/playeras/frames/rojo/010.png
public/images/products/playeras/frames/rojo/020.png
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

El visor `ProductSpinViewer` usará los frames automáticamente cuando existan;
si no, mantiene el fallback frente/espalda.

## Carpetas

- `playeras/`, `sudaderas/`, `gorras/trucker/`, `gorras/clasica/`, `totes/`
  → `mockups/` y `frames/`
- `laser/templates/` → ilustraciones opcionales de plantillas láser
- `insumos/` → fotos de productos de la categoría Insumos
