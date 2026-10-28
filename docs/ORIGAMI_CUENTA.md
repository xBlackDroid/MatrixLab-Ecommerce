# Cuenta privada de Origami

Actualización: 11 de octubre de 2026. El acceso usa usuario y contraseña; no requiere correo.

## Lo implementado y probado

- Enlace directo `/distribuidores/login`, sin enlace en la tienda pública y con noindex. Los datos exigen sesión válida; conocer la URL no concede acceso.
- Login con el logo de MatrixLab Stickers. Resumen simple con piezas disponibles, valor del stock a costo, pagos a MatrixLab y «Por pagar», sin dos indicadores de deuda. «Por pagar» muestra únicamente lo restante después de los abonos.
- Usuario operativo creado: `origami`. Se utilizó la contraseña indicada por el propietario y se comprobó su derivación contra el hash real. No se versiona ni se imprime en logs.
- Origami consulta sus piezas, costo, sugerido, ventas y estado de cuenta, y confirma ventas propias. Una venta confirmada descuenta piezas automáticamente.
- El indicador «Valor del stock a costo» representa lo que aún tiene de MatrixLab: cantidad disponible por el costo asignado en cada lote. Ejemplo: 10 piezas a $100 valen $1,000; vender 3 deja $700 en piezas y $300 por pagar. Los pagos van de Origami a MatrixLab y sólo el admin los registra. Abonar esos $300 liquida la venta y conserva los $700 de stock. El precio sugerido al público no interviene en esa valoración.
- Origami no puede crear/editar piezas, ajustar stock, confirmar entregas, registrar pagos, anular documentos ni administrar accesos. Estos permisos se comprueban en servidor y SQL.
- Cada distribuidor empieza sin piezas. MatrixLab crea fichas privadas y registra entregas graduales. No se copia el stock de la tienda.
- Más distribuidores: crear otro registro en `/admin/distribuidores` y su usuario en Accesos. El username es único; la cuenta y los documentos quedan separados por distribuidor. Puede haber varios operadores del mismo distribuidor, con los mismos permisos restrictivos.

## Crear, restablecer o suspender desde MatrixLab

Instalar las migraciones 0009, 0010 y 0011 en el destino elegido, configurar los secretos del servidor y habilitar únicamente el entorno de validación. Entrar con sesión MatrixLab a la cuenta del distribuidor y abrir Accesos:

1. Elegir Crear cuenta, capturar `origami` y la contraseña indicada por el propietario; revisar y confirmar.
2. Compartir el enlace privado y las credenciales por el canal acordado. Esta app no envía correos ni mensajes.
3. Para cambiar contraseña, elegir Restablecer contraseña con el mismo usuario. Revoca todas sus sesiones; no modifica inventario ni pagos.
4. Suspender bloquea el siguiente acceso. Reactivar exige volver a entrar; no restaura sesiones antiguas.

La contraseña se almacena como scrypt con sal aleatoria. Los listados, recibos e historial de intenciones nunca devuelven ni guardan la contraseña en texto plano. No hay contraseña predeterminada en el código. Longitud admitida: 8 a 128 caracteres.

## Alta controlada por herramienta

`scripts/consignments/provision-origami.ts` también sirve para futuros distribuidores mediante `--name`, `--slug` y `--username`. Un reintento conserva una cuenta existente y no cambia su contraseña. Para restablecerla se utiliza Accesos.

Dry-run, sin DB ni contraseña:

```powershell
npm run provision:origami -- --username origami --project <referencia-del-proyecto> --site https://<entorno>
```

Para aplicar, se añade `--apply` y se proporciona la contraseña por stdin desde el gestor seguro del operador, nunca como argumento. Requiere `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `CONSIGNMENT_SESSION_SECRET` del mismo destino. La herramienta verifica referencia y HTTPS. El recibo en `.consignment-tests/access-<proyecto>-<usuario>.json` contiene sólo usuario, ID del distribuidor y enlace; no contiene contraseña ni su hash.

## Cámara

Sólo `/distribuidores/escanear` habilita cámara. El navegador solicita permiso al pulsar Abrir cámara, sin audio. Denegarlo conserva SKU manual/lector. Cancelar o navegar detiene la transmisión, incluso cuando el permiso llega tarde. Leer QR prepara una venta; confirmar descuenta stock. Falta prueba de cámara física en el celular de Origami sobre HTTPS.

## Estado del alta real

El propietario autorizó usar el Supabase actual con el portal desactivado. El 10 de octubre de 2026 se instalaron 0009, 0010 y 0011 en `spgrjhlwmyjfwiwsqgvn`, mediante el editor SQL autenticado, en una transacción. Después se creó la cuenta real `origami`, sin email, con una única membresía activa de operador. ID de distribuidor: `1f8f51c1-eb53-4f89-8079-a6c89120dcf7`.

Al crear la cuenta el 10 de octubre tenía cero piezas, ventas, pagos y sesiones abiertas. Las 424 variantes online conservaron exactamente sus existencias anteriores. Las seis conciliaciones resultaron sin inconsistencias; todas las tablas privadas tienen RLS y anon/authenticated carecen de lectura y ejecución privadas. También se verificó el rechazo de credenciales y RPC de acceso mediante la API pública real.

El 11 de octubre el propietario solicitó y confirmó 1 pieza de ejemplo **Lego Calabaza**, SKU `ORI-LEGO-CALABAZA`, costo unitario $50 MXN y sugerido $60 MXN. Se registró la entrega `ENT-1`, referencia «Ejemplo autorizado: Lego Calabaza», mediante RPC administrativa auditada e idempotente en el proyecto actual. Snapshot del operador confirmado: una pieza visible, valor de stock $50 y por pagar $0. No se crearon ventas ni pagos ni se vinculó a una variante online; las 424 variantes conservaron su stock. Recibo sin secretos: `.consignment-tests/origami-lego-calabaza-example.json`. Es una entrega de ejemplo solicitada, no evidencia de entrega física. El portal productivo continúa apagado.

En Vercel Production se configuraron `CONSIGNMENTS_ENABLED=false` y un secreto independiente de sesión marcado como sensible. No se desplegó ni activó el portal productivo. No se cambiaron valores de `.env.local`. Posteriormente el propietario solicitó la versión de prueba: se publicó un Preview con el módulo habilitado sólo en ese deployment, origen HTTPS propio y secreto independiente, conservando Vercel Authentication. El login/cookies de ese candidato sigue pendiente del acceso SSO; cámara física también pendiente. El admin del Preview espera autorización de configuración. Ver `ORIGAMI_PREVIEW.md` para enlace y evidencia.

Recibos locales sin contraseñas en `.consignment-tests/`: `access-spgrjhlwmyjfwiwsqgvn-origami.json`, `origami-setup-plan.json` y `origami-remote-validation.json`. Evidencia visual: `screenshots/origami-supabase-validation.png`. Las cuentas de las suites locales son fixtures temporales distintas de esta cuenta operativa.
