import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/security/env";

/**
 * Cliente Supabase con ANON KEY, sujeto a RLS. Se usa en el servidor para
 * lecturas de catálogo público (categorías/productos/variantes visibles).
 *
 * En esta etapa el navegador nunca habla directo con Supabase: todas las
 * operaciones pasan por route handlers. Si en etapa 2 se usa la anon key en
 * cliente, las policies de RLS ya restringen el acceso a catálogo visible.
 */

let cachedAnon: SupabaseClient | null = null;

export function getAnonClient(): SupabaseClient | null {
  if (cachedAnon) return cachedAnon;
  const { supabaseUrl, supabaseAnonKey } = getServerEnv();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  cachedAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedAnon;
}
