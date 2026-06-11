import type {
  CategoryRow,
  ProductRow,
  ProductVariantRow,
} from "@/lib/db/types";

/**
 * Datos mock espejo de supabase/seed.sql.
 *
 * Se usan SOLO cuando Supabase no está configurado (desarrollo/preview) para
 * poder navegar el catálogo. Carrito, checkout, diseñador y admin requieren
 * base de datos real y responden 503 con mensaje claro si falta.
 */

const NOW = "2026-01-01T00:00:00.000Z";

function category(
  id: string,
  title: string,
  handle: string,
  description: string,
  sortOrder: number,
): CategoryRow {
  return {
    id,
    title,
    handle,
    description,
    image_url: null,
    sort_order: sortOrder,
    status: "activa",
    created_at: NOW,
    updated_at: NOW,
  };
}

export const MOCK_CATEGORIES: CategoryRow[] = [
  category(
    "c0000000-0000-4000-8000-000000000001",
    "Stickers",
    "stickers",
    "Stickers personalizados para marcas, eventos, regalos, campañas, empaques y colecciones.",
    1,
  ),
  category(
    "c0000000-0000-4000-8000-000000000002",
    "Imanes",
    "imanes",
    "Imanes personalizados para refrigerador, eventos, recuerdos, marcas y promociones.",
    2,
  ),
  category(
    "c0000000-0000-4000-8000-000000000003",
    "Playeras y prendas",
    "playeras-prendas",
    "Prendas personalizadas con acabado premium para personas, eventos, equipos, escuelas y empresas.",
    3,
  ),
  category(
    "c0000000-0000-4000-8000-000000000004",
    "Gorras",
    "gorras",
    "Gorras personalizadas para eventos, marcas, equipos y activaciones especiales.",
    4,
  ),
  category(
    "c0000000-0000-4000-8000-000000000005",
    "Grabado láser",
    "grabado-laser",
    "Piezas personalizadas en madera, acrílico, metal y materiales especiales.",
    5,
  ),
  category(
    "c0000000-0000-4000-8000-000000000006",
    "Impresión 3D",
    "impresion-3d",
    "Piezas únicas, prototipos, decoración, accesorios y objetos personalizados capa por capa.",
    6,
  ),
  category(
    "c0000000-0000-4000-8000-000000000007",
    "Diseñador T-Shirt Lab",
    "disenador-tshirt-lab",
    "Crea prendas y accesorios textiles personalizados desde el laboratorio interactivo.",
    7,
  ),
];

type ProductSeed = Omit<
  ProductRow,
  "images" | "tags" | "created_at" | "updated_at" | "min_quantity" | "max_quantity"
> & {
  tags?: string[];
  min_quantity?: number;
  max_quantity?: number;
};

function product(seed: ProductSeed): ProductRow {
  return {
    images: [],
    tags: seed.tags ?? [],
    min_quantity: seed.min_quantity ?? 1,
    max_quantity: seed.max_quantity ?? 999,
    created_at: NOW,
    updated_at: NOW,
    ...seed,
  } as ProductRow;
}

export const MOCK_PRODUCTS: ProductRow[] = [
  product({
    id: "d0000000-0000-4000-8000-000000000001",
    category_id: "c0000000-0000-4000-8000-000000000001",
    title: "Sticker personalizado",
    handle: "sticker-personalizado",
    description:
      "Stickers con tu diseño, logotipo o ilustración favorita. Acabados profesionales resistentes al agua, ideales para empaques, laptops, botellas, campañas y colecciones. Desde una pieza hasta miles.",
    base_price: 99,
    compare_at_price: null,
    status: "disponible",
    is_customizable: true,
    production_time: "2 a 3 días hábiles",
    tags: ["personalizable", "volumen"],
  }),
  product({
    id: "d0000000-0000-4000-8000-000000000002",
    category_id: "c0000000-0000-4000-8000-000000000002",
    title: "Imán personalizado",
    handle: "iman-personalizado",
    description:
      "Imanes personalizados con acabado premium para refrigerador, recuerdos de eventos, regalos y promociones de marca. Perfectos para bodas, cumpleaños y activaciones.",
    base_price: 129,
    compare_at_price: null,
    status: "disponible",
    is_customizable: true,
    production_time: "2 a 3 días hábiles",
    tags: ["personalizable", "eventos"],
  }),
  product({
    id: "d0000000-0000-4000-8000-000000000003",
    category_id: "c0000000-0000-4000-8000-000000000003",
    title: "Playera personalizada",
    handle: "playera-personalizada",
    description:
      "Playera de algodón suave con personalización premium. Sube tu diseño en el laboratorio interactivo, elige color y talla, y recibe una prenda lista para presumir. Ideal para personas, equipos, escuelas y empresas.",
    base_price: 349,
    compare_at_price: 399,
    status: "disponible",
    is_customizable: true,
    production_time: "3 a 5 días hábiles",
    max_quantity: 500,
    tags: ["personalizable", "laboratorio", "volumen"],
  }),
  product({
    id: "d0000000-0000-4000-8000-000000000004",
    category_id: "c0000000-0000-4000-8000-000000000004",
    title: "Gorra personalizada",
    handle: "gorra-personalizada",
    description:
      "Gorra estructurada con acabado premium y tu diseño al frente. Perfecta para marcas, eventos, equipos deportivos y regalos especiales.",
    base_price: 279,
    compare_at_price: null,
    status: "disponible",
    is_customizable: true,
    production_time: "3 a 5 días hábiles",
    max_quantity: 500,
    tags: ["personalizable", "laboratorio"],
  }),
  product({
    id: "d0000000-0000-4000-8000-000000000005",
    category_id: "c0000000-0000-4000-8000-000000000003",
    title: "Tote bag personalizada",
    handle: "tote-bag-personalizada",
    description:
      "Bolsa de tela resistente con personalización textil premium. Diseña la tuya en el laboratorio: regalos, eventos, librerías, marcas y uso diario con estilo.",
    base_price: 249,
    compare_at_price: null,
    status: "disponible",
    is_customizable: true,
    production_time: "3 a 5 días hábiles",
    max_quantity: 500,
    tags: ["personalizable", "laboratorio", "eco"],
  }),
  product({
    id: "d0000000-0000-4000-8000-000000000006",
    category_id: "c0000000-0000-4000-8000-000000000005",
    title: "Grabado láser personalizado",
    handle: "grabado-laser-personalizado",
    description:
      "Piezas únicas grabadas en madera, acrílico o metal: placas, llaveros, reconocimientos, señalética y regalos corporativos. Este producto se prepara sobre pedido con acabados profesionales.",
    base_price: 399,
    compare_at_price: null,
    status: "sobre_pedido",
    is_customizable: true,
    production_time: "5 a 7 días hábiles",
    max_quantity: 200,
    tags: ["personalizable", "sobre-pedido", "empresas"],
  }),
  product({
    id: "d0000000-0000-4000-8000-000000000007",
    category_id: "c0000000-0000-4000-8000-000000000006",
    title: "Pieza 3D personalizada",
    handle: "pieza-3d-personalizada",
    description:
      "Objetos impresos capa por capa: prototipos, figuras, decoración, accesorios y refacciones creativas. Cuéntanos tu idea y la hacemos realidad sobre pedido.",
    base_price: 299,
    compare_at_price: null,
    status: "sobre_pedido",
    is_customizable: true,
    production_time: "5 a 7 días hábiles",
    max_quantity: 100,
    tags: ["personalizable", "sobre-pedido", "prototipos"],
  }),
];

function variant(
  id: string,
  productId: string,
  title: string,
  sku: string,
  price: number,
  stock: number,
  extra: Partial<ProductVariantRow> = {},
): ProductVariantRow {
  return {
    id,
    product_id: productId,
    title,
    sku,
    price,
    stock,
    color: null,
    size: null,
    option_label: null,
    status: "disponible",
    created_at: NOW,
    updated_at: NOW,
    ...extra,
  };
}

const P = {
  sticker: "d0000000-0000-4000-8000-000000000001",
  iman: "d0000000-0000-4000-8000-000000000002",
  playera: "d0000000-0000-4000-8000-000000000003",
  gorra: "d0000000-0000-4000-8000-000000000004",
  tote: "d0000000-0000-4000-8000-000000000005",
  laser: "d0000000-0000-4000-8000-000000000006",
  pieza3d: "d0000000-0000-4000-8000-000000000007",
};

export const MOCK_VARIANTS: ProductVariantRow[] = [
  variant("e0000000-0000-4000-8000-000000000101", P.sticker, "Paquete 10 — 5 cm", "STK-5CM", 99, 120, { option_label: "Tamaño 5 cm" }),
  variant("e0000000-0000-4000-8000-000000000102", P.sticker, "Paquete 10 — 8 cm", "STK-8CM", 149, 90, { option_label: "Tamaño 8 cm" }),
  variant("e0000000-0000-4000-8000-000000000103", P.sticker, "Paquete 10 — 10 cm", "STK-10CM", 199, 60, { option_label: "Tamaño 10 cm" }),
  variant("e0000000-0000-4000-8000-000000000201", P.iman, "Imán 5x5 cm", "IMN-5X5", 129, 80, { option_label: "Tamaño 5x5 cm" }),
  variant("e0000000-0000-4000-8000-000000000202", P.iman, "Imán 7x7 cm", "IMN-7X7", 169, 0, { option_label: "Tamaño 7x7 cm", status: "agotado" }),
  variant("e0000000-0000-4000-8000-000000000301", P.playera, "Blanco / CH", "PLY-BL-CH", 349, 25, { color: "Blanco", size: "CH" }),
  variant("e0000000-0000-4000-8000-000000000302", P.playera, "Blanco / M", "PLY-BL-M", 349, 25, { color: "Blanco", size: "M" }),
  variant("e0000000-0000-4000-8000-000000000303", P.playera, "Blanco / G", "PLY-BL-G", 349, 25, { color: "Blanco", size: "G" }),
  variant("e0000000-0000-4000-8000-000000000304", P.playera, "Blanco / XG", "PLY-BL-XG", 349, 15, { color: "Blanco", size: "XG" }),
  variant("e0000000-0000-4000-8000-000000000305", P.playera, "Negro / CH", "PLY-NG-CH", 349, 25, { color: "Negro", size: "CH" }),
  variant("e0000000-0000-4000-8000-000000000306", P.playera, "Negro / M", "PLY-NG-M", 349, 25, { color: "Negro", size: "M" }),
  variant("e0000000-0000-4000-8000-000000000307", P.playera, "Negro / G", "PLY-NG-G", 349, 25, { color: "Negro", size: "G" }),
  variant("e0000000-0000-4000-8000-000000000308", P.playera, "Negro / XG", "PLY-NG-XG", 349, 15, { color: "Negro", size: "XG" }),
  variant("e0000000-0000-4000-8000-000000000401", P.gorra, "Negro", "GRR-NG", 279, 20, { color: "Negro" }),
  variant("e0000000-0000-4000-8000-000000000402", P.gorra, "Azul marino", "GRR-AZ", 279, 15, { color: "Azul marino" }),
  variant("e0000000-0000-4000-8000-000000000403", P.gorra, "Beige", "GRR-BG", 279, 12, { color: "Beige" }),
  variant("e0000000-0000-4000-8000-000000000501", P.tote, "Natural", "TTE-NAT", 249, 30, { color: "Natural" }),
  variant("e0000000-0000-4000-8000-000000000502", P.tote, "Negro", "TTE-NG", 249, 20, { color: "Negro" }),
  variant("e0000000-0000-4000-8000-000000000601", P.laser, "Madera", "LSR-MAD", 399, 0, { option_label: "Material: madera", status: "sobre_pedido" }),
  variant("e0000000-0000-4000-8000-000000000602", P.laser, "Acrílico", "LSR-ACR", 449, 0, { option_label: "Material: acrílico", status: "sobre_pedido" }),
  variant("e0000000-0000-4000-8000-000000000603", P.laser, "Metal", "LSR-MET", 549, 0, { option_label: "Material: metal", status: "sobre_pedido" }),
  variant("e0000000-0000-4000-8000-000000000701", P.pieza3d, "Chica (hasta 8 cm)", "3DP-CH", 299, 0, { option_label: "Tamaño chico", status: "sobre_pedido" }),
  variant("e0000000-0000-4000-8000-000000000702", P.pieza3d, "Mediana (hasta 15 cm)", "3DP-MD", 499, 0, { option_label: "Tamaño mediano", status: "sobre_pedido" }),
  variant("e0000000-0000-4000-8000-000000000703", P.pieza3d, "Grande (hasta 25 cm)", "3DP-GR", 899, 0, { option_label: "Tamaño grande", status: "sobre_pedido" }),
];
