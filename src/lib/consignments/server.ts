import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getServiceClient, requireServiceClient } from "@/lib/db/admin";
import { getServerEnv } from "@/lib/security/env";
import { verifyCsrf } from "@/lib/security/csrf";
import { sessionHash, verifyToken } from "./tokens";
import type { Snapshot } from "./domain";

export const DISTRIBUTOR_COOKIE = "ml_distributor";
export const enabled = () => getServerEnv().consignmentsEnabled;
export function requireFeature() { if (!enabled()) notFound(); }
export async function distributorSession(token: string | undefined) {
  const session = verifyToken(token ?? "", getServerEnv().consignmentSessionSecret ?? "");
  if (!session || !enabled()) return null;
  const db = getServiceClient(); if (!db) return null;
  const { data: stored, error } = await db.from("consignment_sessions").select("*")
    .eq("token_hash", sessionHash(session.sid)).is("revoked_at", null).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("CONS_SERVICE");
  if (!stored) return null;
  const { data: member, error: me } = await db.from("distributor_memberships").select("*")
    .eq("id", stored.membership_id).eq("distributor_id", stored.distributor_id).eq("auth_user_id", stored.auth_user_id).eq("status", "activa").maybeSingle();
  const { data: d, error: de } = await db.from("distributors").select("id,is_active").eq("id", stored.distributor_id).maybeSingle();
  if (me || de) throw new Error("CONS_SERVICE");
  if (!member || !d?.is_active) return null;
  const { data: credential, error: ce } = await db.from("distributor_credentials").select("membership_id")
    .eq("membership_id", member.id).eq("distributor_id", stored.distributor_id).eq("is_active", true).maybeSingle();
  if (ce) throw new Error("CONS_SERVICE");
  if (!credential) return null;
  return { ...session, membershipId: member.id as string, distributorId: stored.distributor_id as string, userId: stored.auth_user_id as string };
}
export async function getDistributor(request: NextRequest, mutation = false) {
  const session = await distributorSession(request.cookies.get(DISTRIBUTOR_COOKIE)?.value);
  return session && (!mutation || verifyCsrf(request, session.csrf)) ? session : null;
}
export async function requireDistributorPage() {
  requireFeature();
  const s = await distributorSession((await cookies()).get(DISTRIBUTOR_COOKIE)?.value);
  if (!s) redirect("/distribuidores/login");
  return s;
}
export async function snapshot(id: string, admin: boolean): Promise<Snapshot> {
  const { data, error } = await requireServiceClient().rpc("consignment_snapshot", { p_distributor: id, p_admin: admin });
  if (error || !data) throw new Error("CONS_SERVICE");
  return data as Snapshot;
}
export const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 8 * 3600 });
