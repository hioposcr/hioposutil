# Mensajes y resultados

La herramienta informa claramente lo que está ocurriendo para que soporte pueda actuar con rapidez.

## Cómo usar esta página

Si el sistema muestra un mensaje y no está seguro de qué hacer, busque aquí el tipo de situación y tome la acción sugerida.

## Mensajes de éxito

Indican, por ejemplo, que:

- el archivo fue cargado correctamente
- el análisis fue completado
- la versión corregida fue generada
- el documento fue enviado a MDG

## Mensajes de error

Pueden indicar, por ejemplo, que:

- el archivo no es válido
- el formato no corresponde a lo esperado
- faltan datos obligatorios
- las credenciales MDG son incorrectas
- MDG rechazó el documento

## Guía rápida de interpretación

| Mensaje o problema | Qué significa | Qué hago ahora |
| --- | --- | --- |
| El archivo no carga | El archivo no tiene el formato esperado o no corresponde al caso | Revise que sea el XML o JSON correcto |
| El análisis no avanza | El sistema no pudo comparar correctamente los datos | Verifique que cargó el documento original y la nota correcta |
| El resultado corregido no se genera | Faltan datos o la información no permite completar el proceso | Revise terminal, archivos y pasos previos |
| El envío a MDG falla | MDG rechazó la autenticación o el comprobante | Revise ambiente, tenantId, password y mensaje mostrado |
| Un documento del lote queda en error | Ese XML requiere revisión individual | Revise esa fila de la cola y determine si reintenta |
| El resto del lote sí avanzó | El proceso continuó con otros documentos válidos | Atienda solo los documentos con error |

## Resultados visibles

Según el módulo utilizado, la herramienta puede mostrar:

- resumen del documento
- comparación de montos
- total corregido
- nueva clave
- nuevo consecutivo
- resultados documento por documento dentro del lote

## Qué revisar al final de cada caso

- que la nueva clave exista
- que el nuevo consecutivo sea coherente
- que el total final se vea correcto
- que la respuesta de MDG coincida con la acción realizada
