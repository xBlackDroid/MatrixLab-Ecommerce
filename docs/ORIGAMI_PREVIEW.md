# Origami: versión de prueba en Vercel

Fecha: 11 de octubre de 2026. Diseño móvil solicitado por el propietario, implementado con Claude y revisado, probado y desplegado por Codex. La revisión anterior de Claude del 10 de octubre se conserva como evidencia histórica.

## Preview publicado

- Login: https://matrixlab-origami-prueba-20261010-141134.vercel.app/distribuidores/login
- Deployment: `dpl_GcfNmLbiRTqzDVKEefLLXdBYB9HM`, estado READY, entorno Preview, confirmado con `vercel inspect`.
- URL del deployment: https://matrix-lab-ecommerce-4n45g04d9-rafcastaneda-3285s-projects.vercel.app
- Admin: https://matrixlab-origami-prueba-20261010-141134.vercel.app/admin/login
- Directorio admin: https://matrixlab-origami-prueba-20261010-141134.vercel.app/admin/distribuidores
- Commit exportado y probado: `de1da7fae61981f3449cab4109c938b25b028fb4`.
- Build remoto correcto, Next 15.5.27 y comprobación de tipos aprobada. Incluye el borrado de T-shirt Lab; sin nuevas dependencias, push o merge.

Production ya está publicada y habilitada por autorización del propietario. Estado final en `ORIGAMI_PRODUCCION.md` y guía `TSHIRT_LAB_BORRADO.md`. En este Preview final se autenticó admin, se consultó Diseños y se comprobaron el botón por lote, 29 casillas de previews y 43 de archivos. No se borraron archivos existentes.

## Historial de verificaciones anteriores

Los párrafos siguientes documentan los candidatos previos al lanzamiento. Las menciones de Production apagada y pruebas pendientes describen esos estados anteriores; el resultado vigente está en los documentos enlazados arriba.

La interfaz usa CSS aislado, fondo oscuro, acentos lila, navegación segmentada y tarjetas de inventario con costo y sugerido separados. Se verificó desde 320 px, con controles táctiles de al menos 44 px y campos de 16 px. El login conserva el logo existente de MatrixLab Stickers. Origami paga a MatrixLab y admin registra esos abonos; el resumen mantiene piezas, valor del stock a costo, pagos y un único «Por pagar». El precio sugerido y los pagos no alteran la valoración del inventario. Sobre este código pasaron E2E, build, tipos y lint. Cámara automatizada pasó con el mismo Scanner, sin cambios posteriores de lógica; cámara física continúa pendiente. Dominio, PostgreSQL y seguridad pasaron sobre la valoración previa `ea76df7`, sin cambios posteriores en esos cálculos o el backend. Evidencia: `ORIGAMI_TEST_REPORT.md`. El alias existente se actualizó a este deployment y sustituye al de simplificación `dpl_HtaUV2VNhAMAnReqGDFgZZvDNNes` (`36ee82f`).

El upload se hizo desde un `git archive` del commit, sin archivos locales no versionados, `.env.local`, artefactos de pruebas ni secretos. Se registró y verificó el alias de pruebas antes de asociarlo al candidato READY.

El candidato Preview tiene `CONSIGNMENTS_ENABLED=true`, secretos de sesión nuevos e independientes para distribuidor y admin, y el origen HTTPS canónico del alias mediante overrides del deployment. El propietario autorizó explícitamente enviar a este Preview la contraseña admin de MatrixLab ya configurada localmente. Las variables se transmitieron desde el entorno del proceso del CLI oficial, sin secretos en argumentos o logs; no se versionó ni exportó `.env.local`. Usa la configuración Supabase que ya existía en Vercel Preview; no se volvió a enviar la clave de servicio. Production conserva el flag false y su deployment anterior. El admin inicial `dpl_21KkmYhdpgdgpByLg5dvFhqQAwKi` habilitó esas variables sobre el Preview móvil `dpl_55uudHRTXTiXdh2uFx2iJ14piTFx`. El candidato actual agrega el flujo de inventario y usuarios por perfil.

## Acceso y pruebas pendientes

El candidato actual sustituye al admin inicial `dpl_21KkmYhdpgdgpByLg5dvFhqQAwKi`. Incluye directorio con Inventario/Entregas/Usuarios por perfil y guía Crear pieza → Asignar stock → Vincular usuarios. En Edge con sesión Vercel habitual se autenticó realmente MatrixLab Admin y se consultaron el inventario de Origami, su cuenta origami activa y el formulario de entrega con cantidad/costo/sugerido. La membresía vincula automáticamente ese usuario al inventario de Origami. No se confirmaron operaciones de negocio, ni se extrajeron cookies o crearon tokens de bypass. Login/lectura admin HTTPS acreditados; el harness integral y la cámara física siguen pendientes. Las restricciones y observaciones anteriores siguientes se conservan como historia, no como resultado del candidato actual.

Durante la publicación, una exportación sin enlace `.vercel` creó el proyecto temporal `source`. Su deployment se retiró y el proyecto se eliminó tras autorización explícita del propietario. El alias de Origami no se vinculó a él. El runner ahora fija y valida IDs de proyecto/equipo/alias antes de enviar el candidato. MatrixLab Production no cambió. Recibo de corrección `.consignment-tests/origami-preview-project-correction.json`.

Vercel Authentication sigue habilitada. Los GET anónimos del alias redirigen a SSO de Vercel (302). En Edge, con la sesión de Vercel existente del propietario, se verificó el 11 de octubre que `/admin/login` muestra el campo «Contraseña de acceso» y «Entrar al panel»; el mensaje de panel bloqueado ya no aparece. No se desactivó la protección ni se creó un token de bypass.

Después de Vercel, el portal usa el usuario real `origami` y la contraseña ya indicada por el propietario. Por solicitud explícita posterior, el 11 de octubre se agregó una pieza de ejemplo Lego Calabaza: costo $50 MXN, sugerido $60 MXN, entrega `ENT-1`. Snapshot del operador confirmado: stock 1, valor $50 y por pagar $0. No se registraron ventas ni pagos. El dato está en el Supabase compartido autorizado; no es una fixture aislada ni acredita entrega física. Recibo: `.consignment-tests/origami-lego-calabaza-example.json`. No requiere redeploy. La prueba integral del login/cookie/Origin/CSRF/no-store y cámara física en este deployment aún no está acreditada: SSO impidió llegar al módulo. Las pruebas locales y la validación SQL/Supabase anterior siguen documentadas por separado.

El admin de este Preview está configurado con la autenticación existente de MatrixLab: sólo contraseña, sin username nuevo. La revisión automática rechazó inicialmente el envío de esa credencial; el propietario lo autorizó explícitamente para el Preview y después se completó el despliegue. El login usa sesiones firmadas y persistidas, y las mutaciones conservan el control CSRF. Origami sigue siendo operador, sin permisos de piezas, entregas, pagos ni accesos. La habilitación expone el panel admin existente, que también administra la tienda; el Preview apunta al Supabase compartido autorizado. No se crearon piezas, entregas, ventas o pagos adicionales durante esta habilitación. La visualización del formulario no acredita aún una sesión admin autenticada ni operaciones reales en HTTPS.

Recibos actuales: `.consignment-tests/origami-admin-preview-deployment.json`, `origami-admin-preview-deploy.log`, `origami-admin-preview-validation.json` y `origami-preview-deployment.json`. `origami-preview-protection-check.json` conserva la comprobación del Preview móvil anterior. El harness HTTPS autenticado no se ejecutó; no se extrajeron cookies del navegador ni se crearon tokens de bypass.

## Revisión de Claude y verificación de Codex

El propietario autorizó explícitamente procesar en Anthropic los archivos del módulo enumerados en la conversación. Para este diseño, Claude Code trabajó con copias aisladas de componentes y páginas, el logo y la skill `redesign-existing-projects` suministrada como contexto; no recibió archivos de entorno ni secretos y no ejecutó tests ni desplegó. Codex integró el diseño, corrigió contraste, controles de contraseña, unidades comerciales y navegación a 320 px, inspeccionó capturas y ejecutó las comprobaciones descritas arriba. Evidencia de diseño: `ORIGAMI_DISENO_MOVIL.md`.

En la revisión anterior, Claude revisó el candidato `4b203d5` y escribió `.consignment-tests/ORIGAMI_PREVIEW_CLAUDE.md`; aquella revisión no cambió código, ejecutó tests ni desplegó. Las correcciones de valoración, pagos y simplificación fueron implementadas y probadas por Codex; no se atribuyen a esa revisión histórica. Codex preparó los Previews. El punto señalado por Claude sobre Origin estricto se resolvió fijando `CONSIGNMENTS_SITE_URL` al alias registrado.

Correcciones a las notas de Claude: la auditoría vigente documentada es cero avisos de runtime y cinco altos de herramientas de lint; sus doce avisos corresponden al reporte histórico. Los rechazos administrativos por el endpoint del distribuidor se evalúan antes de la excepción de membership: ese actor recibe FORBIDDEN. La compatibilidad física Safari/iOS continúa pendiente. La revisión de Claude es evidencia de revisión, no evidencia de tests ejecutados o de captura física.

Antes de liberar producción deben cerrarse las verificaciones del candidato y registrar la prueba de cámara del celular. No confirmar operaciones financieras sintéticas en el proyecto actual para probar el flujo.
