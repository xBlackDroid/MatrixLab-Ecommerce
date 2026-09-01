"use client";

import { useState } from "react";
import { Copy, Check, MapPin } from "lucide-react";
import type { ShippingAddressSnapshot } from "@/lib/db/types";

/**
 * Datos de entrega de un pedido, para el admin.
 *
 * SOLO se usa dentro del panel autenticado: la dirección es PII y no aparece
 * en ninguna vista pública. Nada de esto se registra en logs.
 *
 * Un pedido puede traer `shipping_address` en tres estados y los tres se
 * manejan aquí: `null` (los anteriores a la captura de dirección), el
 * snapshot completo, o —si alguien editó el jsonb a mano en Supabase o
 * apareciera una fila con la forma vieja— algo que NO es el snapshot. Este
 * componente es cliente y el panel no tiene error boundary, así que una
 * excepción aquí tumbaría la lista COMPLETA de pedidos: por eso se valida la
 * forma en vez de confiar en el tipo.
 */
function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

/** ¿El jsonb tiene de verdad la forma del snapshot? */
export function isShippingAddressSnapshot(
  value: unknown,
): value is ShippingAddressSnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    texto(v.street) !== "" &&
    texto(v.neighborhood) !== "" &&
    texto(v.municipality) !== "" &&
    texto(v.state) !== "" &&
    texto(v.postal_code) !== ""
  );
}

/**
 * Líneas de la dirección, tolerante a campos ausentes: nunca lanza. Las
 * líneas que quedarían vacías se omiten.
 */
export function formatAddressLines(address: unknown): string[] {
  const v = (address ?? {}) as Record<string, unknown>;
  const numeros = [texto(v.exterior_number), texto(v.interior_number)]
    .filter((n) => n !== "")
    .join(" int. ");
  return [
    `${texto(v.street)} ${numeros}`.trim(),
    texto(v.neighborhood),
    `${texto(v.postal_code)} ${texto(v.municipality)}`.trim(),
    texto(v.state),
  ].filter((line) => line !== "");
}

export default function ShippingAddressBlock({
  address,
}: {
  address: ShippingAddressSnapshot | null;
}) {
  const [copiado, setCopiado] = useState(false);

  // Sin dirección utilizable —null o un jsonb con otra forma— se dice, no se
  // adivina. El caso "otra forma" además muestra lo que sí se pueda leer para
  // que el pedido no quede a ciegas.
  if (!isShippingAddressSnapshot(address)) {
    const rescatadas = formatAddressLines(address);
    return (
      <div className="flex flex-col gap-3 text-sm">
        <h3 className="text-xs font-bold uppercase text-ml-white/45">
          Datos de entrega
        </h3>
        <p className="rounded-lg bg-white/5 px-3.5 py-2.5 text-ml-white/60">
          Dirección no registrada. Este pedido es anterior a la captura de
          dirección en el checkout: confírmala por WhatsApp antes de enviar.
        </p>
        {rescatadas.length > 0 && (
          <div className="rounded-lg bg-white/5 px-3.5 py-2.5 text-ml-white/70">
            <p className="text-xs text-ml-white/45">
              Datos parciales encontrados en el pedido:
            </p>
            {rescatadas.map((linea) => (
              <span key={linea} className="block">
                {linea}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  const lineas = formatAddressLines(address);
  const textoPlano = [
    address.recipient_name,
    address.phone,
    ...lineas,
    address.references ? `Ref: ${address.references}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoPlano);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin portapapeles (permiso denegado, contexto inseguro): el texto sigue
      // visible y seleccionable, así que no se avisa nada.
    }
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase text-ml-white/45">
          Datos de entrega
        </h3>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs text-ml-white/70 transition hover:border-ml-cyan/50 hover:text-ml-cyan"
        >
          {copiado ? (
            <Check className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copiado ? "Copiada" : "Copiar dirección"}
        </button>
      </div>

      <p>
        <span className="text-ml-white/50">Recibe:</span>{" "}
        {texto(address.recipient_name) || "—"}
      </p>
      <p>
        <span className="text-ml-white/50">WhatsApp / teléfono:</span>{" "}
        {texto(address.phone) || "—"}
      </p>
      <p>
        <span className="text-ml-white/50">Correo:</span>{" "}
        {texto(address.email) || "—"}
      </p>

      <div className="flex gap-2 rounded-lg bg-white/5 px-3.5 py-2.5">
        <MapPin
          className="mt-0.5 h-4 w-4 shrink-0 text-ml-cyan"
          aria-hidden
        />
        <address className="not-italic leading-relaxed text-ml-white/80">
          {lineas.map((linea) => (
            <span key={linea} className="block">
              {linea}
            </span>
          ))}
        </address>
      </div>

      {address.references && (
        <p className="rounded-lg bg-white/5 px-3.5 py-2.5 text-ml-white/70">
          <span className="text-ml-white/50">Referencias:</span>{" "}
          {address.references}
        </p>
      )}
    </div>
  );
}
