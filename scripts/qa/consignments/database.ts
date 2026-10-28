import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
import { mkdir, mkdtemp, readFile, readdir } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { randomBytes } from "node:crypto";
import { createServer } from "node:net";
import assert from "node:assert/strict";
export async function freePort() {
  const server = createServer(); await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const address = server.address(); if (!address || typeof address === "string") throw new Error("NO_PORT");
  const port = address.port; await new Promise<void>((r, j) => server.close((e) => e ? j(e) : r())); return port;
}
export async function withDatabase<T>(run: (pool: Pool, config: { port: number; password: string }) => Promise<T>) {
  // No env ni URL externa: cada corrida crea un clúster real nuevo en loopback.
  const root = resolve(".consignment-tests"); await mkdir(root, { recursive: true });
  const directory = await mkdtemp(join(root, "pg-"));
  if (relative(root, directory).startsWith("..")) throw new Error("UNSAFE_TEST_PATH");
  const port = await freePort(); const password = randomBytes(24).toString("hex");
  const pg = new EmbeddedPostgres({ databaseDir: directory, port, user: "postgres", password, persistent: true,
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    postgresFlags: ["-h", "127.0.0.1"], onLog: () => {}, onError: () => {} });
  let pool: Pool | undefined;
  try {
    await pg.initialise(); await pg.start();
    pool = new Pool({ host: "127.0.0.1", port, user: "postgres", password, database: "postgres", max: 10 });
    await pool.query(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid,bucket_id text); alter table storage.objects enable row level security;`);
    const files = (await readdir(resolve("supabase/migrations"))).filter((f) => /^\d.*\.sql$/.test(f)).sort();
    for (const f of files) {
      try { await pool.query(await readFile(join("supabase/migrations", f), "utf8")); }
      catch (e) { throw new Error(`Migration ${f}: ${(e as Error).message}`); }
      if (f.startsWith("0008")) {
        await pool.query(`insert into products(id,title,handle,base_price,status) values('10000000-0000-4000-8000-000000000001','Baseline TEST','baseline-test',123,'disponible');
          insert into product_variants(product_id,title,sku,stock) values('10000000-0000-4000-8000-000000000001','Baseline','BASELINE-TEST',99);
          insert into carts(session_id) values('baseline-pre-module-test');`);
      }
    }
    assert.equal((await pool.query("select stock from product_variants where sku='BASELINE-TEST'")).rows[0].stock, 99);
    assert.equal((await pool.query("select count(*)::int n from carts where session_id='baseline-pre-module-test'")).rows[0].n, 1);
    console.log(`PostgreSQL aislado: ${files.length} migraciones aplicadas.`);
    return await run(pool, { port, password });
  } finally { await pool?.end(); await pg.stop(); }
}
