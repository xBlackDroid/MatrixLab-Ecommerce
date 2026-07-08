/**
 * Contenido informativo de Etiquetas Escolares Lab, fiel a la guía PDF
 * "Cómo Hacer tu Pedido".
 *
 *   - GUÍA RÁPIDA  → páginas 1 y 2 (cómo hacer tu pedido)
 *   - ENTREGAS     → página 11 (puntos de entrega)
 *   - PAGOS        → página 12 (métodos de pago)
 *   - CONTACTO     → página 13 (¡haz tu pedido hoy!)
 *
 * Es contenido de REFERENCIA visible en la página, NO toca el checkout real
 * (que sigue usando el flujo de la tienda / Mercado Pago). Los datos bancarios
 * exactos se confirman al cliente al cerrar el pedido para no exponer una
 * cuenta que pueda cambiar.
 */

export interface GuideStep {
  /** Emoji/ícono visual rápido. */
  icon: string;
  title: string;
  text: string;
}

/** Paso a paso de la guía (PDF pág. 2), adaptado al flujo web. */
export const SCHOOL_GUIDE_STEPS: GuideStep[] = [
  {
    icon: "🎒",
    title: "Elige tu paquete",
    text: "Selecciona Elementary o Ultra según lo que necesites.",
  },
  {
    icon: "✏️",
    title: "Personaliza tu diseño",
    text: "Nombre, tipografía y, si quieres, tu propia imagen. El fondo es automático.",
  },
  {
    icon: "✨",
    title: "Add-ons opcionales",
    text: "Adiciones según la temática y el estilo que quieras replicar.",
  },
  {
    icon: "🧾",
    title: "Confirma tu cotización",
    text: "Revisamos juntos los detalles de tu pedido.",
  },
  {
    icon: "💳",
    title: "Anticipo del 50%",
    text: "Con tu anticipo pasamos el pedido a producción.",
  },
  {
    icon: "✅",
    title: "Aprueba tu diseño",
    text: "Te enviamos la propuesta para que la apruebes o pidas ajustes.",
  },
  {
    icon: "📦",
    title: "Recibe en 5 días hábiles",
    text: "Entregamos tu pedido en aproximadamente 5 días hábiles.",
  },
];

/** Resaltados de la portada (PDF pág. 1-2) para el hero. */
export const SCHOOL_GUIDE_HIGHLIGHTS: Array<{ label: string; value: string }> = [
  { label: "Paquetes", value: "Elementary / Ultra" },
  { label: "Add-ons", value: "Opcionales" },
  { label: "Anticipo", value: "50% para producir" },
  { label: "Entrega", value: "≈ 5 días hábiles" },
];

// ---------------------------------------------------------------------------
// Secciones informativas (acordeones al final de la página).
// ---------------------------------------------------------------------------

export interface InfoGroup {
  heading: string;
  /** Nota corta debajo del encabezado (opcional). */
  note?: string;
  items: string[];
}

export interface InfoSection {
  id: string;
  /** Emoji visual del acordeón. */
  icon: string;
  title: string;
  /** Subtítulo corto. */
  subtitle: string;
  groups: InfoGroup[];
}

/** Puntos de entrega (PDF pág. 11). */
export const SCHOOL_DELIVERY: InfoSection = {
  id: "entrega",
  icon: "📍",
  title: "Puntos de entrega",
  subtitle: "CDMX y Estado de México · fines de semana y previa cita",
  groups: [
    {
      heading: "CDMX",
      note: "Costo de entrega: $50",
      items: [
        "Sobre Periférico, de Parque Toreo a Ermita Iztapalapa",
        "Ciudad Universitaria",
        "Estación de metro a convenir",
      ],
    },
    {
      heading: "Estado de México",
      note: "Costo de entrega: $50",
      items: ["Centro Comercial La Cúspide", "Plaza Satélite"],
    },
    {
      heading: "Sin costo extra de entrega",
      items: [
        "Outlet Lerma",
        "Plaza Sendero",
        "Town Square Metepec",
        "Galerías Metepec",
        "Galerías Toluca",
        "Centro Toluca",
        "Colegios varios — pregunta por el tuyo",
      ],
    },
    {
      heading: "Otros puntos",
      items: [
        "Zona metropolitana de Toluca: +$30 de entrega",
      ],
    },
  ],
};

/** Métodos de pago (PDF pág. 12). */
export const SCHOOL_PAYMENTS: InfoSection = {
  id: "pagos",
  icon: "💳",
  title: "Métodos de pago",
  subtitle: "Elige el que más te convenga",
  groups: [
    {
      heading: "Efectivo",
      items: ["Pago en efectivo al momento de la entrega."],
    },
    {
      heading: "Transferencia bancaria",
      items: [
        "Cuenta Banamex a nombre de Karla Elorza.",
        "Te compartimos los datos completos al confirmar tu pedido.",
        "Envía tu comprobante de pago por WhatsApp.",
      ],
    },
    {
      heading: "Tarjeta de crédito / débito",
      items: ["Se aplica una comisión del 3.5% sobre el monto total."],
    },
  ],
};

/** Contacto (PDF pág. 13). */
export const SCHOOL_CONTACT: InfoSection = {
  id: "contacto",
  icon: "💬",
  title: "Contacto",
  subtitle: "¡Haz tu pedido hoy! Escríbenos y arma tu pack ideal.",
  groups: [
    {
      heading: "Síguenos y escríbenos",
      items: [
        "Instagram: @MatrixLabStickers",
        "TikTok: @MatrixLab.Stickers",
        "Tel / WhatsApp: 56 5557 5131",
      ],
    },
  ],
};

export const SCHOOL_INFO_SECTIONS: InfoSection[] = [
  SCHOOL_DELIVERY,
  SCHOOL_PAYMENTS,
  SCHOOL_CONTACT,
];
