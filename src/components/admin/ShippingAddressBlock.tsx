"use client";

import { useState } from "react";
import { Copy, Check, MapPin } from "lucide-react";
import type { ShippingAddressSnapshot } from "@/lib/db/types";

/**
 * Datos de entrega de un pedido, para el admin.
 *
 * SOLO se usa dentro del panel autenticado: la dirección es PII y no aparece
 * en ninguna vista pública. Ver `formatAddressLines`, que es lo único que
 * arma el texto — nada de esto se registra en logs.
 *
 * Los pedidos anteriores a la captura de dirección tienen `null` y se
 * declaran como tal en vez de renderizar campos vacíos o `undefined`.
 */
export function formatAddressLines(address: ShippingAddressSnapshot): string[] {
  const numeros = [address.exterior_number, address.interior_number]
    .filter(Boolean)
    .join(" int. ");
  return [
    `${address.street} ${numeros}`.trim(),
    address.neighborhood,
    `${address.postal_code} ${address.municipality}`.trim(),
    address.state,
  ].filter((line) => line.trim() !== "");
}

export default function ShippingAddressBlock({
  address,
}: {
  address: ShippingAddressSnapshot | null;
}) {
  const [copiado, setCopiado] = useState(false);

  if (!address) {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <h3 className="text-xs font-bold uppercase text-ml-white/45">
          Datos de entrega
        </h3>
        <p className="rounded-lg bg-white/5 px-3.5 py-2.5 text-ml-white/60">
          Dirección no registrada. Este pedido es anterior a la captura de
          dirección en el checkout: confírmala por WhatsApp antes de enviar.
        </p>
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
        {address.recipient_name}
      </p>
      <p>
        <span className="text-ml-white/50">WhatsApp / teléfono:</span>{" "}
        {address.phone}
      </p>
      <p>
        <span className="text-ml-white/50">Correo:</span> {address.email}
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
