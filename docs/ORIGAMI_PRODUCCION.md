# Origami: lanzamiento a producción

11 de octubre de 2026. El propietario aprobó expresamente publicar el módulo después de revisar el Preview.

- Portal: https://www.matrixlabintelligence.com/distribuidores/login
- Admin: https://www.matrixlabintelligence.com/admin/distribuidores
- Diseños y borrado de archivos: https://www.matrixlabintelligence.com/admin/disenos
- Deployment vigente: `dpl_5eH84FdKBNDYk9YAPZYS3Lj4fJLm`, READY/Production; código `de1da7fae61981f3449cab4109c938b25b028fb4`. Publicación posterior de recuperación admin, sin cambios de código, sobre `dpl_CJ5cuGUkvKPizepbsGjUMBPdiMCx`.
- Primer deployment: `dpl_3WvMPdfbNykQwm5kN6EPjWzR2Seq`, código probado `07337baf8b4689f69952b550bfc62a5851e2daf2`, proyecto Vercel MatrixLab.
- El dominio sin www redirige al canónico www. `CONSIGNMENTS_ENABLED=true` y `CONSIGNMENTS_SITE_URL=https://www.matrixlabintelligence.com` se configuraron en Production.

El despliegue hereda las credenciales existentes de Production. No se enviaron `.env.local`, contraseñas o claves locales a Production, y se fijó el ID del proyecto/equipo en la exportación. Se conservaron configuración de pagos y Supabase. Los documentos anteriores que señalan Production desactivada describen el estado previo al lanzamiento.

Las 16 suites de regresión de tienda/diseñador/pagos/seguridad pasaron antes del lanzamiento. Sobre el dominio productivo se comprobó login real de Origami, perfil correcto, cookie HttpOnly/Secure/SameSite, no-store, rechazo de origen ajeno, sesión ausente y acceso del operador a administración; logout exige CSRF y revoca la sesión. El scanner tiene cámara limitada a su origen y la tienda sigue respondiendo. No se registraron ventas, entregas o pagos para esa comprobación. Recibos `.consignment-tests/origami-production-deployment.json` y `origami-production-validation.json`.

La cámara física en el celular de Origami no se acredita con esta comprobación HTTP; la adquisición y lectura se habían probado con automatización y fixtures. La publicación no cambia esa limitación de evidencia.

## Cierre de la versión final

### Recuperación administrativa posterior

El propietario informó que ninguna contraseña conocida permitía entrar y eligió expresamente restablecer con una contraseña nueva y cerrar sesiones anteriores. Se reemplazaron únicamente `ADMIN_ACCESS_PASSWORD` y `ADMIN_SESSION_SECRET` en Production, como variables sensibles, y se publicó el mismo código probado en `dpl_5eH84FdKBNDYk9YAPZYS3Lj4fJLm`. No se cambió la contraseña del Preview ni las credenciales/sesiones del distribuidor.

El único bloqueo durable activo coincidió con el vencimiento indicado por `Retry-After` del login desde esta conexión; se retiró sólo ese contador mediante la RPC existente. Se conservaron los límites, las funciones y la protección contra intentos fallidos. PASS real en HTTPS: login administrativo, cookie HttpOnly/Secure/SameSite, Diseños con selección por archivo/preview, directorio de Distribuidores, logout y rechazo de la sesión revocada. DELETE anónimo sigue rechazado. No se ejecutaron borrados autenticados ni operaciones de negocio. Recibos privados sin contraseñas: `.consignment-tests/admin-recovery-deployment.json` y `admin-production-validation.json`.

La revisión automática rechazó un diagnóstico externo de IP; no se ejecutó. La recuperación usó exclusivamente la respuesta de MatrixLab y la coincidencia del contador en Supabase. La contraseña se entregó al propietario; no se versionó ni se incluyó en documentos. Los párrafos siguientes describen el estado previo a esta recuperación; su limitación de login administrativo productivo quedó resuelta.

La versión final incluye selección y borrado de archivos/previews de T-shirt Lab; operación y resultados en `TSHIRT_LAB_BORRADO.md`. Pasaron build, tipos, lint de los archivos modificados, 16/16 suites de regresión, pruebas PostgreSQL/Storage de borrado y E2E a 320/390/430 px. Una fixture exclusiva en Supabase real acreditó la retirada física y de registros, y quedó totalmente limpia. La auditoría de los 29 diseños/43 archivos existentes encontró 136 rutas compatibles, sin modificarlos.

Se repitieron las 14 comprobaciones HTTP del portal sobre el deployment final y todas pasaron. La API nueva rechazó DELETE anónimo con 401. En el Preview final del mismo commit, el login administrativo y la consulta real de Diseños mostraron el botón de borrado por lote, 29 casillas de preview y 43 de archivos. No se seleccionaron ni borraron archivos preexistentes.

Production conserva su contraseña administrativa anterior, diferente de la usada en el Preview. El intento con la credencial local fue rechazado; no se cambió la contraseña. Vercel no devuelve esa variable sensible al comando de lectura, por lo que no se acredita una sesión admin autenticada en Production. Sí se acredita el formulario productivo, el portal Origami, la interfaz autenticada del Preview, las pruebas integrales locales y el borrado real de la fixture por el backend de Supabase.

La revisión automática rechazó una prueba DELETE autenticada productiva cuyo destino era la fixture ya eliminada: no pudo confirmar la inexistencia del UUID. Se retiró esa petición y sólo se comprobó el rechazo anónimo; no se ejecutó esa prueba ni se borraron datos del usuario. Los resultados de borrado anteriores corresponden a las pruebas aisladas y la fixture real exclusiva.
