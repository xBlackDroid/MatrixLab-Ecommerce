# Gorras deportivas y colores

Base productiva acumulativa: `43050b7d1e5b5f49e8de21fe2da901a2c30b99c4`, deployment `dpl_25EvmpEG1QDnfqRzkEG4Q8N8CUab`. Se preservan precios administrativos, folios consecutivos del cotizador y todas las actualizaciones anteriores de Wear y las otras líneas.

## Catálogo autorizado

Se agregan Marathon Runner (GO002), Crossfit (GO003), Gym Rat (GO004), Gym Addict (GO005) y Padel Player (GO006), y se amplía Padel Queen (GO001). Todos a $279 MXN, en Rosa, Negro, Blanco y Rosa pastel, con una existencia por color. La variante previa de Padel Queen conserva su ID, SKU, precio y stock; se identifica como Rosa. Se agregan 23 variantes, sin reiniciar inventario anterior.

Las gorras tienen selección de color y cantidad. Corte y talla se conservan sólo para las playeras y sudaderas que los usan. El color se refleja en tarjeta, imagen grande, URL, variante del carrito y miniatura administrativa. La colección Gorras se suma a las anteriores, dentro de Prendas listas.

## Imágenes

Origen: fotografías de `output/MatrixLab_gorras_deportivas_5_2026-10-28.zip` y fotografía aportada de Padel Queen. No se ejecutaron los scripts incluidos en el ZIP.

Se usó ImageGen integrado en modo edición. Cada gorra conserva su forma y diseño frontal, con cuatro colores y fondo de pasto/cancha al aire libre. Las 24 imágenes se guardan en `public/images/matrixlab-wear/gorras/colors/go001-rosa.webp` hasta `go006-rosa-pastel.webp`; el manifiesto `sports-cap-assets-20261028.json` enumera los archivos y dimensiones. Las fotos completas son verticales y la ficha/tarjeta respeta su proporción para mostrar toda la gorra, sin estirar ni cortar la visera.

Los prompts exactos y referencias están en `sports-cap-image-prompts-20261028.json`. Instrucciones: conservar silueta, costuras, ojales, botón, visera, tejido y estampado; cambiar tela a rosa original, negro, blanco y rosa pastel; mantener tinta clara en colores oscuros y adaptar a carbón en claros para legibilidad; sustituir estudio neón por campo deportivo exterior con pasto, luz natural y fondo desenfocado. Se validó visualmente cada uno de los 24 resultados.

## Validación

TypeScript y pruebas de colores de gorras, prendas listas, inventario administrativo y cotizador. Las altas SQL son aditivas e idempotentes y registran movimientos por las 23 existencias nuevas. Antes de la publicación se guardó una instantánea de los 467 productos y 1,336 variantes existentes para verificar conservación del inventario.

Despliegue productivo inicial: `dpl_AXeJoS8SeWxbBC3jjSGRzEcqHHUi`. Comprobación posterior: 472 productos y 1,359 variantes totales; 49 productos listos con foto, de los cuales seis son gorras. Las 24 variantes de gorra aparecen en el bloque Wear del inventario con miniatura del color correcto. Los otros 466 productos no cambiaron.

Comprobación en navegador de las seis fichas y sus 24 colores: fotografía correcta, compra habilitada y límite de una pieza. Compra desde la interfaz de Padel Queen Negra confirmada; 14 variantes comprobadas por API con precio de $279 e imagen correcta y rechazo de cantidades superiores al límite. Los carritos de prueba se vacían sin generar pedidos. Se ajustó el ancho mínimo nativo del fieldset de color para pantallas de 320 px.
