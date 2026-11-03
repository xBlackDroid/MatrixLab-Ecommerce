# Marcas de agua y protección disuasiva del catálogo

Integración del 3 de noviembre de 2026 sobre main `31ada9a5818ff04294ab300c85671cc9cef8eeb9`.
Se conservan las versiones actuales de Wear, cotizador, bazar y cursos.

La plantilla `StoreImage` aplica el logo de Wear, 3D, Tumbler, Stickers, Láser o
Escolar sin modificar archivos originales. La marca central tiene opacidad
24%; la firma de esquina, 52%. Las miniaturas de hasta 100 px muestran sólo
el centro. Las capas no interceptan clics de galerías ni controles de color.
La familia explícita o categoría prevalece sobre el nombre de archivo.

La configuración está en `src/lib/store/image-watermark.ts`; estilos en
`src/components/store/StoreImage.module.css`. Los catálogos, fichas, colores,
miniaturas, carrito y galería fotográfica del curso usan el componente. Las
nuevas imágenes que pasen por esas plantillas heredan la marca automáticamente.
Los logos de navegación siguen sin marca.

## Protección y límites

- Se limitan clic derecho, arrastre de fotos y atajos comunes de inspección,
  código fuente y guardar página en las páginas públicas. Se conservan los
  menús de edición de formularios y los controles de admin y distribuidores.
- El middleware devuelve 403 al abrir una foto local como documento, también
  mediante `/_next/image`. Las fotos incrustadas siguen cargando. Los rechazos
  llevan `private, no-store`; los logos de categoría siguen disponibles.
- Fetch Metadata es un disuasivo: un cliente HTTP puede omitir o falsificar
  esos headers y recuperar el original. No es autenticación ni DRM.
- La consola puede abrirse desde los menús del navegador; la capa visual puede
  retirarse. Las capturas siguen siendo posibles. Proteger realmente el
  original requiere almacenamiento privado y servir derivados marcados.

Los metadatos, `/ai-usage.txt`, el footer y `/robots.txt` declaran condiciones
de uso y exclusión de crawlers de entrenamiento. Son avisos voluntarios, sin
excluir buscadores. Las marcas y personajes ajenos pertenecen a sus titulares.
No se migran datos, no se cambian secretos ni se editan fotografías originales.
El preview de comparación de originales permanece sólo en el workspace local.

## Validación del release

- Build de producción y chequeo de tipos completos.
- ESLint de componentes y utilidades nuevas.
- 33 comprobaciones específicas de logos, navegación de fotos, CSP y compatibilidad.
- 81 comprobaciones de navegador sobre el build de producción: ocho rutas,
  marcas de familia, carga de fotos, dimensiones, colores de playera/sudadera/
  gorra, anchos 1440/390/320 px, acceso directo y optimizado, edición de campos,
  rutas del bazar y cotizador y ausencia de errores de ejecución.
- Regresión general: 24/30 suites. Las seis suites fallidas también fallan en
  una copia limpia del mismo main: admin-inventory-price, bazar-http,
  matrixlab-3d, production-reference, tumbler-cups y tumbler-ready. Incluyen
  contratos de snapshot y cantidades de catálogo anteriores, y un runner sin
  condición react-server. No se alteran esas reglas históricas en este cambio.
- Se intentó revisión independiente con Claude Code, sin permisos de escritura.
  No pudo ejecutarse por sesión OAuth vencida; no se afirma revisión de Claude.

Deployment previo para reversión: `dpl_Gafr1JWRecgmbvUXJZTGKmFfjjMd`
(`matrix-lab-ecommerce-48vxlkzd5-matrixlabintelligence.vercel.app`).
