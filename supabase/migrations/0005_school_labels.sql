-- ============================================================================
-- MatrixLab Store Core — Etiquetas Escolares Lab (ADITIVA)
--
-- 100% aditiva y no destructiva. Igual que 0004:
--   * Amplía el CHECK de design_projects.product_type para admitir el nuevo
--     tipo 'etiquetas-escolares' (conserva todos los tipos previos).
--   * Amplía el CHECK de design_projects.designer_type para admitir la familia
--     'school-labels' (conserva garment | sheet | laser).
--
-- NO elimina tablas/columnas. NO toca RLS, pedidos, checkout ni Mercado Pago.
-- Ejecutar después de 0001/0002/0003/0004.
-- ============================================================================

-- 1) Ampliar product_type (incluye todos los tipos previos + etiquetas).
alter table public.design_projects
  drop constraint if exists design_projects_product_type_check;

alter table public.design_projects
  add constraint design_projects_product_type_check
  check (product_type in (
    'playera', 'gorra', 'tote',
    'sudadera', 'gorra-trucker', 'gorra-clasica',
    'stickers-planilla', 'stickers-repeticion',
    'imanes-planilla', 'imanes-repeticion',
    'laser',
    'etiquetas-escolares'
  ));

-- 2) Ampliar designer_type (garment | sheet | laser | school-labels).
alter table public.design_projects
  drop constraint if exists design_projects_designer_type_check;

alter table public.design_projects
  add constraint design_projects_designer_type_check
  check (designer_type is null or designer_type in (
    'garment', 'sheet', 'laser', 'school-labels'
  ));
