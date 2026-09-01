import type { SVGProps } from "react";

/**
 * Siluetas de prenda del T-Shirt Lab.
 *
 * Por qué existen aparte de `GarmentIcons`: aquellos son iconos de interfaz al
 * estilo lucide —24×24, trazo 2, pensados para ir junto a una etiqueta de 14px—
 * y como ARTE de una tarjeta se veían pobres. La sudadera, en particular, no
 * llegaba a leerse como sudadera: sin capucha cerrada ni bolsillo era una
 * playera con cordones.
 *
 * Estas son ilustraciones, no iconos: lienzo 64×64 (7× más superficie, así que
 * admiten detalle real) y los rasgos que de verdad identifican cada prenda
 * —capucha ancha con abertura y bolsillo canguro, visera con costura y botón,
 * asa de tote— en vez de un contorno genérico.
 *
 * `GarmentIcons` NO se borra: lo siguen usando /tienda y /tienda/disenador.
 * Son dos herramientas distintas.
 *
 * Decisiones comunes:
 * - Todo en `currentColor`, sin `<linearGradient>` interno. Un degradado dentro
 *   del SVG obligaría a IDs únicos por instancia (cada silueta se pinta dos
 *   veces: watermark y primer plano), y dos IDs iguales en el documento hacen
 *   que el navegador resuelva el degradado equivocado. El color y el brillo se
 *   ponen desde CSS, que además los hace animables en hover.
 * - `vectorEffect="non-scaling-stroke"` para que el trazo mantenga su grosor
 *   óptico tanto en el watermark de 9rem como en la pieza de 3.5rem.
 * - SIN área de impresión punteada. Se probó y se quitó: a 56px reales el
 *   rectángulo de guiones chocaba con los cordones y el bolsillo de la sudadera
 *   y con la costura de la gorra, y se leía como suciedad en vez de como
 *   significado. La idea de "aquí va tu imagen" ya la dicen los tres pasos que
 *   hay al lado, con palabras y sin ensuciar el dibujo.
 */

function base(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

/** Playera de cuello redondo. */
export function TeeSilhouette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        vectorEffect="non-scaling-stroke"
        d="M23.5 12.5 L13.5 16.8 L6.5 26.5 L14.8 32.2 L18 27.5 L18 54 Q18 56.5 20.5 56.5 L43.5 56.5 Q46 56.5 46 54 L46 27.5 L49.2 32.2 L57.5 26.5 L50.5 16.8 L40.5 12.5 C39 18.8 25 18.8 23.5 12.5 Z"
      />
      {/* costura del cuello */}
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.4}
        d="M24.8 14.6 C26.6 19.8 37.4 19.8 39.2 14.6"
      />
    </svg>
  );
}

/**
 * Sudadera con capucha.
 *
 * La capucha va como pieza APARTE del cuerpo y más ancha que el cuello. En la
 * primera versión era un arco estrecho y alto cerrando el escote, y a tamaño
 * pequeño parecía un globo apoyado sobre los hombros. Ancha y baja se lee como
 * capucha caída, que es como cuelga una de verdad.
 */
export function HoodieSilhouette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* cuerpo y mangas, cerrado por el escote */}
      <path
        vectorEffect="non-scaling-stroke"
        d="M22.5 19 L12.5 22.5 L5.5 32 L13.8 37.5 L17.5 32.5 L17.5 53.5 Q17.5 56 20 56 L44 56 Q46.5 56 46.5 53.5 L46.5 32.5 L50.2 37.5 L58.5 32 L51.5 22.5 L41.5 19 C40 24 24 24 22.5 19 Z"
      />
      {/* Capucha: DOS arcos concéntricos, no uno.
          Un solo arco sobre los hombros se lee como una cabeza, por muy ancho
          o bajo que se dibuje — el ojo lo interpreta como silueta de persona.
          El par exterior/interior le da grosor de tela: lo que se ve entre las
          dos líneas es la capucha, y lo de dentro, su abertura. */}
      <path
        vectorEffect="non-scaling-stroke"
        d="M21.5 19.5 C21.5 11.5 26.5 8 32 8 C37.5 8 42.5 11.5 42.5 19.5"
      />
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        d="M25.2 19.5 C25.2 14.6 28.2 12.2 32 12.2 C35.8 12.2 38.8 14.6 38.8 19.5"
      />
      {/* cordones */}
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        d="M28.8 24 V29.5 M35.2 24 V29.5"
      />
      {/* bolsillo canguro */}
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        d="M21.5 41 Q21.5 50.5 27 50.5 L37 50.5 Q42.5 50.5 42.5 41"
      />
    </svg>
  );
}

/**
 * Gorra de perfil.
 *
 * La visera es una figura CERRADA que sale de la base de la copa. Antes eran
 * dos curvas abiertas encadenadas y el trazo volvía sobre sí mismo formando un
 * lazo: parecía un asa, no una visera.
 */
export function CapSilhouette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* copa */}
      <path
        vectorEffect="non-scaling-stroke"
        d="M13 37.5 C13 19.5 47 19.5 47 37.5"
      />
      {/* banda inferior */}
      <path vectorEffect="non-scaling-stroke" d="M12.6 37.5 H46.6" />
      {/* Visera RELLENA, no de contorno.
          Dibujada como línea, un contorno cerrado y alargado se lee como un
          lazo o un asa: el ojo ve el hueco de dentro, no el volumen. Rellena
          se lee como lo que es —una pieza sólida— y además contrasta con la
          copa en línea, que es justo la lectura de una gorra real. */}
      <path
        fill="currentColor"
        stroke="none"
        d="M45 37.5 C53.5 37.5 60 39.4 61.4 41.5 C62 42.5 61 43.4 58.8 43.4 C51.5 43.4 46.8 41.8 45 40 Z"
      />
      {/* costura central y botón */}
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.4}
        d="M30 20.6 V37.5"
      />
      <circle
        cx="30"
        cy="19.4"
        r="1.9"
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.4}
      />
    </svg>
  );
}

/** Tote bag: cuerpo ligeramente cónico y asa de arco. */
export function ToteSilhouette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* cuerpo */}
      <path
        vectorEffect="non-scaling-stroke"
        d="M15.5 23 L48.5 23 L45.8 53.6 Q45.6 55.6 43.6 55.6 L20.4 55.6 Q18.4 55.6 18.2 53.6 Z"
      />
      {/* asa */}
      <path
        vectorEffect="non-scaling-stroke"
        d="M25 23 V18.4 C25 13.9 28.1 11.4 32 11.4 C35.9 11.4 39 13.9 39 18.4 V23"
      />
      {/* pliegue superior */}
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.4}
        d="M16.2 28 H47.8"
      />
    </svg>
  );
}
