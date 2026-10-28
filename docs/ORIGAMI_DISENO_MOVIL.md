# Origami: diseño móvil

Solicitud del propietario, 11 de octubre de 2026: optimizar el portal para celular y darle un diseño más cuidado, inspirado en la claridad y el estado seleccionado de los selectores de modo/modelo que menciona. Usar Claude y skills de diseño dentro del módulo existente.

## Dirección

Superficies oscuras, acento lila de MatrixLab, contraste legible, jerarquía de números y controles táctiles. Navegación entre Inventario, Venta y Estado de cuenta visible sin pestañas escondidas. Login con el logo existente de MatrixLab Stickers. Sin nombres de modelos de IA en el producto, decoración que dificulte operar ni nuevas dependencias/recursos remotos.

El resumen conserva cuatro datos: piezas disponibles, valor del stock a costo, pagos a MatrixLab y un único «Por pagar». Los costos y precios sugeridos permanecen separados. Los valores siempre provienen del snapshot: no se hardcodea Lego Calabaza ni se generan nuevos datos de ejemplo.

## Alcance y verificación

- Componentes de consignación y las envolturas de inventario/scanner. Estilos aislados para evitar cambios en tienda, catálogo y otros apartados administrativos.
- Presentación, estados y navegación; conservar handlers financieros, CSRF, idempotencia, endpoints, roles, feature flags y noindex.
- Pantallas 320/360/390/430 px y tablet 768, sin desbordamiento incluso con textos/SKU largos; controles de al menos 44 px y campos de 16 px o más.
- Foco visible, estado seleccionado, etiquetas accesibles, safe-area en controles fijos y respeto de reducción de movimiento. Sin pedir cámara al cargar.
- Revisar código generado por Claude y ejecutar build, tipos, lint, E2E del flujo venta/abonos/aislamiento y cámara por sus cambios de presentación. Inspeccionar capturas locales antes de actualizar Preview.

Claude recibió únicamente copias de componentes, dos páginas, el logo y la skill `redesign-existing-projects`; sin `.env`, secretos, acceso a Supabase, shell, MCP ni autorización para desplegar. Implementó el diseño y escribió un reporte local; no ejecutó pruebas ni desplegó. Codex integró, revisó y validó el resultado.

La revisión de Codex elevó el contraste de metadatos, corrigió el botón de contraseña a 44 px y separó su etiqueta del botón, compactó la cabecera y ajustó el selector de admin para respetar la barra superior existente. «Tu costo» y la unidad comercial se conservan válidos para pieza, paquete, juego, par y kit; no se cambia su contabilidad. Textos/SKU largos pueden envolver dentro de los paneles.

La inspección visual a 320 px detectó palabras partidas en controles a pesar de no desbordar horizontalmente. Se corrigió el no-wrap de los nombres de navegación y se omiten iconos/punto de selección a ≤360 px cuando consumen espacio. El estado seleccionado sigue marcado por fondo, borde y aria-current. E2E mide los rectángulos del texto para comprobar que los cinco nombres Inventario/Venta/Cuenta/Escanear/Salir quedan en una sola línea en todos los anchos comprobados. Se inspeccionó la captura estrecha actualizada, con nombres y SKU largos que sí envuelven en el contenido.

Pasaron build, type-check, lint, E2E táctil y automatización de cámara. Se comprobaron 320/360/390/430 px y tablet 768, controles ≥44 px, campos ≥16 px, navegación visible y contenido largo sin desbordamiento; venta y dos abonos conservan los mismos saldos/stock. El mostrar/ocultar contraseña funciona sin enviar el formulario. Los handlers principales de venta/reintento, escaneo y confirmación de accesos se compararon estructuralmente sin diferencias. CSS Modules limita el rediseño al módulo; sin dependencias o fuentes nuevas ni cambios de tablas/datos/flags.

Capturas locales con datos sintéticos: login, inventario antes de venta, revisión de venta, cuenta pagada, scanner y contenido largo a 320 px. La captura se hace desde el inicio para evitar el artefacto visual de sticky al capturar la página completa después de desplazarse. Código y resultados en `ORIGAMI_TEST_REPORT.md`; deployment en `ORIGAMI_PREVIEW.md`. Production permanece apagada hasta cerrar la validación remota y de cámara física. La automatización de cámara no acredita un celular físico.
