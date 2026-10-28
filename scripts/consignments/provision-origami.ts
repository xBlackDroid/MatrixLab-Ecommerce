import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { z } from "zod";
import { usernameSchema, passwordSchema } from "../../src/lib/consignments/access";
import { hashPassword, accessFingerprint } from "../../src/lib/consignments/passwords";

// Administración server-only. No contraseña predeterminada en código ni argumentos.
export async function provisionDistributor(db: SupabaseClient, options: { username: string; password: string; secret: string; name: string; slug: string }) {
  if (options.secret.length < 32) throw new Error("ACCESS_SECRET_REQUIRED");
  const username = usernameSchema.parse(options.username), password = passwordSchema.parse(options.password);
  const name = z.string().trim().min(2).max(120).parse(options.name);
  const slug = z.string().min(2).max(60).regex(/^[a-z0-9-]+$/).parse(options.slug);
  const { data: current, error: lookup } = await db.from("distributors").select("id,is_active").eq("slug", slug).maybeSingle();
  if (lookup) throw new Error("SCHEMA_NOT_READY");
  if (current && !current.is_active) throw new Error("DISTRIBUTOR_INACTIVE");
  const { data: account, error: credentialLookup } = await db.from("distributor_credentials")
    .select("distributor_id,membership_id,is_active").eq("username", username).maybeSingle();
  if (credentialLookup) throw new Error("SCHEMA_NOT_READY");
  if (account) {
    if (account.distributor_id !== current?.id) throw new Error("USERNAME_ALREADY_ASSIGNED");
    if (!account.is_active) throw new Error("ACCOUNT_INACTIVE");
    return { distributorId: current!.id as string, username, status: "already_created", permissions: ["inventory_read", "sale_create", "statement_read"] };
  }
  const dist = (current?.id as string | undefined) ?? randomUUID();
  if (!current) {
    const created = await db.rpc("consignment_command", { p_distributor: dist, p_actor: "setup:distributor", p_actor_type: "matrixlab_admin",
      p_membership: null, p_key: randomUUID(), p_action: "distributor_create", p_payload: { name, slug } });
    if (created.error) throw new Error("DISTRIBUTOR_CREATE_FAILED");
  }
  const command = { action: "create" as const, distributorId: dist, username, password };
  const created = await db.rpc("consignment_access_command", { p_distributor: dist, p_actor: "setup:distributor", p_key: randomUUID(),
    p_action: "create", p_username: username, p_password_digest: await hashPassword(password), p_fingerprint: accessFingerprint(command, options.secret) });
  if (created.error) throw new Error("ACCOUNT_CREATE_FAILED");
  return { distributorId: dist, username, status: "created", permissions: ["inventory_read", "sale_create", "statement_read"] };
}
export function checkTarget(project: string, site: string, supabaseUrl: string) {
  if (!/^[a-z0-9]{20}$/.test(project)) throw new Error("PROJECT_REQUIRED");
  const canonical = new URL(site), provider = new URL(supabaseUrl);
  if (canonical.protocol !== "https:" || canonical.username || canonical.password || canonical.hostname === "localhost") throw new Error("HTTPS_STAGING_REQUIRED");
  if (provider.origin !== `https://${project}.supabase.co` || provider.username || provider.password) throw new Error("PROJECT_MISMATCH");
}
async function main() {
  const { values } = parseArgs({ options: { username: { type: "string", default: "origami" }, name: { type: "string", default: "Origami" },
    slug: { type: "string", default: "origami" }, project: { type: "string" }, site: { type: "string" }, apply: { type: "boolean", default: false } } });
  const username = usernameSchema.parse(values.username), project = values.project ?? "", site = values.site ?? "";
  checkTarget(project, site, `https://${project}.supabase.co`);
  if (!values.apply) { console.log(JSON.stringify({ mode: "dry-run", username, project, site, distributor: values.name, inventory: "empty or preserved", sendsEmail: false })); return; }
  const provider = process.env.SUPABASE_URL ?? "", key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  checkTarget(project, site, provider);
  if (key.length < 32) throw new Error("SERVICE_CREDENTIAL_REQUIRED");
  const secret = process.env.CONSIGNMENT_SESSION_SECRET ?? "";
  if (secret.length < 32) throw new Error("ACCESS_SECRET_REQUIRED");
  if (process.stdin.isTTY) throw new Error("PASSWORD_STDIN_REQUIRED");
  let password = ""; for await (const chunk of process.stdin) { password += chunk; if (password.length > 132) throw new Error("PASSWORD_INVALID"); }
  password = password.replace(/\r?\n$/, "");
  const result = await provisionDistributor(createClient(provider, key, { auth: { persistSession: false, autoRefreshToken: false } }),
    { username, password, secret, name: values.name!, slug: values.slug! });
  await mkdir(resolve(".consignment-tests"), { recursive: true });
  const receipt = resolve(".consignment-tests", `access-${project}-${username}.json`);
  await writeFile(receipt, JSON.stringify({ ...result, project, portal: `${new URL(site).origin}/distribuidores/login`, createdAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ ok: true, status: result.status, username, receipt }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((e) => {
  const code = (e as Error).message;
  console.error(/^[A-Z_]+$/.test(code) ? code : "SETUP_FAILED_CHECK_ARGUMENTS_AND_CONFIGURATION"); process.exitCode = 1;
});
