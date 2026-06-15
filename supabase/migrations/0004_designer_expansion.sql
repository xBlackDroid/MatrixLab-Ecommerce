-- ============================================================================
-- MatrixLab Store Core — Etapa 2 — Expansión del Laboratorio (ADITIVA)
--
-- Esta migración es 100% aditiva y no destructiva:
--   * Amplía el CHECK de design_projects.product_type para admitir los nuevos
--     tipos de diseñador (sudadera, gorras, planillas, láser).
--   * Agrega columnas nullable designer_type y profile para clasificación y
--     filtrado en el admin. Los diseños v1 existentes quedan intactos.
--
-- NO elimina tablas ni columnas. NO toca RLS, pedidos ni Mercado Pago.
-- Ejecutar después de 0001/0002/0003.
-- ============================================================================

-- 1) Ampliar el conjunto permitido de product_type (incluye los v1).
alter table public.design_projects
  drop constraint if exists design_projects_product_type_check;

alter table public.design_projects
  add constraint design_projects_product_type_check
  check (product_type in (
    'playera', 'gorra', 'tote',
    'sudadera', 'gorra-trucker', 'gorra-clasica',
    'stickers-planilla', 'stickers-repeticion',
    'imanes-planilla', 'imanes-repeticion',
    'laser'
  ));

-- 2) Clasificador de familia de diseñador (garment | sheet | laser).
alter table public.design_projects
  add column if not exists designer_type text
  check (designer_type is null or designer_type in ('garment', 'sheet', 'laser'));

-- 3) Perfil de talla para prendas (niño | mujer | hombre).
alter table public.design_projects
  add column if not exists profile text
  check (profile is null or profile in ('nino', 'mujer', 'hombre'));

create index if not exists idx_designs_designer_type
  on public.design_projects(designer_type);
