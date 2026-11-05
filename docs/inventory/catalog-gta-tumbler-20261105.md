# GTA y actualización Tumbler — 2026-11-05

Cuatro diseños GTA VI en sudadera y gorra: Dúo Vice, Vice City Sunset, Leonida Night Drive y VI Palm Club. Se conserva el escenario y estampado del ZIP v2. Rosa pastel es la portada; Azul royal es la segunda opción. No se alteran las opciones antiguas.

- Sudaderas SU010–SU013: $645 MXN, Hombre y Mujer, Chica/Mediana/Grande, nueve colores, 54 variantes y 270 piezas por diseño.
- Gorras GO007–GO010: $279 MXN, cinco colores incluyendo Azul royal solicitado, sin corte/talla, una pieza por color.
- Total Wear: ocho productos, 236 variantes, 1,100 piezas iniciales.
- V010: termo rosa con asa, $180 MXN, una pieza Rosa; no se afirma capacidad/material no verificados. Reutiliza el precio de los termos vigentes.
- V001–V009: sólo imágenes aprobadas del 27 de octubre; no se modifican precio ni existencias. Se incorpora filtro Todos/Vasos/Termos con URL persistente.
- VL001: se invierten primera y segunda foto; tercera intacta.

Las seis tomas descartadas IMG_4159/4160/4162/4163/4164/4165 no se presentan como productos nuevos: sus bases estaban ocultas o reconstruidas. Las vistas alternativas aprobadas se agrupan en la misma ficha.

Los maestros y respaldos permanecen fuera de public. WebP sRGB: sudadera 724×724, gorra 543×724, vasos/termos 1200×1200. Revisión visual T2 de los 56 Wear y 14 Tumbler; la fidelidad colorimétrica absoluta no puede certificarse por fotografía doméstica. La marca de agua y las funciones privadas de la tienda se conservan.

El SQL de alta es aditivo y reejecutable, inserta primero oculto y registra reposiciones sólo mediante RETURNING de variantes nuevas. La activación y cambios de imágenes están separados para evitar productos con fotos 404 durante el despliegue. No se ejecutan semillas históricas que restablezcan precios.

Manifiesto: `catalog-gta-tumbler-20261105.json`. Prompts exactos: `catalog-gta-prompts-20261105.json`. Publicación y comprobaciones confirmadas abajo.

+
+## Publicación confirmada
+
+Producción Ready: https://matrix-lab-ecommerce-b71qgj35u-matrixlabintelligence.vercel.app — deployment `dpl_Ce7cDUcSGQJTX6CmWF3DTcjQJFDs`, fuente `794a46f2180d40492bb2bd358ad4305d18854979`. Se comprobaron los alias www.matrixlabintelligence.com y matrixlabintelligence.com. El commit conserva main y los dos cambios móviles ya publicados el 4 de noviembre. La normalización posterior de los dos títulos Palm Club se aplicó como dato, sin cambiar precios, existencias ni la aplicación desplegada.
+
+- 70 archivos públicos verificados por SHA256, 56 cambios de color en tarjetas y ocho fichas correctas.
+- Carrito probado con Hombre/Mediana/Rosa pastel, Mujer/Mediana/Azul royal y gorra Azul royal; precios, foto y variante coinciden. Solicitudes superiores al stock rechazadas con 409. Carrito propio vaciado al terminar; no se crearon pedidos ni pagos.
+- 18 comprobaciones de ancho móvil a 320/390 px sin desbordamiento; revisión visual de escritorio 1440 px. Cero errores de ejecución.
+- Filtros Vasos y Termos muestran cinco productos cada uno. Fotos aprobadas visibles. Galería de Marcianitos confirma la antigua segunda imagen como portada y la antigua primera como segunda.
+- Comparación de diez productos previos y catorce variantes: cero diferencias inesperadas; precios, stock, IDs, SKU y demás datos comerciales preservados. Se modificaron sólo imágenes y su fecha de actualización.
+- Nueve altas disponibles, 237 variantes y 1,101 piezas nuevas; 237 movimientos iniciales, sin duplicados. De ese total, Wear corresponde a ocho productos/236 variantes/1,100 piezas.
+
+Enlaces: [GTA](https://www.matrixlabintelligence.com/tienda/prendas-listas?coleccion=gta), [Termos](https://www.matrixlabintelligence.com/tienda/categoria/matrixlab-tumbler?subcategoria=snowglobe&tipo=termos), [Vasos](https://www.matrixlabintelligence.com/tienda/categoria/matrixlab-tumbler?subcategoria=snowglobe&tipo=vasos), [Marcianitos](https://www.matrixlabintelligence.com/tienda/producto/vaso-listo-vl001).
+
+Evidencias locales: `output/catalog-publication-2026-11-05/` contiene recibos SQL, antes/después, logs de build/deploy, capturas de tienda/carrito y QA detallada. Los maestros y prompts fuente permanecen allí. Publicación y comprobaciones de datos T1; recolor y apreciación de materiales T2.
+