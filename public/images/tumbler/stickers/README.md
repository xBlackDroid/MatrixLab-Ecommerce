# Fotografías de UV Stickers (MatrixLab Tumbler)

Cada UV Sticker se vincula a su foto **por CÓDIGO interno**, nunca por nombre
comercial. Así, cambiar el nombre público de un diseño no rompe la imagen, y
actualizar una foto es reemplazar un archivo (sin tocar código ni base de datos).

## Convención

```
public/images/tumbler/stickers/{codigo-en-minusculas}.webp
```

Ejemplos:

```
a001.webp   →  A001   (UV Sticker 24oz A001)
a050.webp   →  A050
a187.webp   →  A187   (Holográfico)
a209.webp   →  A209   (Mini)
```

## Comportamiento

- Si el archivo existe, la tarjeta de `/tienda/categoria/wraps-glow-finish` y
  la ficha de producto lo muestran automáticamente (verificación en servidor).
- Si NO existe, se usa `placeholder.webp`: un placeholder de marca MatrixLab
  Tumbler / UV Sticker. Nunca se muestra una imagen rota ni la foto de otro
  diseño.
- Si el admin sube imágenes al producto desde `/admin`, esas ganan sobre la
  convención de archivo (la curaduría manual no se pisa).

## Estado actual de las fotos

Ningún `{codigo}.webp` está subido todavía: los 209 UV Stickers muestran el
placeholder. Basta con dejar el archivo en esta carpeta (por ejemplo
`a050.webp`) para que aparezca en el siguiente render: no hay que modificar
código ni la base de datos.

Códigos válidos: `a001` … `a209`.
