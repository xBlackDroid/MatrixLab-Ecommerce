import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface DesignDeletionJob {
  id: string; design_id: string; delete_project: boolean; prefix: string;
  files: { bucket: string; path: string }[];
}

/** Se borran bytes primero; la DB conserva el trabajo si cualquier paso falla. */
export async function deleteDesignFiles(client: SupabaseClient, job: DesignDeletionJob): Promise<void> {
  if (!/^[a-f0-9]{16}\/[a-f0-9-]{36}\/$/.test(job.prefix) || job.prefix.split("/")[1] !== job.design_id) throw new Error("UNSAFE_PATH");
  const paths = new Map<string, Set<string>>([["design-assets", new Set()], ["design-previews", new Set()]]);
  for (const file of job.files) {
    if (!paths.has(file.bucket) || !file.path.startsWith(job.prefix) || !/^(?!\.{1,2}$)[A-Za-z0-9._-]+$/.test(file.path.slice(job.prefix.length))) throw new Error("UNSAFE_PATH");
    paths.get(file.bucket)!.add(file.path);
  }
  for (const [bucket, objects] of paths) {
    // Incluye previews anteriores y subidas huérfanas del mismo diseño.
    if (job.delete_project || bucket === "design-previews") {
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await client.storage.from(bucket).list(job.prefix.slice(0, -1), { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
        if (error || !data) throw new Error("STORAGE_LIST_FAILED");
        for (const file of data) {
          if (!file.id || !/^(?!\.{1,2}$)[A-Za-z0-9._-]+$/.test(file.name)) throw new Error("UNSAFE_PATH");
          if (job.delete_project || /^preview-[A-Za-z0-9_-]{8}\.webp$/.test(file.name)) objects.add(job.prefix + file.name);
        }
        if (data.length < 100) break;
      }
    }
    const all = [...objects];
    for (let n = 0; n < all.length; n += 100) {
      const { error } = await client.storage.from(bucket).remove(all.slice(n, n + 100));
      if (error) throw new Error("STORAGE_DELETE_FAILED");
    }
    if (job.delete_project) {
      const { data, error } = await client.storage.from(bucket).list(job.prefix.slice(0, -1), { limit: 1 });
      if (error || !data || data.length) throw new Error("STORAGE_NOT_EMPTY");
    } else if (objects.size) {
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await client.storage.from(bucket).list(job.prefix.slice(0, -1), { limit: 100, offset });
        if (error || !data || data.some(file => objects.has(job.prefix + file.name))) throw new Error("STORAGE_NOT_EMPTY");
        if (data.length < 100) break;
      }
    }
  }
}
