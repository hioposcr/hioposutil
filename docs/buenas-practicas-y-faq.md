# Buenas prácticas y preguntas frecuentes

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
