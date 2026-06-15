/**
 * Apoyo comercial por WhatsApp. Funciona en cliente y servidor.
 * El número se configura con NEXT_PUBLIC_WHATSAPP_NUMBER (sin signo +,
 * con código de país, ej. 521XXXXXXXXXX).
 */

const FALLBACK_NUMBER = "5210000000000";

export function getWhatsAppNumber(): string {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? FALLBACK_NUMBER;
  // wa.me exige número sin "+" ni espacios.
  return raw.replace(/[^0-9]/g, "");
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(message)}`;
}

export const whatsappMessages = {
  product: (name: string) =>
    `Hola MatrixLab, quiero información sobre este producto: ${name}`,
  design: (designId: string) =>
    `Hola MatrixLab, diseñé una pieza en la tienda y quiero confirmar detalles. ID de diseño: ${designId}`,
  outOfStock: (name: string) =>
    `Hola MatrixLab, quiero saber si pueden producir este producto aunque aparece agotado: ${name}`,
  customRequest: () =>
    "Hola MatrixLab, no veo lo que necesito en la tienda. ¿Me ayudan a crearlo?",
  customizeProduct: (name: string) =>
    `Hola MatrixLab, quiero personalizar este producto: ${name}`,
  quoteDesign: () =>
    "Hola MatrixLab, quiero cotizar una pieza personalizada del laboratorio.",
  designHelp: () =>
    "Hola MatrixLab, estoy diseñando en el laboratorio y necesito ayuda para preparar mi archivo.",
  sheetHelp: () =>
    "Hola MatrixLab, quiero ayuda para armar mi planilla de stickers o imanes.",
  laserQuote: () =>
    "Hola MatrixLab, quiero cotizar un grabado personalizado del laboratorio láser.",
} as const;
