# Thumbnails reales de tipografías (Etiquetas Escolares Lab)

Esta carpeta guarda los thumbnails recortados del PDF "Cómo Hacer tu Pedido"
(sección "Elige tu tipografía", partes 1 a 6, códigos 001–054).

## Cómo agregar los thumbnails reales

1. Recorta cada muestra del PDF y expórtala a **PNG** (idealmente con fondo
   transparente y proporción ~4:3).
2. Guárdala aquí con el nombre exacto del código, con 3 dígitos y `.png`:

   ```
   public/images/school-labels/typography/001.png
   public/images/school-labels/typography/002.png
   ...
   public/images/school-labels/typography/054.png
   ```

3. No hace falta tocar código: el laboratorio usa
   `src/lib/designer/school-labels/typography-options.ts`, que apunta a
   `/images/school-labels/typography/0NN.png`.

## Fallback

Si un thumbnail aún no existe, la UI **no se rompe**: muestra una vista previa
generada con el nombre escrito y el código grande. En cuanto subas el PNG con el
nombre correcto, la card lo mostrará automáticamente.
