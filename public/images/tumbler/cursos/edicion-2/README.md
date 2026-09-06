# Fotos del taller — Cursos MatrixLab Tumbler, Edición 2

Aquí van las fotos que se ven en el carrusel de
`/tienda/matrixlab-tumbler/cursos`.

**No hay que tocar código ni base de datos.** El servidor lee esta carpeta en
cada visita: en cuanto el archivo está aquí con el nombre correcto, la foto
aparece en la galería y en el orden que le toca.

## Convención

```
public/images/tumbler/cursos/edicion-2/01.webp
public/images/tumbler/cursos/edicion-2/02.webp
public/images/tumbler/cursos/edicion-2/03.webp
...
```

- **Dos dígitos**, empezando en `01`. El número manda el orden del carrusel,
  así que para reordenar basta con renombrar los archivos.
- **Minúsculas siempre**, y la extensión también (`.webp`, no `.WEBP`).
- Se aceptan `.webp`, `.jpg`, `.jpeg` y `.png`, pero **usa `.webp`**: la
  galería carga varias fotos y un `.jpg` de cámara pesa entre 5 y 10 veces
  más.

Cualquier archivo con otro nombre (`foto final.webp`, `IMG_2231.jpg`, este
mismo `README.md`) se **ignora**: no se cuela a la página ni rompe el orden.

## IMPORTANTE: el nombre del archivo debe ir en minúsculas

Producción (Vercel/Linux) usa un filesystem **case-sensitive**; el entorno de
desarrollo (Windows/macOS) normalmente no. Subir `01.WEBP` funciona en local y
falla en producción sin dar ningún error: la foto sencillamente no aparece.

## Formato recomendado

- **Proporción vertical** (retrato). El carrusel recorta a 4:5, que es lo que
  sale de un teléfono en vertical. Una foto horizontal se ve, pero se recorta
  por arriba y por abajo.
- **Ancho de 1200–1600 px** es más que suficiente: `next/image` genera las
  medidas que necesita cada pantalla.
- Cuida que lo importante quede **centrado**: el recorte come los bordes.

## Mientras la carpeta esté vacía

La galería muestra marcadores de posición de marca y el texto "Estamos
preparando las fotos del taller". No se inventan fotos ni se usan imágenes de
banco.

## Ediciones futuras

Cada edición tiene su carpeta:

```
public/images/tumbler/cursos/edicion-3/01.webp
```

La ruta la declara la edición en `src/lib/store/courses/matrixlab-tumbler.ts`
(campo `gallery.dir`).
