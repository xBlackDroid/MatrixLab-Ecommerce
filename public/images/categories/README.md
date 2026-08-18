# Imágenes de categorías

Coloca aquí el logo/imagen de cada categoría del catálogo.

## Logos de marca (mapeados)

Algunas categorías usan un nombre de archivo de marca distinto de su `handle`
(la URL de la categoría no cambia). El mapeo vive en
`CATEGORY_LOGO_BASENAMES` (`src/lib/store/products.ts`):

| Categoría (handle) | Archivo esperado |
| --- | --- |
| `matrixlab-tumbler` | `matrixlab-tumbler.png` |
| `impresion-3d` | `matrixlab-3d.png` |
| `stickers` | `matrixlab-stickers.png` |
| `playeras-prendas` | `matrixlab-playeras.png` |
| `gorras` | `matrixlab-gorras.png` |
| `imanes` | `matrixlab-imanes.png` |
| `disenador-tshirt-lab` | `matrixlab-tshirt-lab.png` |
| `etiquetas-escolares` | `matrixlab-etiquetas-escolares.png` |

## Convención por handle

Para cualquier otra categoría basta con nombrar el archivo como su `handle`:

```
public/images/categories/<handle>.png   (o .webp)
```

Comportamiento:

- Si el archivo existe, la tienda lo muestra automáticamente en la tarjeta de
  `/tienda` y en el encabezado de `/tienda/categoria/<handle>` (la
  verificación se hace en servidor; no hay que tocar código).
- Si NO existe, la tarjeta usa su icono de fallback (para MatrixLab Tumbler,
  un icono de vaso) y nada se rompe: ni el build ni la página.
- `etiquetas-escolares` no es una categoría estándar del grid (es un acceso
  curado): su logo se usa en el bloque "Regreso a clases" de `/tienda` y en la
  página "Próximamente" de su categoría, con el mismo tamaño y proporción.
- El logo se renderiza con `object-contain`, así que no se deforma: se ajusta
  dentro del recuadro conservando su proporción.
- Se acepta `.png` o `.webp` (si existen ambos, gana `.png`).
- Tamaño recomendado: cuadrado, mínimo 256×256 px.
