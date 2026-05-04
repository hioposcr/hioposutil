# Manual de uso de hioposutil

## Control de versiones

| Versión | Fecha de elaboración | Descripción |
| --- | --- | --- |
| 1.0 | 15/04/2026 | Creación inicial del documento. |
| 1.1 | 04/05/2026 | Conversión del documento a manual operativo orientado a soporte. |

## Datos generales

| Campo | Valor |
| --- | --- |
| Área propietaria | Departamento de Ingeniería |
| Nombre de la herramienta | hioposutil |
| Tipo de documento | Manual de uso |
| Público objetivo | Soporte y usuarios operativos autorizados |
| Elaborado por | Felipe Alvarez |
| Aprobado por | Ricardo Plaz |

## Propósito del manual

Este manual explica cómo utilizar `hioposutil` en el trabajo diario de soporte.

Su objetivo es que cualquier persona autorizada pueda aprender a usar la herramienta sin necesidad de conocimientos técnicos, siguiendo un flujo claro para:

- cargar documentos
- revisar la información generada por el sistema
- corregir comprobantes rechazados por redondeo
- reenviar comprobantes a MDG
- procesar lotes grandes de XML de forma ordenada

## ¿Qué resuelve la herramienta?

`hioposutil` fue creada para ayudar cuando un comprobante electrónico necesita ser corregido o reenviado.

La herramienta cubre dos necesidades principales:

### Corrección individual

Se utiliza cuando un documento fue rechazado y se necesita revisar un caso puntual, corregir montos y generar una nueva versión lista para exportación o envío.

### Reenvío masivo

Se utiliza cuando se deben reprocesar muchos XML en la misma operación, aplicando una nueva terminal y una numeración secuencial.

## ¿Quién debe usarla?

La herramienta está pensada para:

- personal de soporte
- usuarios operativos autorizados
- personas encargadas de atender incidencias de documentos electrónicos

No está pensada como herramienta de desarrollo ni como reemplazo del análisis fiscal o contable.

## Requisitos para operar

Antes de usar la herramienta, la persona debe contar con:

- acceso autorizado al sistema
- archivos válidos del caso a procesar
- credenciales MDG del cliente correspondiente
- criterio claro sobre si el caso debe tratarse como corrección individual o como reenvío masivo

## Ingreso al sistema

Al abrir la herramienta:

1. Se muestra la pantalla de acceso.
2. La persona debe iniciar sesión con las credenciales internas autorizadas.
3. Una vez dentro, puede trabajar normalmente en cualquiera de los módulos.

### Comportamiento de la sesión

- la sesión se conserva mientras exista actividad
- si la persona deja de usar la herramienta durante un tiempo prolongado, la sesión puede expirar
- antes de que expire, el sistema puede mostrar una advertencia
- también es posible cerrar sesión manualmente

## Recorrido de la pantalla principal

La pantalla principal está organizada para que el flujo sea simple y repetible.

### 1. Selector de módulo

Permite escoger entre:

- `Corrección individual`
- `Reenvío masivo`

### 2. Configuración MDG

Permite definir:

- ambiente `Testing` o `Producción`
- `tenantId`
- `password`

### 3. Área de trabajo

Aquí se cargan los archivos, se ejecutan las acciones y se revisan los resultados.

## Módulo de corrección individual

Este módulo se utiliza cuando el caso corresponde a un solo documento.

### Cuándo usarlo

Utilice este módulo cuando:

- exista una nota de crédito rechazada
- se requiera comparar el documento rechazado contra el documento original
- se necesite recalcular el monto permitido
- se deba generar una nueva versión corregida

### Archivos necesarios

Normalmente se requieren:

- XML del documento original
- nota rechazada en JSON o XML

### Paso a paso

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

### ¿Qué hace cada acción?

#### Analizar documento

Revisa el documento original y la nota cargada para identificar diferencias relevantes.

#### Recalcular ajuste

Aplica la corrección necesaria cuando el documento rechazado supera el monto permitido.

#### Generar versión corregida

Prepara la nueva versión del comprobante para revisión, descarga o envío.

#### Enviar a MDG

Remite el documento generado utilizando la configuración MDG ingresada por la persona.

### Resultado esperado

Al finalizar este flujo, la persona podrá ver:

- nueva clave
- nuevo consecutivo
- nueva fecha de emisión
- total corregido
- resumen del ajuste aplicado

Cuando el envío es exitoso, la pantalla puede limpiarse automáticamente para facilitar el siguiente caso.

## Módulo de reenvío masivo

Este módulo se utiliza cuando se deben reprocesar varios XML en la misma operación.

### Cuándo usarlo

Utilice este módulo cuando:

- se necesita reenviar muchos comprobantes
- se requiere cambiar terminal
- se desea iniciar una nueva secuencia numérica
- se debe procesar un volumen grande de XML con control de resultados

### Información requerida

#### XML del lote

Son los documentos que se van a reprocesar.

#### Nueva terminal

Es la terminal que se usará para generar los nuevos consecutivos y claves.

#### Número inicial

Es el punto de partida de la numeración del lote.

Ejemplo:

- si el número inicial es `1`
- el primer documento quedará con `0000000001`
- el segundo con `0000000002`
- el tercero con `0000000003`

#### Pausa entre envíos

Permite espaciar las emisiones hacia MDG.

Rango permitido:

- mínimo `300 ms`
- máximo `500 ms`

#### Regenerar clave de seguridad

Si esta opción está activa, la herramienta vuelve a construir el tramo de seguridad de la clave durante el reprocesamiento.

### Paso a paso

1. Ingresar al módulo `Reenvío masivo`.
2. Cargar los XML del lote.
3. Verificar que los archivos hayan sido aceptados por la herramienta.
4. Ingresar la nueva terminal.
5. Ingresar el número inicial.
6. Definir la pausa entre envíos.
7. Activar o desactivar la regeneración de clave de seguridad.
8. Completar la configuración MDG.
9. Presionar `Preparar lote`.
10. Revisar la cola de procesamiento.
11. Presionar `Enviar lote a MDG`.
12. Revisar los resultados finales.

### Cola de procesamiento

La cola muestra cada documento del lote con su estado individual.

Estados disponibles:

- `Listo`
- `Procesando`
- `Enviado`
- `Con error`

Cuando el lote contiene muchos documentos, la cola se presenta con paginación para hacer más fácil la revisión.

### Cómo se comporta el envío masivo

El sistema no envía todos los documentos al mismo tiempo.

Para cuidar la estabilidad operativa:

- los documentos se procesan de forma controlada
- se utiliza una pausa entre emisiones
- se reutiliza el token dentro de los grupos internos del lote

Esto reduce la presión sobre MDG y mejora la continuidad del procesamiento.

## Configuración MDG

La configuración MDG es necesaria tanto para la corrección individual como para el reenvío masivo.

### Ambiente

Debe seleccionarse uno de los siguientes:

- `Testing`
- `Producción`

### Tenant ID

Corresponde al identificador del cliente en MDG.

### Password

Corresponde a la contraseña del cliente en MDG.

### Recomendaciones antes de enviar

Antes de presionar el botón de envío, confirme:

- que el ambiente sea el correcto
- que el `tenantId` corresponda al cliente correcto
- que la contraseña esté vigente
- que el documento o lote ya haya sido revisado visualmente

## Mensajes, estados y resultados

La herramienta informa claramente lo que está ocurriendo para que soporte pueda actuar con rapidez.

### Mensajes de éxito

Indican, por ejemplo, que:

- el archivo fue cargado correctamente
- el análisis fue completado
- la versión corregida fue generada
- el documento fue enviado a MDG

### Mensajes de error

Pueden indicar, por ejemplo, que:

- el archivo no es válido
- el formato no corresponde a lo esperado
- faltan datos obligatorios
- las credenciales MDG son incorrectas
- MDG rechazó el documento

### Resultados visibles

Según el módulo utilizado, la herramienta puede mostrar:

- resumen del documento
- comparación de montos
- total corregido
- nueva clave
- nuevo consecutivo
- resultados documento por documento dentro del lote

## Buenas prácticas de operación

Para trabajar de forma segura y ordenada, se recomienda:

- verificar siempre el ambiente antes de enviar
- usar una terminal correcta para el nuevo proceso
- comenzar en `Testing` si el caso requiere validación previa
- revisar el resumen antes de enviar
- usar pausas conservadoras cuando el lote sea grande
- identificar primero los errores antes de reintentar documentos

## Preguntas frecuentes

### ¿Qué pasa si el XML no carga?

La herramienta mostrará un mensaje indicando que el archivo no pudo ser interpretado o que no cumple el formato esperado.

### ¿La herramienta corrige cualquier tipo de rechazo?

No. Está orientada principalmente a corrección por diferencias de redondeo y a reprocesamiento operativo de documentos.

### ¿Qué pasa si MDG devuelve error?

El sistema mostrará el resultado recibido para que la persona pueda revisar el caso, las credenciales o la información del documento.

### ¿Se puede enviar un lote grande?

Sí. La herramienta está preparada para trabajar con lotes amplios y ofrece una cola paginada para revisar el avance.

### ¿Todos los documentos del lote se envían al mismo tiempo?

No. Se procesan de manera controlada.

### ¿Qué ocurre si un documento falla dentro del lote?

Ese documento quedará marcado con error y podrá revisarse de forma posterior.

### ¿Se puede volver a intentar?

Sí. La revisión de resultados permite identificar qué documentos necesitan una nueva gestión.

## Glosario

| Término | Definición |
| --- | --- |
| XML | Archivo del comprobante electrónico |
| JSON | Formato de intercambio de información |
| Clave | Identificador electrónico del comprobante |
| Consecutivo | Número secuencial del documento |
| Terminal | Segmento usado para regenerar datos del documento |
| MDG | Plataforma utilizada para la remisión del comprobante |
| Lote | Conjunto de documentos procesados en una misma operación |
| Cola | Lista que muestra el estado de cada documento |

## Cierre

Este manual está orientado al aprendizaje y uso diario de `hioposutil` por parte del personal de soporte y usuarios operativos.
