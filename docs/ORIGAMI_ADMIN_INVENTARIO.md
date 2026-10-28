# Inventario y acceso por distribuidor

Cada perfil de `/admin/distribuidores` tiene accesos visibles a **Administrar inventario**, **Registrar entrega** y **Usuarios y acceso**. Los tres abren la cuenta de ese distribuidor. Al crear un perfil nuevo se abre directamente su configuración de piezas; empieza sin stock y sin usuarios.

## Flujo del administrador

1. Abrir el distribuidor, por ejemplo Origami.
2. **Crear pieza**: capturar nombre, SKU, unidad comercial y sugerido; guardar y confirmar la ficha privada.
3. **Asignar stock**: seleccionar la pieza, cantidad, costo unitario para ese distribuidor, sugerido y fecha; confirmar la entrega. Sólo esta entrega agrega existencias vendibles.
4. **Vincular usuarios**: crear una cuenta dentro del perfil seleccionado. El usuario queda vinculado a ese distribuidor; los usuarios existentes se listan en esa sección. Origami ya tiene su cuenta, por lo que no necesita crearla de nuevo.
5. Compartir `/distribuidores/login`. Es el mismo enlace para todos: el backend identifica el inventario mediante la membresía autenticada, sin permitir escoger otra cuenta desde la URL.

Para ampliar existencias de una pieza ya creada, registrar otra entrega de tipo Reposición. El costo y sugerido se capturan por entrega; los lotes conservan sus condiciones originales. La tienda no importa ni descuenta stock automáticamente al registrar esta entrega privada.

## Alcance y comprobación

La navegación permite abrir directamente `?seccion=inventario`, `piezas`, `entregas`, `pagos` o `accesos`; valores desconocidos vuelven a Inventario. Sólo la página admin admite esas secciones, con su guard de sesión existente. Al cambiar de distribuidor o sección por URL se remonta el workspace para no conservar formularios o intenciones de otra cuenta.

No se cambian SQL, credenciales, permisos, cálculos ni APIs. Los usuarios de cada distribuidor comparten el stock de su perfil y sólo registran ventas propias; MatrixLab administra piezas, entregas y pagos. Crear un perfil no crea automáticamente una credencial.

La suite E2E usa PostgreSQL aislado y el servidor local compilado para comprobar directorio, navegación directa y recarga, alta vacía, entrega visible para el usuario correcto, acceso auxiliar con el mismo inventario y ausencia de esa pieza en otro distribuidor. Las capturas `admin-distributor-directory.png` y `admin-distributor-setup.png` en `.consignment-tests/screenshots` contienen datos sintéticos. Los resultados definitivos y el deployment vigente se registran en `ORIGAMI_TEST_REPORT.md` y `ORIGAMI_PREVIEW.md`.
