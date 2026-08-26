# Fotografías de Sparkles (MatrixLab Tumbler)

Cada Sparkle se vincula a su foto **por CÓDIGO interno**, nunca por nombre
comercial. Así, cambiar el nombre público de un glitter no rompe la imagen, y
actualizar una foto es reemplazar un archivo (sin tocar código ni base de datos).

## Convención

```
public/images/tumbler/sparkles/{codigo-en-minusculas}.webp
```

Ejemplos:

```
2002.webp     c03r.webp     c07r-a.webp    c08r.webp
g001.webp     m004.webp     le01.webp
```

## Comportamiento

- Si el archivo existe, la tarjeta de `/tienda/categoria/repuestos-consumibles`
  y la ficha de producto lo muestran automáticamente (verificación en servidor).
- Si NO existe, se usa `placeholder.webp`: un placeholder de marca MatrixLab
  Tumbler / Sparkle. Nunca se muestra una imagen rota ni la foto de otro glitter.
- Si el admin sube imágenes al producto desde `/admin`, esas ganan sobre la
  convención de archivo (la curaduría manual no se pisa).

## IMPORTANTE: el nombre del archivo debe ir en minúsculas

Producción (Vercel/Linux) usa un filesystem **case-sensitive**; el entorno de
desarrollo (Windows/macOS) normalmente no. Subir `C08R.webp` en vez de
`c08r.webp` funciona en local pero falla en producción sin dar ningún error
(cae al placeholder en silencio). Nombra siempre el archivo en minúsculas,
preservando los guiones (`C07R-A` → `c07r-a.webp`).

## Estado actual de las fotos

Los 46 Sparkles del Excel tienen su foto subida (`{codigo-en-minusculas}.webp`).
