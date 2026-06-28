# Banners de la sección de stickers (home `/`)

Sube aquí las imágenes de los 4 banners flotantes de la sección de stickers de
la página de inicio.

## Cómo cambiar un banner

1. Sube tu imagen a esta carpeta, por ejemplo:
   - `public/images/home/sticker-banners/marcas.webp`
   - `public/images/home/sticker-banners/eventos.webp`
   - `public/images/home/sticker-banners/colecciones.webp`
   - `public/images/home/sticker-banners/regalos.webp`

2. Abre `src/app/page.tsx` y edita el arreglo `stickerFeatureBanners`.
   Añade el campo `image` (y opcionalmente `href`) al banner que quieras:

   ```ts
   const stickerFeatureBanners = [
     {
       title: "Marcas y empaques",
       subtitle: "Stickers, etiquetas y empaques con tu identidad.",
       image: "/images/home/sticker-banners/marcas.webp",
       href: "/tienda/categoria/stickers",
     },
     // ...
   ];
   ```

## Notas

- Si un banner **no** tiene `image`, se muestra el estado por defecto
  (icono + texto). No se rompe nada.
- Ruta pública: lo que pongas en `image` empieza en `/images/...`
  (sin `public/`).
- Formato recomendado: `.webp` (ligero). También sirve `.jpg` / `.png`.
- Proporción sugerida: ~1:1 o vertical suave; las tarjetas recortan con
  `object-cover` y aplican un velo para que el texto sea legible.
