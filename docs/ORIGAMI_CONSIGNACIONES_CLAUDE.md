# MatrixLab Intelligence — Consignaciones y distribuidores: Origami

**Documento de implementación para Claude y validación posterior por Codex.**

Fecha: 9 de octubre de 2026.

Actualización: 10 de octubre de 2026 — alta gradual y manual de las piezas entregadas a Origami, confirmada por el usuario.

Precisión confirmada el 11 de octubre de 2026: Origami paga a MatrixLab; sólo MatrixLab registra esos pagos desde admin. MatrixLab entrega cantidades y fija dos importes distintos: costo unitario para Origami y precio sugerido al público. El indicador principal antes llamado «Crédito disponible» debe ser «Valor del stock a costo»: suma de cantidad disponible × costo pactado de cada lote. No usar precio sugerido, pagos o saldo a favor para valorar las piezas. Entregar no genera deuda por venta; vender disminuye el valor de stock y genera la deuda correspondiente. Los pagos reducen deuda, sin cambiar existencias ni su valoración. En la cuenta Origami los recibos se nombran «Pagos a MatrixLab».

Simplificación posterior del 11 de octubre: el resumen debe mostrar sólo piezas disponibles, valor del stock a costo, pagos a MatrixLab y un único saldo «Por pagar» (lo que falta cubrir después de los abonos). Eliminar las tarjetas «Deuda por ventas» y «Pendiente de pago». Cada venta muestra «Por pagar» en su resumen; el detalle desplegable conserva total a MatrixLab y pagado. El login lleva el logo existente `/images/categories/matrixlab-stickers.png`. No cambiar cálculos, permisos ni contabilidad por esta simplificación visual.

Diseño móvil solicitado después: Claude implementó un estilo oscuro con el acento de MatrixLab, selector segmentado visible Inventario/Venta/Cuenta, superficies y cifras más claras, campos de 16 px y controles de al menos 44 px. Codex integró y validó el resultado. Mantener ese sistema aislado en `src/components/consignments/portal.module.css`, sin cambiar tienda/globales, lógica, permisos ni datos. Es una referencia de estilo a selectores de modo, sin nombres de modelos de IA en el producto. Detalles y comprobaciones: `ORIGAMI_DISENO_MOVIL.md`.

Repositorio inspeccionado: `C:\Dev\MatrixLab-Ecommerce`, commit de referencia `5f2052a`.
Estado: especificación; funcionalidad y pruebas todavía por implementar.

## 1. Instrucción para Claude

Implementa un módulo privado dentro de MatrixLab Intelligence para controlar las piezas que MatrixLab deja en consignación a Origami. MatrixLab y Origami deben consultar el mismo inventario, ver el costo pactado para el distribuidor y el precio sugerido, registrar ventas que descuenten existencias y consultar lo vendido, los pagos recibidos y el saldo pendiente.

**Requisito confirmado por el usuario:** Origami no tendrá todo el catálogo ni todo el stock de la página. MatrixLab irá creando y entregando sus piezas poco a poco. Su inventario empieza vacío y se forma exclusivamente con las altas y entregas que MatrixLab confirme para ese distribuidor. No importar ni asignar automáticamente productos, variantes, cantidades o novedades del e-commerce.

Entrega código funcional, migraciones, pruebas automatizadas y evidencia reproducible. Después, Codex revisará de forma independiente el código, ejecutará las pruebas y validará los flujos en un entorno de prueba. **No hagas merge a la rama productiva, despliegues a producción, apliques migraciones productivas ni cargues datos reales antes de esa validación.** Revisa también si el repositorio publica automáticamente al hacer push y evita activar ese despliegue.

Trabaja en una rama de funcionalidad, por ejemplo `codex/origami-consignaciones`, respetando las instrucciones vigentes del repositorio y los cambios ajenos existentes. Implementa y prueba; no entregues solamente pantallas, mocks, un plan o pruebas que buscan palabras en el código. No cambies secretos ni muestres contenido de `.env.local`.

## 2. Objetivo y acuerdos iniciales

El usuario necesita responder, desde cualquiera de las dos cuentas:

- ¿Qué piezas tiene Origami y cuántas quedan de cada una?
- ¿A qué costo se le dejó cada pieza y cuál es el precio sugerido al público?
- ¿Qué vendió, cuándo y cuántas piezas?
- ¿Cuánto debe pagar a MatrixLab por esas ventas?
- ¿Qué pagos recibió MatrixLab, a qué ventas se aplicaron y cuánto falta?

Implementar el requisito confirmado anterior y estos supuestos explícitos, documentándolos en la entrega:

1. **Consignación:** dejar piezas no genera una deuda. La deuda nace al confirmar su venta. No es una compra mayorista con pago de todo lo entregado por adelantado.
2. **Costo para Origami:** importe unitario que Origami debe a MatrixLab al vender. No es el costo interno de fabricación de MatrixLab. En la interfaz usar “Costo para Origami”.
3. **Precio sugerido:** referencia comercial; Origami puede capturar un precio de venta real distinto. Eso no modifica lo que debe a MatrixLab.
4. **Moneda:** MXN; fechas visibles en `America/Mexico_City`, persistencia de instantes en UTC.
5. **Unidad:** pieza o unidad comercial definida por SKU. Un paquete se vende como paquete; no desarmarlo automáticamente en piezas. Variantes diferentes deben tener SKU/código distinto.
6. **Inventario de consignación independiente en el MVP:** cargar las piezas físicamente entregadas a Origami; estas operaciones no cambian automáticamente `product_variants.stock` de la tienda. Mostrarlo claramente a MatrixLab al cargar una entrega. No contabilizar estas piezas como disponibles para el checkout online.
7. Las piezas ya entregadas se cargan como “Inventario inicial”. No inventar cantidades, costos, precios ni ventas previas. Una deuda previa, si existe, requiere una carga separada con procedencia y validación; queda fuera del MVP.
8. Un producto puede recibirse en distintos lotes con costos distintos. El costo pactado de un lote queda fijo; los lotes nuevos pueden tener otro costo. Consumir lotes por FIFO según orden de recepción, con desempate estable por ID.
9. Solo MatrixLab confirma pagos recibidos. Origami puede consultar los pagos, pero no marcarse como pagado.
10. Sin venta offline en el MVP. Ante pérdida de conexión, conservar el formulario y exigir confirmación del servidor antes de anunciar una venta exitosa.
11. **Alta gradual de piezas:** solo MatrixLab crea/asigna las piezas de Origami y confirma cuánto le entrega de cada una. Crear una ficha no crea existencias; confirmar una entrega sí. Origami ve únicamente sus piezas entregadas y su histórico, incluidas las agotadas; no ve borradores ni productos de la tienda no asignados.
12. **Piezas privadas independientes del e-commerce:** permitir registrar una pieza directamente en este módulo sin tener que publicarla ni crearla primero en la tienda. Vincularla a un producto/variante existente es opcional y no importa su stock, no publica la pieza y no cambia sus precios públicos.

El alta gradual y la selección exclusiva de las piezas de Origami son requisitos confirmados. Los demás acuerdos propuestos no implican que el usuario ya confirmó cada detalle. Registrarlos en el informe de entrega. Si aparece evidencia de que el negocio funciona distinto, exponer el punto concreto y adaptar antes de cargar datos reales.

Antes de activar datos reales, conciliar físicamente lo disponible en MatrixLab y en Origami. Si las piezas entregadas siguen incluidas en el stock online, MatrixLab debe corregir ese stock por el flujo administrativo existente y dejar evidencia; la carga inicial de consignación no lo hace por sí sola. No efectuar otro descuento si esa salida ya fue registrada. Esta conciliación es condición de activación, para evitar que ambos canales ofrezcan la misma pieza.

## 3. Contexto real del repositorio

Reinspecciona el checkout antes de editar; esta lista describe lo observado al escribir el documento:

| Elemento | Ubicación y consecuencia |
| --- | --- |
| Aplicación | Next.js 15 App Router, React 19, TypeScript, Tailwind v4; `package.json`. Integrar en la misma aplicación. |
| Catálogo | `src/lib/store/products.ts`, `src/lib/db/types.ts`, `products` y `product_variants`. Permitir vincular una pieza seleccionada por MatrixLab y precargar su información descriptiva; no sincronizar catálogo, existencias ni precios automáticamente. |
| Inventario existente | `src/lib/store/inventory.ts` y `src/app/api/admin/inventory/route.ts`. `adjustStock` hace lectura y escritura separadas y limita el resultado a cero: no reutilizar ese patrón para ventas concurrentes. |
| Administración | `src/components/admin/AdminNav.tsx`, `src/components/admin/AdminLayout.tsx`, `src/app/admin/*`. Agregar acceso a “Distribuidores”. |
| Sesión admin actual | `src/lib/security/session.ts`, `admin-auth.ts`, `src/app/api/admin/login/route.ts`. Contraseña de admin y sesión HMAC revocable; no tiene identidad de distribuidor ni permisos por distribuidor. |
| Supabase | `src/lib/db/admin.ts` usa `service_role`, que omite RLS. `src/lib/db/client.ts` es lectura pública. El aislamiento debe verificarse en el servidor. |
| RLS | `supabase/migrations/0002_rls.sql`: tablas privadas sin acceso directo para `anon`/`authenticated`. Mantener este modelo para las tablas nuevas. |
| Migraciones | Se observaron `0001` a `0008`. Usar el siguiente número libre real; no sobrescribir migraciones aplicadas. Hay comentarios/documentación antiguos: verificar SQL existente, no confiar solo en README. |
| Mutaciones | `src/lib/security/csrf.ts`, validación Zod, helpers de `src/lib/api.ts`, rate limiting y protección durable de login. Mantener estos controles. |
| Cámara | `next.config.ts` envía `Permissions-Policy: camera=()`. El escáner necesita una excepción controlada. |
| CSP | `src/middleware.ts` mantiene patrones de rutas dinámicas con nonce. Las páginas privadas nuevas necesitan `force-dynamic` y su patrón correspondiente. |
| Pruebas | `scripts/qa/*.test.ts`; contratos, cabeceras, carrito, pagos, diseñador y catálogos. Añadir pruebas reales sin debilitar las existentes. |
| Herramientas | Hay scripts `build`, `type-check`, `lint`; no hay runner dedicado al módulo. El build omite ESLint; que compile no prueba que lint pasó. |

No meter costos del distribuidor en columnas públicas del catálogo ni en respuestas públicas. Las fichas privadas de consignación se guardan en DB; no usar datos estáticos ni mocks como inventario operativo. Una pieza puede existir solo en el módulo de distribuidores. No obligar a MatrixLab a darla de alta en el catálogo público ni a crear una variante de tienda antes de consignarla. El vínculo opcional al catálogo reutiliza información seleccionada, no convierte el catálogo completo en inventario de Origami.

## 4. Alcance del MVP y permisos

Dos espacios en la misma web:

- **MatrixLab:** `/admin/distribuidores`, detalle de Origami, entregas, ventas, pagos y estado de cuenta.
- **Origami:** `/distribuidores/login` y `/distribuidores/...`, con inventario, registro de venta, historial y estado de cuenta propios.

Origami es el primer distribuidor. Guardar la entidad en la base; no incrustar IDs ni permisos de Origami en el código. Preparar aislamiento para otros distribuidores sin construir un marketplace ni una organización empresarial compleja.

| Acción | MatrixLab admin | Usuario activo de Origami |
| --- | --- | --- |
| Ver inventario, costo para Origami y sugerido | Sí, todos los distribuidores | Sí, solo Origami |
| Ver ventas, pagos, saldo e historial | Sí | Sí, solo Origami |
| Crear distribuidor y administrar sus accesos | Sí | No |
| Crear ficha privada de pieza o vincular producto seleccionado | Sí, para el distribuidor elegido | No |
| Registrar inventario inicial o entrega | Sí | No |
| Registrar venta de existencias de Origami | Sí, indicando distribuidor | Sí |
| Modificar costo de un lote confirmado | No; corregir con reversión y nueva entrada | No |
| Actualizar sugerido vigente | Sí; conservar histórico de ventas | No |
| Registrar o anular pago recibido | Sí | No |
| Anular venta, devolución o ajuste de stock | Sí, con motivo y trazabilidad | No; puede solicitar corrección fuera de la app |
| Consultar otros distribuidores o admin general | Sí | No |
| Exportar su estado de cuenta CSV | Sí | Sí, solo Origami |

Actualización solicitada por el propietario: acceso privado por usuario y contraseña, sin correo. Usuario inicial `origami`; la contraseña se recibe por un canal seguro y nunca se incorpora a código, seeds o documentos versionados. Usar un algoritmo estándar de almacenamiento de contraseñas con sal aleatoria (scrypt de Node.js en esta implementación), verificación en servidor, sesiones revocables y membresía activa por request. No compartir la contraseña admin ni convertir una sesión de distribuidor en sesión admin.

Puede conservarse la sesión admin existente para MatrixLab. Para su auditoría guardar actor `matrixlab_admin` y un identificador hash de sesión; no afirmar que existe un usuario nominal donde hoy no existe. Para Origami guardar el ID del usuario autenticado. Documentar la limitación del admin legado.

El administrador crea usuarios, restablece contraseñas, suspende y reactiva cuentas desde Accesos. Restablecer o suspender revoca sesiones existentes; no existe registro público ni recuperación por email. La sección sólo se descubre mediante el enlace directo `/distribuidores/login`, sin enlaces en la tienda y con noindex; el servidor exige credenciales para acceder a datos. El modelo debe admitir más distribuidores, cada uno con inventario, usuarios, ventas y pagos propios. Se autoriza preparar la cuenta real de Origami en el destino indicado por el propietario, sin activar producción antes de validar.

## 5. Pantallas y flujos

### 5.1 Resumen compartido

Mostrar nombre del distribuidor y tarjetas con piezas disponibles, piezas vendidas netas, importe generado a favor de MatrixLab, pagos recibidos netos, saldo pendiente y crédito a favor de Origami. Cada cifra debe explicar periodo y unidad. No mezclar ingreso al público con deuda a MatrixLab.

Mostrar última sincronización, botón actualizar y estados de carga/error/vacío. Con pantalla activa, refrescar cada 15 segundos y al recuperar foco; refrescar inmediatamente tras cada mutación. Pausar polling en segundo plano. Prueba objetivo: un cambio confirmado en una sesión se refleja en la otra en máximo 20 segundos con conexión disponible.

Filtros de fecha por rango local, producto/SKU y estado. Un filtro del historial no debe hacer desaparecer el saldo global sin etiquetar claramente que se muestra un saldo del periodo.

### 5.2 Inventario y entrega de piezas

Un distribuidor nuevo empieza con cero piezas y una pantalla vacía. Para MatrixLab mostrar “Agregar pieza a Origami”; para Origami, “Aún no hay piezas registradas”. No llenar la pantalla con el catálogo público ni con todos sus productos a stock cero.

MatrixLab puede agregar piezas de dos formas:

1. **Crear pieza manualmente:** nombre, descripción/variante opcional, foto opcional, unidad comercial y SKU/código interno. Guardar una ficha privada del distribuidor, sin publicación en la tienda. El sistema puede proponer un código único; MatrixLab puede usar su propio SKU dentro del alcance del distribuidor.
2. **Elegir un producto existente:** buscador del catálogo solo para MatrixLab; seleccionar explícitamente producto/variante y precargar nombre, foto y SKU. No precargar cantidad desde stock online ni tratar el precio público como costo para Origami.

Después de crear/seleccionar la pieza, capturar cantidad entregada, costo para Origami y precio sugerido. Permitir guardar borrador o confirmar pieza y entrega en un mismo flujo. No sumar stock hasta la confirmación transaccional. En reposiciones, seleccionar la ficha ya existente y crear un nuevo lote; no duplicar una ficha por cada entrega. Crear otro producto en la tienda no agrega nada a Origami.

Inventario: foto, producto, variante, SKU, cantidad disponible, costo para Origami, precio sugerido y acceso a registrar venta. Si hay costos diferentes, mostrar “Costo según lote” y desplegar desglose; no mostrar un promedio como costo contractual. El formulario de venta calcula su costo con los lotes que realmente consumirá.

MatrixLab registra una entrega con fecha, referencia/notas y renglones de producto/variante, cantidad, costo pactado y sugerido. Preview antes de confirmar. Al confirmar, crear documento y lotes/movimientos de entrada en una transacción. La entrega no genera saldo por pagar. Confirmación idempotente.

Editar un borrador no afecta stock. Una entrega confirmada no se edita ni borra físicamente. Su reversión requiere motivo y solo puede retirar unidades aún disponibles de esos lotes; bloquear si ya se vendieron o devolvieron. Para corregir un lote consumido usar ajustes explícitos compatibles con la trazabilidad, no reescribir su costo histórico.

### 5.3 Registrar venta

Origen de captura: buscar producto/SKU, lector USB/Bluetooth que escribe como teclado, o cámara. Permitir una venta con varios renglones y cantidades enteras positivas.

1. Identificar la pieza/variante dentro de las fichas entregadas a Origami; no buscar el catálogo global como inventario vendible.
2. Mostrar foto/nombre, stock, cantidad, sugerido, precio real editable e importe que corresponderá a MatrixLab. El sugerido precarga el precio real.
3. Repetir escaneo agrega cantidad al borrador, con control contra múltiples detecciones continuas del mismo código.
4. Mostrar resumen y botón “Confirmar venta”. **Leer un código no descuenta stock.**
5. El servidor vuelve a validar permisos, existencia, stock y lotes/costos; confirma toda la venta o ninguno de sus renglones.
6. Descuenta piezas de Origami, crea deuda por el costo pactado y devuelve folio, cantidades e importes definitivos. Si cambió el costo previsto desde el preview, pedir revisar el nuevo resumen antes de confirmar; no sorprender al usuario con otra deuda.

No mezclar el cobro que Origami recibe de su cliente con el pago que hace a MatrixLab. Registrar una venta no la marca liquidada. No integrar Mercado Pago para esta deuda en el MVP.

Deshabilitar doble clic mientras se procesa, pero usar además idempotencia durable. Ante timeout conservar la misma clave y permitir consultar el resultado o reintentar sin duplicar. Validación rechazada permite corregir el borrador y crear una intención nueva. No limpiar el formulario hasta saber que se guardó.

### 5.4 Escáner y etiquetas

Generar código estable por ficha de pieza del distribuidor y resolverlo en el backend, con o sin vínculo al catálogo. QR opaco, sin costos, credenciales ni datos personales. Guardar unicidad en DB. El mismo código puede identificar unidades intercambiables de esa ficha/variante; FIFO resuelve el lote. No hace falta serializar cada pieza individual en el MVP.

Permitir imprimir etiquetas con QR, SKU y nombre corto en una página de impresión. El costo no aparece en la etiqueta. El formato de etiqueta debe probarse visualmente, sin exigir impresora especial.

La cámara se abre por acción del usuario, preferentemente trasera, y se detiene al cerrar, navegar o completar captura. Implementar una alternativa para permisos denegados, cámara ausente o decoder no disponible. No depender exclusivamente de una API experimental del navegador; documentar y probar el decoder elegido, su licencia y su compatibilidad real.

Configurar `Permissions-Policy` para permitir `camera=(self)` **solo en las páginas existentes de escaneo** y mantener el bloqueo en el resto. Verificar las cabeceras finales: dos políticas/overrides no deben terminar bloqueando la cámara. No relajar CSP globalmente. Lecturas de códigos de otro distribuidor, desconocidos o productos sin stock no producen ventas.

### 5.5 Pagos y aplicaciones

MatrixLab registra monto recibido, fecha efectiva, método (`transferencia`, `efectivo`, `otro`), referencia y nota. No procesar una transferencia ni afirmar que existe verificación bancaria automática.

Antes de confirmar, mostrar cuánto se aplicará a ventas y cuánto quedará como crédito. Por defecto distribuir el pago a ventas pendientes de la más antigua a la más nueva. Permitir seleccionar ventas específicas y aplicar importes parciales, sin superar ni la deuda de una venta ni el monto disponible del pago.

Admitir abonos y un pago para varias ventas. Excedente queda como **crédito a favor de Origami**, nunca como deuda negativa. Crédito disponible puede aplicarse, por MatrixLab, a una venta posterior mediante una acción explícita; no contar esa aplicación como dinero nuevamente recibido.

Origami ve fecha, monto, referencia, aplicaciones y saldo de sus pagos. No puede crear aplicaciones ni pagos. Dos aplicaciones simultáneas no pueden usar el mismo saldo dos veces.

Un pago registrado por error se anula con motivo: conservar el documento, revertir sus aplicaciones en la misma transacción y recalcular deuda/crédito. No tocar inventario. Impedir doble anulación. Anular aquí significa corregir el registro; no devolver dinero por banco.

### 5.6 Devoluciones, anulaciones y ajustes

Incluir los tres casos básicos, disponibles para MatrixLab:

- **Retorno de piezas no vendidas de Origami a MatrixLab:** resta piezas disponibles del lote, sin deuda ni pago. Con stock separado no aumenta automáticamente el stock online.
- **Anular venta equivocada:** reversión de todas sus líneas, resta la deuda generada y repone unidades a sus lotes originales. Se conserva venta y reversión.
- **Devolución de cliente sobre una venta:** cantidades parciales por línea, acumuladas hasta el máximo vendido neto. Revierte proporcionalmente el costo pactado original. Reponer solo piezas vendibles; si no son vendibles, registrar destino/merma explícitos sin ponerlas disponibles.

Si la venta tenía pagos aplicados, liberar únicamente la parte de aplicaciones que exceda su nueva deuda, preservando los recibos. Esa cantidad vuelve a crédito disponible. Guardar eventos de reversión de aplicación y recalcular todo en una transacción. No suponer devolución física de dinero a Origami ni al cliente. Los reembolsos bancarios y su conciliación quedan fuera del MVP.

Para una devolución parcial de una línea que consumió varios lotes, vincular la devolución a asignaciones originales y mostrar a MatrixLab el costo que se revierte; nunca usar el costo vigente de otra entrega. Si se liberan aplicaciones de varios pagos, hacerlo de la más reciente a la más antigua, con desempate estable, y guardar el vínculo a cada aplicación revertida.

Ajustes positivos o negativos requieren cantidad, lote/variante y motivo. Positivos crean lote con costo definido; negativos no pueden superar stock. Una merma no genera automáticamente deuda ni cambia una venta; registrar la pérdida y su motivo. Si el negocio requiere cobrar mermas, definirlo después, sin inventar ese acuerdo.

### 5.7 Estado de cuenta y exportación

Mostrar entregas, ventas, devoluciones, pagos, aplicaciones y saldo con folios navegables. CSV con rango, SKU, cantidades, costo pactado, sugerido histórico, venta real, deuda, pagos aplicados, pendiente y crédito. El estado global debe cuadrar con sus documentos.

Para saldo de un periodo, incluir saldo/crédito iniciales, movimientos del periodo y saldo/crédito finales. No restar solamente ventas y pagos filtrados y llamarlo “saldo total”. Neutralizar fórmulas en textos exportados a CSV y aplicar el mismo filtro de autorización que en pantalla.

## 6. Reglas de dinero y trazabilidad

Trabajar con **centavos enteros** en los modelos del módulo; usar rangos seguros explícitos, constraints y validación. Si Postgres devuelve `bigint` como texto, convertir sin perder precisión y rechazar valores fuera del rango admitido. No usar floats para cálculos monetarios. Un campo visual “$100.00” corresponde a `10000` centavos.

- Deuda de una línea = suma de `cantidad consumida del lote × costo unitario pactado del lote`.
- Venta al público = cantidad × precio real capturado. Ese monto es informativo para MatrixLab.
- Deuda neta de una venta = deuda original − reversión de deuda por devoluciones/anulación.
- Pendiente de una venta = deuda neta − aplicaciones netas activas; siempre ≥ 0.
- Pendiente del distribuidor = suma de pendientes de sus ventas.
- Crédito disponible = pagos recibidos no anulados − aplicaciones netas activas; siempre ≥ 0.
- No sumar crédito al dinero recibido ni restarlo otra vez de ventas que ya tienen aplicaciones.
- Stock = entradas − ventas − retornos no vendidos − mermas + devoluciones vendibles + reversión de ventas, por lote y variante.

Snapshot al vender: ficha privada de pieza, nombre/variante, SKU, unidad comercial, costo por lote, sugerido vigente y precio real. Si cambia la ficha o el catálogo vinculado, el histórico mantiene nombre/precios originales. No borrar fichas privadas con documentos referenciados; añadir claves foráneas restrictivas en el módulo para conservarlas. El vínculo opcional al catálogo puede quedar nulo si se elimina ese producto, manteniendo intactas la ficha, sus snapshots y todos los documentos de consignación.

Costos pactados estrictamente positivos en el MVP; precio real puede ser cero con confirmación visible y motivo (el costo sigue siendo exigible). Precio real menor al costo muestra advertencia, pero no altera la deuda. Toda corrección conserva autor, fecha efectiva, fecha de registro y motivo. Folios legibles y únicos; UUID internos sin asumir secuencias sin huecos.

## 7. Modelo de datos propuesto

Puedes ajustar nombres, pero conserva estas entidades, relaciones e invariantes. Entrega un diagrama o tabla del esquema final.

| Entidad sugerida | Datos e invariantes esenciales |
| --- | --- |
| `distributors` | ID, nombre, slug único, estado activo/inactivo. Origami como registro, no condición en código. |
| `distributor_memberships` | ID usuario autenticado, distribuidor, estado y rol. Unicidad de membresía; resolución de permisos en servidor. |
| `consignment_items` | Ficha privada: distribuidor, nombre, descripción/variante, foto, unidad comercial, SKU/código interno, QR único, sugerido vigente y estado borrador/activo/inactivo. SKU único por distribuidor. `product_variant_id` opcional; unicidad distribuidor/variante cuando exista vínculo. Sin copiar stock online. |
| `consignment_deliveries` y líneas | Folio, tipo inicial/reposición, fecha efectiva, renglones, cantidades, snapshots de costo/sugerido, estado y autor. |
| `consignment_lots` | Entrega/ajuste origen, distribuidor, ficha privada de pieza, costo pactado, orden FIFO, cantidad recibida y disponible. Disponible nunca negativa ni mayor a entradas netas autorizadas. No depender de una variante de tienda obligatoria. |
| `consignment_sales` y líneas | Distribuidor, folio, fechas, autor, cantidades, snapshots de producto y precio público. Estado financiero derivado, no marcado arbitrariamente. |
| `consignment_sale_allocations` | Línea de venta, lote, cantidad y costo congelado. Requeridas cuando una línea consume varios lotes. |
| `consignment_returns` y líneas | Venta/asignación o lote origen, ficha privada de pieza, cantidades, motivo, reposición vendible/merma y deuda revertida. Límite acumulado contra lo vendido o disponible. |
| `consignment_payments` | Distribuidor, monto, método, referencia, fechas, actor y eventos de anulación. Monto > 0. |
| `consignment_payment_applications` | Pago, venta, importe y eventos de reversión vinculados. Sumas no mayores al monto disponible ni a deuda neta. |
| `consignment_movements` | Lote/ficha privada de pieza, delta firmado, tipo, documento origen, autor y fecha. Ledger permanente; no borrado físico. |
| `consignment_audit_events` | Acción, actor, entidad, motivo y metadata controlada. Forma parte de la transacción para acciones de negocio. |
| `consignment_idempotency` | Actor, distribuidor, operación, clave, hash canónico del payload y resultado/documento. Unicidad y concurrencia resueltas en DB. |

Constraints, FKs e índices por distribuidor, ficha privada, vínculo opcional a variante, lote, fecha y documentos. Impedir cruces entre distribuidores mediante claves compuestas o comprobaciones transaccionales, además de los guards HTTP. `ON DELETE CASCADE` no debe borrar documentos de negocio al eliminar un producto/usuario. Preferir baja lógica. Las ventas y los lotes referencian la ficha privada obligatoria; el catálogo es solo un vínculo opcional descriptivo.

## 8. Atomicidad y API

Toda operación que afecte stock o dinero debe ejecutarse en una **transacción Postgres**, por ejemplo una función RPC. Varias llamadas independientes `.insert()`/`.update()` de Supabase no son una transacción. No sustituir stock insuficiente por `Math.max(0, ...)` o `greatest(..., 0)`.

Bloquear lotes/documentos financieros pertinentes, revalidar estado y aplicar movimientos, importes, auditoría e idempotencia juntos. Orden consistente de bloqueos para ventas con varias variantes y aplicaciones a varias ventas. Reintentos limitados de deadlocks/serialización conservan la misma intención idempotente. Fallos intermedios dejan cero cambios parciales.

Para reconciliación financiera, serializar las escrituras por distribuidor o usar bloqueos equivalentes: venta, aplicación, devolución y anulación no pueden calcular estados incompatibles. Estado persistido y ledger deben reconciliarse; entregar consultas que detecten divergencias.

Funciones privilegiadas: `search_path` seguro, SQL parametrizado, sin ejecución pública; revocar `EXECUTE` de `PUBLIC`, `anon` y `authenticated`, concederlo solamente al backend que corresponde. `service_role` requiere guards completos y datos derivados de la identidad comprobada. No aceptar autor/rol arbitrarios del body como prueba de autorización.

Contrato orientativo, manteniendo espacios separados para permisos:

| API | Comportamiento |
| --- | --- |
| `/api/admin/distributors` | Listar/crear/actualizar distribuidores y accesos, solo admin. |
| `/api/admin/distributors/[id]/...` | Inventario, entregas, ventas, pagos, aplicaciones, reversión, estado y exportación de ese distribuidor. |
| `/api/admin/distributors/[id]/items` | Crear/editar fichas privadas o vincular una pieza seleccionada del catálogo; no modifica existencias por sí sola. Solo admin. |
| `/api/distributor/auth/...` | Login/logout por usuario y sesión propia; restablecimiento desde la API admin de Accesos. |
| `/api/distributor/inventory` | Inventario del distribuidor derivado de membresía. |
| `/api/distributor/scan` | Resolver código dentro de su inventario, sin mutación. |
| `/api/distributor/sales/preview` | Resolver stock, lotes y deuda previstos, con versión/token ligado a ese resumen. |
| `/api/distributor/sales` | Consultar y confirmar venta propia. |
| `/api/distributor/statement` y `/export` | Estado y CSV propios, paginados/filtrados. |

No es obligatorio adoptar exactamente esas URLs; documentar las finales. Las APIs admin exigen el guard admin actual y CSRF en mutaciones. Las de distribuidor exigen sesión verificada, membresía activa, guard de propiedad y protección CSRF ligada a su sesión; login tiene validación de origen y protección contra fuerza bruta. Validar consultas, params y bodies con Zod estricto, límites de tamaño/cantidad y paginación. Ignorar o rechazar precios pactados y totales enviados por Origami: resolverlos de la DB.

Respuestas de error con código estable y mensaje en español: sesión inválida, prohibido, datos inválidos, stock insuficiente, recurso no encontrado, operación repetida/conflicto de intención y servicio no disponible. Sin detalles SQL ni información que confirme existencia de recursos ajenos. Ante caída de DB responder error explícito, no inventario vacío o datos mock como si fueran reales.

Usar `Idempotency-Key` o contrato equivalente en todas las mutaciones de negocio. Misma clave/contexto/payload devuelve el mismo resultado sin duplicar; misma clave con payload distinto devuelve conflicto. Comprobar permisos antes de devolver una respuesta idempotente almacenada. Reinicios del servidor no deben borrar esa garantía. Una reversión no permite volver a usar la intención original para repetir el documento.

## 9. Seguridad e integración de interfaz

RLS activado y privilegios directos revocados en las tablas privadas nuevas. Que el catálogo público siga legible no autoriza leer datos de consignación. Probar acceso directo con `anon` y `authenticated`, acceso a RPC y manipulación de todos los IDs de documentos.

Cookies seguras, HttpOnly donde corresponda, SameSite y expiración; logout/revocación efectivos. No confiar únicamente en claims del navegador ni en ocultar botones. Middleware/redirección no sustituyen guards de página/API. Desactivar membresía debe bloquear el siguiente request incluso con sesión del proveedor aún válida.

Páginas privadas con `robots: noindex`, `force-dynamic` y respuestas `Cache-Control: private, no-store` para datos de stock/cuenta. No cachear datos de un distribuidor bajo una clave común. Probar que alternar sesiones no filtra datos.

Crear `CONSIGNMENTS_ENABLED` como flag de servidor, apagado por defecto y documentado en `.env.example`. Con flag apagado ocultar navegación y rechazar acceso a páginas/APIs del módulo. No usar la bandera como único control de autorización.

Respetar tipografía, colores y componentes existentes. Interfaz en español, pensada para celular: tabla/card legible, campos etiquetados, estados vacíos, foco, teclado y controles táctiles de al menos 44 px. Sin depender solo del color para “pendiente”, “parcial” o “pagado”. Confirmaciones financieras muestran cantidades, costo y saldo resultante.

## 10. Ejemplo de aceptación obligatorio

Estos valores son **fixtures sintéticos**, nunca precios reales de Origami:

1. MatrixLab entrega 10 unidades del SKU `DEMO-ORI-01`, costo $100.00, sugerido $180.00. Stock Origami = 10; deuda = $0.00. Stock online sin cambios.
2. Origami vende 3 a $170.00 cada una. Stock = 7; venta al público = $510.00; deuda a MatrixLab = $300.00.
3. Reenviar la confirmación con la misma clave conserva exactamente esos valores y el mismo folio.
4. MatrixLab registra pago de $150.00 aplicado a esa venta. Pendiente = $150.00; estado = parcialmente pagada.
5. MatrixLab registra otro pago de $150.00. Pendiente = $0.00; estado = pagada; stock continúa en 7.
6. Se devuelve una unidad vendible de esa venta. Stock = 8; deuda neta = $200.00; recibos conservados por $300.00; aplicaciones netas = $200.00; crédito = $100.00; pendiente = $0.00.
7. Origami vende otra unidad con costo $100.00. Stock = 7; pendiente de esa venta = $100.00; crédito = $100.00. MatrixLab aplica el crédito: pendiente = $0.00 y crédito = $0.00, sin un nuevo recibo de dinero.

Fixture separado de costos por lote: recibir 2 a $100.00 y 3 a $120.00; vender 3 consume 2 del primer lote y 1 del segundo, generando deuda de **$320.00**, con 2 piezas restantes a costo $120.00. Cambiar el sugerido no cambia esa deuda.

## 11. Pruebas que Claude debe generar y ejecutar

Entregar runners y scripts de `package.json` reproducibles, con dependencias de pruebas declaradas en el lockfile. Usar el runner existente cuando resulte adecuado; para E2E puede agregarse Playwright. Implementar suites separadas de dominio, integración Postgres, seguridad y navegador.

La integración usa Postgres/Supabase **aislado de pruebas**, con migraciones reales. No basta un mock que siempre devuelve éxito. Configuración separada (`CONSIGNMENTS_TEST_*` o equivalente), verificación del destino antes de mutaciones y limpieza exclusivamente de fixtures identificados. Si faltan servicios/credenciales, fallar con explicación: no anunciar que todo pasó por saltar pruebas. No usar `.env.local` productivo como fallback.

| ID | Escenario | Resultado verificable |
| --- | --- | --- |
| T01 | Entrega inicial y reposición | Aumentan stock correcto, crean lotes/ledger, deuda cero y stock online intacto. |
| T02 | Venta simple y multilínea | Stock y deuda exactos; snapshots y folios persistidos. |
| T03 | FIFO con costos distintos | Distribución 2×100 + 1×120 = 320 del ejemplo; sin promediar ni actualizar histórico. |
| T04 | Cantidades/precios inválidos | Rechazar negativos, fracciones de cantidad, nulos, overflow y campos financieros/actor inyectados. |
| T05 | Stock insuficiente en una línea | Ninguna línea ni documento se confirma; ledger, deuda y stock sin cambios. |
| T06 | Última pieza desde dos sesiones | Solo una venta distinta se confirma; otra recibe conflicto/stock insuficiente; nunca stock negativo. |
| T07 | Idempotencia secuencial y concurrente | Mismo payload/clave = un documento; payload distinto/clave igual = conflicto; persiste tras reinicio. |
| T08 | Fallo a mitad de una transacción | Rollback de stock, documentos, dinero, auditoría e intención; reintento seguro. |
| T09 | Pagos parcial, total y para varias ventas | Importes y estados derivados exactos; ninguna aplicación supera deuda o recibo. |
| T10 | Excedente y aplicación de crédito | Crédito separado; aplicado una vez; no aumenta pagos recibidos. |
| T11 | Dos aplicaciones simultáneas | No se utiliza dos veces el mismo crédito ni se sobrepaga una venta. |
| T12 | Anulación de pago | Preserva recibo, revierte aplicaciones, reabre deuda; inventario intacto; doble anulación bloqueada. |
| T13 | Venta anulada y devolución parcial | Repone lotes originales cuando procede, revierte deuda original y libera crédito correcto de pagos previos. |
| T14 | Retorno no vendido, merma y reversión de entrega | No generan deuda; no exceden disponible; entrega consumida no se borra/revierte indebidamente. |
| T15 | Devoluciones repetidas y concurrentes | La suma nunca supera venta neta; cantidades, dinero y stock se mantienen conciliados. |
| T16 | Aislamiento A/B | Cuenta Origami no lee ni muta inventario, venta, pago, lote, QR o CSV de otro distribuidor cambiando IDs. |
| T17 | Permisos y acceso directo | Origami no cobra, invita ni entra a admin; `anon`/`authenticated` sin acceso a tablas/RPC privadas. |
| T18 | Sesión, CSRF y revocación | Sesión expirada, manipulada/revocada y membresía desactivada rechazadas; mutaciones sin CSRF rechazadas. |
| T19 | Escaneo | QR propio resuelve variante; código ajeno/desconocido no; detectar código no descuenta; lector teclado y manual funcionan. |
| T20 | Cámara y cabeceras | Permiso solo en escáner; no rompe CSP/nonce ni cabeceras existentes; permisos denegados muestran alternativa. |
| T21 | Red interrumpida y timeout | Borrador preservado, misma intención, consulta/reintento sin duplicado y sin falso éxito. |
| T22 | Dos sesiones y refresco | Venta/pago visible en la otra en ≤20 s; estados de error claros si falla DB. |
| T23 | Histórico, CSV y rangos | Cambio de catálogo/sugerido no reescribe documentos; fecha local, saldo inicial/final y CSV concilian. |
| T24 | Feature flag, caché y secretos | Flag apagado bloquea módulo; no filtración entre sesiones ni credenciales en bundle/respuestas/logs. |
| T25 | Navegador y accesibilidad | Completar entrega → venta → abono → liquidación desde móvil y escritorio, teclado y formularios etiquetados. |
| T26 | Migraciones y regresión | Aplicar sobre DB limpia y DB existente de pruebas; tienda, carrito, checkout, webhook, diseñador y admin conservan sus flujos. |
| T27 | Inicio vacío y altas graduales | Con catálogo online lleno, Origami empieza vacío. Entregar 2 de una pieza muestra solo esa ficha y 2 unidades. Una nueva alta en la tienda no aparece en Origami; los borradores privados tampoco. |
| T28 | Pieza creada solo para Origami | Crear ficha sin `product_variant_id`, entregar, escanear, vender y aplicar pago correctamente. La pieza no se publica en la tienda ni altera su stock. |
| T29 | Producto de tienda no asignado | Aunque tenga stock online, Origami no puede listarlo como suyo, resolverlo para vender ni confirmar venta manipulando IDs. Crear/asignar fichas por API como Origami se rechaza. |

Las pruebas de concurrencia deben usar conexiones/transacciones separadas y verificar estado final en DB, no solo botones deshabilitados. Inyectar el fallo de T08 en un entorno de prueba controlado; no agregar un interruptor público de fallos al producto.

E2E mínimo: sesión MatrixLab y sesión Origami separadas; un tercer usuario de otro distribuidor para probar aislamiento. Pantallas en 390×844 y escritorio. Para cámara, automatizar decoder con imágenes/fixtures cuando sea viable y completar prueba manual en celular sobre HTTPS; un QR simulado no prueba acceso a cámara real. Marcar por separado lo automatizado y lo probado en hardware.

Comandos esperados al terminar (Claude debe crearlos y documentar sus requisitos):

```powershell
npm ci
npm run type-check
npm run test:consignments
npm run test:consignments:db
npm run test:consignments:security
npm run test:consignments:e2e
npm run build
```

Ejecutar también las suites actuales de `scripts/qa/*.test.ts` con el runner y configuración adecuados; documentar un comando agregado que falle si una suite falla. Conservar los tests de contratos y cabeceras; extenderlos al nuevo espacio de rutas. No borrar aserciones para acomodar una implementación insegura.

Verificar ESLint por separado. El `lint` actual apunta a `next lint`, y el build omite lint; revisar su funcionamiento y entregar comando válido para los archivos afectados, informando incompatibilidades preexistentes. No marcar lint como pasado porque `build` pasó, ni efectuar actualizaciones masivas de dependencias ajenas al módulo.

## 12. Entregables de Claude

1. Código integrado y navegación de ambos roles; flag apagado por defecto.
2. Migraciones SQL aditivas, funciones transaccionales, RLS/privilegios, índices y consultas de reconciliación.
3. Fixtures sintéticos separados de cualquier seed productivo, al menos Origami de prueba y distribuidor B.
4. Pruebas unitarias, integración, seguridad y E2E, con comandos exactos y requisitos del entorno.
5. `docs/ORIGAMI_IMPLEMENTACION.md`: arquitectura final, rutas, tablas, autenticación, supuestos, dependencias, limitaciones y preparación del entorno.
6. `docs/ORIGAMI_TEST_REPORT.md`: commit probado, comandos, fecha, entorno, resultados reales, fallos/pendientes, logs sanitizados y capturas. No inventar evidencia.
7. `docs/ORIGAMI_RELEASE_RUNBOOK.md`: pasos de staging/producción, variables sin valores secretos, respaldo, alta real de Origami, carga inicial, smoke tests y rollback.
8. Resumen final de Claude con rama/commit, archivos cambiados, resultado de cada suite y puntos que Codex debe revisar. Terminar con **“Pendiente de validación independiente por Codex; no desplegado a producción”** mientras esa sea la situación real.

No dar por resuelta una suite saltada ni omitir el pendiente de cámara real. Si falla una prueba previa a los cambios, registrar baseline con evidencia y distinguir la regresión nueva; no ocultarla ni ampliar alcance sin necesidad.

## 13. Validación independiente de Codex antes de producción

Esta sección define trabajo futuro de revisión; escribir el documento no ejecuta ni acredita esta validación.

Cuando Claude entregue la implementación, Codex debe:

- Comparar diff con esta especificación y verificar supuestos, permisos, guards y aislamiento en cada endpoint/página/exportación.
- Revisar SQL: constraints, FKs, bloqueos, FIFO, idempotencia, concurrencia, auditoría atómica, RLS, privilegios de funciones y reversión de dinero.
- Ejecutar por su cuenta checks y suites en entorno aislado, sobre el mismo commit entregado; no basarse únicamente en el reporte de Claude.
- Reproducir el ejemplo numérico, los casos de última pieza, pago doble, devolución pagada y ataque entre distribuidores, consultando DB final.
- Validar interfaz en móvil/escritorio, dos sesiones, escáner y headers en staging. Completar/registrar prueba de cámara real.
- Verificar que costos privados no aparecen en catálogo público, caché, bundles o exportaciones ajenas, y que tienda/checkout/admin siguen operativos.
- Revisar runbook, carga inicial y recuperación; informar hallazgos con gravedad, evidencia y solución requerida.
- Crear `docs/ORIGAMI_CODEX_VALIDATION.md` con commit validado, suites ejecutadas, evidencia, hallazgos pendientes y veredicto **APROBADO** o **NO APROBADO**.

Un fix posterior cambia el commit: volver a validar los controles afectados y actualizar el veredicto. No reutilizar una aprobación de un commit anterior para cambios sin revisar.

## 14. Criterios de liberación y operación

Solo proponer producción cuando:

- T01–T29 pasan con evidencia; prueba de cámara física y cabeceras en HTTPS realizada.
- Type-check, build, lint aplicable y regresión completados; cualquier limitación previa tiene evidencia y evaluación explícita de Codex.
- No existen defectos abiertos que afecten saldo, stock, permisos, transacciones, idempotencia o privacidad.
- Codex emite **APROBADO** para el commit concreto.
- Staging usa DB/identidades distintas de producción y el alta/carga inicial real aún no se ha confundido con fixtures.

Runbook: respaldar y verificar destino, aplicar migraciones aprobadas, publicar el commit validado con módulo apagado, probar compatibilidad, crear acceso real controlado de Origami, cargar únicamente cantidades/costos confirmados, verificar inventario y habilitar el módulo. La promoción productiva será un paso posterior a esta tarea de especificación/implementación/revisión.

Rollback preferido: apagar flag y volver al código compatible anterior conservando datos/ledger; no ejecutar `DROP`, borrar ventas/pagos ni restaurar un respaldo que pierda operaciones ya registradas. Tras escrituras reales, reparar con migración forward y reconciliación. Entregar consultas para detectar stock/ledger divergentes, aplicaciones excesivas, deuda inconsistente y documentos incompletos.

Fuera de esta versión: facturación fiscal, conciliación bancaria automática, cobro online a Origami, app nativa, modo offline, serial individual de cada pieza, reembolso bancario, inventario multi-almacén completo y transferencias automáticas desde el stock de e-commerce. Si se requiere transferir desde stock central más adelante, especificar una transacción que reste el origen y sume destino exactamente una vez; no improvisarlo ni descontar nuevamente al registrar una venta de Origami.
