/**
 * QA del inventario admin: bloque comercial + miniatura.
 *
 * Sin base de datos ni red: la lectura paginada se prueba con un cliente
 * falso y la presentación con filas sintéticas. Verifica:
 *   - mapeo de bloques por handle canónico (UV Stickers ≠ MatrixLab Stickers,
 *     todas las sublíneas Tumbler, colecciones Wear, desconocido → Sin bloque);
 *   - miniaturas reales del pipeline público, foto por color, fallback, URLs
 *     no seguras descartadas y mojibake reparado;
 *   - paginación completa (>1000 variantes), orden y LEFT JOIN (sin !inner);
 *   - checkAvailability / adjustStock idénticos a `main`;
 *   - gate de /preview/inventario (Preview/dev sí, producción 404) y que la
 *     vista de muestra no lea base ni mute nada.
 *
 * Uso: npx tsx scripts/qa/admin-inventory.test.ts
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Los módulos de servidor importan "server-only": se relanza con la condición
// react-server (igual que `test:design-deletion`) para poder importarlos.
if (!process.execArgv.join(" ").includes("react-server")) {
  const result = spawnSync(
    process.execPath,
    ["--conditions=react-server", "--import", "tsx", __filename],
    { stdio: "inherit", env: process.env },
  );
  process.exit(result.status ?? 1);
}

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
  if (!ok) failures += 1;
}

async function main() {
  const { inventoryBlockOf, presentInventoryEntries } = await import(
    "../../src/lib/store/inventory-presentation"
  );
  const { listInventory, checkAvailability } = await import(
    "../../src/lib/store/inventory"
  );
  const { TUMBLER_SUBCATEGORY_HANDLES, READY_TO_WEAR_CATEGORY_HANDLES } =
    await import("../../src/lib/store/products");
  const { READY_WEAR_COLLECTIONS } = await import("../../src/lib/store/ready-wear");
  const blocks = await import("../../src/lib/store/commercial-blocks");
  const preview = await import("../../src/app/preview/inventario/sample");
  const { isDynamicRoute } = await import("../../src/middleware");

  // -------------------------------------------------------------------------
  console.log("\n--- Bloques comerciales por handle de categoría ---");
  const wear = [
    ...READY_WEAR_COLLECTIONS.map((c) => c.handle),
    "playeras-prendas",
    "gorras",
    "wear-call-of-duty",
    "wear-friends",
    "wear-gta",
    "wear-kpop",
    "wear-music-rock",
    "wear-resident-evil",
    "wear-toluca",
    "wear-totes",
  ];
  const wrongWear = wear.filter((h) => inventoryBlockOf(h) !== "wear");
  check("colecciones Wear + playeras-prendas + gorras → MatrixLab Wear", wrongWear.length === 0, wrongWear.join(", "));
  check(
    "READY_TO_WEAR_CATEGORY_HANDLES completo → Wear",
    READY_TO_WEAR_CATEGORY_HANDLES.every((h) => inventoryBlockOf(h) === "wear"),
  );
  check("stickers → MatrixLab Stickers", inventoryBlockOf("stickers") === "stickers");
  check("imanes → MatrixLab Stickers", inventoryBlockOf("imanes") === "stickers");

  const tumbler = [
    "matrixlab-tumbler",
    "insumos",
    "snowglobe",
    "llaveros",
    "tags-acrilico",
    "acrilicos",
    "accesorios-personalizacion",
    "repuestos-consumibles",
    "magic-flow",
    "wraps-glow-finish",
  ];
  const wrongTumbler = tumbler.filter((h) => inventoryBlockOf(h) !== "tumbler");
  check("madre, legado y 8 sublíneas (incl. ocultas) → MatrixLab Tumbler", wrongTumbler.length === 0, wrongTumbler.join(", "));
  check(
    "TUMBLER_SUBCATEGORY_HANDLES completo → Tumbler",
    TUMBLER_SUBCATEGORY_HANDLES.every((h) => inventoryBlockOf(h) === "tumbler"),
  );
  check("UV Stickers (wraps-glow-finish) NO es MatrixLab Stickers", inventoryBlockOf("wraps-glow-finish") !== "stickers");
  check("impresion-3d → MatrixLab 3D", inventoryBlockOf("impresion-3d") === "3d");
  check("grabado-laser → MatrixLab Láser", inventoryBlockOf("grabado-laser") === "laser");
  check("etiquetas-escolares → Regreso a Clases", inventoryBlockOf("etiquetas-escolares") === "escolar");
  const unknown = [null, undefined, "", "sticker-a001", "mi-sticker", "wear", "tumbler", "vasos-listos", "STICKERS"];
  check(
    "desconocido / null → sin bloque (nunca por palabra parecida)",
    unknown.every((h) => inventoryBlockOf(h) === null),
  );
  check(
    "etiquetas de bloque",
    blocks.inventoryBlockLabel("laser") === "MatrixLab Láser" &&
      blocks.inventoryBlockLabel(null) === "Sin bloque",
  );

  // -------------------------------------------------------------------------
  console.log("\n--- Presentación por fila (miniatura, texto, huérfanas) ---");
  const base = {
    sku: null,
    price: null,
    color: null as string | null,
    size: null,
    option_label: null,
    status: "disponible" as const,
    stock: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
  const product = (
    handle: string,
    categoryHandle: string | null,
    extra: { title?: string; images?: string[] } = {},
  ) => ({
    title: extra.title ?? handle,
    handle,
    images: extra.images ?? [],
    categories: categoryHandle ? { handle: categoryHandle, title: "Cat" } : null,
  });
  const rows = presentInventoryEntries([
    { ...base, id: "a", product_id: "p-uv", title: "24 oz", products: product("sticker-a001", "wraps-glow-finish", { title: "UV Sticker 24oz A001" }) },
    { ...base, id: "b", product_id: "p-wr", title: "Negra / M", color: "Negra", products: product("wear-lista-wr001", "playeras-prendas") },
    { ...base, id: "c", product_id: "p-wr", title: "Blanca / M", color: "Blanca", products: product("wear-lista-wr001", "playeras-prendas") },
    { ...base, id: "d", product_id: "p-3d", title: "Pieza", products: product("ml3d-3d001", "impresion-3d") },
    { ...base, id: "e", product_id: "p-none", title: "Única", products: product("sin-foto", "gorras") },
    { ...base, id: "f", product_id: "p-st", title: "Pieza", products: product("x-sticker", null, { title: "Sticker suelto" }) },
    { ...base, id: "g", product_id: "p-orphan", title: "Huérfana", products: null },
    { ...base, id: "h", product_id: "p-bad", title: "X", products: product("bad", "stickers", { images: ["javascript:alert(1)"] }) },
    { ...base, id: "i", product_id: "p-moji", title: "X", products: product("moji", "grabado-laser", { title: "personalizaciÃ³n", images: ["https://abc.supabase.co/storage/v1/object/public/x.webp"] }) },
    { ...base, id: "j", product_id: "p-arr", title: "X", products: [product("arr", "imanes", { images: ["/images/matrixlab-stickers/imn-auto001.webp"] })] },
  ]);
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  check("conserva todas las filas y su orden", rows.map((r) => r.id).join("") === "abcdefghij");
  check("UV Sticker en wraps-glow-finish → MatrixLab Tumbler", byId.a.display.block === "tumbler" && byId.a.display.blockLabel === "MatrixLab Tumbler");
  check("UV Sticker usa su foto real", byId.a.display.thumbnail === "/images/tumbler/stickers/a001.webp", String(byId.a.display.thumbnail));
  check("foto por color Negra", byId.b.display.thumbnail === "/images/matrixlab-wear/colors/wr001-negra.webp", String(byId.b.display.thumbnail));
  check("foto por color Blanca (mismo producto, otro color)", byId.c.display.thumbnail === "/images/matrixlab-wear/colors/wr001-blanca.webp", String(byId.c.display.thumbnail));
  check("pieza 3D con foto real", byId.d.display.thumbnail === "/images/matrixlab-3d/3d001.webp", String(byId.d.display.thumbnail));
  check("sin foto conocida → null (fallback Sin imagen)", byId.e.display.thumbnail === null);
  check("'Sticker' en el título sin categoría → Sin bloque", byId.f.display.block === null && byId.f.display.blockLabel === "Sin bloque");
  check(
    "variante huérfana se conserva sin producto",
    byId.g.products === null && byId.g.display.productTitle === null && byId.g.display.blockLabel === "Sin bloque" && byId.g.stock === 1,
  );
  check("URL no segura descartada", byId.h.display.thumbnail === null);
  check("mojibake reparado en el nombre", byId.i.display.productTitle === "personalización" && byId.i.products?.title === "personalización");
  check("https de Supabase conservada", byId.i.display.thumbnail?.startsWith("https://abc.supabase.co/") === true);
  check("relación entregada como arreglo también se lee", byId.j.display.block === "stickers" && byId.j.display.thumbnail === "/images/matrixlab-stickers/imn-auto001.webp");
  check("stock y estado intactos", rows.every((r) => r.stock === 1 && r.status === "disponible"));
  check(
    "búsqueda incluye bloque y categoría (sin acentos)",
    blocks.inventorySearchText(byId.i).includes("matrixlab laser") &&
      blocks.inventorySearchText(byId.a).includes("wraps-glow-finish"),
  );

  // -------------------------------------------------------------------------
  console.log("\n--- Lectura paginada (>1000 variantes) ---");
  async function runPaged(total: number) {
    const calls: { select?: string; order: string[]; range?: [number, number] }[] = [];
    const all = Array.from({ length: total }, (_, i) => ({
      ...base,
      id: `v${String(i).padStart(5, "0")}`,
      product_id: `p${i % 7}`,
      title: `V${i}`,
      products: i % 50 === 0 ? null : product(`h${i % 7}`, i % 2 ? "stickers" : null),
    }));
    const client = {
      from(table: string) {
        const call: (typeof calls)[number] = { order: [] };
        calls.push(call);
        if (table !== "product_variants") throw new Error("tabla inesperada");
        const builder = {
          select(s: string) { call.select = s; return builder; },
          order(col: string, opts: { ascending: boolean }) { call.order.push(`${col}:${opts.ascending}`); return builder; },
          range(from: number, to: number) {
            call.range = [from, to];
            return Promise.resolve({ data: all.slice(from, to + 1), error: null });
          },
        };
        return builder;
      },
    };
    const result = await listInventory(client as never);
    return { calls, result, all };
  }
  for (const total of [1234, 1000, 0]) {
    const { calls, result, all } = await runPaged(total);
    check(
      `${total} variantes: devuelve todas en orden`,
      result.length === total && result.every((r, i) => r.id === all[i].id),
      `${result.length}`,
    );
    check(
      `${total} variantes: páginas de 500 sin huecos`,
      calls.every((c, i) => c.range?.[0] === i * 500 && c.range?.[1] === i * 500 + 499) &&
        calls.length === Math.floor(total / 500) + 1,
      calls.map((c) => c.range?.join("-")).join(", "),
    );
    check(
      `${total} variantes: orden created_at + id, LEFT JOIN`,
      calls.every(
        (c) =>
          c.order.join(",") === "created_at:true,id:true" &&
          !c.select?.includes("!inner") &&
          c.select === "*, products(title, handle, images, categories(handle, title))",
      ),
    );
  }
  {
    const { result } = await runPaged(1234);
    check("huérfanas incluidas en la lectura paginada", result.filter((r) => r.products === null).length === 25);
  }
  {
    const failing = {
      from: () => {
        const b = {
          select: () => b,
          order: () => b,
          range: () => Promise.resolve({ data: null, error: { message: "x" } }),
        };
        return b;
      },
    };
    let threw = false;
    try { await listInventory(failing as never); } catch { threw = true; }
    check("error del Data API → excepción (no lista parcial)", threw);
  }

  // -------------------------------------------------------------------------
  console.log("\n--- Reglas de stock intactas respecto a main ---");
  let mainSource = "";
  try {
    mainSource = execSync("git show origin/main:src/lib/store/inventory.ts", { cwd: ROOT, encoding: "utf8" });
  } catch {
    console.log("(sin git/origin: se omite la comparación con main)");
  }
  const branchSource = read("src/lib/store/inventory.ts");
  const fnBody = (src: string, name: string) => {
    const norm = src.replace(/\r\n/g, "\n");
    const start = norm.indexOf(`export function ${name}`) >= 0
      ? norm.indexOf(`export function ${name}`)
      : norm.indexOf(`export async function ${name}`);
    const end = norm.indexOf("\n}\n", start);
    return start >= 0 && end > start ? norm.slice(start, end + 2) : "";
  };
  if (mainSource) {
    for (const fn of ["checkAvailability", "adjustStock", "listMovements"]) {
      const a = fnBody(mainSource, fn);
      check(`${fn} idéntica a main`, a.length > 0 && a === fnBody(branchSource, fn));
    }
  }
  check(
    "checkAvailability sigue respondiendo igual",
    JSON.stringify(checkAvailability({ status: "disponible", min_quantity: 1, max_quantity: 9 }, { status: "disponible", stock: 1 }, 2)) ===
      JSON.stringify({ ok: false, reason: "stock_insuficiente" }),
  );

  // -------------------------------------------------------------------------
  console.log("\n--- Vista previa /preview/inventario ---");
  const gate = preview.isInventoryPreviewEnabled;
  check("NODE_ENV=production + VERCEL_ENV=preview → habilitada", gate({ NODE_ENV: "production", VERCEL_ENV: "preview" }));
  check("NODE_ENV=production + VERCEL_ENV=production → 404", !gate({ NODE_ENV: "production", VERCEL_ENV: "production" }));
  check("next start local sin VERCEL_ENV → 404", !gate({ NODE_ENV: "production" }));
  check("next dev → habilitada", gate({ NODE_ENV: "development" }));
  check("CSP estricta sólo en la ruta exacta", isDynamicRoute("/preview/inventario") && !isDynamicRoute("/preview") && !isDynamicRoute("/preview/inventario/x"));

  const pageSource = read("src/app/preview/inventario/page.tsx");
  const sampleSource = read("src/app/preview/inventario/sample.ts");
  const previewSource = pageSource + sampleSource;
  check(
    "la vista previa no lee base, ni service role, ni API",
    !/listInventory|listMovements|requireServiceClient|getServiceClient|@\/lib\/db\/admin|@\/lib\/store\/inventory"|fetch\(|SUPABASE/i.test(previewSource),
  );
  check("la vista previa no salta la sesión admin", !/requireAdminPage|ml_admin|ADMIN_SESSION/.test(previewSource));
  check("gate antes de renderizar + force-dynamic + readOnly", /if \(!isInventoryPreviewEnabled\(\)\) notFound\(\);/.test(pageSource) && /force-dynamic/.test(pageSource) && /\breadOnly\b/.test(pageSource));
  check("banner de muestra", pageSource.includes("Datos de muestra · Solo lectura"));
  const sampleRows = presentInventoryEntries(preview.SAMPLE_INVENTORY_ENTRIES);
  const sampleBlocks = new Set(sampleRows.map((r) => r.display.block));
  check(
    "la muestra cubre los 6 bloques + Sin bloque",
    blocks.INVENTORY_BLOCKS.every((b) => sampleBlocks.has(b.id)) && sampleBlocks.has(null),
  );
  check("la muestra incluye fotos reales y un caso sin foto", sampleRows.filter((r) => r.display.thumbnail).length >= 9 && sampleRows.some((r) => !r.display.thumbnail));
  check("la muestra incluye una variante huérfana", sampleRows.some((r) => r.products === null));
  check("los SKUs de muestra se identifican como muestra", sampleRows.every((r) => !r.sku || r.sku.startsWith("MUESTRA-")));

  // -------------------------------------------------------------------------
  console.log("\n--- Tabla: contrato de mutación sin cambios ---");
  const table = read("src/components/admin/InventoryTable.tsx");
  const adjustFn = table.slice(table.indexOf("async function adjust("), table.indexOf("const blockCounts"));
  check("readOnly corta antes de cualquier fetch", adjustFn.indexOf("if (readOnly)") > -1 && adjustFn.indexOf("if (readOnly)") < adjustFn.indexOf("fetch("));
  check(
    "PATCH /api/admin/inventory con cabecera CSRF igual que antes",
    adjustFn.includes('fetch("/api/admin/inventory"') && adjustFn.includes('method: "PATCH"') && adjustFn.includes("[CSRF_HEADER]: csrf") && table.includes('const CSRF_HEADER = "x-ml-csrf"'),
  );
  check("la tabla de cliente no importa módulos de servidor", !/lib\/store\/(products|inventory|inventory-presentation)"|server-only|lib\/db\/admin/.test(table));
  check("commercial-blocks no importa módulos de servidor", !/^import(?!\s+type).*from/m.test(read("src/lib/store/commercial-blocks.ts")));
  check("filtro con 'Todos los bloques' y etiquetas accesibles", table.includes("Todos los bloques") && table.includes('htmlFor="inventory-search"') && table.includes('htmlFor="inventory-block"'));
  check("nombres por fila en +/- y estado", table.includes("`Restar 1 a ${name}`") && table.includes("`Sumar 1 a ${name}`") && table.includes("`Estado de ${rowName(row)}`"));
  check("estado sin resultados con Limpiar filtros", table.includes("Ninguna variante coincide") && table.includes("Limpiar filtros"));

  console.log(failures === 0 ? "\nTodo OK." : `\n${failures} fallo(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Error");
  process.exit(1);
});
