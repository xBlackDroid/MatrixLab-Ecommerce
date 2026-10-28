# Origami: operación y liberación

Actualización: 10 de octubre de 2026. Versión: usuario/contraseña nativos, migraciones 0009–0011.
Estado: implementación, pruebas locales, esquema remoto y cuenta real terminados. Preview publicado por solicitud del propietario, build remoto correcto y protegido por Vercel Authentication. Login integral HTTPS y cámara física pendientes. No desplegado a producción. Enlace y estado en `ORIGAMI_PREVIEW.md`.

Preparación ya ejecutada el 10 de octubre de 2026, por autorización del propietario: proyecto `spgrjhlwmyjfwiwsqgvn`, migraciones 0009–0011 instaladas en transacción y cuenta `origami` activa de operador, sin email ni inventario inicial. Seis conciliaciones sin inconsistencias, RLS/privilegios privados verificados y 424 variantes online sin cambios. Vercel Production tiene flag false y secreto de sesión sensible independiente. No repetir 0011: contiene CREATE TABLE sin IF NOT EXISTS. Recibos en `.consignment-tests/`; la referencia previa de stock no acredita un respaldo completo. Los pasos siguientes siguen siendo el procedimiento para otros destinos y la liberación pendiente.

## Destino y preparación

1. Destino actual confirmado por el propietario: Supabase actual con portal apagado. Para otros destinos, confirmar proyecto y comprobar las migraciones aplicadas antes de instalar.
2. Configurar acceso administrativo SQL al destino mediante el gestor de secretos. `SUPABASE_SERVICE_ROLE_KEY` permite REST/RPC, pero no instala tablas; no sustituye `DATABASE_URL` o el acceso SQL del dashboard. No pegar claves por chat.
3. Respaldar el destino y comprobar que tiene 0001–0008. Aplicar, una sola vez y por el flujo de migraciones, `0009_consignments.sql`, `0010_consignment_operations.sql` y `0011_distributor_credentials.sql`, en ese orden. Registrar su estado. 0011 revoca sesiones anteriores del módulo y permite usuarios sin correo; no toca stock ni cuentas de ecommerce.
4. Desplegar el commit candidato con `CONSIGNMENTS_ENABLED=false`. Configurar `CONSIGNMENT_SESSION_SECRET` independiente, aleatorio y de al menos 32 caracteres; `CONSIGNMENTS_SITE_URL` con el origen HTTPS exacto; `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del destino. Conservar configuración de la tienda. El login nuevo no necesita Supabase Auth, SMTP, correo, anon key ni redirects de recuperación.
5. Comprobar tienda, carrito, diseñador, checkout sandbox, webhooks y admin. Con flag apagado, las páginas y API nuevas devuelven 404. La navegación pública no contiene enlaces del portal.

## Alta de Origami y prueba HTTPS

1. En el proyecto actual el registro y usuario `origami` ya existen: no duplicar ni restablecer su contraseña durante pruebas. Para otros destinos, crear el registro vacío y la cuenta desde Accesos o la herramienta descrita en `ORIGAMI_CUENTA.md`; nunca hardcodear la contraseña ni ponerla en argumentos de CLI. Mantener vacías sus piezas reales hasta registrar entregas físicas.
2. Habilitar sólo el entorno de validación y entrar por `/distribuidores/login`. Confirmar usuario/contraseña, cookie HttpOnly/Secure, no-store, Origin y CSRF. Probar logout, contraseña incorrecta y bloqueo persistente. Cambiar contraseña desde admin debe cerrar sesiones; suspender bloquea la siguiente petición y reactivar exige login nuevo.
3. Crear un distribuidor B y su propio usuario. Comprobar que ambos ven exclusivamente sus documentos, piezas y QR. Origami no puede administrar inventario, entregas, pagos, devoluciones ni accesos, incluso llamando las API manualmente.
4. Usar exclusivamente datos de prueba: ficha privada, ficha descriptivamente vinculada al catálogo y borrador sin entrega. Confirmar entregas explícitas y el ejemplo financiero: 10 piezas a $100 → venta 3 → dos pagos de $150 → devolución 1 → crédito $100 → nueva venta → aplicar crédito. El catálogo online no se modifica.
5. En el celular físico de Origami, sobre HTTPS, pulsar Abrir cámara y permitir acceso. Leer una etiqueta QR, comprobar que prepara el borrador, confirmar una vez y verificar descuento. Probar permiso denegado, captura manual y cierre/navegación con detención de cámara. Registrar navegador/dispositivo/fecha. El backend de captura nativo del Windows usado para pruebas automatizadas no está soportado; las pruebas de canvas no acreditan esta captura física.
6. Verificar dos sesiones con actualizaciones en máximo 20 s; doble clic/respuesta perdida con una sola venta, concurrencia de última pieza y devoluciones pagadas. Ejecutar `supabase/consignment_reconciliation.sql`: las primeras seis consultas sin filas y todos los privilegios públicos falsos, incluidas credenciales.
7. Registrar commit exacto, resultados del transporte Supabase/HTTPS y cámara; actualizar `ORIGAMI_CODEX_VALIDATION.md`. Si cambia el código, repetir las comprobaciones afectadas. Medir el volumen previsto antes de crecer a históricos grandes: el snapshot todavía materializa el histórico completo antes de paginar documentos.

## Promoción a producción

La activación productiva permanece pendiente de la validación del destino concreto.

1. Registrar commit probado, migraciones, operador, respaldo y configuración. Instalar el esquema sólo si aún no está aplicado; conservar el ledger y el histórico.
2. Desplegar con flag apagado y comprobar ecommerce/admin. Crear la cuenta real si se validó antes en otro proyecto. El username es `origami`; no reutilizar usuarios ni contraseñas de fixtures.
3. Registrar exclusivamente piezas, cantidades, costo y sugerido entregados físicamente a Origami. No copiar todo el catálogo ni precios sintéticos.
4. Habilitar el portal cuando se cierre la validación. Compartir enlace directo y credenciales por el canal autorizado. No se enviaron ni programaron correos, mensajes, cobros o transferencias.
5. Revisar errores de acceso/stock/idempotencia/DB, sincronización y conciliación durante el inicio de operación. MatrixLab registra los pagos efectivamente recibidos.

## Operación y recuperación

- Nueva ficha no significa stock: primero confirmar la entrega. Cambios de costo crean nuevos lotes; el histórico de ventas conserva el costo original.
- Escanear/capturar prepara la venta; confirmar descuenta. Los pagos registran dinero recibido y su aplicación, sin mover dinero bancario.
- Si la respuesta se pierde, conservar la intención y usar Reintentar. No generar otra venta hasta revisar el resultado.
- Correcciones y devoluciones dejan rastro; no borrar documentos ni editar saldos manualmente. Las devoluciones pagadas liberan crédito, no un pago nuevo.
- Suspender usuarios o distribuidores bloquea el acceso y conserva el histórico para MatrixLab. Restablecer contraseña cierra sesiones sin modificar documentos.
- Ante divergencia, apagar `CONSIGNMENTS_ENABLED`, preservar evidencia y revisar el ledger. Reparar con movimientos formales o migración forward; volver a conciliar.
- Rollback: apagar flag y volver a código compatible. No hacer DROP ni restaurar un respaldo que borre ventas o pagos posteriores.
