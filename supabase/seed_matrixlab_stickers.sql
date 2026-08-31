-- ============================================================================
-- MatrixLab Stickers — 110 diseños de PLANILLA — Seed aditivo e IDEMPOTENTE
--
-- ***  LISTO PARA EJECUTAR — PERO NO EJECUTADO EN ESTE RELEASE  ***
--
-- El precio quedó confirmado ($85 MXN por PLANILLA), así que este seed ya NO
-- está bloqueado: crea los 110 productos vendibles. Sigue sin ejecutarse hasta
-- que se autorice explícitamente.
--
-- UNIDAD COMERCIAL: cada fila es una COLECCIÓN completa que se vende como
-- PLANILLA (15 a 21 stickers aprox., según el tamaño de los diseños), NO un
-- sticker suelto. GE001 = la planilla Geek GE001. Cantidad 1 = 1 planilla.
--
-- FUENTE DE VERDAD: Inventario_MatrixLab_Stickers.xlsx (hoja "Inventario
-- Stickers"), leído por scripts/data/build-matrixlab-catalogs.py, que también
-- REGENERA el bloque de datos de este archivo. No editar las filas a mano.
--   columna B -> código (GE001…LE010)  |  columna C -> nombre
--   columna D -> categoría temática    |  columna F -> descripción
--   columna G -> acabado / tamaño      |  columna H -> planillas (99)
--   columna I -> SKU (STK-<código>)    |  columna L -> handle
-- La columna K ("Valor total") NO se usa.
--
-- PRECIO: la columna J del Excel llegó VACÍA en las 110 filas. Los $85 por
-- PLANILLA NO se dedujeron de ninguna otra línea: son el precio único
-- CONFIRMADO comercialmente para este release. La fuente única del valor es
-- `MATRIXLAB_STICKERS_SHEET_PRICE` en src/lib/store/matrixlab-stickers.ts; el
-- generador lo lee de ahí, así que el módulo y este seed no pueden divergir.
-- El nombre lleva SHEET a propósito: $85 es la planilla, nunca la pieza.
--
-- AUDITORÍA DE RUTA: la categoría `stickers` YA EXISTE (supabase/seed.sql y
-- seed_designer_base_v2.sql). Este seed NO crea una categoría nueva y NO
-- cambia el handle público /tienda/categoria/stickers.
--
-- ESTA LÍNEA NO ES MatrixLab Tumbler: los 209 UV Stickers de Tumbler viven en
-- la categoría `wraps-glow-finish` con SKU `STK-A###` y NO se tocan aquí. Los
-- SKU de esta línea son `STK-<2 letras><3 dígitos>` (STK-GE001), así que no
-- colisionan.
--
-- GARANTÍAS
--   * Re-ejecutable: upsert por `handle` (producto) y por `sku` (variante).
--     Si el producto ya existe, CONSERVA su id — no se reasignan ids.
--   * NO borra nada: sin DELETE, sin TRUNCATE, sin DROP.
--   * NO toca Tumbler (Sparkles, UV Stickers de Tumbler, Vasos), ni pedidos,
--     ni diseños, ni usuarios, ni Mercado Pago.
--   * NO toca los productos genéricos previos de la categoría ("Sticker
--     personalizado", "Planilla de stickers"): siguen vivos en la base y en el
--     admin; el catálogo sólo los separa de ESTA presentación pública. Ese
--     producto genérico homónimo NO es esta línea: no comparte handle ni SKU.
--   * NO toca `images`: la foto se resuelve por código desde
--     public/images/matrixlab-stickers/<codigo>.webp y el admin puede curar
--     imágenes sin que el seed las pise.
--   * NO toca `compare_at_price` ni `production_time` (curables desde admin).
--
-- RESULTADO ESPERADO: 110 productos, 110 variantes, 10 890 planillas.
-- ============================================================================

-- Todo el seed corre en UNA transacción: si cualquier guardia falla, no queda
-- nada a medias. Sin esto, `psql -f` autocommitea sentencia por sentencia y
-- seguiria adelante tras un error (docs/TIENDA.md documenta ese modo de uso).
begin;

-- ---------------------------------------------------------------------------
-- La categoría debe existir: este seed NUNCA crea una segunda categoría ni
-- cambia el handle público /tienda/categoria/stickers.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from public.categories where handle = 'stickers'
  ) then
    raise exception
      'Falta la categoría stickers. Ejecuta supabase/seed.sql primero.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Catálogo. Bloque REGENERADO desde el Excel: no editar a mano.
--   (handle, código, nombre, descripción, acabado, planillas, SKU, precio
--    POR PLANILLA)
-- ---------------------------------------------------------------------------
with stickers(handle, code, title, description, finish_label, stock, sku, price) as (
  values
-- <generated:matrixlab-stickers-seed>
  ('sticker-geek-codigo-cosmico', 'GE001', 'Sticker Geek - Código Cósmico', 'Look inteligente y divertido para darle personalidad a laptop, vaso o libreta.', 'UV DTF / temático', 99, 'STK-GE001', 85),
  ('sticker-geek-modo-nerd', 'GE002', 'Sticker Geek - Modo Nerd', 'Un detalle geek con actitud cool para quienes presumen lo que aman.', 'UV DTF / temático', 99, 'STK-GE002', 85),
  ('sticker-geek-ctrl-z', 'GE003', 'Sticker Geek - Ctrl Z', 'Perfecto para fans de la tecnología que quieren un sticker con guiño divertido.', 'UV DTF / temático', 99, 'STK-GE003', 85),
  ('sticker-geek-ciencia-pop', 'GE004', 'Sticker Geek - Ciencia Pop', 'Color, curiosidad y vibra creativa en un diseño fácil de combinar.', 'UV DTF / temático', 99, 'STK-GE004', 85),
  ('sticker-geek-pixel-genius', 'GE005', 'Sticker Geek - Pixel Genius', 'Toque retro-digital para que cualquier accesorio se vea más único.', 'UV DTF / temático', 99, 'STK-GE005', 85),
  ('sticker-geek-cafe-y-codigo', 'GE006', 'Sticker Geek - Café y Código', 'Ideal para mentes creativas que funcionan mejor con café y buenas ideas.', 'UV DTF / temático', 99, 'STK-GE006', 85),
  ('sticker-geek-universo-retro', 'GE007', 'Sticker Geek - Universo Retro', 'Nostalgia geek lista para pegar y convertir lo simple en especial.', 'UV DTF / temático', 99, 'STK-GE007', 85),
  ('sticker-geek-byte-lover', 'GE008', 'Sticker Geek - Byte Lover', 'Pequeño, expresivo y hecho para fans de los detalles tech.', 'UV DTF / temático', 99, 'STK-GE008', 85),
  ('sticker-geek-lab-vibes', 'GE009', 'Sticker Geek - Lab Vibes', 'Energía de laboratorio creativo para personalizar con estilo MatrixLab.', 'UV DTF / temático', 99, 'STK-GE009', 85),
  ('sticker-geek-cerebro-digital', 'GE010', 'Sticker Geek - Cerebro Digital', 'Diseño con chispa para quienes llevan la creatividad en modo activo.', 'UV DTF / temático', 99, 'STK-GE010', 85),
  ('sticker-gamer-nivel-pro', 'GA001', 'Sticker Gamer - Nivel Pro', 'Para subirle el estilo a cualquier termo, consola o setup gamer.', 'UV DTF / temático', 99, 'STK-GA001', 85),
  ('sticker-gamer-respawn', 'GA002', 'Sticker Gamer - Respawn', 'Un sticker con vibra de segunda oportunidad y partida nueva.', 'UV DTF / temático', 99, 'STK-GA002', 85),
  ('sticker-gamer-joystick-power', 'GA003', 'Sticker Gamer - Joystick Power', 'Energía gamer lista para destacar en tu colección favorita.', 'UV DTF / temático', 99, 'STK-GA003', 85),
  ('sticker-gamer-boss-final', 'GA004', 'Sticker Gamer - Boss Final', 'Diseño con presencia para quienes juegan siempre con actitud ganadora.', 'UV DTF / temático', 99, 'STK-GA004', 85),
  ('sticker-gamer-loot-legendario', 'GA005', 'Sticker Gamer - Loot Legendario', 'Ese detalle especial que se siente como recompensa desbloqueada.', 'UV DTF / temático', 99, 'STK-GA005', 85),
  ('sticker-gamer-gg-vibes', 'GA006', 'Sticker Gamer - GG Vibes', 'Simple, divertido y perfecto para fans de las buenas partidas.', 'UV DTF / temático', 99, 'STK-GA006', 85),
  ('sticker-gamer-modo-co-op', 'GA007', 'Sticker Gamer - Modo Co-op', 'Ideal para regalar o combinar con tu dúo gamer favorito.', 'UV DTF / temático', 99, 'STK-GA007', 85),
  ('sticker-gamer-game-over-cool', 'GA008', 'Sticker Gamer - Game Over Cool', 'Un toque atrevido para accesorios que necesitan más personalidad.', 'UV DTF / temático', 99, 'STK-GA008', 85),
  ('sticker-gamer-xp-boost', 'GA009', 'Sticker Gamer - XP Boost', 'Diseño dinámico para que tu sticker se sienta como mejora instantánea.', 'UV DTF / temático', 99, 'STK-GA009', 85),
  ('sticker-gamer-headset-on', 'GA010', 'Sticker Gamer - Headset On', 'Vibra de streaming, chat y partidas largas en un solo detalle.', 'UV DTF / temático', 99, 'STK-GA010', 85),
  ('sticker-pokemon-entrenador-elite', 'PK001', 'Sticker Pokemon - Entrenador Elite', 'Para fans que quieren llevar su aventura favorita a todos lados.', 'UV DTF / temático', 99, 'STK-PK001', 85),
  ('sticker-pokemon-pokebola-pop', 'PK002', 'Sticker Pokemon - Pokebola Pop', 'Color llamativo y nostalgia instantánea para personalizar con energía.', 'UV DTF / temático', 99, 'STK-PK002', 85),
  ('sticker-pokemon-tipo-electrico', 'PK003', 'Sticker Pokemon - Tipo Eléctrico', 'Diseño vibrante para darle chispa a vasos, libretas o laptops.', 'UV DTF / temático', 99, 'STK-PK003', 85),
  ('sticker-pokemon-ruta-aventura', 'PK004', 'Sticker Pokemon - Ruta Aventura', 'Un sticker listo para acompañar colecciones, regalos y combos temáticos.', 'UV DTF / temático', 99, 'STK-PK004', 85),
  ('sticker-pokemon-batalla-epica', 'PK005', 'Sticker Pokemon - Batalla Épica', 'Perfecto para quienes aman la emoción de cada duelo y evolución.', 'UV DTF / temático', 99, 'STK-PK005', 85),
  ('sticker-pokemon-starter-vibes', 'PK006', 'Sticker Pokemon - Starter Vibes', 'Ese detalle inicial que vuelve cualquier accesorio más coleccionable.', 'UV DTF / temático', 99, 'STK-PK006', 85),
  ('sticker-pokemon-gimnasio-pro', 'PK007', 'Sticker Pokemon - Gimnasio Pro', 'Estilo de campeón para fans que no pasan desapercibidos.', 'UV DTF / temático', 99, 'STK-PK007', 85),
  ('sticker-pokemon-captura-total', 'PK008', 'Sticker Pokemon - Captura Total', 'Diseño irresistible para atrapar miradas desde el primer vistazo.', 'UV DTF / temático', 99, 'STK-PK008', 85),
  ('sticker-pokemon-liga-master', 'PK009', 'Sticker Pokemon - Liga Master', 'Un toque ganador para completar sets con mucha personalidad.', 'UV DTF / temático', 99, 'STK-PK009', 85),
  ('sticker-pokemon-evolucion-glow', 'PK010', 'Sticker Pokemon - Evolución Glow', 'Vibra brillante y coleccionable para fans de todas las generaciones.', 'UV DTF / temático', 99, 'STK-PK010', 85),
  ('sticker-futbol-golazo', 'FU001', 'Sticker Futbol - Golazo', 'Pura pasión de cancha para pegar donde se vive el futbol.', 'UV DTF / temático', 99, 'STK-FU001', 85),
  ('sticker-futbol-pasion-de-cancha', 'FU002', 'Sticker Futbol - Pasión de Cancha', 'Diseño hecho para hinchas que llevan el juego en el corazón.', 'UV DTF / temático', 99, 'STK-FU002', 85),
  ('sticker-futbol-barra-brava', 'FU003', 'Sticker Futbol - Barra Brava', 'Energía de estadio para accesorios con carácter y movimiento.', 'UV DTF / temático', 99, 'STK-FU003', 85),
  ('sticker-futbol-campeon', 'FU004', 'Sticker Futbol - Campeón', 'Sticker ideal para celebrar victorias, torneos y equipos favoritos.', 'UV DTF / temático', 99, 'STK-FU004', 85),
  ('sticker-futbol-tiro-libre', 'FU005', 'Sticker Futbol - Tiro Libre', 'Un detalle dinámico que se siente listo para meter gol.', 'UV DTF / temático', 99, 'STK-FU005', 85),
  ('sticker-futbol-porteria', 'FU006', 'Sticker Futbol - Portería', 'Estilo futbolero limpio para vasos, termos o libretas deportivas.', 'UV DTF / temático', 99, 'STK-FU006', 85),
  ('sticker-futbol-balon-clasico', 'FU007', 'Sticker Futbol - Balón Clásico', 'Diseño fácil de vender para fans de todas las edades.', 'UV DTF / temático', 99, 'STK-FU007', 85),
  ('sticker-futbol-la-10', 'FU008', 'Sticker Futbol - La 10', 'Para quien quiere sentirse figura dentro y fuera de la cancha.', 'UV DTF / temático', 99, 'STK-FU008', 85),
  ('sticker-futbol-hincha-fiel', 'FU009', 'Sticker Futbol - Hincha Fiel', 'Un sticker con orgullo para quienes nunca abandonan a su equipo.', 'UV DTF / temático', 99, 'STK-FU009', 85),
  ('sticker-futbol-final-sonada', 'FU010', 'Sticker Futbol - Final Soñada', 'Perfecto para regalos, celebraciones y temporadas de torneo.', 'UV DTF / temático', 99, 'STK-FU010', 85),
  ('sticker-resident-evil-umbrella-alert', 'RE001', 'Sticker Resident Evil - Umbrella Alert', 'Estética survival horror para fans que aman lo oscuro y coleccionable.', 'UV DTF / temático', 99, 'STK-RE001', 85),
  ('sticker-resident-evil-survival-mode', 'RE002', 'Sticker Resident Evil - Survival Mode', 'Diseño intenso para darle misterio a cualquier accesorio.', 'UV DTF / temático', 99, 'STK-RE002', 85),
  ('sticker-resident-evil-biohazard', 'RE003', 'Sticker Resident Evil - Biohazard', 'Un clásico de terror con presencia fuerte y estilo gamer.', 'UV DTF / temático', 99, 'STK-RE003', 85),
  ('sticker-resident-evil-laboratorio-oscuro', 'RE004', 'Sticker Resident Evil - Laboratorio Oscuro', 'Vibra de suspenso perfecta para termos, laptops y libretas.', 'UV DTF / temático', 99, 'STK-RE004', 85),
  ('sticker-resident-evil-noche-infectada', 'RE005', 'Sticker Resident Evil - Noche Infectada', 'Para quienes buscan un sticker con tensión y mucho carácter.', 'UV DTF / temático', 99, 'STK-RE005', 85),
  ('sticker-resident-evil-mision-escape', 'RE006', 'Sticker Resident Evil - Misión Escape', 'Diseño llamativo que se siente listo para una historia secreta.', 'UV DTF / temático', 99, 'STK-RE006', 85),
  ('sticker-resident-evil-clave-roja', 'RE007', 'Sticker Resident Evil - Clave Roja', 'Un detalle oscuro y elegante para fans del horror de supervivencia.', 'UV DTF / temático', 99, 'STK-RE007', 85),
  ('sticker-resident-evil-susto-premium', 'RE008', 'Sticker Resident Evil - Susto Premium', 'Sticker con impacto visual para destacar en cualquier colección.', 'UV DTF / temático', 99, 'STK-RE008', 85),
  ('sticker-resident-evil-archivo-secreto', 'RE009', 'Sticker Resident Evil - Archivo Secreto', 'Perfecto para quienes aman pistas, misterio y estética de culto.', 'UV DTF / temático', 99, 'STK-RE009', 85),
  ('sticker-resident-evil-antihero-vibes', 'RE010', 'Sticker Resident Evil - Antihero Vibes', 'Actitud intensa y coleccionable para accesorios con personalidad fuerte.', 'UV DTF / temático', 99, 'STK-RE010', 85),
  ('sticker-graduaciones-orgullo-graduado', 'GR001', 'Sticker Graduaciones - Orgullo Graduado', 'Ideal para celebrar el logro con un detalle bonito y memorable.', 'UV DTF / temático', 99, 'STK-GR001', 85),
  ('sticker-graduaciones-birrete-brillante', 'GR002', 'Sticker Graduaciones - Birrete Brillante', 'Un sticker festivo para regalos, termos y recuerdos de graduación.', 'UV DTF / temático', 99, 'STK-GR002', 85),
  ('sticker-graduaciones-generacion-2026', 'GR003', 'Sticker Graduaciones - Generación 2026', 'Perfecto para personalizar souvenirs de una generación inolvidable.', 'UV DTF / temático', 99, 'STK-GR003', 85),
  ('sticker-graduaciones-meta-cumplida', 'GR004', 'Sticker Graduaciones - Meta Cumplida', 'Diseño emotivo para celebrar esfuerzo, cierre de etapa y nuevos comienzos.', 'UV DTF / temático', 99, 'STK-GR004', 85),
  ('sticker-graduaciones-foto-de-honor', 'GR005', 'Sticker Graduaciones - Foto de Honor', 'Detalle especial para acompañar recuerdos, álbumes o regalos.', 'UV DTF / temático', 99, 'STK-GR005', 85),
  ('sticker-graduaciones-diploma-vibes', 'GR006', 'Sticker Graduaciones - Diploma Vibes', 'Un toque elegante y alegre para festejar el gran día.', 'UV DTF / temático', 99, 'STK-GR006', 85),
  ('sticker-graduaciones-promocion', 'GR007', 'Sticker Graduaciones - Promoción', 'Sticker versátil para packs escolares, fiestas y entregas especiales.', 'UV DTF / temático', 99, 'STK-GR007', 85),
  ('sticker-graduaciones-sueno-logrado', 'GR008', 'Sticker Graduaciones - Sueño Logrado', 'Mensaje inspirador que convierte cualquier producto en recuerdo significativo.', 'UV DTF / temático', 99, 'STK-GR008', 85),
  ('sticker-graduaciones-fiesta-de-grado', 'GR009', 'Sticker Graduaciones - Fiesta de Grado', 'Energía de celebración lista para personalizar y regalar.', 'UV DTF / temático', 99, 'STK-GR009', 85),
  ('sticker-graduaciones-futuro-brillante', 'GR010', 'Sticker Graduaciones - Futuro Brillante', 'Diseño optimista para vender como detalle de cierre y comienzo.', 'UV DTF / temático', 99, 'STK-GR010', 85),
  ('sticker-my-little-pony-arcoiris-amistad', 'ML001', 'Sticker My Little Pony - Arcoíris Amistad', 'Color dulce y mágico para fans de los detalles tiernos.', 'UV DTF / temático', 99, 'STK-ML001', 85),
  ('sticker-my-little-pony-pony-magic', 'ML002', 'Sticker My Little Pony - Pony Magic', 'Diseño encantador que vuelve cualquier accesorio más alegre.', 'UV DTF / temático', 99, 'STK-ML002', 85),
  ('sticker-my-little-pony-dulce-encanto', 'ML003', 'Sticker My Little Pony - Dulce Encanto', 'Perfecto para regalos infantiles, termos y libretas llenas de color.', 'UV DTF / temático', 99, 'STK-ML003', 85),
  ('sticker-my-little-pony-brillo-pastel', 'ML004', 'Sticker My Little Pony - Brillo Pastel', 'Vibra suave, bonita y muy coleccionable para combinar en sets.', 'UV DTF / temático', 99, 'STK-ML004', 85),
  ('sticker-my-little-pony-friendship-vibes', 'ML005', 'Sticker My Little Pony - Friendship Vibes', 'Un sticker alegre para celebrar amistad, color y fantasía.', 'UV DTF / temático', 99, 'STK-ML005', 85),
  ('sticker-my-little-pony-marca-magica', 'ML006', 'Sticker My Little Pony - Marca Mágica', 'Detalle especial con personalidad tierna y mucha luz visual.', 'UV DTF / temático', 99, 'STK-ML006', 85),
  ('sticker-my-little-pony-nube-pastel', 'ML007', 'Sticker My Little Pony - Nube Pastel', 'Diseño suave y llamativo para productos con estilo cute.', 'UV DTF / temático', 99, 'STK-ML007', 85),
  ('sticker-my-little-pony-aventura-pony', 'ML008', 'Sticker My Little Pony - Aventura Pony', 'Ideal para fans que quieren llevar fantasía a todas partes.', 'UV DTF / temático', 99, 'STK-ML008', 85),
  ('sticker-my-little-pony-corazon-arcoiris', 'ML009', 'Sticker My Little Pony - Corazón Arcoíris', 'Un toque feliz para accesorios que necesitan más color.', 'UV DTF / temático', 99, 'STK-ML009', 85),
  ('sticker-my-little-pony-sueno-magico', 'ML010', 'Sticker My Little Pony - Sueño Mágico', 'Sticker dulce y brillante, fácil de amar desde el primer vistazo.', 'UV DTF / temático', 99, 'STK-ML010', 85),
  ('sticker-god-bless-america-stars-and-stripes', 'GB001', 'Sticker God Bless America - Stars & Stripes', 'Orgullo patriótico con look limpio para termos, autos o laptops.', 'UV DTF / temático', 99, 'STK-GB001', 85),
  ('sticker-god-bless-america-freedom-vibes', 'GB002', 'Sticker God Bless America - Freedom Vibes', 'Diseño fuerte y positivo para celebrar el espíritu americano.', 'UV DTF / temático', 99, 'STK-GB002', 85),
  ('sticker-god-bless-america-usa-pride', 'GB003', 'Sticker God Bless America - USA Pride', 'Un clásico visual fácil de vender en temporadas patrióticas.', 'UV DTF / temático', 99, 'STK-GB003', 85),
  ('sticker-god-bless-america-patriotic-heart', 'GB004', 'Sticker God Bless America - Patriotic Heart', 'Detalle emotivo para regalos, celebraciones y recuerdos familiares.', 'UV DTF / temático', 99, 'STK-GB004', 85),
  ('sticker-god-bless-america-liberty-shine', 'GB005', 'Sticker God Bless America - Liberty Shine', 'Brillo de libertad para accesorios con presencia y significado.', 'UV DTF / temático', 99, 'STK-GB005', 85),
  ('sticker-god-bless-america-america-strong', 'GB006', 'Sticker God Bless America - America Strong', 'Mensaje poderoso para quienes quieren mostrar orgullo con estilo.', 'UV DTF / temático', 99, 'STK-GB006', 85),
  ('sticker-god-bless-america-red-white-blue', 'GB007', 'Sticker God Bless America - Red White Blue', 'Combinación icónica para destacar rápido en cualquier producto.', 'UV DTF / temático', 99, 'STK-GB007', 85),
  ('sticker-god-bless-america-blessings-usa', 'GB008', 'Sticker God Bless America - Blessings USA', 'Diseño con fe, orgullo y vibra positiva para regalar.', 'UV DTF / temático', 99, 'STK-GB008', 85),
  ('sticker-god-bless-america-liberty-spirit', 'GB009', 'Sticker God Bless America - Liberty Spirit', 'Estilo patriótico elegante para colecciones temáticas y souvenirs.', 'UV DTF / temático', 99, 'STK-GB009', 85),
  ('sticker-god-bless-america-home-of-the-brave', 'GB010', 'Sticker God Bless America - Home of the Brave', 'Un sticker con mensaje fuerte y presencia memorable.', 'UV DTF / temático', 99, 'STK-GB010', 85),
  ('sticker-anime-senpai-mood', 'AN001', 'Sticker Anime - Senpai Mood', 'Vibra anime divertida para fans que aman personalizarlo todo.', 'UV DTF / temático', 99, 'STK-AN001', 85),
  ('sticker-anime-kawaii-pop', 'AN002', 'Sticker Anime - Kawaii Pop', 'Color y ternura para hacer más cute cualquier accesorio.', 'UV DTF / temático', 99, 'STK-AN002', 85),
  ('sticker-anime-shonen-power', 'AN003', 'Sticker Anime - Shonen Power', 'Energía de protagonista para stickers con mucha actitud.', 'UV DTF / temático', 99, 'STK-AN003', 85),
  ('sticker-anime-chibi-star', 'AN004', 'Sticker Anime - Chibi Star', 'Diseño adorable y coleccionable para regalos y combos temáticos.', 'UV DTF / temático', 99, 'STK-AN004', 85),
  ('sticker-anime-sakura-vibes', 'AN005', 'Sticker Anime - Sakura Vibes', 'Toque suave y visual para fans del estilo japonés.', 'UV DTF / temático', 99, 'STK-AN005', 85),
  ('sticker-anime-otaku-heart', 'AN006', 'Sticker Anime - Otaku Heart', 'Un sticker directo para quienes presumen su fandom con orgullo.', 'UV DTF / temático', 99, 'STK-AN006', 85),
  ('sticker-anime-manga-panel', 'AN007', 'Sticker Anime - Manga Panel', 'Look de viñeta para personalizar con estética de historia.', 'UV DTF / temático', 99, 'STK-AN007', 85),
  ('sticker-anime-hero-arc', 'AN008', 'Sticker Anime - Hero Arc', 'Diseño con vibra de evolución, aventura y momento épico.', 'UV DTF / temático', 99, 'STK-AN008', 85),
  ('sticker-anime-mecha-energy', 'AN009', 'Sticker Anime - Mecha Energy', 'Estilo futurista para accesorios con presencia fuerte.', 'UV DTF / temático', 99, 'STK-AN009', 85),
  ('sticker-anime-magic-girl', 'AN010', 'Sticker Anime - Magic Girl', 'Brillo, color y fantasía para colecciones llenas de encanto.', 'UV DTF / temático', 99, 'STK-AN010', 85),
  ('sticker-musica-beat-lover', 'MU001', 'Sticker Musica - Beat Lover', 'Ritmo visual para fans que llevan la música a todos lados.', 'UV DTF / temático', 99, 'STK-MU001', 85),
  ('sticker-musica-vinilo-retro', 'MU002', 'Sticker Musica - Vinilo Retro', 'Nostalgia musical perfecta para termos, laptops y libretas.', 'UV DTF / temático', 99, 'STK-MU002', 85),
  ('sticker-musica-corazon-pop', 'MU003', 'Sticker Musica - Corazón Pop', 'Diseño alegre para quienes aman canciones pegajosas y buen estilo.', 'UV DTF / temático', 99, 'STK-MU003', 85),
  ('sticker-musica-bajo-profundo', 'MU004', 'Sticker Musica - Bajo Profundo', 'Un sticker con presencia para accesorios con actitud sonora.', 'UV DTF / temático', 99, 'STK-MU004', 85),
  ('sticker-musica-karaoke-night', 'MU005', 'Sticker Musica - Karaoke Night', 'Ideal para regalos divertidos y colecciones con vibra de fiesta.', 'UV DTF / temático', 99, 'STK-MU005', 85),
  ('sticker-musica-festival-vibes', 'MU006', 'Sticker Musica - Festival Vibes', 'Color y energía para quienes viven esperando el próximo concierto.', 'UV DTF / temático', 99, 'STK-MU006', 85),
  ('sticker-musica-playlist-mood', 'MU007', 'Sticker Musica - Playlist Mood', 'Un detalle moderno para personalizar con canciones favoritas.', 'UV DTF / temático', 99, 'STK-MU007', 85),
  ('sticker-musica-guitarra-vibe', 'MU008', 'Sticker Musica - Guitarra Vibe', 'Diseño clásico para fans de riffs, bandas y escenarios.', 'UV DTF / temático', 99, 'STK-MU008', 85),
  ('sticker-musica-nota-brillante', 'MU009', 'Sticker Musica - Nota Brillante', 'Toque musical limpio y vendible para cualquier producto.', 'UV DTF / temático', 99, 'STK-MU009', 85),
  ('sticker-musica-dj-energy', 'MU010', 'Sticker Musica - DJ Energy', 'Vibra nocturna y dinámica para stickers con mucho movimiento.', 'UV DTF / temático', 99, 'STK-MU010', 85),
  ('sticker-lectura-book-lover', 'LE001', 'Sticker Lectura - Book Lover', 'Para quien siempre trae una historia favorita en la cabeza.', 'UV DTF / temático', 99, 'STK-LE001', 85),
  ('sticker-lectura-capitulo-feliz', 'LE002', 'Sticker Lectura - Capítulo Feliz', 'Un sticker cálido para libretas, termos y rincones de lectura.', 'UV DTF / temático', 99, 'STK-LE002', 85),
  ('sticker-lectura-cafe-y-libro', 'LE003', 'Sticker Lectura - Café y Libro', 'Combo irresistible para lectores que disfrutan los pequeños rituales.', 'UV DTF / temático', 99, 'STK-LE003', 85),
  ('sticker-lectura-pagina-magica', 'LE004', 'Sticker Lectura - Página Mágica', 'Diseño encantador que convierte cualquier accesorio en biblioteca personal.', 'UV DTF / temático', 99, 'STK-LE004', 85),
  ('sticker-lectura-tbr-mood', 'LE005', 'Sticker Lectura - TBR Mood', 'Perfecto para fans de listas infinitas y próximas lecturas.', 'UV DTF / temático', 99, 'STK-LE005', 85),
  ('sticker-lectura-libreria-vibes', 'LE006', 'Sticker Lectura - Librería Vibes', 'Aroma visual de estantes, historias nuevas y tardes tranquilas.', 'UV DTF / temático', 99, 'STK-LE006', 85),
  ('sticker-lectura-marcapaginas-cool', 'LE007', 'Sticker Lectura - Marcapáginas Cool', 'Un detalle lector que también funciona perfecto como regalo.', 'UV DTF / temático', 99, 'STK-LE007', 85),
  ('sticker-lectura-novela-favorita', 'LE008', 'Sticker Lectura - Novela Favorita', 'Sticker emotivo para quienes se enamoran de cada historia.', 'UV DTF / temático', 99, 'STK-LE008', 85),
  ('sticker-lectura-plot-twist', 'LE009', 'Sticker Lectura - Plot Twist', 'Diseño divertido para lectores que aman las sorpresas.', 'UV DTF / temático', 99, 'STK-LE009', 85),
  ('sticker-lectura-lectura-cozy', 'LE010', 'Sticker Lectura - Lectura Cozy', 'Vibra cómoda y bonita para accesorios con alma tranquila.', 'UV DTF / temático', 99, 'STK-LE010', 85)
  -- </generated:matrixlab-stickers-seed>
),
upserted as (
  insert into public.products (
    category_id, title, handle, description, base_price, status,
    is_customizable, production_time, min_quantity, max_quantity, tags
  )
  select
    (select id from public.categories where handle = 'stickers'),
    s.title,
    s.handle,
    -- La descripción del Excel habla del diseño; la unidad comercial se dice
    -- aquí para que la ficha pública tampoco pueda leerse como sticker suelto.
    -- Va PRIMERO a propósito: la metadata del producto corta a 160 caracteres,
    -- así que lo que no puede perderse es la planilla, no el adjetivo.
    -- Bloque REGENERADO desde el módulo TS: no editar a mano.
-- <generated:matrixlab-stickers-copy>
  'Cada planilla incluye aproximadamente 15 a 21 stickers, dependiendo del tamaño de los diseños.'
  -- </generated:matrixlab-stickers-copy>
      || E'\n\n' || s.description,
    s.price,
    case when s.stock > 0 then 'disponible' else 'agotado' end,
    false,
    '2 a 3 días hábiles',
    1,
    s.stock,
    array['matrixlab-stickers', 'planilla', 'sticker', s.code]
  from stickers s
  on conflict (handle) do update set
    title = excluded.title,
    description = excluded.description,
    base_price = excluded.base_price,
    status = excluded.status,
    max_quantity = excluded.max_quantity,
    tags = excluded.tags
  returning id, handle
)
insert into public.product_variants (
  product_id, title, sku, price, stock, option_label, status
)
select
  u.id,
  -- La variante ES la unidad de venta: una planilla completa.
  'Planilla',
  s.sku,
  s.price,
  s.stock,
  -- La ficha del producto muestra `option_label` (no el título de la
  -- variante), así que la unidad tiene que ir aquí o el único texto visible
  -- sería el acabado y "99 disponibles" se leería como 99 stickers.
  'Planilla · ' || s.finish_label,
  case when s.stock > 0 then 'disponible' else 'agotado' end
from stickers s
join upserted u on u.handle = s.handle
on conflict (sku) do update set
  product_id = excluded.product_id,
  title = excluded.title,
  price = excluded.price,
  stock = excluded.stock,
  option_label = excluded.option_label,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Guardia post-siembra: valida lo que REALMENTE quedó en la base. Si algo no
-- cuadra (un precio en 0 o distinto del precio de linea, un conteo
-- incompleto), aborta con mensaje claro; al
-- ejecutarse dentro de una transacción, la siembra se revierte entera en vez
-- de dejar productos a medias o en $0.
-- ---------------------------------------------------------------------------
do $$
declare
  -- Precio por planilla esperado. Bloque REGENERADO desde
  -- MATRIXLAB_STICKERS_SHEET_PRICE: si se generara a mano, cambiar el módulo y
  -- regenerar dejaría esta guardia exigiendo el precio anterior y abortando
  -- cada siembra.
  precio_esperado constant numeric :=
-- <generated:matrixlab-stickers-precio>
  85
  -- </generated:matrixlab-stickers-precio>
  ;
  productos int;
  variantes int;
  planillas bigint;
  precios_malos int;
  precios_fuera int;
begin
  select count(*) into productos
    from public.products p
    join public.categories c on c.id = p.category_id
   where c.handle = 'stickers' and 'matrixlab-stickers' = any(p.tags);

  select count(*), coalesce(sum(stock), 0),
         count(*) filter (where price is null or price <= 0),
         count(*) filter (where price is distinct from precio_esperado)
    into variantes, planillas, precios_malos, precios_fuera
    from public.product_variants
   where sku ~ '^STK-[A-Z]{2}[0-9]{3}$';

  if precios_malos > 0 then
    raise exception
      'MatrixLab Stickers: % variante(s) quedaron sin precio valido. Se revierte.',
      precios_malos;
  end if;
  -- El precio por PLANILLA es unico. Cualquier variante con otro valor
  -- (p. ej. un $10 historico de la lectura anterior del catalogo) revierte.
  if precios_fuera > 0 then
    raise exception
      'MatrixLab Stickers: % variante(s) no valen $% por planilla. Se revierte.',
      precios_fuera, precio_esperado;
  end if;
  if productos <> 110 or variantes <> 110 or planillas <> 10890 then
    raise exception
      'MatrixLab Stickers: se esperaban 110/110/10890 y hay %/%/%. Se revierte.',
      productos, variantes, planillas;
  end if;

  raise notice
    'MatrixLab Stickers OK: % productos, % variantes, % planillas.',
    productos, variantes, planillas;
end $$;

-- ---------------------------------------------------------------------------
-- Verificación manual (debe devolver 110 / 110 / 10890 / 85).
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.products p
--      join public.categories c on c.id = p.category_id
--     where c.handle = 'stickers' and 'matrixlab-stickers' = any(p.tags)) as productos,
--   (select count(*) from public.product_variants
--     where sku ~ '^STK-[A-Z]{2}[0-9]{3}$') as variantes,
--   (select coalesce(sum(stock), 0) from public.product_variants
--     where sku ~ '^STK-[A-Z]{2}[0-9]{3}$') as planillas,
--   (select distinct price from public.product_variants
--     where sku ~ '^STK-[A-Z]{2}[0-9]{3}$') as precio_unico;

commit;
