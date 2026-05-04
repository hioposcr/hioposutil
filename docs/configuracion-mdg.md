# Configuración MDG

La configuración MDG es necesaria tanto para la corrección individual como para el reenvío masivo.

## Qué significa cada dato

- `Ambiente`: indica si el envío va a `Testing` o a `Producción`
- `Tenant ID`: identifica al cliente dentro de MDG
- `Password`: contraseña de ese cliente en MDG

## Ambiente

Debe seleccionarse uno de los siguientes:

- `Testing`
- `Producción`

## ¿Cuándo usar cada ambiente?

| Ambiente | Cuándo usarlo |
| --- | --- |
| `Testing` | Cuando quiere validar el flujo sin trabajar todavía en el ambiente real |
| `Producción` | Cuando ya está listo para enviar el documento real |

## Tenant ID

Corresponde al identificador del cliente en MDG.

En lenguaje simple: es el número que le dice a MDG de qué cliente se trata el envío.

## Password

Corresponde a la contraseña del cliente en MDG.

En lenguaje simple: es la clave que permite autenticar el envío de ese cliente.

## Recomendaciones antes de enviar

Antes de presionar el botón de envío, confirme:

- que el ambiente sea el correcto
- que el `tenantId` corresponda al cliente correcto
- que la contraseña esté vigente
- que el documento o lote ya haya sido revisado visualmente

## Errores comunes al completar esta sección

| Situación | Qué revisar |
| --- | --- |
| Se eligió el ambiente incorrecto | Confirmar si el caso va a `Testing` o a `Producción` |
| El `tenantId` no funciona | Revisar que corresponda al cliente correcto |
| El password falla | Confirmar que no tenga errores de digitación o que no haya cambiado |
| MDG devuelve rechazo aunque el documento parece correcto | Revisar ambiente, credenciales y datos del comprobante |
