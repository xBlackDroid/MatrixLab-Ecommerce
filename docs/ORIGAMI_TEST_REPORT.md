# Origami: reporte de pruebas

## Validación actual: lanzamiento y borrado de T-shirt Lab

Actualización posterior de recuperación admin: Production `dpl_5eH84FdKBNDYk9YAPZYS3Lj4fJLm`, mismo código `de1da7f`; contraseña nueva y firma admin renovada por elección del propietario. PASS real: login admin, cookie segura, Diseños con selección, directorio de Distribuidores, logout y sesión revocada rechazada. El bloqueo único coincidente con esta conexión se retiró sin cambiar la protección. La limitación de login productivo documentada abajo pertenece al estado anterior y está resuelta. No se efectuaron borrados autenticados ni operaciones de negocio.

Código `de1da7fae61981f3449cab4109c938b25b028fb4`, Production READY `dpl_CJ5cuGUkvKPizepbsGjUMBPdiMCx`; Preview READY `dpl_GcfNmLbiRTqzDVKEefLLXdBYB9HM`. PASS: build, type-check, lint de archivos modificados, regresión 16/16, suite de borrado PostgreSQL/Storage, E2E de borrado móvil 320/390/430 px y 14 controles HTTP de Origami en Production.

Supabase real: fixture exclusiva de borrado parcial/completo, original restante conservado, composiciones antiguas retiradas, cero filas/objetos pendientes al terminar. Se verificaron las funciones SQL instaladas y sus permisos. Auditoría de rutas existentes: 29 diseños, 43 archivos, 136 rutas compatibles; sólo lectura. En el Preview final se autenticó admin y se verificaron controles sobre los datos reales, sin confirmar borrados. DELETE anónimo en Production rechazado con 401.

La contraseña administrativa previa de Production se conservó; la del Preview no permite autenticar allí y Vercel no devuelve el secreto sensible en lectura. El admin autenticado en Production y la cámara física no se acreditan con estas pruebas. Una solicitud DELETE autenticada productiva de prueba fue bloqueada por revisión automática y retirada, sin ejecutarla. Ver detalles y evidencia en `ORIGAMI_PRODUCCION.md` y `TSHIRT_LAB_BORRADO.md`.

## Validación previa: inventario y usuarios por perfil

11 de octubre de 2026. Código `07337baf8b4689f69952b550bfc62a5851e2daf2`. PASS final: build, type-check, lint:consignments y E2E, todos con exit 0. El primer build dentro del sandbox falló por EPERM al crear archivos temporales de `.next`; el build final con permisos de ejecución adecuados pasó. No se cambian APIs, SQL, cálculos ni credenciales de distribuidores.

E2E: directorio con enlaces individuales por distribuidor; Entregas y Accesos abren la sección correcta, incluida recarga; crear distribuidor abre Piezas con stock cero y sin usuarios; una ficha no es visible al operador hasta confirmar la entrega; la pieza entregada aparece para Origami y su usuario auxiliar, y permanece ausente para el distribuidor B. Continuaron pasando ventas, abonos, reintentos idempotentes, controles restringidos y aislamiento. Admin se comprobó a 320/390/430 px en directorio y contenido del workspace, con controles ≥44 px y campos ≥16 px. Se inspeccionaron las capturas móviles con datos sintéticos. No se repitieron cámara, dominio, DB o regresión global porque sus flujos no cambiaron.

Preview `dpl_6FnNT9V9Dzg3Jc6cCDzHaxufsfo6`, READY, proyecto MatrixLab y entorno Preview comprobados; build remoto y tipos aprobados. En Edge con la sesión Vercel habitual se autenticó realmente el admin, se abrió el directorio, el inventario de Origami, sus usuarios (cuenta origami activa) y la captura de entrega con cantidad/costo/sugerido. Sólo se consultaron formularios y datos, sin confirmar operaciones de negocio. Esto acredita login y lectura admin en HTTPS; no acredita todavía el harness integral de cookie/Origin/CSRF/no-store, mutaciones reales o cámara física. Recibo `.consignment-tests/origami-distributor-inventory-validation.json`.

Incidencia de publicación resuelta: una exportación sin `.vercel` creó accidentalmente el proyecto Vercel `source`. Se retiró el deployment y, con autorización explícita del propietario, se eliminó el proyecto temporal. El alias de Origami no se asignó a ese candidato y Production de MatrixLab no cambió. El runner ahora valida IDs de proyecto/equipo/alias y fija el enlace en la exportación antes de ejecutar el CLI. Evidencia `.consignment-tests/origami-preview-project-correction.json`.

## Validación previa: diseño móvil

11 de octubre de 2026. Código `16ba712f6f6f8722e2e3ac91f7ab28f30df9f27d`, diseño inicial de Claude `697dabf`. Claude aplicó la skill suministrada `redesign-existing-projects` sobre copias aisladas y no ejecutó tests ni desplegó; Codex revisó, integró, corrigió detalles y ejecutó las comprobaciones.

PASS: build, type-check, lint:consignments y E2E definitivos, todos con exit 0. La automatización de cámara pasó sobre el mismo `Scanner.tsx`; los ajustes posteriores fueron de CSS y pruebas de presentación, sin cambiar adquisición/cancelación/lectura de cámara. No se repitieron dominio, SQL, provisioning o regresión global porque sus flujos/dependencias no cambiaron.

- Chromium con contexto táctil y reducción de movimiento: 320/360/390/430 px y tablet 768. Cero scroll horizontal; botones, enlaces, desplegables y campos visibles de al menos 44 px; inputs/selects de 16 px o más.
- Navegación visible de tres secciones y selección aria-current. Los rectángulos de texto confirman nombres completos en una sola línea; la revisión visual de 320 px encontró y corrigió palabras partidas antes del resultado definitivo.
- Logo cargado, mostrar/ocultar contraseña sin enviar el formulario, costes/sugerido separados y un único «Por pagar». Costos comerciales no presuponen siempre piezas: se conserva la unidad de cada ficha.
- Venta tres unidades → saldo $300; abonos $150/$150 → $150/$0, manteniendo stock $700. Reintento tras pérdida de respuesta después de COMMIT sin duplicado, aislamiento de tres cuentas, ausencia de controles administrativos para Origami, alta gradual y acceso auxiliar aprobados.
- Nombres largos y SKU de 60 caracteres envuelven sin overflow en 320 px. Sin errores de página. Los handlers principales de Workspace, Scanner y confirmación de AccessPanel se compararon estructuralmente sin diferencias.
- Cámara: permiso sólo clic, denegación/concesión, alternativa manual, permiso tardío cancelado con tracks cerrados, QR en video de canvas y ninguna venta automática. Backend de dispositivo sintético nativo de Windows no soportado; captura física/iOS no acreditada.

Primera ejecución E2E abortó porque la etiqueta e importe de revisión de venta ahora son nodos separados; el locator se adaptó y verifica la misma cifra $300. No se cambiaron cálculos para hacer pasar pruebas. Las capturas se tomaron desde el inicio para evitar artefactos de sticky en imágenes de página completa. Se inspeccionaron login, inventario, venta, scanner, cuenta y contenido largo en `.consignment-tests/screenshots/`. Son fixtures locales; no se escribieron datos en el Supabase real, que conserva el ejemplo autorizado Lego Calabaza.

Preview y restricciones remotas en `ORIGAMI_PREVIEW.md`. Production sigue apagada. No se acredita todavía login integral HTTPS ni cámara física.

Habilitación admin posterior (11 de octubre): el propietario autorizó expresamente transmitir a Vercel Preview la contraseña administrativa existente de MatrixLab. Se desplegó el mismo código `16ba712` con esa contraseña y un secreto de sesión admin nuevo e independiente, conservando la configuración Supabase existente. Candidato `dpl_21KkmYhdpgdgpByLg5dvFhqQAwKi` confirmado READY/Preview; build remoto y tipos aprobados, alias de prueba asociado correctamente. En Edge con la sesión de Vercel del propietario, `/admin/login` ya muestra el formulario de contraseña y no el bloqueo de configuración. No se autenticó una sesión admin real ni se crearon operaciones de negocio; esta comprobación no acredita el flujo integral HTTPS. No se cambiaron código, Production ni los permisos de Origami. Recibo: `.consignment-tests/origami-admin-preview-validation.json`.

## Dato de ejemplo autorizado en Supabase actual

11 de octubre de 2026, posterior a las pruebas y por petición expresa del propietario: se creó Lego Calabaza y se confirmó cantidad **1 pieza como ejemplo**, costo $50 MXN y sugerido $60 MXN. La entrega administrativa `ENT-1` usa una clave idempotente y referencia de ejemplo. Snapshot real del operador acredita una pieza visible, valor del stock $50 y por pagar $0. No se registraron ventas ni pagos; huella de IDs/existencias de las 424 variantes online antes/después idéntica. Recibo: `.consignment-tests/origami-lego-calabaza-example.json`. No se modificó el código ni se desplegó/activó Production. Esta carga solicitada en la cuenta compartida no se atribuye al harness de tests ni acredita entrega física. Los resultados de alta vacía siguientes corresponden al estado inicial del 10 de octubre.

## Validación previa: saldo único y logo del login

Fecha: 11 de octubre de 2026. Código probado `36ee82fc39922ac44c5732c46346df102a9c9246`.

PASS: build, type-check, lint:consignments y test:consignments:e2e. El primer build en sandbox falló con EPERM al crear una carpeta de `.next`; se repitió con permisos y terminó con exit 0. No se cambiaron permisos de negocio, cálculos, SQL, sesiones ni dependencias; no se repitieron suites ajenas a la presentación modificada.

- Admin y Origami ven cuatro indicadores: piezas disponibles, valor del stock a costo, pagos y un único saldo «Por pagar». «Deuda por ventas» y «Pendiente de pago» ya no aparecen.
- Chromium móvil verificó saldo $0 inicial, $300 tras vender tres piezas, $150 tras el primer abono y $0 tras el segundo. La valoración permanece $700 después de vender y pagar.
- El resumen de cada venta muestra sólo «Por pagar»; el detalle conserva total a MatrixLab y pagado. Origami sigue sin controles administrativos.
- El login carga el logo existente de MatrixLab Stickers con dimensiones naturales no nulas. Login y cuenta sin overflow ni errores de página. Capturas inspeccionadas: `.consignment-tests/screenshots/origami-login.png` y `origami-mobile.png`, con datos sintéticos locales.
- La suite completa E2E conservó venta/reintentos, aislamiento de tres cuentas, alta gradual y gestión de acceso. Ninguna operación creó datos en Supabase real.

Preview actualizado desde este commit: `dpl_HtaUV2VNhAMAnReqGDFgZZvDNNes`, READY, build remoto y tipos PASS; alias existente asociado. GET de login/cuenta/home: 302 a SSO de Vercel. No acredita aún login integral HTTPS ni cámara física. Estado y restricciones en `ORIGAMI_PREVIEW.md`. Production permanece apagada.

## Validación previa: stock valorado y pagos a MatrixLab

Fecha: 11 de octubre de 2026. Código probado `ea76df795f77b5a2a08f4620e8480e5a915947f7`.

PASS: build, type-check, lint:consignments, test:consignments, test:consignments:db, test:consignments:security y test:consignments:e2e. Se ejecutaron después del cambio; no son resultados atribuidos a Claude. Ninguna prueba creó documentos en Supabase real.

- La tarjeta «Valor del stock a costo» sustituye «Crédito disponible» para admin y Origami. Costos por lote, sugerido y total físico son conceptos distintos.
- En PostgreSQL aislado: entrega 10 a costo $100 muestra $1,000 y deuda cero; vender 3 a público $170 deja stock $700 y pendiente $300; dos abonos de $150 liquidan sin alterar stock $700. Devolución vendible repone $100 al valor físico. FIFO mantiene los costos de las unidades restantes.
- En dominio: varios lotes/centavos exactos, lotes consumidos no suman, pagos/saldos a favor no alteran valor, totales cacheados no sustituyen la valoración y cantidades negativas/desbordamiento se rechazan. CSV indica pagos a MatrixLab e incluye el valor actual del stock.
- En navegador móvil: costo $100, sugerido $180, tarjeta $1,000 → $700 tras venta, $700 tras abonos, pagos a MatrixLab $300 y pendiente $0. Origami no ve «Pagos recibidos», «Crédito disponible» ni controles administrativos.
- Seguridad: operaciones administrativas de Origami rechazadas, aislamiento, CSRF, cookies, no-store, CSV, reintentos/revocación y flag false aprobados. Seis conciliaciones de DB sin inconsistencias.

Se inspeccionó `.consignment-tests/screenshots/origami-mobile.png` con datos sintéticos: 7 piezas, valor $700, pagos a MatrixLab $300 y pendiente $0. La corrección no requiere migración ni cambios en contraseñas/cuentas. Preview actualizado a `dpl_7q1aSS55ntdp1LQ2g5s5BrweTArR`, READY, código `ea76df7`, build remoto y tipos PASS. Alias asociado y GET de login/cuenta/home comprobados: 302 a SSO de Vercel. No se acredita todavía el login integral HTTPS ni cámara física. Ver `ORIGAMI_PREVIEW.md`.

## Validación previa: acceso por usuario y contraseña

Fecha: 10 de octubre de 2026. Código probado: `4b203d56d3021a68333c554b9d04d9a7e8b8ba71`, rama `codex/origami-consignaciones`. Este reporte sustituye el login por correo de la entrega anterior. Documentación agregada después sin cambiar ese código.

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | PASS, exit 0, Next 15.5.27, rutas privadas dinámicas y nueva API de cuentas. |
| `npm run type-check` | PASS, exit 0. |
| `npm run lint:consignments` | PASS, exit 0, sin errores ni advertencias. |
| `npm run test:consignments` | PASS: dinero entero, entradas estrictas, sesiones, CSV y generación/lectura QR. |
| `npm run test:consignments:db` | PASS: 11 migraciones reales, FIFO, transacciones, pagos/devoluciones/créditos, concurrencia, rollback, seis consultas sin divergencias y privilegios públicos revocados, incluidas credenciales. |
| `npm run test:consignments:security` | PASS: Origami no administra inventario/pagos/accesos; aislamiento, cookie/CSRF/Origin, logout/revocación, reinicio idempotente, bloqueo durable, enlace ausente de homepage, noindex y flag apagado. |
| `npm run test:consignments:e2e` | PASS: login real por usuario y contraseña desde móvil, admin/Origami/B separados, venta y dos abonos, respuesta perdida después de COMMIT, ficha privada invisible hasta entrega, alta de operador desde Accesos y login con esa cuenta. Sin errores de página ni overflow móvil. |
| `npm run test:consignments:provision` | PASS: scrypt real y sal aleatoria, alta sin email, cuenta nueva sin piezas, reintento sin duplicados, reinicio idempotente, rechazo de cambio de payload con misma clave, hashes ausentes del listado, reset/suspensión/reactivación, sesiones anteriores cerradas y verificación anterior al reset rechazada al abrir sesión. Stock sin cambios, bitácora sin contraseña, roles públicos sin acceso. |
| `npm run test:consignments:camera` | PASS de automatización: permiso Chromium denegado/concedido, fallback, video de canvas con QR, cancelación tardía y tracks detenidos. Captura física NO acreditada: backend sintético nativo de este Windows devuelve NotSupportedError. |
| Dry-run de `npm run provision:origami` | PASS: usuario origami, proyecto/HTTPS explícitos; sin contraseña, DB remota ni correo. |
| `npm run test:regression` | PASS: 16/16 suites previas. |
| `git diff --cached --check` | PASS antes de guardar implementación. |

Las suites HTTP/navegador arrancan Next.js de producción contra PostgreSQL 18.4 aislado en loopback. El transporte PostgREST es un adaptador de pruebas; se retiró el proveedor de Auth sintético porque ahora las cuentas y las contraseñas se verifican realmente en el backend. No hay fallback a DB remota ni usuarios/pagos reales. Se ejecutaron los comandos fuera del sandbox con aprobación automática para los procesos de PostgreSQL/Chromium y lectura de dependencias.

Se corrigió una fixture que usaba un slug de un carácter frente a la validación mínima de dos; el último resultado de alta es PASS. No se debilitó la validación para hacer pasar la prueba. Las pruebas fallan con exit 1 si una aserción falla.

La auditoría de dependencias del lockfile conservado registra cero avisos de runtime y cinco altos de herramientas de lint (cadena que termina en braces 3.0.3 sin parche publicado en [el aviso primario](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)). No se añadieron dependencias para las contraseñas: se utiliza node:crypto. La actualización previa a Next 15.5.27 y sus parches queda conservada.

## Instalación y validación remota autorizadas

La primera consulta encontró products disponible y las tablas nuevas ausentes (404/PGRST205). Después el propietario autorizó el Supabase actual, manteniendo el portal apagado, y completó la autenticación del dashboard. El 10 de octubre se instalaron 0009–0011 mediante el editor SQL en una transacción. No se usó el endpoint REST para instalar SQL ni se editaron valores de `.env.local`.

| Comprobación real | Resultado |
| --- | --- |
| Esquema y RPC nativas | PASS: tablas y funciones instaladas en spgrjhlwmyjfwiwsqgvn. |
| Cuenta operativa | PASS: origami, sin email, una membresía activa de operador; contraseña indicada verificada con scrypt contra el hash real. |
| Alta vacía | PASS: cero piezas, ventas, pagos y sesiones abiertas. |
| Stock online | PASS: 424 variantes; fingerprints de IDs y existencias antes/después idénticos. |
| Seis conciliaciones | PASS: cero inconsistencias en inventario, saldos, costos, líneas y aplicaciones. Sin datos financieros sintéticos en el destino. |
| RLS y privilegios | PASS en SQL real: cero tablas privadas sin RLS, cero permisos SELECT privados y cero permisos EXECUTE de funciones consignment para anon/authenticated. |
| API pública | PASS: lectura de credenciales y RPC administrativas rechazadas por Supabase real. |
| Configuración Vercel Production | PASS: flag false y secreto de sesión independiente sensible configurados; sin despliegue. |

Recibos sin contraseña/hash en `.consignment-tests/access-spgrjhlwmyjfwiwsqgvn-origami.json`, `origami-setup-plan.json`, `origami-remote-validation.json`; captura `screenshots/origami-supabase-validation.png`. La referencia de stock anterior es una comparación de existencias, no un respaldo completo. No hubo push, merge, despliegue ni activación productiva. El default del módulo permanece apagado.

Primer Preview del 10 de octubre solicitado por el propietario: deployment `dpl_nztgJ1CsknbfCPpoAx2emgZT76bZ`, READY, commit 66fb43a (código igual a 4b203d5), build remoto y tipos PASS. Flag true sólo en ese deployment y origen del alias registrado. Vercel Authentication conservada: HTTP login/cuenta/home respondieron 302 a SSO; el navegador mostró el login de Vercel. Las comprobaciones integrales del módulo HTTPS y hardware no se declaran PASS. Admin del Preview aún sin configuración autorizada. Claude revisó esa preparación; Codex realizó el despliegue. Fue sustituido en el alias por el candidato del 11 de octubre descrito al inicio. Ver `ORIGAMI_PREVIEW.md`.

## Evidencia y reproducción

Capturas locales ignoradas: `.consignment-tests/screenshots/admin.png`, `origami-mobile.png`, `admin-delivery.png`, `origami-inventory.png` y `admin-access.png`. Se inspeccionó visualmente la pantalla de Accesos. Los importes y usuarios con TEST/Fixture son exclusivamente de prueba.

Primero instalar dependencias del lockfile y ejecutar build. Después ejecutar las seis suites test:consignments y test:regression indicadas en la tabla. Para setup usar las instrucciones de ORIGAMI_CUENTA.md. Nunca usar fixtures como datos productivos.

El alta, snapshot y permisos públicos se verificaron ya contra Supabase real. Falta la prueba integral de login/cookies/Origin/CSRF sobre el despliegue HTTPS y la cámara del celular de Origami; registrar evidencia antes de activar producción. Ver ORIGAMI_CODEX_VALIDATION.md y ORIGAMI_RELEASE_RUNBOOK.md.

## Reporte histórico de la primera entrega

Fecha: 10 de octubre de 2026. Rama `codex/origami-consignaciones`.
Snapshot de código probado y guardado: `b22fd9e44d4500598b0d6c6170bd98dc015b8cce`.
Base anterior: `5f2052af4cbd7609fcf3c9c643c1298928209518`.

Las ejecuciones corresponden al árbol de implementación que quedó en ese commit; los documentos de reporte se agregan después, sin cambiar código. Se ejecutaron localmente por Codex; no son resultados atribuidos a Claude. Windows, Node `v24.16.0`, npm `11.13.0`, Next `15.5.20`, PostgreSQL embebido 18.4 y Chromium headless de Playwright. Fixture sintético, sin operaciones ni correos reales.

## Resultado de comandos

| Comando | Resultado final |
| --- | --- |
| `npm run type-check` | PASS, exit 0. Ejecutado después del build. |
| `npm run lint:consignments` | PASS, exit 0, sin errores ni advertencias. |
| `npm run test:consignments` | PASS, exit 0: dinero, validaciones, tokens, CSV y decoder QR real. |
| `npm run test:consignments:db` | PASS, exit 0: migraciones reales, operaciones, concurrencia y conciliación. |
| `npm run test:consignments:security` | PASS, exit 0: servidor Next real, guards, login, cabeceras, reinicios y flag. |
| `npm run test:consignments:e2e` | PASS, exit 0: dos contextos independientes, móvil/escritorio, pagos y respuesta perdida. |
| `npm run test:regression` | PASS, exit 0: 16/16 suites existentes. |
| `npm run build` | PASS, exit 0: compila y genera las rutas nuevas dinámicas. |
| `git diff --cached --check` | PASS antes de guardar la implementación. |
| `npm audit --json` | NO PASS: 12 avisos; ver baseline abajo. |

El build omite lint por configuración previa del proyecto. Por eso se ejecutó ESLint por separado. `npm run lint` sigue usando el comando previo `next lint`, incompatible con esta versión. El runner nuevo desactiva únicamente la regla del plugin Next `no-styled-jsx-in-document`, incompatible con la API de ESLint 9; las demás reglas de los archivos del módulo se ejecutan.

También pasó ESLint sobre los archivos de integración modificados, con exit 0 y sin advertencias:

```powershell
npx eslint next.config.ts src/middleware.ts src/lib/security/env.ts src/components/admin/AdminLayout.tsx src/components/admin/AdminNav.tsx scripts/qa/tumbler-ready.test.ts scripts/qa/run-regression.mjs --rule '@next/next/no-styled-jsx-in-document: off'
```

## Evidencia financiera y de inventario

- Entregar 10 a costo $100 deja stock 10, deuda cero y stock online 99 intacto.
- Vender 3 a $170 deja stock 7, importe público $510 y deuda $300; reintento concurrente conserva un documento.
- Dos pagos de $150 liquidan la venta, sin cambiar stock.
- Devolver una pieza deja stock 8, deuda neta $200, pagos recibidos $300 y crédito $100.
- Nueva venta de una pieza y aplicación de ese crédito liquidan $100 sin crear otro recibo.
- FIFO 2 unidades a $100 y 1 a $120 genera deuda $320.
- Dos conexiones compiten por la última pieza: una venta confirmada. Dos devoluciones no exceden cantidad vendida. Dos aplicaciones no gastan el mismo crédito.
- Fallar la segunda línea de una entrega revierte todos sus cambios. Venta multilínea insuficiente y fingerprint antiguo no escriben documentos parciales.
- Cambiar nombre, SKU y sugerido preserva exactamente las líneas históricas. Un pago explícito a dos ventas aplica los importes correctos.
- Retorno no vendido y merma no generan deuda; entrega consumida no puede revertirse. Anulaciones preservan sus documentos.
- Las seis consultas de inconsistencias en `consignment_reconciliation.sql` devuelven cero filas; ningún rol público obtiene privilegio SELECT sobre tablas privadas.

## Cobertura de la especificación

| IDs | Evidencia automatizada | Alcance pendiente |
| --- | --- | --- |
| T01–T03 | DB: entregas, reposición, venta simple/multilínea y FIFO. | Smoke con datos y entorno reales de staging. |
| T04–T08 | Dominio/DB/HTTP: entradas estrictas, insuficiencia, última pieza, rollback, intención concurrente y reinicio. | Latencia/fallos de plataforma reales. |
| T09–T15 | DB: pagos parciales/total/multiventas, crédito, carreras, anulaciones, retorno, merma y devolución. | Revisión operativa con MatrixLab. |
| T16–T18 | DB/HTTP: IDs ajenos, roles, CSRF, cookies, firma manipulada, revocación, bloqueo durable. | Auth real, recuperación, logout y expiración de proveedor en staging; B en navegador. |
| T19 | QR generado y decodificado con jsQR; manual/SKU en E2E sin descontar al leer; código ajeno rechazado. | Lector físico y QR con cámara de celular. |
| T20 | Permissions-Policy y CSP/nonce comprobados por HTTP real. | Cámara física HTTPS, permiso denegado y Safari/iOS. |
| T21–T22 | E2E: respuesta abortada después del COMMIT, reintento con un solo documento; otro contexto ve venta en hasta 20 s. | Cortes reales y tiempos en hosting de staging. |
| T23 | Dominio/DB: CSV, saldo inicial/final, zona local, fórmulas neutralizadas e histórico conservado. | Conciliación manual de CSV en hoja de cálculo. |
| T24 | HTTP: flag false bloquea páginas/APIs, no-store, cuenta ajena no exportada. Separación server-only. | Revisión de bundles/secretos del deployment final y caché de plataforma. |
| T25 | E2E 390×844 y 1440×1000, entrega/venta/abono/liquidación, sin overflow horizontal ni errores JS. | Auditoría completa de teclado/lector de pantalla. |
| T26 | 10 migraciones en clúster nuevo con producto/variante/carrito insertados antes de las nuevas; 16 suites previas y build. | Migración real de Supabase de staging, compra/webhook con sandbox y humo completo. |
| T27–T29 | Catálogo público con stock y Origami vacío; ficha privada oculta hasta entrega; alta gradual, pieza sin variante y permisos. | Validar carga inicial real contra las piezas físicamente entregadas. |

No se declara T01–T29 completamente aprobado: hay comprobaciones de hardware, proveedor, plataforma y revisión independiente pendientes.

## Capturas y reproducción

E2E genera en `.consignment-tests/screenshots/`: `admin.png`, `origami-mobile.png`, `admin-delivery.png`, `origami-inventory.png`. Se inspeccionaron las capturas de escritorio/móvil; muestran deuda/pagos/saldos y estados legibles. Son fixtures locales, no inventario real. El directorio de artefactos está ignorado por Git.

Desde una instalación nueva:

```powershell
npm ci
npx playwright install chromium
npm run test:consignments
npm run test:consignments:db
npm run build
npm run type-check
npm run lint:consignments
npm run test:consignments:security
npm run test:consignments:e2e
npm run test:regression
```

El bootstrap crea un PostgreSQL nuevo en `.consignment-tests/pg-*`, loopback y contraseña aleatoria, aplica migraciones y detiene el proceso al terminar. Conserva archivos locales de clúster para diagnóstico. Requiere capacidad de iniciar procesos locales y espacio en disco. HTTP/E2E usan el build existente de Next; no ejecutar build y type-check simultáneamente porque Next recrea `.next/types`.

El proveedor Auth del harness es sintético, mientras las transacciones SQL son reales. Toda configuración remota se reemplaza por el gateway local al iniciar el servidor de pruebas; no usa `.env.local` como destino de fixtures. No hay Mercadopago real en estas pruebas.

Salida final sanitizada de integración:

```text
PostgreSQL aislado: 10 migraciones aplicadas.
T06: última pieza, dos conexiones, una venta
T15: dos devoluciones simultáneas no exceden lo vendido
T11: el mismo crédito no se utiliza dos veces
T02/T09/T14/T16/T23: multilínea, pago a dos ventas, retorno, IDs ajenos y snapshots inmutables
Reconciliación: seis consultas sin divergencias y privilegios privados revocados.
```

Salida final sanitizada de seguridad y navegador:

```text
T07: idempotencia permanece tras reiniciar el servidor Next
T20: cabeceras reales de cámara/CSP
T18: revocación de membresía bloquea la siguiente petición
T18: bloqueo de intentos persistente tras reiniciar Next
T24: flag apagado bloquea páginas y APIs
T19/T22/T25: móvil/escritorio, dos sesiones, venta → abonos → liquidación, captura manual sin descuento
T21/T27/T28: respuesta perdida después de COMMIT y alta gradual privada hasta confirmar entrega
16/16 suites previas aprobadas.
```

## Baseline, fallos corregidos y dependencias

La regresión inicial de `tumbler-ready.test.ts` esperaba dos tarjetas que el commit base `5f2052a` había retirado intencionalmente. Se actualizó la expectativa y se agregaron aserciones que conservan sus definiciones. No se modificó ese comportamiento de la tienda.

Durante esta validación se corrigieron: referencias de variables y tipos de registro PL/pgSQL, formato UTF-8 del clúster Windows, origen/variables públicas fijadas al build, firma completa de RPC de bloqueo de login, lectura del bloqueo previo, y diseño de botones móviles. Se volvieron a ejecutar los controles afectados; los resultados finales anteriores sustituyen esos intentos fallidos.

Auditoría actual y auditoría del lockfile en HEAD anterior: ambas reportan 1 moderada, 10 altas y 1 crítica, total 12, sobre los mismos paquetes. Afectados: `@next/eslint-plugin-next`, `brace-expansion`, `braces`, `eslint-config-next`, `fast-glob`, `js-yaml`, `micromatch`, `nanoid`, `next`, `postcss`, `sharp`, `source-map-js`. `next` figura crítico y directo. No se ejecutó una actualización masiva ajena al módulo; hace falta evaluar y corregir estos avisos antes de producción. La coincidencia de baseline no es una aprobación de seguridad.

Evidencia local conservada: `.consignment-tests/npm-audit.json` y `.consignment-tests/baseline-audit.json`; baseline construido con package/lock del commit anterior y `npm audit --package-lock-only` en un directorio de pruebas. No se almacenaron secretos en los reportes.
