import "server-only";

import { requireServiceClient } from "@/lib/db/admin";
import {
  FOLIO_SEED_LAST_ISSUED,
  FolioRpcResultSchema,
  MAX_FOLIO,
  type FolioRepo,
} from "@/lib/admin-cotizador/folios";

/**
 * Repositorio Supabase de los folios del cotizador. Usa el cliente SERVICE
 * ROLE (tablas con RLS sin policies; la función SQL sólo tiene EXECUTE para
 * service_role), así que sólo puede llamarse desde handlers que ya validaron
 * la sesión admin.
 */

const COUNTER_TABLE = "admin_quote_folio_counter";
const RESERVE_FN = "admin_quote_reserve_folios";
/** SQLSTATE propio de la función: mismo UUID con otro contenido. */
const REQUEST_CONFLICT = "MLQ09";

export function createFolioRepo(): FolioRepo {
  const client = requireServiceClient();

  return {
    async lastIssued() {
      const { data, error } = await client
        .from(COUNTER_TABLE)
        .select("last_issued")
        .eq("id", "cot")
        .maybeSingle();
      if (error || !data) throw new Error("FOLIO_READ_FAILED");
      const value = (data as { last_issued: unknown }).last_issued;
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < FOLIO_SEED_LAST_ISSUED ||
        value > MAX_FOLIO
      ) {
        throw new Error("FOLIO_READ_FAILED");
      }
      return value;
    },

    async reserve({ requestId, count, fingerprint }) {
      const { data, error } = await client.rpc(RESERVE_FN, {
        p_request_id: requestId,
        p_count: count,
        p_fingerprint: fingerprint,
      });
      if (error?.code === REQUEST_CONFLICT) return "conflict";
      if (error) throw new Error("FOLIO_RESERVE_FAILED");
      const parsed = FolioRpcResultSchema.safeParse(data);
      if (!parsed.success) throw new Error("FOLIO_RESERVE_FAILED");
      return {
        first: parsed.data.first,
        count: parsed.data.count,
        lastIssued: parsed.data.last_issued,
        replayed: parsed.data.replayed,
      };
    },
  };
}
