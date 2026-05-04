# Reenvío masivo

## Cuándo usar este módulo

Utilice este módulo cuando:

- se necesita reenviar muchos comprobantes
- se requiere cambiar terminal
- se desea iniciar una nueva secuencia numérica
- se debe procesar un volumen grande de XML con control de resultados

## Información requerida

### XML del lote

Son los documentos que se van a reprocesar.

### Nueva terminal

Es la terminal que se usará para generar los nuevos consecutivos y claves.

### Número inicial

Es el punto de partida de la numeración del lote.

Ejemplo:

- si el número inicial es `1`
- el primer documento quedará con `0000000001`
- el segundo con `0000000002`
- el tercero con `0000000003`

### Pausa entre envíos

Permite espaciar las emisiones hacia MDG.

Rango permitido:

- mínimo `300 ms`
- máximo `500 ms`

### Regenerar clave de seguridad

Si esta opción está activa, la herramienta vuelve a construir el tramo de seguridad de la clave durante el reprocesamiento.

## Paso a paso

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

## Cola de procesamiento

La cola muestra cada documento del lote con su estado individual.

Estados disponibles:

- `Listo`
- `Procesando`
- `Enviado`
- `Con error`

Cuando el lote contiene muchos documentos, la cola se presenta con paginación para hacer más fácil la revisión.

## Cómo se comporta el envío masivo

El sistema no envía todos los documentos al mismo tiempo.

Para cuidar la estabilidad operativa:

- los documentos se procesan de forma controlada
- se utiliza una pausa entre emisiones
- se reutiliza el token dentro de los grupos internos del lote

Esto reduce la presión sobre MDG y mejora la continuidad del procesamiento.
