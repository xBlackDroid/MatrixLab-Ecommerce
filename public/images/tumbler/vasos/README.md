# Fotografías de Vasos (MatrixLab Tumbler)

Cada vaso se vincula a su foto **por CÓDIGO interno**, nunca por nombre
comercial. Así, cambiar el nombre público de un vaso no rompe la imagen, y
actualizar una foto es reemplazar un archivo (sin tocar código ni base de datos).

## Convención

```
public/images/tumbler/vasos/{codigo-en-minusculas}.webp
```

Correspondencia exacta:

```
v001.webp  →  V001   (24 oz Transparente)
v002.webp  →  V002   (24 oz Tapa de Color)
v003.webp  →  V003   (24 oz Slip)
v004.webp  →  V004   (20 oz Slip)
v005.webp  →  V005   (16 oz Can)
```

## Comportamiento

- Si el archivo existe, la tarjeta de `/tienda/categoria/snowglobe` y la ficha
  de producto lo muestran automáticamente (verificación en servidor).
- Si NO existe, se usa `placeholder.webp`: un placeholder de marca MatrixLab
  Tumbler. Nunca se muestra una imagen rota ni la foto de otro vaso.
- Si el admin sube imágenes al producto desde `/admin`, esas ganan sobre la
  convención de archivo (la curaduría manual no se pisa).

## Estado actual de las fotos

Los 5 archivos `{codigo}.webp` ya están publicados en esta carpeta:
`v001.webp`, `v002.webp`, `v003.webp`, `v004.webp` y `v005.webp`. La página los
detecta automáticamente por código; no hace falta modificar código ni la base
de datos para actualizar una foto.
