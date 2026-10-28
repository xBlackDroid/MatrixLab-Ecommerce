export const adminSections = {
  inventario: "Inventario",
  piezas: "Piezas",
  entregas: "Entregas",
  pagos: "Pagos",
  accesos: "Accesos",
} as const;

export type AdminSection = (typeof adminSections)[keyof typeof adminSections];

export function readAdminSection(value: string | string[] | undefined): AdminSection {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(adminSections, value)
    ? adminSections[value as keyof typeof adminSections]
    : "Inventario";
}

export function distributorAdminHref(id: string, section: keyof typeof adminSections = "inventario"): string {
  return `/admin/distribuidores/${encodeURIComponent(id)}?seccion=${section}`;
}
