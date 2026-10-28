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
  {"code":"VL004","name":"Vaso Fantasmas Glow in the Dark","collection":"Halloween","status":"Activo","description":"Fantasmas con brillo que se ilumina en la oscuridad. Un vaso decorado para darle un toque divertido a tus bebidas.","capacity":"","finish":"Brilla en la oscuridad","inventory":1,"price":460,"customizable":false,"imagePaths":["/images/tumbler/listos/vl004.webp","/images/tumbler/listos/vl004-2.webp"]},
  {"code":"VL005","name":"Vaso de vidrio Book Addict","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Book Addict, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl005.webp"]},
  {"code":"VL006","name":"Vaso de vidrio Libros y flores","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Libros y flores, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl006.webp"]},
  {"code":"VL007","name":"Vaso de vidrio Bookflowers","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Bookflowers, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl007.webp"]},
  {"code":"VL008","name":"Vaso de vidrio Books Collage","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Books Collage, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl008.webp"]},
  {"code":"VL009","name":"Vaso de vidrio Biblioteca","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Biblioteca, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl009.webp"]},
  {"code":"VL010","name":"Vaso de vidrio Libros Pastel","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Libros Pastel, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl010.webp"]},
  {"code":"VL011","name":"Vaso de vidrio Proud Bookworm","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Proud Bookworm, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl011.webp"]},
  {"code":"VL012","name":"Vaso de vidrio Easily Distracted by Books","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Easily Distracted by Books, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl012.webp"]},
  {"code":"VL013","name":"Vaso de vidrio Hot Girls Read Books","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Hot Girls Read Books, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl013.webp"]},
  {"code":"VL014","name":"Vaso de vidrio Just One More Chapter","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño Just One More Chapter, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl014.webp"]},
  {"code":"VL015","name":"Vaso de vidrio The Book Was Better","collection":"Book Lovers","status":"Activo","description":"Vaso de vidrio decorado con diseño The Book Was Better, tapa de bambú y popote. Listo para regalar a quien disfruta la lectura.","capacity":"","finish":"Vidrio decorado","inventory":1,"price":320,"customizable":false,"imagePaths":["/images/tumbler/listos/vl015.webp"]},
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
