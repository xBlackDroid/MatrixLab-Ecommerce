/**
 * QA de PRENDAS LISTAS: sudaderas adulto (wear-sudadera-su001 … su005), filtro
 * por tipo en /tienda/prendas-listas y regla de foto real.
 *
 * Sin base de datos ni red: las variables de Supabase se vacían ANTES de
 * importar el catálogo, que cae a los mocks. Verifica:
 *   - lista cerrada de colores por prenda y rutas EXACTAS de foto;
 *   - playeras intactas (3 colores, Negra, segunda foto wr005/wr030, archivos);
 *   - un `?color=` ajeno a la prenda nunca arma una ruta: cae a su default;
 *   - color de la línea del carrito y enlace de vuelta a la ficha;
 *   - tipo de prenda por handle, etiqueta y categoría;
 *   - foto real: vacío, placeholder, logo, mockup y URLs inseguras fuera;
 *   - filtros combinados, URL compartible y colección incompatible soltada;
 *   - vitrina (mocks) sin placeholders, relacionados, miniatura admin.
 *
 * Uso: npx tsx scripts/qa/ready-wear.test.ts
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReadyWearColor } from "../../src/lib/store/ready-wear-colors";
import type { ReadyWearFilters } from "../../src/lib/store/ready-wear";

// El catálogo importa "server-only": se relanza con la condición react-server
// (igual que admin-inventory.test.ts) para poder importarlo.
if (!process.execArgv.join(" ").includes("react-server")) {
  const result = spawnSync(
    process.execPath,
    ["--conditions=react-server", "--import", "tsx", __filename],
    { stdio: "inherit", env: process.env },
  );
  process.exit(result.status ?? 1);
}

// Nunca contra una base real: sin estas variables el catálogo usa los mocks.
for (const key of [
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]) {
  delete process.env[key];
}

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

const HOODIES = [1, 2, 3, 4, 5].map((n) => `wear-sudadera-su00${n}`);
const HOODIE_LABELS = [
  "Lila",
  "Negro",
  "Blanco",
  "Negro jaspe",
  "Gris jaspe",
  "Rojo",
  "Azul marino",
  "Azul royal",
  "Rosa pastel",
];
const HOODIE_FILES = [
  "lila",
  "negro",
  "blanco",
  "negro-jaspe",
  "gris-jaspe",
  "rojo",
  "azul-marino",
  "azul-royal",
  "rosa-pastel",
];
const SHIRTS = Array.from(
  { length: 34 },
  (_, i) => `wear-lista-wr${String(i + 1).padStart(3, "0")}`,
);
const SHIRT = "wear-lista-wr001";
const TOTE = "wear-tote-to001";

async function main() {
  const colors = await import("../../src/lib/store/ready-wear-colors");
  const wear = await import("../../src/lib/store/ready-wear");
  const { MOCK_PRODUCTS } = await import("../../src/lib/store/mock-data");
  const catalog = await import("../../src/lib/store/products");
  const { inventoryBlockOf, presentInventoryEntries } = await import(
    "../../src/lib/store/inventory-presentation"
  );

  // -------------------------------------------------------------------------
  console.log("\n--- Colores y fotos por prenda ---");
  check(
    "sudaderas: los 9 colores exactos, en orden",
    HOODIES.every((h) => same(colors.getReadyWearColors(h).map((c) => c.label), HOODIE_LABELS)),
  );
  check(
    "sudaderas: Lila por defecto",
    HOODIES.every((h) => colors.getDefaultReadyWearColor(h) === "Lila"),
  );
  const hoodiePaths = HOODIES.flatMap((h, i) =>
    HOODIE_LABELS.map((label, j) => ({
      got: colors.readyWearColorImages(h, label as ReadyWearColor),
      want: [`/images/matrixlab-wear/hoodies/su00${i + 1}-${HOODIE_FILES[j]}.webp`],
    })),
  );
  check(
    "sudaderas: 45 rutas exactas (una foto por color)",
    hoodiePaths.length === 45 && hoodiePaths.every((p) => same(p.got, p.want)),
    hoodiePaths.find((p) => !same(p.got, p.want))?.got.join(", "),
  );
  check(
    "playeras: Blanca, Negra, Gris y Negra por defecto",
    SHIRTS.every(
      (h) =>
        same(colors.getReadyWearColors(h).map((c) => c.label), ["Blanca", "Negra", "Gris"]) &&
        colors.getDefaultReadyWearColor(h) === "Negra",
    ) && colors.DEFAULT_READY_WEAR_COLOR === "Negra",
  );
  check(
    "playeras: wr005 y wr030 conservan su segunda foto",
    same(colors.readyWearColorImages("wear-lista-wr005", "Gris"), [
      "/images/matrixlab-wear/colors/wr005-gris.webp",
      "/images/matrixlab-wear/colors/wr005-gris-2.webp",
    ]) &&
      same(colors.readyWearColorImages("wear-lista-wr030", "Blanca"), [
        "/images/matrixlab-wear/colors/wr030-blanca.webp",
        "/images/matrixlab-wear/colors/wr030-blanca-2.webp",
      ]) &&
      same(colors.readyWearColorImages(SHIRT, "Negra"), [
        "/images/matrixlab-wear/colors/wr001-negra.webp",
      ]),
  );
  const shirtFiles = SHIRTS.flatMap((h) =>
    colors.READY_WEAR_COLORS.flatMap((c) => colors.readyWearColorImages(h, c.label)),
  );
  const missingShirt = shirtFiles.filter((p) => !existsSync(join(ROOT, "public", p)));
  check(
    `playeras: las ${shirtFiles.length} fotos por color existen en public/`,
    shirtFiles.length === 34 * 3 + 2 * 3 && missingShirt.length === 0,
    missingShirt.slice(0, 5).join(", "),
  );
  const hoodieDir = join(ROOT, "public", "images", "matrixlab-wear", "hoodies");
  if (existsSync(hoodieDir)) {
    const missingHoodie = hoodiePaths
      .flatMap((p) => p.want)
      .filter((p) => !existsSync(join(ROOT, "public", p)));
    check("sudaderas: las 45 fotos existen en public/", missingHoodie.length === 0, missingHoodie.slice(0, 5).join(", "));
  } else {
    console.log("· sudaderas: public/images/matrixlab-wear/hoodies/ aún no existe (las fotos las sube el release)");
  }

  check(
    "isReadyWearShirtHandle sigue siendo SÓLO playeras",
    SHIRTS.every(colors.isReadyWearShirtHandle) &&
      !HOODIES.some(colors.isReadyWearShirtHandle) &&
      !["wear-lista-wr000", "wear-lista-wr035", TOTE].some(colors.isReadyWearShirtHandle),
  );
  check(
    "las playeras y sudaderas con fotografía siguen admitidas y los genéricos quedan fuera",
    [...SHIRTS, ...HOODIES].every(colors.isReadyWearGarmentHandle) &&
      ![
        "wear-sudadera-su000",
        "wear-sudadera-su010",
        "wear-sudadera-su01",
        TOTE,
        "sudadera-personalizada",
        "playera-personalizada",
        "wear-ge001",
        "",
      ].some(colors.isReadyWearGarmentHandle),
  );
  check(
    "?color=lila en una playera: sin ruta inventada, cae a Negra",
    same(colors.readyWearColorImages(SHIRT, "Lila"), []) &&
      colors.parseReadyWearColorFor(SHIRT, "lila") === null &&
      colors.resolveReadyWearColor(SHIRT, "lila") === "Negra",
  );
  check(
    "?color=negra en una sudadera: no es suyo, cae a Lila",
    same(colors.readyWearColorImages(HOODIES[0], "Negra"), []) &&
      colors.parseReadyWearColorFor(HOODIES[0], "negra") === null &&
      colors.resolveReadyWearColor(HOODIES[0], "negra") === "Lila",
  );
  check(
    "slug, etiqueta y mayúsculas se aceptan",
    colors.parseReadyWearColorFor(HOODIES[1], "negro-jaspe") === "Negro jaspe" &&
      colors.parseReadyWearColorFor(HOODIES[1], " NEGRO JASPE ") === "Negro jaspe" &&
      colors.parseReadyWearColorFor(HOODIES[1], "Azul royal") === "Azul royal" &&
      colors.parseReadyWearColorFor(SHIRT, "GRIS") === "Gris",
  );
  const hostile = ["", "  ", "../../etc/passwd", "lila.webp", "negro_jaspe", "<img src=x>", "__proto__", "constructor", "javascript:alert(1)"];
  check(
    "valores hostiles de ?color= se rechazan",
    hostile.every((v) => colors.parseReadyWearColorFor(HOODIES[0], v) === null) &&
      colors.parseReadyWearColorFor(HOODIES[0], null) === null &&
      colors.parseReadyWearColorFor("wear-tote-to001", "Lila") === null,
  );
  check(
    "API previa: parseReadyWearColor sigue siendo de playeras",
    colors.parseReadyWearColor("Negra") === "Negra" &&
      colors.parseReadyWearColor(" blanca ") === "Blanca" &&
      colors.parseReadyWearColor("lila") === null,
  );
  check(
    "foto de variante (carrito / inventario admin)",
    colors.readyWearVariantImage(HOODIES[1], "Negro jaspe") ===
      "/images/matrixlab-wear/hoodies/su002-negro-jaspe.webp" &&
      colors.readyWearVariantImage(SHIRT, "Negra") ===
        "/images/matrixlab-wear/colors/wr001-negra.webp" &&
      colors.readyWearVariantImage(HOODIES[1], "Negra") === null &&
      colors.readyWearVariantImage(TOTE, "Negra") === null,
  );
  check(
    "color de la línea del carrito: columna color, luego título",
    colors.readyWearVariantColor(HOODIES[2], { color: "Gris jaspe", title: "Hombre / Chica / Lila" }) === "Gris jaspe" &&
      colors.readyWearVariantColor(HOODIES[2], { color: null, title: "Mujer / Chica / Azul marino" }) === "Azul marino" &&
      colors.readyWearVariantColor(HOODIES[2], { title: "Rosa pastel / Mujer / Grande" }) === "Rosa pastel" &&
      colors.readyWearVariantColor(SHIRT, { title: "Hombre / Mediana / Negra" }) === "Negra" &&
      colors.readyWearVariantColor(TOTE, { color: "Negra", title: "Negra" }) === null,
  );
  check(
    "enlace de la línea a su ficha conserva el color",
    colors.readyWearProductHref(HOODIES[2], "Negro jaspe") ===
      "/tienda/producto/wear-sudadera-su003?color=negro-jaspe" &&
      colors.readyWearProductHref(SHIRT, "Gris") === "/tienda/producto/wear-lista-wr001?color=gris" &&
      colors.readyWearProductHref(SHIRT, "Lila") === "/tienda/producto/wear-lista-wr001" &&
      colors.readyWearProductHref(TOTE, null) === "/tienda/producto/wear-tote-to001",
  );

  // -------------------------------------------------------------------------
  console.log("\n--- Tipo de prenda ---");
  const typeOf = wear.readyWearTypeOf;
  check("playeras por handle", SHIRTS.every((h) => typeOf({ handle: h }) === "playeras"));
  check("sudaderas por handle", HOODIES.every((h) => typeOf({ handle: h }) === "sudaderas"));
  check(
    "totes por handle (to001 … to004)",
    ["wear-tote-to001", "wear-tote-to002", "wear-tote-to003", "wear-tote-to004"].every((h) => typeOf({ handle: h }) === "totes") &&
      typeOf({ handle: "wear-tote-to005" }) === null,
  );
  check(
    "etiquetas del release de sudaderas",
    typeOf({ handle: "nueva", tags: ["matrixlab-wear", "prenda-lista", "tipo:sudaderas", "adulto", "coleccion:sudaderas"] }) === "sudaderas" &&
      typeOf({ handle: "nueva", tags: ["Tipo:Gorras"] }) === "gorras",
  );
  check(
    "categoría: gorras, wear-sudaderas, colecciones de playeras, wear-totes",
    typeOf({ handle: "x", categoryHandle: "gorras" }) === "gorras" &&
      typeOf({ handle: "x", categoryHandle: "wear-sudaderas" }) === "sudaderas" &&
      typeOf({ handle: "x", categoryHandle: "wear-toluca" }) === "playeras" &&
      typeOf({ handle: "x", categoryHandle: "wear-totes" }) === "totes",
  );
  check(
    "colección sola (coleccion:totes) y sin señal → null",
    typeOf({ handle: "x", tags: ["coleccion:totes"] }) === "totes" &&
      typeOf({ handle: "playera-personalizada", categoryHandle: "playeras-prendas" }) === null &&
      typeOf({ handle: "x", tags: ["tipo:hoodies"] }) === null,
  );
  check(
    "el handle conocido manda sobre una etiqueta contradictoria",
    typeOf({ handle: SHIRT, tags: ["tipo:gorras"], categoryHandle: "gorras" }) === "playeras",
  );
  check(
    "?tipo= con lista cerrada",
    wear.parseReadyWearType("sudaderas") === "sudaderas" &&
      wear.parseReadyWearType(" SUDADERAS ") === "sudaderas" &&
      wear.parseReadyWearType(["gorras", "playeras"]) === "gorras" &&
      ["hoodies", "", "constructor", "__proto__", "<script>"].every((v) => wear.parseReadyWearType(v) === null) &&
      wear.parseReadyWearType(undefined) === null,
  );
  check(
    "filtro: Todos los tipos + Playeras, Sudaderas, Totes, Gorras",
    same(wear.READY_WEAR_TYPES.map((t) => t.label), ["Playeras", "Sudaderas", "Totes", "Gorras"]),
  );

  // -------------------------------------------------------------------------
  console.log("\n--- Foto real ---");
  const real = [
    "/images/matrixlab-wear/totes/to001.webp",
    "/images/matrixlab-wear/wr001.webp",
    "/images/matrixlab-wear/hoodies/su001-lila.webp",
    "https://abc.supabase.co/storage/v1/object/public/product-images/tote.webp",
  ];
  const fake = [
    "",
    "   ",
    "/images/matrixlab-wear/placeholder.webp",
    "/images/tumbler/vasos/placeholder.webp",
    "/images/categories/matrixlab-wear.png",
    "/images/matrixlab-wear/matrixlab-wear.png",
    "/images/products/playeras/mockups/front/blanco.webp",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "//evil.example.com/x.webp",
    "http://abc.supabase.co/x.webp",
    "https://abc.supabase.co/storage/v1/object/public/product-images/placeholder.webp",
  ];
  check("fotos reales aceptadas", real.every(wear.isProductPhoto), real.filter((s) => !wear.isProductPhoto(s)).join(", "));
  check(
    "vacío, placeholder, logo, mockup y URLs inseguras rechazados",
    fake.every((s) => !wear.isProductPhoto(s)) && [null, undefined, 42, {}].every((s) => !wear.isProductPhoto(s)),
    fake.filter((s) => wear.isProductPhoto(s)).join(", "),
  );

  const legacy = MOCK_PRODUCTS.filter((p) =>
    ["playera-personalizada", "gorra-personalizada", "tote-bag-personalizada"].includes(p.handle),
  );
  check(
    "playera/gorra/tote personalizadas (sin foto) quedan fuera",
    legacy.length === 3 && legacy.every((p) => wear.toReadyWearListing(p, "playeras-prendas") === null),
  );
  const base = legacy[0];
  const shirt = wear.toReadyWearListing({ ...base, handle: SHIRT, images: [] }, "wear-toluca");
  const hoodie = wear.toReadyWearListing({ ...base, handle: HOODIES[0], images: [] }, "wear-sudaderas");
  check(
    "playera y sudadera sin `images` usan su foto de color por defecto",
    same(shirt?.images, ["/images/matrixlab-wear/colors/wr001-negra.webp"]) &&
      shirt?.readyWearType === "playeras" &&
      same(hoodie?.images, ["/images/matrixlab-wear/hoodies/su001-lila.webp"]) &&
      hoodie?.readyWearType === "sudaderas",
  );
  const tote = wear.toReadyWearListing(
    { ...base, handle: TOTE, images: ["/images/matrixlab-wear/placeholder.webp", " /images/matrixlab-wear/totes/to001.webp "] },
    "wear-totes",
  );
  check(
    "tote: sólo sus fotos reales, en orden; resto del producto intacto",
    same(tote?.images, ["/images/matrixlab-wear/totes/to001.webp"]) &&
      tote?.readyWearType === "totes" &&
      tote?.base_price === base.base_price &&
      tote?.status === base.status &&
      same(tote?.tags, base.tags),
  );
  check(
    "tote con sólo placeholder/logo queda fuera",
    wear.toReadyWearListing(
      { ...base, handle: TOTE, images: ["/images/matrixlab-wear/placeholder.webp", "/images/categories/matrixlab-wear.png"] },
      "wear-totes",
    ) === null,
  );

  // -------------------------------------------------------------------------
  console.log("\n--- Filtros combinados y URL ---");
  const listing = (handle: string, title: string, tags: string[], categoryHandle: string) =>
    wear.toReadyWearListing({ ...base, id: handle, handle, title, tags, images: [`/images/x/${handle}.webp`] }, categoryHandle)!;
  const products = [
    listing("wear-lista-wr001", "Toluca Campeón", ["coleccion:toluca"], "wear-toluca"),
    listing("wear-lista-wr002", "Toluca Diablos", ["coleccion:toluca"], "wear-toluca"),
    listing("wear-lista-wr003", "GTA Vice", ["coleccion:gta"], "wear-gta"),
    ...HOODIES.map((h, i) =>
      listing(h, ["Architect", "Barista", "Dance Teacher", "Coach", "Wife"][i], ["matrixlab-wear", "prenda-lista", "tipo:sudaderas", "adulto", "coleccion:sudaderas"], "wear-sudaderas"),
    ),
    listing("wear-tote-to001", "Tote Flores", ["coleccion:totes"], "wear-totes"),
  ];
  const run = (filters: Partial<ReadyWearFilters>) =>
    wear.filterReadyWearListings(products, { ...wear.EMPTY_READY_WEAR_FILTERS, ...filters }).map((p) => p.handle);
  check("tipo Sudaderas → sólo las 5 sudaderas", same(run({ type: "sudaderas" }), HOODIES));
  check("tipo Playeras + colección Toluca → se combinan", same(run({ type: "playeras", collection: "toluca" }), ["wear-lista-wr001", "wear-lista-wr002"]));
  check("tipo Totes", same(run({ type: "totes" }), ["wear-tote-to001"]));
  check("tipo Gorras sin gorras con foto → vacío honesto (0)", run({ type: "gorras" }).length === 0 && wear.countReadyWearTypes(products).gorras === 0);
  check(
    "conteos por tipo",
    same(wear.countReadyWearTypes(products), { playeras: 3, sudaderas: 5, totes: 1, gorras: 0 }),
  );
  check("búsqueda sin acentos y por nombre", same(run({ query: "campeon" }), ["wear-lista-wr001"]) && same(run({ query: "  dance " }), ["wear-sudadera-su003"]));
  check("búsqueda + tipo se combinan", same(run({ type: "playeras", query: "toluca" }), ["wear-lista-wr001", "wear-lista-wr002"]) && run({ type: "sudaderas", query: "toluca" }).length === 0);
  check(
    "colecciones ofrecidas según el tipo",
    same(wear.readyWearCollectionsFor(products, "sudaderas").map((c) => c.id), ["sudaderas"]) &&
      same(wear.readyWearCollectionsFor(products, "playeras").map((c) => c.id), ["gta", "toluca"]) &&
      wear.readyWearCollectionsFor(products, "gorras").length === 0,
  );
  check(
    "sin tipo se conservan las colecciones existentes y se agrega IceSkating",
    same(wear.readyWearCollectionsFor(products, null).map((c) => c.id), [
      "call-of-duty", "friends", "gta", "kpop", "music-rock", "resident-evil", "toluca", "totes", "sudaderas", "gorras", "ice-skating",
    ]) && wear.READY_WEAR_COLLECTIONS.some((c) => c.id === "sudaderas" && c.handle === "wear-sudaderas"),
  );
  const fromUrl = wear.parseReadyWearFilters({ tipo: "sudaderas", coleccion: "toluca", q: "  Architect  " });
  check(
    "URL: ?tipo=sudaderas&coleccion=toluca suelta la colección incompatible",
    same(fromUrl, { type: "sudaderas", collection: "toluca", query: "Architect" }) &&
      same(wear.normalizeReadyWearFilters(products, fromUrl), { type: "sudaderas", collection: null, query: "Architect" }),
  );
  check(
    "cambiar a un tipo compatible conserva la colección",
    same(wear.normalizeReadyWearFilters(products, { type: "playeras", collection: "toluca", query: "" }).collection, "toluca"),
  );
  check(
    "URL: valores hostiles ignorados y búsqueda acotada",
    same(wear.parseReadyWearFilters({ tipo: "<script>", coleccion: "__proto__" }), wear.EMPTY_READY_WEAR_FILTERS) &&
      wear.parseReadyWearFilters({ q: "<b>gta</b>\u0000" + "x".repeat(200) }).query.length <= 80 &&
      !wear.parseReadyWearFilters({ q: "<b>gta</b>" }).query.includes("<"),
  );
  const params = new URLSearchParams("utm_source=ig&tipo=gorras&q=x");
  wear.writeReadyWearFilters(params, { type: "sudaderas", collection: null, query: "  wife " });
  check("URL: escribe tipo y búsqueda, conserva otros parámetros", params.toString() === "utm_source=ig&tipo=sudaderas&q=wife", params.toString());
  wear.writeReadyWearFilters(params, wear.EMPTY_READY_WEAR_FILTERS);
  check("URL: filtros vacíos se borran", params.toString() === "utm_source=ig", params.toString());
  check(
    "enlaces compartibles por tipo",
    wear.readyWearListHref({ type: "sudaderas" }) === "/tienda/prendas-listas?tipo=sudaderas" &&
      wear.readyWearListHref({ type: "totes" }) === "/tienda/prendas-listas?tipo=totes" &&
      wear.readyWearListHref() === "/tienda/prendas-listas",
  );

  // -------------------------------------------------------------------------
  console.log("\n--- Catálogo (mocks, sin base) ---");
  check(
    "wear-sudaderas es categoría de prendas listas y bloque Wear del inventario",
    (catalog.READY_TO_WEAR_CATEGORY_HANDLES as readonly string[]).includes("wear-sudaderas") &&
      wear.READY_WEAR_COLLECTIONS.every((c) => (catalog.READY_TO_WEAR_CATEGORY_HANDLES as readonly string[]).includes(c.handle)) &&
      inventoryBlockOf("wear-sudaderas") === "wear",
  );
  const shown = await catalog.getReadyToWearProducts();
  check(
    "vitrina: nada sin foto real (los personalizados con stock no salen)",
    shown.every((p) => p.images.length > 0 && p.images.every(wear.isProductPhoto)) &&
      !shown.some((p) => ["playera-personalizada", "gorra-personalizada", "tote-bag-personalizada"].includes(p.handle)),
    shown.map((p) => p.handle).join(", "),
  );
  const designer = MOCK_PRODUCTS.find((p) => p.handle === "playera-personalizada")!;
  const relatedDesigner = await catalog.getRelatedProducts(designer, 4);
  const relatedReady = await catalog.getRelatedProducts({ ...designer, id: "ready", handle: SHIRT }, 4);
  check(
    "relacionados: la ficha del Laboratorio no cambia (sigue con sus genéricos)",
    relatedDesigner.some((p) => p.handle === "tote-bag-personalizada"),
    relatedDesigner.map((p) => p.handle).join(", "),
  );
  check(
    "relacionados: la ficha de una prenda lista sólo recomienda con foto real",
    relatedReady.every((p) => p.images.length > 0 && p.images.every(wear.isProductPhoto)) &&
      !relatedReady.some((p) => p.handle === "tote-bag-personalizada"),
    relatedReady.map((p) => p.handle).join(", "),
  );
  const rows = presentInventoryEntries([
    {
      id: "v1",
      product_id: "p-su",
      title: "Mujer / Chica / Negro jaspe",
      sku: null,
      price: 645,
      stock: 5,
      color: "Negro jaspe",
      size: "Chica",
      option_label: "Mujer",
      status: "disponible",
      created_at: "2026-10-27T00:00:00Z",
      updated_at: "2026-10-27T00:00:00Z",
      products: { title: "Architect", handle: HOODIES[0], images: [], categories: { handle: "wear-sudaderas", title: "Sudaderas" } },
    },
  ]);
  check(
    "inventario admin: miniatura por color de la sudadera, stock intacto",
    rows[0].display.thumbnail === "/images/matrixlab-wear/hoodies/su001-negro-jaspe.webp" &&
      rows[0].display.block === "wear" &&
      rows[0].stock === 5,
    String(rows[0].display.thumbnail),
  );

  // -------------------------------------------------------------------------
  console.log("\n--- Rutas visibles ---");
  const tienda = read("src/app/tienda/page.tsx");
  check(
    "/tienda: Wear encabeza con prendas listas y deja el Laboratorio como secundaria",
    /ctaLabel="Comprar prendas listas"\s+ctaHref="\/tienda\/prendas-listas"/.test(tienda) &&
      /label: "Personalizar en el Laboratorio",\s+href: "\/tienda\/disenador",\s+icon: Wand2/.test(tienda) &&
      !tienda.includes('ctaLabel="Diseñar mi prenda"'),
  );
  check(
    "/tienda: las 4 teselas abren la vitrina filtrada por tipo",
    ['label: "Playeras", type: "playeras"', 'label: "Sudaderas", type: "sudaderas"', 'label: "Gorras", type: "gorras"', 'label: "Tote bags", type: "totes"'].every((s) => tienda.includes(s)) &&
      tienda.includes("href: readyWearListHref({ type: item.type })") &&
      !tienda.includes("href: `/tienda/disenador/${item.type}`"),
  );
  const landing = read("src/app/page.tsx");
  check(
    "home: Wear con dos caminos, prendas listas primero",
    /label: "Comprar prendas listas",\s+href: "\/tienda\/prendas-listas"/.test(landing) &&
      /label: "Personalizar en el Laboratorio",\s+href: "\/tienda\/disenador"/.test(landing) &&
      /id: "wear",\s+dual: true,\s+accesses: WEAR_ACCESSES/.test(landing),
  );
  check(
    "ficha: rama de prenda lista generalizada; color validado por prenda",
    read("src/app/tienda/producto/[handle]/page.tsx").includes("isReadyWearGarmentHandle(product.handle) ?") &&
      read("src/app/tienda/producto/[handle]/page.tsx").includes("parseReadyWearColorFor("),
  );

  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} fallo(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "Error");
  process.exit(1);
});
