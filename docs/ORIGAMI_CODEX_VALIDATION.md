# Origami: validación de Codex

Fecha: 11 de octubre de 2026. Rama `codex/origami-consignaciones`.
Código actual probado: `07337baf8b4689f69952b550bfc62a5851e2daf2`. Diseño móvil previo: `16ba712`; diseño inicial de Claude: `697dabf`; simplificación previa: `36ee82f`; valoración previa: `ea76df7`; alta nativa previa: `4b203d5`.
Base: `5f2052af4cbd7609fcf3c9c643c1298928209518`.

## Resultado

Gestión por perfil: directorio con enlaces visibles a Inventario, Entregas y Usuarios, alta que abre Piezas, y guía para asignar stock y vincular usuarios. PASARON build, tipos, lint y E2E: rutas/recarga, nuevo distribuidor vacío, entrega visible sólo al perfil correcto y acceso auxiliar que comparte ese inventario. Se inspeccionó móvil. En el Preview `dpl_6FnNT9V9Dzg3Jc6cCDzHaxufsfo6` se autenticó realmente el admin en Edge y se consultaron inventario, cuenta origami activa y formulario de entrega; no se confirmaron operaciones de negocio. No cambian permisos, SQL, APIs ni cálculos. Detalle y límites actuales en `ORIGAMI_TEST_REPORT.md` y `ORIGAMI_PREVIEW.md`; las notas remotas siguientes son históricas cuando indican que el login admin aún no se había probado.

Diseño móvil solicitado posteriormente: Claude aplicó la skill suministrada y modificó sólo copias de UI; Codex integró y corrigió contraste, controles de contraseña, unidades comerciales, cabecera, offset de admin y navegación estrecha. Pasaron build, tipos, lint y E2E definitivos; cámara automatizada pasó con el mismo Scanner sin cambios posteriores de lógica. Chromium táctil comprobó 320/360/390/430 px y tablet 768, objetivos ≥44 px, campos ≥16 px, nombres de navegación completos, textos/SKU largos sin overflow, venta/abonos y roles conservados. Se inspeccionaron capturas locales. Sin cambios de cálculos, APIs, SQL, dependencias ni datos reales; el ejemplo Lego Calabaza se conserva. Evidencia: `ORIGAMI_DISENO_MOVIL.md` y `ORIGAMI_TEST_REPORT.md`.

Simplificación posterior del propietario: se quitaron las tarjetas «Deuda por ventas» y «Pendiente de pago», dejando un único «Por pagar» junto a piezas, valor del stock y pagos. El resumen de cada venta también muestra un solo saldo; el detalle conserva los importes originales. El login lleva el logo existente de MatrixLab Stickers. En el commit previo 36ee82f pasaron build, type-check, lint:consignments y E2E: logo cargado, saldo $300 → $150 → $0 con abonos, stock $700 sin cambio al pagar, móvil sin overflow y permisos/aislamiento conservados. Se inspeccionaron ambas capturas locales. Sin cambios de cálculo, backend, SQL ni dependencias.

Corrección confirmada por el propietario el 11 de octubre: Origami paga a MatrixLab y sólo admin registra esos pagos. «Valor del stock a costo» sustituye la tarjeta «Crédito disponible» y suma cantidad disponible por costo contractual de cada lote. El sugerido y los pagos no intervienen en esa valoración. El historial y CSV expresan pagos de Origami a MatrixLab. No requirió migraciones ni cambios en la cuenta real o datos de negocio.

En `ea76df7` se ejecutaron y aprobaron build, type-check, lint:consignments y las cuatro suites afectadas: dominio, PostgreSQL, seguridad y E2E. El ejemplo en DB aislada/navegador acredita entrega 10 × $100 = $1,000 de stock, venta 3 = $700 de stock/$300 pendientes y dos abonos de $150 = deuda pendiente cero/stock $700. FIFO conserva el costo de los lotes que quedan, y una devolución vendible repone su costo original. Centavos exactos y rechazo de desbordamientos comprobados.

Implementación, validación automatizada local, instalación del esquema y alta operativa de Origami terminadas. **Producción aún no aprobada ni activada**: falta validar el despliegue candidato por HTTPS y comprobar cámara física. El propietario autorizó el Supabase actual con el portal desactivado.

Se incorporó la instrucción final del propietario: username `origami`, contraseña sin correo, portal accesible por enlace directo y modelo para futuros distribuidores. La cuenta nativa se verificó con scrypt real en servidor, sesiones revocables y membresía/credencial vigentes en cada request. MatrixLab crea, restablece, suspende y reactiva cuentas. Los hashes y contraseñas no aparecen en listados, bitácora ni recibos.

Origami sólo consulta su inventario/estado de cuenta y confirma ventas propias. Las operaciones administrativas de piezas, ajustes, entregas, pagos, crédito, anulaciones y accesos fueron rechazadas por HTTP sin cambiar stock ni dinero. El servidor deriva el distribuidor de la sesión; IDs externos no cambian su cuenta. El QR agrega al borrador y la confirmación descuenta transaccionalmente.

El inventario inicia vacío y crece únicamente con las fichas/entregas que MatrixLab confirma. No copia stock online. Los costos históricos, FIFO, pagos, devoluciones, crédito, concurrencia y reintentos se verificaron con PostgreSQL real. Seis consultas de conciliación sin divergencias; anon/authenticated sin lectura ni ejecución de operaciones privadas.

El login y alta adicional desde Accesos se probaron en navegador. Se probó aislamiento de MatrixLab, Origami y B; móvil sin overflow; ventas, abonos, entrega gradual, respuesta perdida después de COMMIT y un único documento tras reintentar. Reset y suspensión cierran sesiones, la contraseña anterior deja de servir y una verificación anterior al reset no puede abrir una sesión nueva después.

La cámara solicita permiso sólo por acción del usuario, sin audio. Se comprobó permiso denegado/concedido, fallback manual, lectura de QR en video de canvas y cancelación tardía deteniendo tracks. El backend de dispositivo sintético nativo no está soportado en este Windows; esa limitación no acredita captura física. Falta prueba de celular sobre HTTPS.

En la entrega nativa anterior (4b203d5) pasaron build, tipos, lint, seis suites del módulo y 16/16 suites previas. Cada corrección se verificó con las comprobaciones afectadas enumeradas arriba; no se repitieron cámara, provisioning ni la regresión global porque no cambiaron sus flujos ni dependencias. La auditoría previa del lockfile conservado tiene cero avisos de runtime; quedan cinco altos de herramientas de lint. Evidencia y límites: ORIGAMI_TEST_REPORT.md.

Claude inició la estructura/migración 0009 y posteriormente implementó el diseño móvil. Codex completó el módulo, revisó e integró el diseño y ejecutó las pruebas. Estos resultados son la revisión técnica local de Codex; no se atribuyen a tests ejecutados por Claude ni acreditan el flujo integral del Preview remoto.

## Pendiente externo concreto

| Pendiente | Evidencia y cierre |
| --- | --- |
| Destino e instalación SQL | CERRADO: 0009–0011 instaladas en transacción en spgrjhlwmyjfwiwsqgvn, editor SQL autenticado. Seis conciliaciones sin inconsistencias, RLS en todas las tablas privadas, sin SELECT ni EXECUTE privados para anon/authenticated. |
| Cuenta operativa Origami | CERRADO: username origami creado sin email, contraseña indicada verificada, una membresía activa de operador. Alta inicial vacía el 10 de octubre. El 11 se agregó, por solicitud expresa, una pieza de ejemplo Lego Calabaza a costo $50/sugerido $60, entrega ENT-1; valor $50/por pagar $0, sin ventas ni pagos. Las 424 variantes online permanecen intactas. |
| Supabase y HTTPS | REST/RPC reales comprobadas para alta, snapshot vacío y denegación de acceso público. Falta validar login/cookie/Origin/CSRF/no-store y ecommerce en el despliegue candidato HTTPS. |
| Cámara física | Probar permiso y QR en el celular/navegador de Origami, fallback y cierre de transmisión. |

El propietario confirmó el proyecto actual y completó la autenticación del dashboard. El esquema y la cuenta real ya están preparados. Vercel Production tiene `CONSIGNMENTS_ENABLED=false` y un secreto de sesión independiente y sensible. Por solicitud posterior se desplegó el candidato en Preview con flag true sólo en ese deployment: build remoto aprobado y Vercel Authentication conservada. El propietario autorizó expresamente transmitir la contraseña admin local existente a ese Preview; candidato `dpl_21KkmYhdpgdgpByLg5dvFhqQAwKi` confirmado READY con secreto admin nuevo e independiente y alias actualizado. En Edge con la sesión Vercel del propietario, `/admin/login` muestra el formulario habilitado; consultas HTTP anónimas conservan la redirección a SSO. No se autenticó una sesión admin ni se realizaron operaciones de negocio durante esta habilitación, por lo que el flujo integral HTTPS sigue pendiente. Ver `ORIGAMI_PREVIEW.md`. No se editaron valores de `.env.local` ni se reenviaron claves Supabase. No hubo push, merge o despliegue productivo.

Recibos locales: `.consignment-tests/access-spgrjhlwmyjfwiwsqgvn-origami.json`, `origami-setup-plan.json`, `origami-remote-validation.json` y captura `screenshots/origami-supabase-validation.png`. Se conservaron fingerprints de las migraciones y del stock online anterior/posterior. La referencia de stock no es un respaldo completo de la base.

## Límites operativos registrados

El modelo admite múltiples distribuidores y usuarios, con índices y bloqueos independientes por distribuidor. El snapshot aún materializa el histórico completo antes de paginar; directorio y catálogo auxiliar limitan a 100 registros. Medir y trasladar filtros/paginación a SQL antes de crecer a históricos grandes. La UI filtra por fechas/SKU, pero no tiene filtro financiero separado. No se transfiere automáticamente stock central ni se envían correos. El administrador registra pagos, sin cobros bancarios.

Faltan Safari/iOS y auditoría completa de accesibilidad. El riesgo de lint queda registrado y las herramientas se mantienen fuera del runtime; no se hizo audit fix --force ni downgrade de Next.

## Activación

Cerrar las verificaciones externas en el destino concreto y registrar el mismo commit que se va a desplegar. Seguir ORIGAMI_RELEASE_RUNBOOK.md; los cambios posteriores requieren repetir las comprobaciones afectadas. El rollback conserva documentos/ledger y apaga `CONSIGNMENTS_ENABLED`.
