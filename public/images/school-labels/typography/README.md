# Thumbnails de tipografías (Etiquetas Escolares Lab)

Muestras de la guía "Cómo Hacer tu Pedido" (sección "Elige tu tipografía",
partes 1 a 6, códigos 001–054), exportadas como **WebP optimizado** (~6 KB c/u)
para no bloquear la carga.

```
public/images/school-labels/typography/001.webp
public/images/school-labels/typography/002.webp
...
public/images/school-labels/typography/054.webp
```

El catálogo `src/lib/designer/school-labels/typography-options.ts` apunta a
`/images/school-labels/typography/0NN.webp`.

## Cómo regenerar

Recorta cada muestra de la guía (proporción ~4:3) y guárdala con el nombre
exacto del código y extensión `.webp`. No hace falta tocar código.

## Fallback

Si un thumbnail no existe, la UI **no se rompe**: muestra una vista previa
generada con el nombre escrito y el código grande. En cuanto exista el `.webp`
con el nombre correcto, la card lo mostrará automáticamente.
