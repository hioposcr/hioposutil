# hioposutil

Herramienta web interna para corregir notas de crédito electrónicas rechazadas por diferencias de redondeo frente al documento fiscal original, regenerar su información de reemisión y reenviarlas a MDG sin exponer endpoints directamente en el frontend.

## Objetivo

La aplicación permite:

- cargar el XML del documento original
- cargar la nota rechazada en JSON o XML
- analizar diferencias de total
- recalcular una versión corregida por debajo del original
- regenerar fecha, consecutivo y clave usando una nueva terminal
- exportar JSON y XML corregidos
- reenviar el comprobante a MDG usando una Netlify Function para evitar CORS
- operar con login interno y sesión persistente para personal de soporte

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Sonner
- Netlify Functions

## Funcionalidades principales

- Login interno obligatorio antes de usar la herramienta
- Sesión persistente en navegador con cierre manual y expiración por inactividad
- Advertencia previa al vencimiento de sesión
- Soporte de documento original por XML o ingreso manual
- Soporte de nota de crédito rechazada en JSON MDG o XML
- Parseo robusto con validaciones y manejo de errores
- Ajuste automático de diferencias pequeñas de redondeo
- Regeneración de consecutivo, clave y fecha de emisión
- Exportación de `JSON` y `XML`
- Envío a MDG por ambiente `Testing` o `Producción`
- Uso de `tenantId` y `password` por cliente sin dejarlos fijos en el sitio
- Limpieza automática del caso después de un envío exitoso a MDG

## Arquitectura

```mermaid
flowchart LR
    U[Usuario soporte] --> L[Login interno]
    L --> FE[Frontend React]
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
    FE --> C[Limpiar caso exitoso]
    C --> U
```

## Flujo de autenticación y sesión

```mermaid
flowchart TD
    A[Apertura de la app] --> B[Mostrar login]
    B --> C{Credenciales válidas?}
    C -- No --> D[Mostrar error]
    D --> B
    C -- Sí --> E[Guardar sesión local]
    E --> F[Habilitar herramienta]
    F --> G[Monitorear actividad]
    G --> H{Inactividad prolongada?}
    H -- No --> G
    H -- Sí --> I[Mostrar advertencia]
    I --> J{Usuario sigue activo?}
    J -- Sí --> G
    J -- No --> K[Cerrar sesión]
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

    S->>FE: Inicia sesión y carga archivos
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
    FE-->>S: Limpia el formulario si el envío fue exitoso
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

1. Ingresar con el login interno de soporte.
2. Cargar el XML del documento original.
3. Cargar la nota de crédito rechazada en JSON o XML.
4. Revisar los resúmenes generados por la app.
5. Configurar la nueva terminal de reemisión.
6. Presionar `Analizar documento`.
7. Presionar `Recalcular ajuste`.
8. Presionar `Generar versión corregida`.
9. Revisar el preview JSON/XML.
10. Opcionalmente exportar archivos.
11. Seleccionar ambiente `Testing` o `Producción`.
12. Ingresar `tenantId` y `password` del cliente.
13. Presionar `Enviar a MDG`.
14. Si el envío es exitoso, la app limpia el caso actual para preparar el siguiente.
15. Cerrar sesión manualmente desde el encabezado cuando corresponda.

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
- La herramienta tiene login interno obligatorio antes de habilitar las acciones de negocio.
- La sesión permanece disponible mientras exista actividad del usuario y se invalida por inactividad prolongada.
- Existe advertencia de vencimiento de sesión antes del cierre automático.
- Si más adelante se requiere mayor seguridad, el siguiente paso recomendado es reemplazar el login fijo y la captura manual por autenticación real y almacenamiento seguro de credenciales por cliente.

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

### La sesión se cerró sola

Revisar si:

- el usuario estuvo inactivo por un periodo prolongado
- la advertencia de sesión fue ignorada
- se limpió almacenamiento del navegador

## Validaciones realizadas

El proyecto fue verificado con:

```bash
npm run typecheck
npm run lint
npm run build
```

## Licencia

Uso interno.
