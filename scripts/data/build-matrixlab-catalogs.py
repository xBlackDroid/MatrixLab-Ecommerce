"""
Generador de los módulos de datos MatrixLab Stickers / Wear / 3D.

FUENTE DE VERDAD: los tres Excel de inventario
  Inventario_MatrixLab_Stickers.xlsx  (hoja "Inventario Stickers")
  Inventario_MatrixLab_Wear.xlsx      (hoja "Inventario Wear")
  Inventario_MatrixLab_3D.xlsx        (hoja "Inventario 3D")

Lee el XLSX con la librería ESTÁNDAR de Python (zipfile + ElementTree): NO
agrega ninguna dependencia al proyecto. package.json y package-lock.json no
se tocan.

Regenera EXCLUSIVAMENTE los bloques delimitados por

    // <generated:...>   ...   // </generated:...>

dentro de src/lib/store/matrixlab-*.ts, igual que hace
scripts/data/build-tumbler-stickers.ts con la línea de Tumbler. Todo lo que
está fuera de esos marcadores (tipos, helpers, comentarios) se conserva.

PRECIO: los tres Excel traen la columna Precio VACÍA en las 217 filas. El
generador NO emite ningún campo de precio: el precio no existe en el modelo
hasta que se confirme comercialmente. No hay ningún valor por defecto que
pueda colarse a producción.

Uso:
  python scripts/data/build-matrixlab-catalogs.py <carpeta-con-los-xlsx>
"""
import re
import sys
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
RNS = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
ROOT = Path(__file__).resolve().parents[2]


def _col_index(ref):
    """Índice 0-based de la columna a partir de una referencia tipo 'AB12'."""
    n = 0
    for ch in re.match(r'([A-Z]+)', ref).group(1):
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def read_sheet(path, sheet_name):
    """Devuelve (encabezados, filas) de una hoja del XLSX."""
    z = zipfile.ZipFile(path)
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in root.findall(NS + 'si'):
            shared.append(''.join(t.text or '' for t in si.iter(NS + 't')))
    workbook = ET.fromstring(z.read('xl/workbook.xml'))
    relmap = {
        r.get('Id'): r.get('Target')
        for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    }
    for sheet in workbook.find(NS + 'sheets'):
        if sheet.get('name') != sheet_name:
            continue
        target = relmap[sheet.get(RNS + 'id')].lstrip('/')
        if target not in z.namelist():
            target = 'xl/' + target
        rows = []
        for row in ET.fromstring(z.read(target)).iter(NS + 'row'):
            cells, highest = {}, -1
            for c in row.findall(NS + 'c'):
                idx = _col_index(c.get('r'))
                kind = c.get('t')
                v = c.find(NS + 'v')
                inline = c.find(NS + 'is')
                if kind == 's' and v is not None:
                    value = shared[int(v.text)]
                elif kind == 'inlineStr' and inline is not None:
                    value = ''.join(x.text or '' for x in inline.iter(NS + 't'))
                else:
                    value = v.text if v is not None else ''
                cells[idx] = (value or '').strip()
                highest = max(highest, idx)
            rows.append([cells.get(i, '') for i in range(highest + 1)])
        header = rows[0]
        body = [r + [''] * (len(header) - len(r)) for r in rows[1:]]
        return header, body
    raise SystemExit('Hoja no encontrada: %s en %s' % (sheet_name, path))


def slugify(value):
    """Slug estable, minúsculas y sin acentos. Se usa como id de filtro."""
    normalized = unicodedata.normalize('NFD', value)
    stripped = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
    cleaned = re.sub(r'[^a-z0-9]+', '-', stripped.lower())
    return re.sub(r'-+', '-', cleaned).strip('-')


def ts_string(value):
    """Literal de string TypeScript, con comillas y barras escapadas."""
    escaped = value.replace(chr(92), chr(92) * 2).replace('"', chr(92) + '"')
    return '"%s"' % escaped


def write_block(rel_path, marker, lines, comment='//'):
    """Reescribe el bloque generado del archivo, conservando el resto.

    `comment` es el prefijo de comentario del lenguaje destino: `//` para los
    módulos TypeScript y `--` para el seed SQL.
    """
    path = ROOT / rel_path
    src = path.read_text(encoding='utf-8')
    start = '%s <generated:%s>' % (comment, marker)
    end = '%s </generated:%s>' % (comment, marker)
    pattern = re.compile(re.escape(start) + r'.*?' + re.escape(end), re.S)
    if not pattern.search(src):
        raise SystemExit('Marcadores %s no encontrados en %s' % (marker, rel_path))
    body = chr(10).join([start] + ['  ' + line for line in lines] + ['  ' + end])
    path.write_text(pattern.sub(lambda _: body, src, count=1), encoding='utf-8')
    print('   -> %-40s %3d filas' % (rel_path, len(lines)))


def collect_categories(rows, index, seen):
    """Categorías en el ORDEN EXACTO de aparición en el Excel."""
    label = rows[index]
    key = slugify(label)
    if key not in [k for k, _ in seen]:
        seen.append((key, label))
    return key


def build_stickers(src_dir):
    """Columnas: B código, C nombre, D categoría, F descripción,
    G acabado/tamaño, H unidades, L handle. Precio (J) va vacío."""
    _, rows = read_sheet(
        src_dir / 'Inventario_MatrixLab_Stickers.xlsx', 'Inventario Stickers')
    out, cats = [], []
    for position, r in enumerate(rows, start=1):
        category = collect_categories(r, 3, cats)
        # El handle es la identidad pública: una celda L vacía produciría un
        # handle "" (clave duplicada en React y producto sin URL en el seed).
        # Se falla de inmediato en vez de emitir datos rotos en silencio.
        if not r[11].strip():
            raise SystemExit(
                'Fila %d (%s): la columna L (Handle) esta vacia en el Excel.'
                % (position, r[1]))
        out.append(
            '{ position: %d, code: %s, name: %s, category: %s, description: %s, '
            'finishLabel: %s, inventory: %d, handle: %s },' % (
                position, ts_string(r[1]), ts_string(r[2]), ts_string(category),
                ts_string(r[5]), ts_string(r[6]), int(r[7]), ts_string(r[11])))
    return out, cats


def build_wear(src_dir):
    """Columnas: B código, C nombre, D categoría, F descripción,
    G tipo de prenda, H color, I talla/edad, J unidades. Precio (L) vacío.
    El Excel NO trae handle: se deriva del código en el módulo TS."""
    _, rows = read_sheet(
        src_dir / 'Inventario_MatrixLab_Wear.xlsx', 'Inventario Wear')
    out, cats = [], []
    for position, r in enumerate(rows, start=1):
        category = collect_categories(r, 3, cats)
        out.append(
            '{ position: %d, code: %s, name: %s, category: %s, description: %s, '
            'garmentType: %s, color: %s, size: %s, inventory: %d },' % (
                position, ts_string(r[1]), ts_string(r[2]), ts_string(category),
                ts_string(r[5]), ts_string(r[6]), ts_string(r[7]),
                ts_string(r[8]), int(r[9])))
    return out, cats


def build_3d(src_dir):
    """Columnas: B código, C nombre, D categoría, F descripción, G tipo/uso,
    H color/acabado, I unidades, M personalizable. Precio (K) vacío.
    El Excel NO trae handle: se deriva del código en el módulo TS."""
    _, rows = read_sheet(src_dir / 'Inventario_MatrixLab_3D.xlsx', 'Inventario 3D')
    out, cats = [], []
    for position, r in enumerate(rows, start=1):
        category = collect_categories(r, 3, cats)
        customizable = 'true' if r[12].strip().lower().startswith('s') else 'false'
        out.append(
            '{ position: %d, code: %s, name: %s, category: %s, description: %s, '
            'usageLabel: %s, finishLabel: %s, inventory: %d, customizable: %s },' % (
                position, ts_string(r[1]), ts_string(r[2]), ts_string(category),
                ts_string(r[5]), ts_string(r[6]), ts_string(r[7]), int(r[8]),
                customizable))
    return out, cats


def sql_string(value):
    """Literal de string SQL: se duplican las comillas simples."""
    return "'%s'" % value.replace("'", "''")


def read_stickers_commercials():
    """Precio por planilla y copy de contenido, leidos del modulo TS.

    Ninguno de los dos sale del Excel (la columna J llega vacia y el conteo de
    stickers por planilla no existe por SKU). Viven en
    src/lib/store/matrixlab-stickers.ts y de ahi los toma el seed, para que la
    UI y la base no puedan divergir.
    """
    module = (ROOT / 'src/lib/store/matrixlab-stickers.ts').read_text(encoding='utf-8')

    def one(name, pattern):
        match = re.search(pattern, module)
        if not match:
            raise SystemExit('No se encontro %s en el modulo.' % name)
        return match.group(1)

    price = one('MATRIXLAB_STICKERS_SHEET_PRICE',
                r'MATRIXLAB_STICKERS_SHEET_PRICE\s*=\s*(\d+(?:\.\d+)?)')
    low = one('MATRIXLAB_STICKERS_PER_SHEET_MIN',
              r'MATRIXLAB_STICKERS_PER_SHEET_MIN\s*=\s*(\d+)')
    high = one('MATRIXLAB_STICKERS_PER_SHEET_MAX',
               r'MATRIXLAB_STICKERS_PER_SHEET_MAX\s*=\s*(\d+)')
    copy = one('MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY_LONG',
               r'MATRIXLAB_STICKERS_SHEET_CONTENTS_COPY_LONG\s*=\s*`([^`]*)`')
    copy = (copy.replace('${MATRIXLAB_STICKERS_PER_SHEET_MIN}', low)
                .replace('${MATRIXLAB_STICKERS_PER_SHEET_MAX}', high))
    if '${' in copy:
        raise SystemExit('El copy de la planilla tiene interpolaciones sin resolver.')
    return price, copy


def build_stickers_seed(src_dir, price):
    """Filas VALUES del seed de MatrixLab Stickers.

    Cada fila es una PLANILLA / coleccion completa, no un sticker suelto: la
    columna H (99) son planillas disponibles y `price` es por planilla, ya
    resuelto por read_stickers_commercials().
    """
    _, rows = read_sheet(
        src_dir / 'Inventario_MatrixLab_Stickers.xlsx', 'Inventario Stickers')
    out = []
    for index, r in enumerate(rows):
        code, name, description = r[1], r[2], r[5]
        finish, units, handle = r[6], int(r[7]), r[11]
        comma = ',' if index < len(rows) - 1 else ''
        out.append('(%s, %s, %s, %s, %s, %d, %s, %s)%s' % (
            sql_string(handle), sql_string(code), sql_string(name),
            sql_string(description), sql_string(finish), units,
            sql_string('STK-' + code), price, comma))
    return out


TARGETS = [
    ('MatrixLab Stickers', build_stickers,
     'src/lib/store/matrixlab-stickers.ts', 'matrixlab-stickers'),
    ('MatrixLab Wear', build_wear,
     'src/lib/store/matrixlab-wear.ts', 'matrixlab-wear'),
    ('MatrixLab 3D', build_3d,
     'src/lib/store/matrixlab-3d.ts', 'matrixlab-3d'),
]


def main():
    if len(sys.argv) < 2:
        raise SystemExit('Uso: build-matrixlab-catalogs.py <carpeta-con-los-xlsx>')
    src_dir = Path(sys.argv[1])
    print('Fuente de verdad:', src_dir)
    for label, builder, rel_path, marker in TARGETS:
        lines, cats = builder(src_dir)
        print('%s: %d productos, %d categorias' % (label, len(lines), len(cats)))
        for key, original in cats:
            print('     %-22s %s' % (key, original))
        write_block(rel_path, marker, lines)

    # Seed de MatrixLab Stickers: es la unica linea con precio confirmado, asi
    # que es la unica cuyo seed lleva datos. Wear y 3D siguen bloqueados.
    price, sheet_copy = read_stickers_commercials()
    seed_rows = build_stickers_seed(src_dir, price)
    print('Seed MatrixLab Stickers: %d planillas a $%s c/u' % (len(seed_rows), price))
    write_block('supabase/seed_matrixlab_stickers.sql',
                'matrixlab-stickers-seed', seed_rows, comment='--')
    # El precio y el copy tambien se generan: si vivieran a mano dentro del SQL,
    # cambiar el modulo y regenerar dejaria la guardia exigiendo el precio viejo
    # y la ficha publica anunciando un rango que ya no es.
    write_block('supabase/seed_matrixlab_stickers.sql',
                'matrixlab-stickers-precio', [price], comment='--')
    write_block('supabase/seed_matrixlab_stickers.sql',
                'matrixlab-stickers-copy', [sql_string(sheet_copy)], comment='--')


if __name__ == '__main__':
    main()
