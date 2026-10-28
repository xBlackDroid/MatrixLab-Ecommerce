# Consignaciones Origami: implementación

Fecha: 11 de octubre de 2026. Rama: `codex/origami-consignaciones`.
Versión actual: acceso nativo por usuario/contraseña, migraciones 0009–0011, valoración del stock, resumen simplificado, diseño móvil y gestión visible por perfil. Base de implementación: `b22fd9e44d4500598b0d6c6170bd98dc015b8cce`. Código actual validado: `07337ba`; diseño móvil previo: `16ba712`; diseño inicial de Claude: `697dabf`; simplificación previa: `36ee82f`; valoración previa: `ea76df7`; alta nativa previa: `4b203d5`. Los commits posteriores de documentación no cambian código.

Cada tarjeta del directorio abre el inventario, las entregas o los usuarios de ese distribuidor. Crear un perfil abre su configuración de piezas; el workspace guía Crear pieza → Asignar stock → Vincular usuarios y muestra el nombre de la cuenta seleccionada. Un usuario creado dentro del perfil se vincula automáticamente a su inventario; Origami conserva su cuenta existente. Ver `ORIGAMI_ADMIN_INVENTARIO.md`. Build, tipos, lint y E2E aprobados; login y lectura admin HTTPS comprobados en el Preview vigente sin confirmar operaciones de negocio.

Actualización: el usuario solicitó login sin correo, portal privado por enlace y escalabilidad a más distribuidores. Se implementó la gestión de cuentas desde Accesos, sin depender de Supabase Auth. La contraseña no se guarda en texto plano ni se incluye en bitácoras/respuestas. El setup genérico acepta nombre, slug y usuario; mantiene vacío o intacto el inventario. Ver `ORIGAMI_CUENTA.md`.

## Comportamiento

Diseño móvil del 11 de octubre: Claude implementó estilos aislados en `portal.module.css` y Codex los revisó y validó. Selector segmentado Inventario/Venta/Cuenta visible y sticky, cabecera compacta, tipografía tabular, costos/sugerido separados, login con mostrar contraseña y scanner con estado visible. Controles ≥44 px, campos ≥16 px y etiquetas completas incluso en 320 px. Se respeta reducción de movimiento y se conserva el mismo backend/contabilidad. Sin nuevas dependencias, fuentes remotas o cambios globales del sitio. Detalle: `ORIGAMI_DISENO_MOVIL.md`.

Simplificación posterior del 11 de octubre: admin y distribuidor muestran piezas disponibles, valor del stock a costo, pagos y un único «Por pagar», calculado con el pendiente restante. Se quitaron las dos tarjetas «Deuda por ventas» y «Pendiente de pago». El resumen de venta también conserva sólo «Por pagar»; los detalles desplegables muestran total a MatrixLab y pagado. Login y recuperación llevan el logo existente de MatrixLab Stickers. No se modifican cálculos, permisos ni datos.

Corrección del 11 de octubre de 2026: Origami realiza pagos a MatrixLab y el propietario los registra desde admin. El resumen muestra «Valor del stock a costo» en vez de «Crédito disponible», calculado con las cantidades disponibles y el costo contractual de cada lote, con centavos enteros y rechazo de desbordamientos. El precio sugerido es independiente. Los pagos se muestran como «Pagos a MatrixLab» para Origami; los anticipos o excedentes conservan su contabilidad de saldo a favor, separada del valor físico del inventario. El CSV usa la misma dirección de pago e incluye la valoración actual global.

El apartado se integra al panel de MatrixLab y tiene un acceso separado para distribuidores. Origami comienza con inventario vacío aunque la tienda tenga productos y existencias. MatrixLab crea fichas privadas poco a poco y confirma entregas físicas con cantidades, costo pactado y precio sugerido. Una ficha sin entrega es borrador y no aparece en la cuenta de Origami.

La ficha puede existir exclusivamente para Origami o vincularse a una variante del catálogo. Vincularla copia datos seleccionados, nunca existencias. No se publica la ficha privada ni se modifica el stock online. El retiro físico del stock central debe conciliarse por el procedimiento actual de MatrixLab; esta versión no implementa una transferencia automática de almacenes.

Ambos roles ven existencias, costos por lote, sugerido, ventas y estado de cuenta. Origami puede confirmar ventas propias. MatrixLab administra piezas, entregas, accesos, pagos, aplicaciones de crédito, devoluciones, anulaciones, mermas y retornos no vendidos. Desactivar un distribuidor bloquea su acceso y operaciones nuevas; MatrixLab conserva la posibilidad de corregir y liquidar la cuenta.

El QR identifica una ficha, sin precios ni credenciales. Leerlo con cámara, lector de teclado o captura manual prepara una venta: el stock se descuenta al confirmar. La venta presenta previamente el costo pactado, importe público y deuda. Un precio público menor que el costo no reduce la deuda. Se exige motivo para precio público cero.

Los pagos son registros de dinero recibido por MatrixLab; no realizan cobros ni transferencias bancarias. Pueden aplicarse por antigüedad, a ventas específicas o quedar totalmente como crédito. Una devolución de venta pagada libera crédito, sin inventar un nuevo pago. Las correcciones conservan los documentos originales.

## Rutas finales

| Ruta | Uso |
| --- | --- |
| `/admin/distribuidores` | Directorio y alta vacía, sesión admin actual. |
| `/admin/distribuidores/[id]` | Inventario y administración de la cuenta elegida. |
| `/distribuidores/login` | Usuario y contraseña propios del distribuidor. |
| `/distribuidores/recuperar` | Instrucción para solicitar restablecimiento a MatrixLab. |
| `/distribuidores` | Inventario, venta y estado de cuenta propios. |
| `/distribuidores/escanear` | Cámara y alternativa de captura manual. |
| `GET /api/admin/distributors` | Directorio; `id` selecciona cuenta; `catalog` consulta variantes para vinculación. |
| `POST /api/admin/distributors` | `{ distributorId, command: { action, payload } }`, admin y CSRF. |
| `GET /api/distributor` | Cuenta derivada de membresía; ningún ID externo cambia su propietario. |
| `POST /api/distributor` | `{ action, payload }`, sólo `preview` y `sale`, sesión y CSRF. |
| `GET/POST /api/admin/distributors/access` | Listado sin hashes; crear/restablecer/suspender/reactivar cuentas, admin y CSRF. |
| `POST /api/distributor/auth` | `login` y `logout`, con Origin y límite durable de intentos. |

Las lecturas de cuenta admiten `scan`, `export=csv`, fechas ISO `from`/`to` y `page` desde cero. Los documentos se devuelven en páginas de 20; los indicadores superiores son globales. El CSV consulta el histórico completo y calcula saldo inicial/final del rango, detalle de ventas y crédito global. Neutraliza campos que podrían ejecutar fórmulas al abrirlos en una hoja de cálculo.

Mutaciones de negocio: cabecera `Idempotency-Key` de 8 a 120 caracteres y `x-ml-csrf`. Zod rechaza campos no previstos, costos/totales/actor inyectados, cantidades inválidas y desbordamientos. El servidor deriva identidad, rol y distribuidor; la DB calcula costos y saldos. No hay modo offline.

## Datos y transacciones

`0009_consignments.sql` agrega tablas privadas: `distributors`, `distributor_memberships` y `consignment_sessions`, `items`, `deliveries`, `delivery_lines`, `adjustments`, `lots`, `sales`, `sale_lines`, `sale_allocations`, `returns`, `return_lines`, `payments`, `payment_applications`, `movements`, `audit_events`, `idempotency` (los nombres posteriores a sessions llevan prefijo `consignment_`). Incluye constraints, índices y secuencias de folios.

`0010_consignment_operations.sql` agrega las operaciones y vistas privadas. `consignment_command` bloquea la fila del distribuidor y realiza documentos, lotes, aplicaciones, ledger, auditoría e intención en la misma transacción. Los comandos de un mismo distribuidor se serializan, también cuando llegan desde conexiones distintas. Los folios pueden tener huecos después de un rollback; las secuencias no son transaccionales.

`consignment_preview` selecciona lotes FIFO por `received_at, fifo_seq` y firma el resumen mediante fingerprint SHA-256. La venta vuelve a calcularlo dentro del bloqueo y rechaza un resumen desactualizado. Los costos de lotes y snapshots históricos son inmutables. Los importes se guardan en centavos enteros; límite por importe/documento: `1_000_000_000_000` centavos; cantidades hasta un millón por línea; documentos hasta 50 líneas.

La intención idempotente se guarda en PostgreSQL por distribuidor, actor y operación. Mismo payload/clave devuelve el documento original incluso tras reiniciar Next; reutilizar la clave con otro payload genera conflicto. Se comprueban permisos antes de devolver resultados previos. La interfaz preserva la intención y bloquea operaciones nuevas cuando desconoce si el servidor confirmó una venta.

Las aplicaciones de pagos son entidades separadas. Devoluciones reducen deuda original y liberan aplicaciones excedentes conservando su rastro. Anular un pago revierte aplicaciones y reabre saldos, sin cambiar inventario. Una entrega sólo se revierte si sus lotes no tienen movimientos posteriores.

`consignment_snapshot` toma un bloqueo compartido para leer datos coherentes. Vistas: `consignment_sale_balances`, `consignment_payment_balances`, `consignment_reconciliation`. Consultas operativas: `supabase/consignment_reconciliation.sql`; las primeras seis deben devolver cero filas.

`0011_distributor_credentials.sql` agrega credenciales privadas e intenciones de acceso, permite membresías sin email, revoca las sesiones antiguas y agrega RPC administrativas y apertura de sesión. Crear cuentas o cambiar contraseñas es transaccional, auditado e idempotente: un HMAC estable de la intención permite reintentar con sal nueva sin guardar contraseñas en el historial. Listados de cuentas nunca devuelven el hash.

## Acceso y privacidad

El backend verifica usuario normalizado y contraseña con scrypt (N=16384, r=8, p=1, sal aleatoria de 16 bytes, derivación de 64 bytes y comparación constante), antes de emitir una cookie propia `ml_distributor`: HMAC con secreto independiente, HttpOnly, SameSite=Lax, Secure en producción y vigencia de ocho horas. La DB conserva únicamente el hash del identificador de sesión. Cada request valida sesión persistida, expiración, credencial, membresía y distribuidor activos. Logout y desactivación de membresía revocan acceso; cambiar contraseña revoca estas sesiones. La apertura de sesión revalida atómicamente el hash vigente bajo el bloqueo del distribuidor: una contraseña verificada antes de un reset no puede abrir una sesión después del reset.

El login comprueba Origin contra la URL canónica configurada. Los intentos se registran antes de autenticar en las RPC durables existentes de seguridad, con namespace propio: el décimo intento en 15 minutos bloquea durante 15 minutos. Un login exitoso limpia su contador. El guard falla cerrado cuando la base no responde.

No existe registro público. MatrixLab crea usuarios y restablece/suspende/reactiva accesos desde Accesos. El username es único y cada membresía pertenece a un distribuidor. `auth_user_id` conserva su nombre histórico, pero identifica al actor local y ya no requiere una identidad externa. Sólo las ventas propias están habilitadas para distribuidores, independientemente del rol histórico de la membresía. El portal no aparece en la navegación pública y sus páginas declaran noindex.

Las tablas tienen RLS, sin lectura directa de `anon`/`authenticated`. Las funciones nuevas revocan EXECUTE de PUBLIC y ambos roles públicos; sólo el backend `service_role` las utiliza después de los guards. Triggers comprueban distribuidor y relaciones de lotes/documentos. Ledger y auditoría rechazan modificación y borrado.

Páginas privadas dinámicas y noindex, respuestas de cuenta no-store, protección CSRF en mutaciones. La cámara sólo se permite en `/distribuidores/escanear`. CSP usa nonce en las rutas dinámicas. Se corrigió además la clasificación CSP de `/tienda`, que ya era dinámica. El polling de cuenta es cada 15 segundos en pestaña visible y al recuperar foco.

## Configuración y dependencias

| Variable | Uso |
| --- | --- |
| `CONSIGNMENTS_ENABLED` | Sólo el valor `true` habilita el módulo; default apagado. |
| `CONSIGNMENT_SESSION_SECRET` | Secreto aleatorio independiente, mínimo 32 caracteres. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Proyecto elegido por el servidor, nunca cliente. |
| `CONSIGNMENTS_SITE_URL` | URL canónica del entorno; fallback `NEXT_PUBLIC_SITE_URL`. |
| `ADMIN_ACCESS_PASSWORD`, `ADMIN_SESSION_SECRET` | Acceso MatrixLab existente. |

Los overrides privados evitan reutilizar valores públicos fijados al build cuando se prueba el servidor en otro entorno. No mezclar URL de un proyecto con claves de otro. Configurar HTTPS para el login y la cámara. El módulo no necesita correo, SMTP, tokens de recuperación ni anon key para autenticar distribuidores. No se editaron valores de `.env.local`. Por autorización del propietario, el 10 de octubre se instalaron 0009–0011 en el Supabase actual y se creó la cuenta real origami vacía; Vercel Production conserva el portal desactivado y ya tiene secreto de sesión sensible independiente. Ver `ORIGAMI_CUENTA.md` para el registro de preparación.

Runtime agregado: `jsqr`, `qrcode`. Desarrollo/pruebas: `pg`, `tsx`, tipos, `embedded-postgres`, Playwright. PostgreSQL de pruebas se ejecuta realmente en loopback, con clúster, puerto y contraseña generados. No recibe URL externa ni hace fallback a producción. El adaptador HTTP de pruebas emula sólo el transporte PostgREST; credenciales, derivación de contraseña, sesiones, operaciones y SQL son los reales. Queda pendiente validar el transporte con Supabase real sobre HTTPS.

## Límites y pendientes de liberación

- La respuesta de documentos está paginada, pero el snapshot SQL todavía materializa el histórico completo antes de filtrar en el backend; directorio/catálogo auxiliar limitados a 100 registros. Evaluar volumen y mover filtros/paginación al SQL para crecer. No hay prueba de carga de larga duración.
- La interfaz filtra historial por fechas e inventario por nombre/SKU; no incluye un filtro independiente por estado financiero. Los estados sí se muestran. La alta correctiva existe como comando API; la interfaz usa entregas para incrementar inventario.
- No se envía correo. El restablecimiento es administrativo y revoca sesiones. Esquema y alta reales ya preparados en el proyecto actual. Preview publicado y acceso admin configurado por autorización explícita del propietario; formulario admin comprobado en Edge. Siguen pendientes el flujo integral HTTPS autenticado y la liberación de Production. Ver `ORIGAMI_PREVIEW.md`.
- Se probaron Chromium desktop, viewport móvil y tres sesiones aisladas. La suite adicional prueba estados de permiso nativos y video de canvas; el dispositivo sintético nativo no está soportado en este Windows. Faltan Safari/iOS, cámara física y permisos en celular HTTPS, además de una revisión completa de teclado/lector de pantalla.
- Codex completó y validó la implementación iniciada por Claude. Las pruebas locales no acreditan un deployment HTTPS ni la cámara física de Origami.

Ver `ORIGAMI_TEST_REPORT.md`, `ORIGAMI_CODEX_VALIDATION.md` y `ORIGAMI_RELEASE_RUNBOOK.md`.
