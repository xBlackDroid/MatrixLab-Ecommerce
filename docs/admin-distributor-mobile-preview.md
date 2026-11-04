# Preview móvil de Admin y Distribuidores

Fecha: 2026-11-04. Estado: revisión local, sin publicación en producción.

## Revisión

- Interactivo local: http://127.0.0.1:4180/review
- Capturas para iPad: https://drive.google.com/drive/folders/1YmUSslaYmEsSzaKQCmkDpkRT5DR381g0
- Implementación: `C:\Dev\MatrixLab-ops-mobile-20261104`
- Rama: `codex/mobile-admin-distributors-preview-20261104`
- Base: producción `ce1c08a0354ba01936aa118de0bdc7659e0cfbcb`.

## Cambios

Se mantiene la identidad oscura existente. Admin usa un menú plegable con las nueve secciones, navegación activa, foco contenido, Escape y retorno al botón. Pedidos y productos pasan a tarjetas en vertical, sin ocultar información; el detalle del pedido se abre dentro de su tarjeta. Filtros de pedidos e instrucciones secundarias quedan plegados. Productos tiene búsqueda por nombre, enlace, categoría y SKU, sin distinguir acentos. Los formularios conservan sus etiquetas, usan texto de 16 px, áreas de toque de 44 px y teclados decimal o numérico según el dato. El editor de producto tiene acciones accesibles al pie del diálogo.

Distribuidores tiene navegación inferior a Inventario, Venta, Cuenta y Escanear, con área segura y espacio reservado. La barra se oculta al escribir. Resumen contable y configuración se despliegan cuando se necesitan. Al agregar una pieza a la venta, los controles para añadir más quedan plegados. El precio conserva lo escrito durante la edición, acepta coma decimal y valida centavos; un importe vacío o inválido impide revisar una venta. Quitar la pieza elimina también ese error. El área de error mantiene estable la posición de las acciones durante el primer toque.

Bazar conserva el flujo de venta, convierte el inventario en tarjetas y añade un acceso móvil al ticket. Cotizador conserva su selector compacto de módulo y su adaptación móvil existente.

## Aislamiento

`C:\Dev\MatrixLab-ops-preview-20261104` es una copia separada, solo para demostración, sin credenciales de producción y excluida de despliegues. Sus páginas de fixture no se copian a la rama de implementación. `server.cjs` escucha únicamente en loopback y simula todas las solicitudes de API en memoria. Ninguna solicitud de API atraviesa el proxy hacia el backend. Las ventas, nombres, órdenes y cifras mostrados son ficticios.

En la implementación no se modificaron rutas API, autenticación, permisos, middleware, esquemas de base de datos, reglas contables ni la tienda pública. Las validaciones originales de comandos, CSRF, confirmaciones e idempotencia permanecen. Los ejemplos no sustituyen una prueba de integración con el backend real.

## Validación

- `scripts/qa/mobile-ops-components.mjs`: flujo de venta con decimales, coma, precio vacío, quitar y volver a agregar, centavos enviados y confirmación con fixtures; categoría modal; cuenta e inventario de Bazar.
- `scripts/qa/mobile-ops-review.mjs`: 320/375/430 px, menú, foco, pedidos y detalle, filtros, búsqueda de productos, editor, entregas/pagos, venta, barra móvil, Bazar y Cotizador. Verifica controles, tamaño de texto y desbordamientos. Incluye axe (problemas graves/críticos) y comparación de navegación/tablas a 1366 px.
- Evidencia: `components-qa.json`, `review-qa.json`, `build.log` y capturas numeradas.
- `npm run type-check` y `npm run build` en el worktree de implementación.

Resultado final: 53 verificaciones de componentes y 172 verificaciones de revisión aprobadas; ningún error de ejecución ni escritura externa de API durante las pruebas. La compilación optimizada final terminó correctamente. El lint de los componentes modificados terminó sin errores; se corrigió también la advertencia sobre la referencia al botón del menú.

Se intentó usar Claude Code con Opus y effort max. Una ejecución no guardó cambios y fue detenida; una revisión acotada terminó por límite de salida. No se atribuyen implementación ni aprobación a Claude. Los cambios y la validación final se realizaron directamente.

## Reiniciar el preview existente

1. Ejecutar `node docs/mobile-ops-preview/sync-preview.mjs` desde el repositorio principal tras cambios de componentes.
2. Ejecutar Next dev en la copia aislada, puerto 3109.
3. Ejecutar `node docs/mobile-ops-preview/server.cjs`, puerto 4180.

La copia aislada y el gateway son solo herramientas de revisión. No desplegarlos ni copiar sus páginas de fixture a producción.
