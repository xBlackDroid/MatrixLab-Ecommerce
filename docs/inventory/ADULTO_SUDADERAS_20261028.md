# Prendas listas: sudaderas y accesorios

Base acumulativa: producción `dpl_3vVkdYLLrBF7bZmQmRBV7d86Y9jG`, commit `ea2363ac4a010b42bb50251ce291c0b0701eda3f`. Conserva el cotizador y el inventario administrativo por bloques con miniaturas.

## Catálogo

- Architect, Barista, Dance Teacher, Coach y Wife: $645 MXN. 9 colores × Hombre/Mujer × Chica/Mediana/Grande; 5 por combinación, 270 variantes y 1,350 piezas nuevas.
- Gorra Padel Queen: $279 MXN, 1 pieza. Tote Tennis Player: $170 MXN, 1 pieza.
- Playeras existentes: $349, Blanca/Negra/Gris, sin reiniciar stock.
- Filtros independientes por tipo, colección y búsqueda. Se ocultan los productos sin fotografía de la vitrina lista; no se borran productos del Laboratorio.
- Wear en tienda e inicio dirige primero a prendas listas; Laboratorio como segunda acción.

## Imágenes y generación

Se usó ImageGen integrado en modo edición, con las fotografías aportadas como referencia. 15 tiras de tres fotografías, divididas y guardadas como 45 WebP de 724 × 724 en `public/images/matrixlab-wear/hoodies/su001-{color}.webp` hasta `su005-{color}.webp`. El manifiesto `adult-hoodie-assets-20261027.json` enumera cada archivo, color y origen generado. Gorra y tote conservan sus fotografías originales en `public/images/matrixlab-wear/gorras/go001.webp` y `public/images/matrixlab-wear/totes/to004.webp`.

Conjunto de instrucciones de edición: conservar modelo, encuadre, fondo, diseño tipográfico e impresión de la fotografía original. Cambiar únicamente el tejido de la sudadera y el contraste de la tinta necesario para legibilidad. Crear tres paneles cuadrados contiguos, sin textos adicionales, bordes ni separadores. Grupos de izquierda a derecha: (1) Lila / Negro / Blanco, (2) Negro jaspe / Gris jaspe / Rojo, (3) Azul marino / Azul royal / Rosa pastel. Jaspe con textura visible, azul marino oscuro y royal saturado. Aplicado individualmente a Architect, Barista, Dance Teacher, Coach y Wife.

## Validación previa

TypeScript y pruebas `ready-wear.test.ts`, `admin-inventory.test.ts` y `admin-cotizador-workspace.test.ts` aprobadas. Colores cerrados por prenda: un color inválido no genera una ruta inexistente. Galería, miniatura, variante, carrito y enlace conservan el color elegido.

Altas SQL aditivas e idempotentes: semillas de sudaderas y accesorios. Variantes ya existentes no se reinician; las altas registran movimientos de reposición.
