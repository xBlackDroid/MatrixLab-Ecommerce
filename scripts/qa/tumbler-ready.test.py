"""Pruebas del importador: datos opcionales, cero, borradores y fotografías."""
import runpy
import unittest
from pathlib import Path
build_rows = runpy.run_path(str(Path(__file__).parents[1] / 'data/build-tumbler-ready.py'))['build_rows']

def row(**fields):
    values=['']*20
    defaults=dict(B='VL001',C='Vaso de prueba',E='Activo',F='Descripción de prueba')
    defaults.update(fields)
    for col,value in defaults.items():
        values[ord(col)-65]=value
    return values

class ImportTests(unittest.TestCase):
    def test_reserved(self):
        self.assertEqual(build_rows([['','VL001','']]),[])
    def test_blank_is_not_zero(self):
        item=build_rows([row()])[0]
        self.assertIsNone(item['inventory'])
        self.assertIsNone(item['price'])
    def test_zero_preserved(self):
        self.assertEqual(build_rows([row(I=0,K=0)])[0]['inventory'],0)
        self.assertEqual(build_rows([row(I=0,K=0)])[0]['price'],0)
    def test_three_photos_in_order(self):
        photos=['/images/tumbler/listos/vl001.webp','/images/tumbler/listos/vl001-2.webp','/images/tumbler/listos/vl001-3.webp']
        self.assertEqual(build_rows([row(P=photos[0],Q=photos[1],R=photos[2])])[0]['imagePaths'],photos)
    def test_invalid_data(self):
        for fields in [dict(I=-1),dict(I=1.5),dict(K='nan'),dict(P='../secret.png')]:
            with self.assertRaises(ValueError): build_rows([row(**fields)])
    def test_duplicate_code(self):
        with self.assertRaises(ValueError): build_rows([row(),row()])
    def test_draft_can_be_incomplete(self):
        self.assertEqual(build_rows([row(E='Borrador',F='')])[0]['status'],'Borrador')
        with self.assertRaises(ValueError): build_rows([row(F='')])

if __name__=='__main__': unittest.main()
