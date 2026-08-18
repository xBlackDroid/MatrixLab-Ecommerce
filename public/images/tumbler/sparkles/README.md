# Fotografías de Sparkles (MatrixLab Tumbler)

Cada Sparkle se vincula a su foto **por CÓDIGO interno**, nunca por nombre
comercial. Así, cambiar el nombre público de un glitter no rompe la imagen, y
actualizar una foto es reemplazar un archivo (sin tocar código ni base de datos).

## Convención

```
public/images/tumbler/sparkles/{codigo-en-minusculas}.webp
```

Ejemplos:

```
2002.webp     c03r.webp     c07r-a.webp    c08r.webp
g001.webp     m004.webp     le01.webp
```

## Comportamiento

- Si el archivo existe, la tarjeta de `/tienda/categoria/repuestos-consumibles`
  y la ficha de producto lo muestran automáticamente (verificación en servidor).
- Si NO existe, se usa `placeholder.webp`: un placeholder de marca MatrixLab
  Tumbler / Sparkle. Nunca se muestra una imagen rota ni la foto de otro glitter.
- Si el admin sube imágenes al producto desde `/admin`, esas ganan sobre la
  convención de archivo (la curaduría manual no se pisa).

## Estado actual de las fotos

Ningún `{codigo}.webp` está subido todavía: los 46 Sparkles muestran el
placeholder. El PDF de MatrixLab Tumbler (páginas 10–21) contiene fotografía
individual identificable de estos 30 códigos, que son los primeros candidatos a
subir:

```
2004  2006  2007  2011  2012
C03R  C08R  C11R  C13R  C31R  C32R  C34R  C50R
G001  G002  G003  G004
M004  M005  M006
LE01  LE02  LE03  LE04  LE05  LE06  LE07  LE08  LE09  LE10
```

Los 16 restantes NO tienen fotografía individual identificable en ese PDF y
seguirán con placeholder hasta que exista una foto propia:

```
2002  2003  2008  2009  2010
C06R  C07R-A  C07R-B  C09R  C14R  C18R  C21R
M001  M002  M003  M007
```

Basta con dejar el archivo en esta carpeta (por ejemplo `2002.webp`) para que
aparezca en el siguiente render: no hay que modificar código ni la base.
