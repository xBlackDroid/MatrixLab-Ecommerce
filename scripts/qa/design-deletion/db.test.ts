import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile, unlink, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withDatabase } from "../consignments/database";
import { deleteDesignFiles, type DesignDeletionJob } from "../../../src/lib/designer/delete-files";

async function main() {
  await withDatabase(async db => {
    const root = await mkdtemp(resolve(".consignment-tests/storage-delete-"));
    const files = new Map<string,string>(); let fail = false;
    const storage = { storage: { from: (bucket: string) => ({
      list: async (folder: string, options: {offset?:number;limit?:number}={}) => {
        const prefix=bucket+"/"+folder+"/";
        const names=[...files.keys()].filter(k=>k.startsWith(prefix)).map(k=>k.slice(prefix.length)).sort();
        return {data:names.slice(options.offset??0,(options.offset??0)+(options.limit??100)).map(name=>({id:name,name})),error:null};
      },
      remove: async (paths: string[]) => {
        if (fail) return {data:null,error:new Error("simulated-storage-failure")};
        for (const path of paths) { const key=bucket+"/"+path; const actual=files.get(key); if(actual) {await unlink(actual);files.delete(key);} }
        return {data:[],error:null};
      },
    }) } } as unknown as SupabaseClient;
    async function put(bucket: string,path: string) {
      const actual=join(root,bucket,path); await mkdir(join(actual,".."),{recursive:true}); await writeFile(actual,Buffer.from("synthetic-upload"));files.set(bucket+"/"+path,actual);return actual;
    }
    const session="synthetic-owner", design=randomUUID(), a=randomUUID(), b=randomUUID(), foreign=randomUUID();
    const prefix=createHash("sha256").update(session).digest("hex").slice(0,16)+"/"+design+"/";
    await db.query("insert into design_projects(id,session_id,product_type,design_json,uploaded_asset_url,preview_url) values($1,$2,'playera',$3,$4,$5)",[design,session,{views:{front:{assets:[{assetId:a},{assetId:b}]}}},prefix+"a.png",prefix+"composite.webp"]);
    for (const [id,name] of [[a,"a"],[b,"b"]]) await db.query("insert into uploaded_assets(id,design_project_id,original_file_url,preview_url,file_name_safe,original_file_name,mime_type,width,height,size_bytes) values($1,$2,$3,$4,$5,$5,'image/png',10,10,16)",[id,design,prefix+name+".png",prefix+name+".webp",name+".png"]);
    const removedFile=await put("design-assets",prefix+"a.png"); await put("design-previews",prefix+"a.webp");
    const retainedFile=await put("design-assets",prefix+"b.png"); await put("design-previews",prefix+"b.webp"); await put("design-previews",prefix+"composite.webp");
    const oldComposite=await put("design-previews",prefix+"preview-ABCDef01.webp");
    const lease=(await db.query("select design_write_begin($1,$2) id",[design,session])).rows[0].id;
    await assert.rejects(db.query("select design_delete_begin($1,$2,false,false)",[design,[a]]),/DESIGN_WRITING/);
    await db.query("delete from design_write_leases where id=$1",[lease]);
    await assert.rejects(db.query("select design_delete_begin($1,$2,false,false)",[design,[foreign]]),/ASSET_NOT_FOUND/);
    const begin=async(project:boolean,ids:string[]|null,resume=false)=>(await db.query("select design_delete_begin($1,$2,$3,$4) job",[design,ids,project,resume])).rows[0].job;
    const job=await begin(false,[a]) as DesignDeletionJob;
    fail=true; await assert.rejects(deleteDesignFiles(storage,job),/STORAGE_DELETE_FAILED/);
    assert.equal((await db.query("select count(*)::int n from uploaded_assets where id=$1",[a])).rows[0].n,1);
    await stat(removedFile);
    await assert.rejects(db.query("select design_write_begin($1,$2)",[design,session]),/DESIGN_DELETING/);
    await assert.rejects(db.query("update design_projects set status='in_review' where id=$1",[design]),/DESIGN_DELETING/);
    await assert.rejects(db.query("insert into cart_items(cart_id,product_id,quantity,unit_price_snapshot,design_project_id) select id,'10000000-0000-4000-8000-000000000001',1,1,$1 from carts limit 1",[design]),/DESIGN_DELETING/);
    fail=false; await deleteDesignFiles(storage,await begin(false,[a],true));
    await db.query("select design_delete_finish($1)",[job.id]);
    await assert.rejects(stat(removedFile),/ENOENT/); await assert.rejects(stat(oldComposite),/ENOENT/); await stat(retainedFile);
    assert.equal((await db.query("select count(*)::int n from uploaded_assets where id=$1",[a])).rows[0].n,0);
    const partial=(await db.query("select * from design_projects where id=$1",[design])).rows[0];
    assert.deepEqual(partial.design_json.views.front.assets,[{assetId:b}]); assert.equal(partial.preview_url,null); assert.equal(partial.uploaded_asset_url,prefix+"b.png");
    await db.query("select design_delete_finish($1)",[job.id]);
    for(let n=0;n<105;n++) await put("design-previews",prefix+`old-${n}.webp`);
    const otherPath="0000000000000000/"+foreign+"/safe.png"; const otherFile=await put("design-assets",otherPath);
    const full=await begin(true,null); await deleteDesignFiles(storage,full); await db.query("select design_delete_finish($1)",[full.id]);
    assert.equal((await db.query("select count(*)::int n from design_projects where id=$1",[design])).rows[0].n,0);
    assert.equal((await db.query("select count(*)::int n from uploaded_assets where design_project_id=$1",[design])).rows[0].n,0);
    assert.equal((await db.query("select count(*)::int n from design_deletion_jobs")).rows[0].n,0);
    await assert.rejects(stat(retainedFile),/ENOENT/); await stat(otherFile); assert.equal(files.size,1);
    assert.equal((await begin(true,null)).alreadyDeleted,true);
    await assert.rejects(deleteDesignFiles(storage,{...full,files:[{bucket:'design-assets',path:otherPath}]}),/UNSAFE_PATH/);
    const anonymous = await db.connect();
    try {
      await anonymous.query("set role anon");
      await assert.rejects(anonymous.query("select * from design_deletion_jobs"),/permission denied/);
      await assert.rejects(anonymous.query("select design_delete_begin($1,null,true,false)",[design]),/permission denied/);
    } finally { await anonymous.query("reset role"); anonymous.release(); }
    const linked=randomUUID(); await db.query("insert into design_projects(id,session_id,product_type) values($1,$2,'playera')",[linked,session]);
    await db.query("insert into cart_items(cart_id,product_id,quantity,unit_price_snapshot,design_project_id) select id,'10000000-0000-4000-8000-000000000001',1,1,$1 from carts limit 1",[linked]);
    await assert.rejects(db.query("select design_delete_begin($1,null,true,false)",[linked]),/DESIGN_LINKED/);
    console.log("PASS: borrado físico + filas DB, selección parcial, previews huérfanos/paginación, fallo y reintento, paths privados, bloqueo concurrente y vínculos de carrito, RLS");
  });
}
main().catch(e=>{console.error(e);process.exit(1)});
