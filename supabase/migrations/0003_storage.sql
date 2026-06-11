-- ============================================================================
-- MatrixLab Store Core — Etapa 1 — Storage
--
-- Buckets:
--   design-assets   (PRIVADO) archivos originales subidos por clientes.
--   design-previews (PRIVADO) previews optimizadas + previews compuestas.
--   product-images  (PÚBLICO lectura) imágenes de catálogo subidas por admin.
--
-- Políticas:
--   * Los buckets privados NO tienen policies para anon/authenticated:
--     nadie puede listar ni leer directamente. El backend (service role,
--     que salta RLS) sube archivos y genera URLs firmadas de corta duración.
--   * La ruta de cada archivo incluye un hash de la sesión dueña
--     (design-assets/<hash-sesion>/<design-id>/<archivo>), y el backend solo
--     firma URLs de archivos cuya sesión/diseño coinciden con el solicitante.
--   * product-images permite SELECT público (catálogo), escritura solo admin
--     vía backend.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('design-assets', 'design-assets', false, 10485760,
   array['image/png', 'image/jpeg', 'image/webp']),
  ('design-previews', 'design-previews', false, 5242880,
   array['image/png', 'image/jpeg', 'image/webp']),
  ('product-images', 'product-images', true, 5242880,
   array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- Lectura pública únicamente para imágenes de catálogo.
drop policy if exists "imagenes_de_catalogo_lectura_publica" on storage.objects;
create policy "imagenes_de_catalogo_lectura_publica"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'product-images');

-- Nota: no se crean policies de INSERT/UPDATE/DELETE para ningún bucket ni
-- de SELECT para los buckets privados. El service role del backend es el
-- único camino de escritura/lectura privada (deny-by-default).
