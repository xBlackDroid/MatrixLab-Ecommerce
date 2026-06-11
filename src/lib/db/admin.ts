import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/security/env";

/**
 * Cliente Supabase con SERVICE ROLE. Salta RLS: SOLO debe usarse dentro de
 * route handlers / server components que ya validaron sesión y permisos a
 * nivel de aplicación. Jamás importar desde componentes cliente — el import
 * de "server-only" rompe el build si alguien lo intenta.
 */

let cachedClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv();
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;
  cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

/** Igual que getServiceClient pero lanza error controlado si no hay config. */
export function requireServiceClient(): SupabaseClient {
  const client = getServiceClient();
  if (!client) {
    throw new Error("DB_NOT_CONFIGURED");
  }
  return client;
}

/**
 * Bitácora de auditoría. Nunca interrumpe el flujo principal y nunca
 * registra secretos: solo ids, acciones y metadata controlada.
 */
export async function logAudit(entry: {
  actor: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const client = getServiceClient();
    if (!client) return;
    await client.from("audit_logs").insert({
      actor: entry.actor.slice(0, 80),
      action: entry.action.slice(0, 80),
      entity_type: entry.entityType.slice(0, 80),
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch {
    // La auditoría nunca debe tirar una operación de negocio.
  }
}
