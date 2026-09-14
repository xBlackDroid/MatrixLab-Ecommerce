/** Vasos terminados. Datos importados desde Inventario_MatrixLab_Tumbler_Listos.xlsx. */
export const READY_TUMBLER_HANDLE = "vasos-listos";
export const READY_TUMBLER_TITLE = "Vasos listos";
export const READY_TUMBLER_DESCRIPTION =
  "Elige tu favorito. Ya le pusimos la magia. Vasos decorados para darle estilo a tu día o convertir un regalo en algo especial.";
export const READY_TUMBLER_IMAGE_DIR = "/images/tumbler/listos";
export const READY_TUMBLER_PLACEHOLDER = "/images/tumbler/vasos/placeholder.webp";

export interface ReadyTumblerItem {
  code: string;
  name: string;
  collection: string;
  status: "Borrador" | "Activo" | "Agotado" | "Pausado";
  description: string;
  capacity: string;
  finish: string;
  inventory: number | null;
  price: number | null;
  customizable: boolean | null;
  imagePaths: string[];
}

export const READY_TUMBLERS: readonly ReadyTumblerItem[] = [
  // <generated:tumbler-ready>
  {"code": "VL001", "name": "Vaso ToyStory Marcianitos", "collection": "Toy Story", "status": "Activo", "description": "Vaso inspirado en los marcianitos de Toy Story, con detalles coloridos y un acabado que convierte cada sorbo en una pequeña aventura. Una pieza lista para regalar o presumir tu fandom.", "capacity": "", "finish": "", "inventory": 5, "price": 750, "customizable": null, "imagePaths": ["/images/tumbler/listos/vl001.webp", "/images/tumbler/listos/vl001-2.webp", "/images/tumbler/listos/vl001-3.webp"]},
  {"code": "VL002", "name": "Vaso Halloween Fantasmas", "collection": "Halloween", "status": "Activo", "description": "Vaso de Halloween con fantasmas juguetones y brillo iridiscente. Un diseño misterioso y divertido para darle personalidad a tus bebidas durante la temporada y todo el año.", "capacity": "", "finish": "", "inventory": 5, "price": 380, "customizable": null, "imagePaths": ["/images/tumbler/listos/vl002.webp", "/images/tumbler/listos/vl002-2.webp", "/images/tumbler/listos/vl002-3.webp"]},
  {"code": "VL003", "name": "Vaso Winnie Pooh Efecto Miel", "collection": "Winnie Pooh", "status": "Activo", "description": "Vaso de Winnie Pooh con efecto miel, glitter dorado y detalles de sus personajes favoritos. Cálido, brillante y perfecto para un regalo que se disfruta todos los días.", "capacity": "", "finish": "", "inventory": 5, "price": 420, "customizable": null, "imagePaths": ["/images/tumbler/listos/vl003.webp", "/images/tumbler/listos/vl003-2.webp", "/images/tumbler/listos/vl003-3.webp"]},
  // </generated:tumbler-ready>
];

export function visibleReadyTumblers(items: readonly ReadyTumblerItem[] = READY_TUMBLERS) {
  return items.filter((item) => item.status === "Activo" || item.status === "Agotado");
}

export function readyTumblerSku(code: string) {
  return `TML-${code.toUpperCase()}`;
}

/** Handle estable para enlazar cada vaso listo con su producto vendible. */
export function readyTumblerHandle(code: string) {
  return `vaso-listo-${code.toLowerCase()}`;
}

/** Vaso listo al que pertenece un handle público; `null` si no es de la línea. */
export function readyTumblerByHandle(
  handle: string,
  items: readonly ReadyTumblerItem[] = READY_TUMBLERS,
): ReadyTumblerItem | null {
  if (!handle) return null;
  return items.find((item) => readyTumblerHandle(item.code) === handle) ?? null;
}
