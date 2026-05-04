# Corrección individual

## Cuándo usar este módulo

Utilice este módulo cuando:

- exista una nota de crédito rechazada
- se requiera comparar el documento rechazado contra el documento original
- se necesite recalcular el monto permitido
- se deba generar una nueva versión corregida

## Archivos necesarios

Normalmente se requieren:

- XML del documento original
- nota rechazada en JSON o XML

## Paso a paso

1. Ingresar al módulo `Corrección individual`.
2. Cargar el XML del documento original.
3. Cargar la nota rechazada.
4. Revisar el resumen que aparece en pantalla.
5. Completar la nueva terminal.
6. Presionar `Analizar documento`.
7. Presionar `Recalcular ajuste`.
8. Presionar `Generar versión corregida`.
9. Revisar el resultado.
10. Exportar o enviar a MDG.

## ¿Qué hace cada acción?

### Analizar documento

Revisa el documento original y la nota cargada para identificar diferencias relevantes.

### Recalcular ajuste

Aplica la corrección necesaria cuando el documento rechazado supera el monto permitido.

### Generar versión corregida

Prepara la nueva versión del comprobante para revisión, descarga o envío.

### Enviar a MDG

Remite el documento generado utilizando la configuración MDG ingresada por la persona.

## Resultado esperado

Al finalizar este flujo, la persona podrá ver:

- nueva clave
- nuevo consecutivo
- nueva fecha de emisión
- total corregido
- resumen del ajuste aplicado

Cuando el envío es exitoso, la pantalla puede limpiarse automáticamente para facilitar el siguiente caso.
