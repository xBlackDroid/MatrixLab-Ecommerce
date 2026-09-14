"""Importa el inventario de vasos terminados sin modificar otras líneas.

python scripts/data/build-tumbler-ready.py <Inventario_MatrixLab_Tumbler_Listos.xlsx>
"""
import argparse
import json
import math
import re
import runpy
from pathlib import Path

common = runpy.run_path(str(Path(__file__).with_name('build-matrixlab-catalogs.py')))
read_sheet = common['read_sheet']
write_block = common['write_block']


def build_rows(rows):
    items, seen = [], set()
    for raw in rows:
        r = [str(value if value is not None else '').strip() for value in raw] + [''] * max(0, 18-len(raw))
        if not r[2]:
            continue  # Fila reservada: no es un producto.
        code = r[1].upper()
        if not re.fullmatch(r'VL\d{3}', code) or code in seen:
            raise ValueError('Código inválido o duplicado: ' + code)
        seen.add(code)
        states = {s.lower(): s for s in ['Borrador', 'Activo', 'Agotado', 'Pausado']}
        status = states.get(r[4].lower() or 'borrador')
        if status is None:
            raise ValueError('Estado inválido: ' + code)
        if status in ['Activo', 'Agotado'] and (not r[5] or r[5].lower().startswith('agrega descrip')):
            raise ValueError('Falta descripción para publicar: ' + code)

        def number(value, integer=False):
            if not value:
                return None
            result = float(value)
            if not math.isfinite(result) or result < 0 or (integer and not result.is_integer()):
                raise ValueError('Precio o cantidad inválida: ' + code)
            return int(result) if result.is_integer() else result

        photos = list(dict.fromkeys(p for p in r[15:18] if p))
        if any(not re.fullmatch(r'/images/tumbler/listos/[a-z0-9-]+\.(?:webp|png|jpe?g)', p) for p in photos):
            raise ValueError('Ruta de fotografía inválida: ' + code)
        customizable = {'sí': True, 'si': True, 'no': False, '': None, 'por definir': None}.get(r[12].lower(), 'invalid')
        if customizable == 'invalid':
            raise ValueError('Personalizable debe ser Sí, No o Por definir: ' + code)
        items.append(dict(code=code, name=r[2], collection=r[3], status=status,
                          description=r[5], capacity=r[6], finish=r[7],
                          inventory=number(r[8], True), price=number(r[10]),
                          customizable=customizable, imagePaths=photos))
    return items


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    _, rows = read_sheet(args.source, 'Vasos listos')
    items = build_rows(rows)
    write_block('src/lib/store/tumbler-ready.ts', 'tumbler-ready',
                [json.dumps(item, ensure_ascii=False) + ',' for item in items])
    print('Vasos listos: %d capturados; %d visibles.' %
          (len(items), sum(item['status'] in ['Activo', 'Agotado'] for item in items)))


if __name__ == '__main__':
    main()
