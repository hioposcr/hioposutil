# hioposutil

Herramienta web interna para corregir notas de crédito electrónicas rechazadas por diferencias de redondeo frente al documento fiscal original y reenviarlas a MDG sin exponer endpoints en el frontend.

## Objetivo

La aplicación permite:

- cargar el XML del documento original
- cargar la nota rechazada en JSON o XML
- analizar diferencias de total
- recalcular una versión corregida por debajo del original
- regenerar fecha, consecutivo y clave usando una nueva terminal
- exportar JSON y XML corregidos
- reenviar el comprobante a MDG usando una Netlify Function para evitar CORS

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Sonner
- Netlify Functions

## Funcionalidades principales

- Soporte de documento original por XML o ingreso manual
- Soporte de nota de crédito rechazada en JSON MDG o XML
- Parseo robusto con validaciones y manejo de errores
- Ajuste automático de diferencias pequeñas de redondeo
- Regeneración de consecutivo, clave y fecha de emisión
- Exportación de `JSON` y `XML`
- Envío a MDG por ambiente `Testing` o `Producción`
- Uso de `tenantId` y `password` por cliente sin dejarlos fijos en el sitio

## Arquitectura

```mermaid
flowchart LR
    U[Usuario soporte] --> FE[Frontend React]
    FE --> P1[Parseo XML original]
    FE --> P2[Parseo nota JSON o XML]
    P1 --> A[Análisis de diferencias]
    P2 --> A
    A --> R[Recálculo y regeneración]
    R --> X[Exportación JSON/XML]
    R --> NF[Netlify Function mdg-submit]
    NF --> T[Token MDG]
    T --> E[Emisión MDG]
    E --> FE
    FE --> U
```

## Flujo de corrección

```mermaid
flowchart TD
    A[Subir XML original] --> B[Subir nota rechazada]
    B --> C[Analizar montos]
    C --> D{La nota supera al original?}
    D -- No --> E[Se mantiene total actual]
    D -- Sí --> F[Reducir monto]
    F --> G[Objetivo: 1 o 2 colones menos]
    G --> H[Actualizar líneas, impuestos y resumen]
    E --> I[Regenerar fecha, consecutivo y clave]
    H --> I
    I --> J[Preview del resultado]
    J --> K[Exportar o enviar a MDG]
```

## Flujo de envío a MDG

```mermaid
sequenceDiagram
    participant S as Soporte
    participant FE as Frontend
    participant NF as Netlify Function
    participant MDG as API MDG

    S->>FE: Ingresa tenantId, password y ambiente
    S->>FE: Presiona Enviar a MDG
    FE->>NF: POST /.netlify/functions/mdg-submit
    Note over FE,NF: Se envían environment, tenantId, password y payload corregido
    NF->>MDG: Solicita token
    MDG-->>NF: access_token
    NF->>MDG: Envía comprobante corregido
    MDG-->>NF: Respuesta de emisión
    NF-->>FE: Resultado estructurado o error
    FE-->>S: Muestra éxito o detalle del error
```

## Estructura relevante

```text
src/
  components/
  parsers/
  services/
  utils/
  types/
netlify/
  functions/
    mdg-submit.mjs
netlify.toml
netlify.env.example
```

## Requisitos

- Node.js 18 o superior
- npm
- Cuenta en Netlify para deploy con Functions

## Instalación local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar solo frontend:

```bash
npm run dev
```

3. Levantar frontend + Netlify Function local:

```bash
npm run dev:netlify
```

Importante:

- `npm run dev` no sirve para probar el envío a MDG por Function.
- Para probar el botón `Enviar a MDG` localmente debes usar `npm run dev:netlify`.

## Scripts disponibles

- `npm run dev`: inicia Vite
- `npm run dev:netlify`: inicia Netlify Dev con Functions
- `npm run build`: genera build de producción
- `npm run lint`: corre ESLint
- `npm run typecheck`: valida tipos TypeScript
- `npm run preview`: previsualiza el build

## Paso a paso de uso

1. Cargar el XML del documento original.
2. Cargar la nota de crédito rechazada en JSON o XML.
3. Revisar los resúmenes generados por la app.
4. Configurar la nueva terminal de reemisión.
5. Presionar `Analizar documento`.
6. Presionar `Recalcular ajuste`.
7. Presionar `Generar versión corregida`.
8. Revisar el preview JSON/XML.
9. Opcionalmente exportar archivos.
10. Seleccionar ambiente `Testing` o `Producción`.
11. Ingresar `tenantId` y `password` del cliente.
12. Presionar `Enviar a MDG`.

## Despliegue en Netlify

### Opción recomendada

Conectar este repositorio a Netlify por Git para que despliegue:

- frontend desde `dist`
- Functions desde `netlify/functions`

### Configuración de build

Netlify ya puede leer esta configuración desde `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

### Variables de entorno

La app ya no depende de credenciales fijas para operar con múltiples clientes, porque soporte puede escribir `tenantId` y `password` por cada envío.

Sin embargo, como respaldo opcional, puedes definir en Netlify:

- `MDG_TENANT_ID`
- `MDG_PASSWORD`
- `MDG_TENANT_ID_TEST`
- `MDG_PASSWORD_TEST`
- `MDG_TENANT_ID_PROD`
- `MDG_PASSWORD_PROD`

El archivo [netlify.env.example](./netlify.env.example) incluye esos nombres como referencia.

## Seguridad y operación

- El frontend no llama directamente a MDG, por lo que se evita el problema de CORS.
- Los endpoints de MDG no se muestran en la interfaz.
- El `tenantId` y `password` del cliente se usan para la operación actual y no quedan como configuración estática del sitio.
- Si más adelante se requiere mayor seguridad, el siguiente paso recomendado es reemplazar captura manual por almacenamiento seguro de credenciales por cliente.

## Consideraciones fiscales

- El XML original es la fuente de verdad para el documento base.
- La app intenta dejar la nota corregida entre 1 y 2 colones por debajo del total del documento original cuando hay diferencia de redondeo.
- En un flujo fiscal real normalmente debe generarse nueva fecha, nuevo consecutivo y nueva clave.
- Se recomienda siempre validar el resultado antes de reenviar a MDG.

## Troubleshooting

### El botón de envío devuelve error de Function no disponible

Usa `npm run dev:netlify` en local o despliega el sitio en Netlify conectado por Git.

### El envío responde con error de configuración

Ocurre si:

- no se ingresó `tenantId`
- no se ingresó `password`
- o la Function esperaba usar variables de entorno y no existen

### El envío responde con error de MDG

Revisar:

- credenciales del cliente
- ambiente correcto
- estructura final del documento
- respuesta mostrada en el panel de error

## Validaciones realizadas

El proyecto fue verificado con:

```bash
npm run typecheck
npm run lint
npm run build
```

## Licencia

Uso interno.
