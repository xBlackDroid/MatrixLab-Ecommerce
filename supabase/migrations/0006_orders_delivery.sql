-- ============================================================================
-- Dirección de entrega en los pedidos — migración ADITIVA y forward-only
--
-- CONTEXTO: `orders.shipping_address jsonb` existe desde 0001_schema.sql, pero
-- el checkout nunca pidió la dirección, así que la columna está vacía en el
-- 100 % de los pedidos históricos (verificado: 17 pedidos, 0 con dirección,
-- algunos ya pagados). Esta migración NO crea la columna: agrega la modalidad
-- de entrega y documenta la forma del snapshot.
--
-- GARANTÍAS
--   * Sólo `add column` con default: no reescribe pedidos existentes, no borra
--     nada. Sin DELETE, sin TRUNCATE, sin DROP, sin cambios de tipo.
--   * `shipping_address` SIGUE siendo nullable a propósito: los pedidos
--     anteriores no tienen dirección y deben poder seguir consultándose y
--     actualizándose (el webhook de Mercado Pago los marca como pagados).
--   * Idempotente: se puede correr dos veces sin error.
--
-- POR QUÉ NO HAY UNA RESTRICCIÓN "envío ⇒ dirección" EN LA BASE
-- La tentación es `check (delivery_method <> 'shipping' or shipping_address is
-- not null)`. Incluso con NOT VALID —que no revisa las filas existentes— la
-- restricción SÍ se evalúa cuando una fila vieja se ACTUALIZA, y el webhook
-- actualiza pedidos históricos al confirmarse un pago. Un pedido de hace
-- semanas, sin dirección, quedaría imposible de marcar como pagado: se
-- rompería el cobro por defender un dato que ya no se puede completar.
-- La obligatoriedad vive por eso en el servidor (CheckoutSchema +
-- createOrderFromCart), que es donde nacen los pedidos nuevos.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Modalidad de entrega. Hoy la tienda sólo opera envío a domicilio: el CHECK
-- lista un único valor a propósito, para no inventar modalidades que el
-- checkout no ofrece. Agregar 'pickup' el día que exista es un ALTER de una
-- línea sobre esta misma restricción.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists delivery_method text not null default 'shipping';

do $$
begin
  if not exists (
    -- `conname` es único por (esquema, tabla), no global: sin calificar por
    -- tabla, una restricción homónima en otro lado haría que esto se saltara
    -- en silencio.
    select 1 from pg_constraint
     where conname = 'orders_delivery_method_check'
       and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_delivery_method_check
      check (delivery_method in ('shipping'));
  end if;
end $$;

comment on column public.orders.delivery_method is
  'Modalidad de entrega del pedido. Hoy sólo ''shipping'' (envío a domicilio).';

-- ---------------------------------------------------------------------------
-- Forma del snapshot de dirección. Es una COPIA INMUTABLE de los datos que el
-- cliente escribió durante el checkout: si mañana cambia su dirección, este
-- pedido debe seguir diciendo a dónde se envió.
--
--   {
--     "recipient_name":   "quien recibe",
--     "phone":            "10 dígitos MX normalizados",
--     "email":            "correo de contacto",
--     "postal_code":      "5 dígitos",
--     "state":            "estado",
--     "municipality":     "municipio / alcaldía",
--     "neighborhood":     "colonia",
--     "street":           "calle",
--     "exterior_number":  "número exterior",
--     "interior_number":  "número interior (opcional)",
--     "references":       "referencias de entrega (opcional)"
--   }
--
-- La validación de esa forma vive en src/lib/validation/checkout.ts. NO se
-- añade un CHECK de jsonb aquí: dejaría fuera a los pedidos históricos (todos
-- con NULL) en cuanto alguno se actualice.
-- ---------------------------------------------------------------------------
comment on column public.orders.shipping_address is
  'Snapshot inmutable de la dirección de entrega capturada en el checkout. '
  'NULL en pedidos anteriores a la captura de dirección. '
  'Forma validada por ShippingAddressSchema (src/lib/validation/checkout.ts).';

-- ---------------------------------------------------------------------------
-- Índice para el admin: filtrar pedidos de envío sin dirección (los
-- históricos) sin escanear la tabla completa.
-- ---------------------------------------------------------------------------
create index if not exists orders_missing_address_idx
  on public.orders (created_at desc)
  where shipping_address is null;

-- ---------------------------------------------------------------------------
-- Verificación manual (no altera nada):
-- ---------------------------------------------------------------------------
-- select
--   count(*)                                             as pedidos,
--   count(*) filter (where shipping_address is not null) as con_direccion,
--   count(*) filter (where shipping_address is null)     as sin_direccion,
--   count(distinct delivery_method)                      as modalidades
-- from public.orders;
