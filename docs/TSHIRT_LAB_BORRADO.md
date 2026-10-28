# T-shirt Lab: selección y borrado de archivos

Publicado en https://www.matrixlabintelligence.com/admin/disenos. Código `de1da7fae61981f3449cab4109c938b25b028fb4`, deployment vigente `dpl_5eH84FdKBNDYk9YAPZYS3Lj4fJLm`, READY/Production, tras recuperación admin sin cambios de código. El Preview final del mismo código es `dpl_GcfNmLbiRTqzDVKEefLLXdBYB9HM`. Estado de acceso productivo y límites de evidencia en `ORIGAMI_PRODUCCION.md`.

En **Admin → Diseños**, cada preview permite seleccionar sus archivos originales. **Borrar archivos seleccionados** muestra una confirmación con los nombres exactos. También se pueden seleccionar previews completos y eliminarlos por lote. Cancelar no cambia datos ni archivos.

La acción elimina objetos mediante la API oficial de Supabase Storage y después elimina sus filas en `uploaded_assets`. El borrado individual retira la miniatura, la preview actual y las composiciones anteriores del diseño; conserva originales no seleccionados, limpia las referencias `assetId`/`baseAssetId` del JSON y deja el diseño en borrador para volver a guardarlo. Un preview completo elimina el proyecto, sus filas de archivos y todos los objetos de su carpeta privada, incluidos archivos y previews huérfanos de subidas o guardados anteriores.

`0012_design_file_deletion.sql` instala trabajos privados y funciones de preparación/finalización. El manifiesto persiste mientras se limpia Storage: si falla un paso, el panel muestra **Reintentar borrado pendiente**. La DB no declara finalizada la operación antes de comprobar la retirada de los objetos. Las funciones públicas no admiten rutas del cliente: se usan IDs de diseño/archivo y paths del servidor, restringidos a `design-assets` y `design-previews` y al prefijo de ese diseño.

El endpoint `DELETE /api/admin/designs/files` exige sesión administrativa, CSRF, validación de entrada y límite de peticiones. RLS y privilegios niegan acceso a anon/authenticated; sólo el backend service_role invoca las funciones. Las subidas/guardados adquieren una lease temporal, y se impiden cambios o nuevos vínculos mientras hay un borrado pendiente. Un diseño vinculado a carrito o pedido se rechaza para preservar los archivos de producción. El admin puede borrar cuando se retire ese vínculo; no se eliminan pedidos ni líneas de carrito como efecto lateral.

El panel incluye borradores sin guardar para que sus subidas también puedan limpiarse. Conserva el límite de los 80 diseños más recientes. El borrado es permanente y requiere la confirmación visible antes de enviar la petición; no se ejecutó una limpieza masiva de archivos existentes del usuario.

## Verificación

- Tras restablecer las credenciales por elección del propietario, login admin real en Production y consulta de Diseños con los controles nuevos aprobados; no se confirmó ningún borrado de datos existentes. Recibo `admin-production-validation.json`.
- Build, type-check y lint de los archivos modificados aprobados; regresión global 16/16 PASS. En el Preview HTTPS final se autenticó admin y se verificaron el botón por lote y las casillas reales, sin borrar archivos existentes.
- PostgreSQL aislado: migración, borrado físico de archivos sintéticos y filas, borrado parcial, conservación de otro original, composiciones antiguas y paginación, fallo/reintento, aislamiento de rutas, RLS y bloqueo de escrituras/vínculos concurrentes.
- Navegador local: móvil 320/390/430 px, selección/cancelación, nombres exactos en confirmación, rechazo sin sesión/CSRF, fallo de Storage y reintento, borrado individual y completo. La confirmación se enfoca y desplaza a la vista en celular.
- Supabase actual: una fixture temporal exclusiva con PNG/WebP comprobó borrado parcial, conservación del otro original y borrado completo sin filas ni objetos restantes; la fixture se retiró al terminar. No se borraron diseños o archivos preexistentes del usuario. Recibo `.consignment-tests/design-deletion-supabase-validation.json`.
- Funciones instaladas: hashes de sus cuerpos normalizados coinciden con el archivo probado; anon/authenticated sin EXECUTE. La migración se instaló en transacción en el editor SQL autenticado del proyecto `spgrjhlwmyjfwiwsqgvn`.

La captura `.consignment-tests/screenshots/tshirt-delete-confirmation.png` contiene datos sintéticos; el transporte de Storage del test de navegador es un adaptador de prueba. La prueba real de Supabase acredita además la API de Storage, sin atribuir al adaptador comportamiento del servicio remoto.
