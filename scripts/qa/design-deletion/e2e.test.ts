import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { withHarness } from "../consignments/harness";
async function main() {
  const objects = new Map<string,Buffer>(); let failOnce = false;
  await withHarness(async h => {
    const id=randomUUID(), a=randomUUID(), b=randomUUID(), session="synthetic-design-owner";
    const prefix=createHash("sha256").update(session).digest("hex").slice(0,16)+"/"+id+"/";
    await h.db.query("insert into design_projects(id,session_id,product_type,designer_type,design_json,uploaded_asset_url,preview_url) values($1,$2,'playera','garment',$3,$4,$5)",[id,session,{views:{front:{assets:[{assetId:a},{assetId:b}]}}},prefix+"a.png",prefix+"composite.webp"]);
    for(const [asset,name] of [[a,"a"],[b,"b"]]) {
      await h.db.query("insert into uploaded_assets(id,design_project_id,original_file_url,preview_url,file_name_safe,original_file_name,mime_type,width,height,size_bytes) values($1,$2,$3,$4,$5,$5,'image/png',10,10,10)",[asset,id,prefix+name+".png",prefix+name+".webp",name+".png"]);
      objects.set("design-assets/"+prefix+name+".png",Buffer.from("synthetic-file")); objects.set("design-previews/"+prefix+name+".webp",Buffer.from("synthetic-preview"));
    }
    objects.set("design-previews/"+prefix+"composite.webp",Buffer.from("synthetic-composite"));
    const browser=await chromium.launch({headless:true});
    try {
      const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
      await context.addCookies([{name:'ml_admin',value:h.adminCookie,url:h.url}]);
      const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
      const endpoint=h.url+'/api/admin/designs/files';
      const noAuth=await fetch(endpoint,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({designId:id,deleteProject:true})});assert.equal(noAuth.status,401);
      const noCsrf=await fetch(endpoint,{method:'DELETE',headers:{'Content-Type':'application/json',Cookie:'ml_admin='+h.adminCookie},body:JSON.stringify({designId:id,deleteProject:true})});assert.equal(noCsrf.status,401);
      await page.goto(h.url+'/admin/disenos'); await expect(page.getByLabel('Seleccionar archivo a.png')).toBeVisible();
      for(const width of [320,390,430]) {await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
      await page.setViewportSize({width:390,height:844});
      await page.getByLabel('Seleccionar archivo a.png').check(); await page.getByRole('button',{name:'Borrar archivos seleccionados (1)',exact:true}).click();
      await expect(page.getByRole('dialog')).toContainText('a.png'); await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(objects.size,5);
      await page.getByRole('button',{name:'Borrar archivos seleccionados (1)',exact:true}).click();
      await expect(page.getByRole('dialog')).toBeInViewport();
      await page.evaluate(()=>window.scrollTo(0,0));
      await mkdir('.consignment-tests/screenshots',{recursive:true}); await page.screenshot({path:'.consignment-tests/screenshots/tshirt-delete-confirmation.png',fullPage:true});
      failOnce=true; await page.getByRole('button',{name:'Eliminar definitivamente',exact:true}).click();
      await expect(page.getByRole('alert').filter({hasText:'No se completó'})).toBeVisible(); await expect(page.getByRole('button',{name:'Reintentar borrado pendiente',exact:true})).toBeVisible();
      assert.equal((await h.db.query('select count(*)::int n from uploaded_assets where design_project_id=$1',[id])).rows[0].n,2);
      await page.getByRole('button',{name:'Reintentar borrado pendiente',exact:true}).click();await page.getByRole('button',{name:'Eliminar definitivamente',exact:true}).click();
      await expect(page.getByRole('status').filter({hasText:'Borrado completado'})).toBeVisible();await expect(page.getByLabel('Seleccionar archivo a.png')).toHaveCount(0);await expect(page.getByLabel('Seleccionar archivo b.png')).toBeVisible();
      assert.equal(objects.has('design-assets/'+prefix+'a.png'),false);assert.equal(objects.has('design-assets/'+prefix+'b.png'),true);
      await page.getByLabel('Seleccionar preview completo').check();await page.getByRole('button',{name:'Borrar previews seleccionados (1)',exact:true}).click();await page.getByRole('button',{name:'Eliminar definitivamente',exact:true}).click();
      await expect(page.getByText('Aún no hay diseños de clientes.',{exact:false})).toBeVisible();assert.equal(objects.size,0);
      assert.equal((await h.db.query('select count(*)::int n from design_projects where id=$1',[id])).rows[0].n,0);assert.deepEqual(errors,[]);
      console.log('PASS: admin móvil, selección/cancelación, CSRF, fallo Storage y reintento, borrado individual y preview completo con eliminación de registros y objetos');
    } finally {await browser.close();}
  },true,async (url,input,method)=>{
    const route=url.pathname.replace('/storage/v1/','');
    if(route.startsWith('object/list/')) {
      const bucket=route.slice('object/list/'.length), prefix=bucket+'/'+String(input.prefix)+'/';
      const names=[...objects.keys()].filter(k=>k.startsWith(prefix)).map(k=>k.slice(prefix.length)).sort();
      const offset=Number(input.offset??0),limit=Number(input.limit??100);
      return {status:200,data:names.slice(offset,offset+limit).map(name=>({id:randomUUID(),name}))};
    }
    if(method==='DELETE'&&route.startsWith('object/')) {
      if(failOnce){failOnce=false;return {status:503,data:{error:'synthetic storage outage'}};}
      const bucket=route.slice('object/'.length);for(const key of input.prefixes as string[])objects.delete(bucket+'/'+key);return {status:200,data:[]};
    }
    // Descargas/preview no son objeto de este test; renderiza el estado sin URL.
    return {status:404,data:{error:'no signed URL in synthetic adapter'}};
  });
}
main().catch(e=>{console.error(e);process.exit(1)});
