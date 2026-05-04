# Buenas prácticas y preguntas frecuentes

## Buenas prácticas de operación

Para trabajar de forma segura y ordenada, se recomienda:

- verificar siempre el ambiente antes de enviar
- usar una terminal correcta para el nuevo proceso
- comenzar en `Testing` si el caso requiere validación previa
- revisar el resumen antes de enviar
- usar pausas conservadoras cuando el lote sea grande
- identificar primero los errores antes de reintentar documentos

## Cómo usar esta página

Si tiene una duda puntual, busque primero la categoría que más se parezca a su caso:

- acceso y sesión
- archivos y carga
- corrección individual
- reenvío masivo
- configuración MDG y envío
- resultados y revisión final

## Preguntas frecuentes

## Acceso y sesión

### ¿Qué pasa si no puedo entrar al sistema?

Primero confirme que está usando las credenciales internas correctas. Si aun así no puede ingresar, debe solicitar apoyo al responsable interno del sistema.

### ¿Por qué la sesión se cerró?

La sesión puede cerrarse por inactividad prolongada o por cierre manual. Si esto ocurre, vuelva a iniciar sesión y retome el caso.

### ¿La sesión se cierra mientras estoy usando la herramienta?

No debería cerrarse si la persona sigue activa dentro del sistema. Antes de una expiración por inactividad, la herramienta puede mostrar una advertencia.

### ¿Puedo cerrar sesión manualmente?

Sí. La herramienta permite cerrar sesión desde la interfaz cuando la persona termina su trabajo.

## Archivos y carga

### ¿Qué pasa si el XML no carga?

La herramienta mostrará un mensaje indicando que el archivo no pudo ser interpretado o que no cumple el formato esperado.

### ¿Qué archivos debo tener para una corrección individual?

Normalmente:

- XML del documento original
- nota rechazada en JSON o XML

### ¿Qué archivos debo tener para reenvío masivo?

Debe contar con los XML del lote que desea reprocesar.

### ¿Puedo cargar la nota rechazada en JSON o en XML?

Sí. La herramienta está preparada para trabajar con ambos formatos, según el caso disponible.

### ¿Qué pasa si cargo el archivo equivocado?

Lo correcto es retirar ese caso y volver a cargar los archivos correctos antes de analizar o enviar. No se recomienda continuar si el resumen en pantalla no coincide con el documento esperado.

### ¿Cómo sé que cargué bien el archivo?

Normalmente lo sabrá porque la herramienta mostrará un resumen del documento, datos relevantes del caso o el registro dentro de la cola de procesamiento.

### ¿Qué hago si el archivo carga, pero los datos se ven extraños?

Deténgase antes de enviar. Revise que realmente cargó el archivo correcto y que pertenece al cliente y caso que está trabajando.

## Corrección individual

### ¿La herramienta corrige cualquier tipo de rechazo?

No. Está orientada principalmente a corrección por diferencias de redondeo y a reprocesamiento operativo de documentos.

### ¿Cuándo debo usar Corrección individual?

Cuando está trabajando un solo caso y necesita comparar el documento rechazado contra el documento original, recalcular si hace falta y generar una nueva versión.

### ¿Qué pasa si la nota no supera el monto del documento original?

La herramienta puede indicarle que no hacía falta ajuste de monto. Aun así, el flujo puede seguir si necesita regenerar datos de reemisión.

### ¿Por qué la herramienta me pide una nueva terminal?

Porque la terminal se usa para regenerar la identidad del documento, especialmente el consecutivo y la clave.

### ¿Puedo usar la misma terminal del documento anterior?

Operativamente lo recomendable es usar la terminal definida para la nueva reemisión según el caso. Si existe duda, confirme el criterio interno antes de enviar.

### ¿Qué debería ver después de recalcular?

Debería ver un resultado corregido o una confirmación de que no hacía falta ajustar el monto.

### ¿Qué debería ver al generar la versión corregida?

Normalmente:

- nueva clave
- nuevo consecutivo
- nueva fecha
- total corregido

### ¿Puedo exportar sin enviar?

Sí. La herramienta permite generar el resultado y descargarlo antes de decidir si será enviado a MDG.

## Reenvío masivo

### ¿Cuándo debo usar Reenvío masivo?

Cuando necesita reprocesar varios XML en la misma operación, con nueva terminal y numeración secuencial.

### ¿Se puede enviar un lote grande?

Sí. La herramienta está preparada para trabajar con lotes amplios y ofrece una cola paginada para revisar el avance.

### ¿En qué orden se procesan los documentos del lote?

Se procesan siguiendo el orden en que fueron cargados en la herramienta.

### ¿Qué significa el número inicial?

Es el punto desde donde comenzará la nueva secuencia numérica del lote.

### Si pongo número inicial 1, ¿qué pasa?

El primer documento tomará `0000000001`, el siguiente `0000000002`, y así sucesivamente.

### ¿Qué pasa si me equivoco en la terminal o en el número inicial?

Lo recomendable es no enviar todavía. Corrija esos datos y vuelva a preparar el lote antes de continuar.

### ¿Qué hace la opción de regenerar clave de seguridad?

Hace que la herramienta reconstruya el segmento de seguridad de la clave durante el reprocesamiento del lote.

### ¿Todos los documentos del lote se envían al mismo tiempo?

No. Se procesan de manera controlada.

### ¿Por qué existe una pausa entre documentos?

Para evitar una presión innecesaria sobre MDG y dar más estabilidad al envío del lote.

### ¿Qué ocurre si un documento falla dentro del lote?

Ese documento quedará marcado con error y podrá revisarse de forma posterior.

### ¿Si uno falla, se detienen todos?

No necesariamente. La cola permite que se identifiquen errores individuales mientras el resto puede continuar según el comportamiento del lote.

### ¿Se puede volver a intentar?

Sí. La revisión de resultados permite identificar qué documentos necesitan una nueva gestión.

### ¿Qué significan los estados de la cola?

- `Listo`: el documento ya está preparado
- `Procesando`: el documento se está trabajando en ese momento
- `Enviado`: el documento fue emitido correctamente
- `Con error`: el documento necesita revisión

## Configuración MDG y envío

### ¿Qué pasa si MDG devuelve error?

El sistema mostrará el resultado recibido para que la persona pueda revisar el caso, las credenciales o la información del documento.

### ¿Cuándo debo usar Testing y cuándo Producción?

- `Testing`: cuando desea validar el flujo en ambiente de prueba
- `Producción`: cuando está listo para enviar el caso real

### ¿Qué es el tenantId?

Es el identificador del cliente dentro de MDG.

### ¿Qué es el password?

Es la contraseña del cliente en MDG.

### ¿Cada cliente usa el mismo tenantId y password?

No necesariamente. Deben usarse los datos correctos del cliente que corresponde al caso.

### ¿Qué hago si el tenantId o el password fallan?

Revise que:

- correspondan al cliente correcto
- no tengan errores de digitación
- sigan vigentes

### ¿Puedo enviar en Producción sin haber probado antes en Testing?

Sí se puede, pero operativamente conviene usar `Testing` primero si el caso es delicado o si existe duda.

### ¿La herramienta llama directo a MDG desde el navegador?

No. El envío se hace mediante una función intermedia para que el proceso sea más estable y no choque con restricciones del navegador.

### ¿Qué pasa si no hay conexión o MDG está lento?

El sistema puede mostrar error o tardar más en responder. Si eso ocurre, espere la respuesta final antes de repetir el intento.

## Resultados y revisión final

### ¿Qué debo revisar antes de enviar?

Se recomienda revisar:

- archivos correctos
- ambiente correcto
- terminal correcta
- tenantId y password correctos
- resumen del documento o lote

### ¿Qué debo revisar después de enviar?

Revise:

- la respuesta mostrada por la herramienta
- la nueva clave
- el nuevo consecutivo
- el estado final del documento o del lote

### ¿Dónde veo si el caso quedó bien?

En los paneles de resultado, en la comparación mostrada por la herramienta o en la cola del lote, según el módulo utilizado.

### ¿Qué pasa después de un envío exitoso en corrección individual?

La herramienta puede limpiar la pantalla para dejar el sistema listo para el siguiente caso.

### ¿Qué pasa después de un envío exitoso en reenvío masivo?

La cola conserva el estado de cada documento para que soporte pueda revisar qué salió bien y qué requiere atención.

### ¿Puedo seguir trabajando después de un error?

Sí. La idea es que el sistema le permita identificar el problema, corregirlo y continuar con el caso o con el resto del lote.

### ¿Cuál es la mejor forma de trabajar cuando tengo dudas?

Lo más recomendable es:

1. confirmar que está en el módulo correcto
2. revisar los archivos cargados
3. validar la configuración MDG
4. leer el mensaje mostrado en pantalla
5. volver a intentar solo cuando entienda qué salió mal
