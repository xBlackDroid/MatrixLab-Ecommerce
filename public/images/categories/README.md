# Imágenes de categorías

Coloca aquí el logo/imagen de cada categoría del catálogo. El archivo debe
llamarse exactamente como el `handle` de la categoría:

```
public/images/categories/<handle>.png   (o .webp)
```

Ejemplo — logo de la línea de vasos/insumos:

```
public/images/categories/matrixlab-tumbler.png
```

Comportamiento:

- Si el archivo existe, la tienda lo muestra automáticamente en la tarjeta de
  `/tienda` y en el encabezado de `/tienda/categoria/<handle>` (la
  verificación se hace en servidor; no hay que tocar código).
- Si NO existe, la tarjeta usa su icono de fallback (para MatrixLab Tumbler,
  un icono de vaso) y nada se rompe: ni el build ni la página.
- Se acepta `.png` o `.webp` (si existen ambos, gana `.png`).
- Tamaño recomendado: cuadrado, mínimo 256×256 px.
