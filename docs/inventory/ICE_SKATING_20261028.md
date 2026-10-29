# Colección IceSkating para adulto

Actualización acumulativa basada en producción `ea514f17` / `dpl_9YDz99GYnRDHiQik7tbQX7LPyCTT`, conservando las sudaderas, playeras, gorras, totes y funciones administrativas anteriores.

Cuatro productos nuevos: SU006 IceSkating Coach, SU007 IceSkating Dad, SU008 IceSkating y SU009 IceSkating Mom. Precio $645 MXN por pieza. Cada uno ofrece nueve colores × corte Hombre/Mujer × talla Chica/Mediana/Grande, con cinco existencias por combinación: 216 variantes y 1,080 piezas nuevas.

Colores: Lila, Negro, Blanco, Negro jaspe, Gris jaspe, Rojo, Azul marino, Azul royal y Rosa pastel. Los productos aparecen en Sudaderas y en la nueva colección IceSkating, combinable con búsqueda. El selector conserva la fotografía y variante del color elegido en tarjeta, ficha, carrito e inventario administrativo.

## Fotografías y prompts

Se usó ImageGen integrado en modo edición con las fotografías aportadas en `output/MatrixLab_IceSkating_sudaderas_etiqueta_v2_2026-10-28.zip`. No se ejecutaron los scripts del archivo.

Primero se generaron nueve colores por diseño manteniendo modelo, vista de espalda y estampado. Por petición posterior del usuario se editaron esas mismas imágenes para cambiar únicamente el fondo a una pista de hielo interior, conservando los colores y diseños ya generados. Sólo las imágenes finales con pista se incorporan al catálogo.

Las 36 fotografías se guardan en `public/images/matrixlab-wear/hoodies/su006-{color}.webp` hasta `su009-{color}.webp`. `ice-skating-assets-20261028.json` contiene rutas, dimensiones y trazabilidad. Los prompts exactos de ambas fases se registran en `ice-skating-image-prompts-20261028.json`.

## Inventario y conservación

La semilla aditiva `supabase/seed_ice_skating_hoodies_20261028.sql` no reinicia stock existente y registra movimientos por las altas nuevas. Se guardó una instantánea de los 472 productos y 1,359 variantes previos para comprobar conservación. El inventario resultante esperado es de 476 productos y 1,575 variantes; la vitrina de prendas listas contiene 53 productos con fotografía.

Para mantener el empaquetado dentro de los límites actuales de hosting, las 36 fotos nuevas se excluyen de los paquetes de servidor mediante `outputFileTracingExcludes`. Siguen en `public/` para el CDN. El selector resuelve sus rutas sin leer imágenes en servidor; las fuentes privadas del cotizador y el resto de archivos de catálogo mantienen su configuración anterior.
