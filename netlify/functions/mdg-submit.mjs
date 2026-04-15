const NETLIFY_FUNCTION_PATH = '/.netlify/functions/mdg-submit';

const MDG_ENDPOINTS = {
  test: {
    tokenUrl: 'https://api.mdg-cloud.com/Emision/api/v1/test/Auth/Token',
    emissionUrl: 'https://api.mdg-cloud.com/Emision/api/v1/test/Emision/EmisionComprobante',
    label: 'Testing',
  },
  prod: {
    tokenUrl: 'https://api.mdg-cloud.com/Emision/api/v1/Auth/Token',
    emissionUrl: 'https://api.mdg-cloud.com/Emision/api/v1/Emision/EmisionComprobante',
    label: 'Producción',
  },
};

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  };
}

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function collectErrorMessages(value) {
  if (typeof value === 'string') {
    const normalized = normalizeText(value);
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectErrorMessages(item));
  }

  if (value && typeof value === 'object') {
    const preferredKeys = ['message', 'mensaje', 'detail', 'title', 'error', 'errors'];
    const preferredMessages = preferredKeys.flatMap((key) => collectErrorMessages(value[key]));

    if (preferredMessages.length > 0) {
      return preferredMessages;
    }

    return Object.values(value).flatMap((item) => collectErrorMessages(item));
  }

  return [];
}

function buildErrorMessage(fallback, parsedResponse) {
  const messages = collectErrorMessages(parsedResponse.data);
  const uniqueMessages = [...new Set(messages.map((message) => normalizeText(message)).filter(Boolean))];

  if (uniqueMessages.length > 0) {
    return uniqueMessages.join(' | ');
  }

  return normalizeText(parsedResponse.text) || fallback;
}

async function parseApiResponse(response) {
  const text = await response.text();

  if (!text) {
    return {
      text: '',
      data: null,
    };
  }

  try {
    return {
      text,
      data: JSON.parse(text),
    };
  } catch {
    return {
      text,
      data: text,
    };
  }
}

function resolveCredentials(environment, requestBody) {
  const runtimeTenantId = typeof requestBody?.tenantId === 'string' ? requestBody.tenantId.trim() : '';
  const runtimePassword = typeof requestBody?.password === 'string' ? requestBody.password.trim() : '';

  if (runtimeTenantId && runtimePassword) {
    return {
      tenantId: runtimeTenantId,
      password: runtimePassword,
      source: 'request',
    };
  }

  const suffix = environment === 'prod' ? 'PROD' : 'TEST';
  const tenantId = process.env[`MDG_TENANT_ID_${suffix}`] || process.env.MDG_TENANT_ID || '';
  const password = process.env[`MDG_PASSWORD_${suffix}`] || process.env.MDG_PASSWORD || '';

  return {
    tenantId: tenantId.trim(),
    password: password.trim(),
    source: 'environment',
  };
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildMdgError({ environment, endpoint, source, status, message, rawBody }) {
  return {
    environment,
    endpoint,
    source,
    status,
    message,
    ...(rawBody ? { rawBody } : {}),
  };
}

function formatCostaRicaTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Costa_Rica',
  }).format(date);
}

async function postJson({ endpoint, body, authorization }) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/plain',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify(body),
  });

  return {
    response,
    parsedResponse: await parseApiResponse(response),
  };
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        Allow: 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(
      405,
      buildMdgError({
        environment: 'test',
        endpoint: NETLIFY_FUNCTION_PATH,
        source: 'function',
        status: 405,
        message: 'Método no permitido. Usa POST para enviar el comprobante a MDG.',
      })
    );
  }

  let requestBody;

  try {
    requestBody = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(
      400,
      buildMdgError({
        environment: 'test',
        endpoint: NETLIFY_FUNCTION_PATH,
        source: 'function',
        status: 400,
        message: 'El cuerpo enviado a la Netlify Function no es un JSON válido.',
      })
    );
  }

  const environment = requestBody?.environment === 'prod' ? 'prod' : requestBody?.environment === 'test' ? 'test' : null;

  if (!environment) {
    return jsonResponse(
      400,
      buildMdgError({
        environment: 'test',
        endpoint: NETLIFY_FUNCTION_PATH,
        source: 'function',
        status: 400,
        message: 'Debes indicar un ambiente válido (`test` o `prod`).',
      })
    );
  }

  if (!isObject(requestBody?.payload)) {
    return jsonResponse(
      400,
      buildMdgError({
        environment,
        endpoint: NETLIFY_FUNCTION_PATH,
        source: 'function',
        status: 400,
        message: 'El payload corregido no tiene una estructura JSON válida.',
      })
    );
  }

  const credentials = resolveCredentials(environment, requestBody);

  if (!/^\d+$/.test(credentials.tenantId) || !credentials.password) {
    return jsonResponse(
      500,
      buildMdgError({
        environment,
        endpoint: NETLIFY_FUNCTION_PATH,
        source: 'config',
        status: 500,
        message:
          'Debes enviar `tenantId` y `password` del cliente, o bien configurar `MDG_TENANT_ID` y `MDG_PASSWORD` como respaldo en Netlify.',
      })
    );
  }

  const endpoints = MDG_ENDPOINTS[environment];
  let tokenData;

  try {
    const { response, parsedResponse } = await postJson({
      endpoint: endpoints.tokenUrl,
      body: {
        tenantId: Number.parseInt(credentials.tenantId, 10),
        password: credentials.password,
      },
    });

    if (!response.ok) {
      return jsonResponse(
        response.status,
        buildMdgError({
          environment,
          endpoint: endpoints.tokenUrl,
          source: 'token',
          status: response.status,
          message: buildErrorMessage('MDG rechazó la obtención del token.', parsedResponse),
          rawBody: parsedResponse.text || undefined,
        })
      );
    }

    if (!isObject(parsedResponse.data) || typeof parsedResponse.data.access_token !== 'string') {
      return jsonResponse(
        502,
        buildMdgError({
          environment,
          endpoint: endpoints.tokenUrl,
          source: 'token',
          status: 502,
          message: 'MDG respondió el token con un formato inesperado.',
          rawBody: parsedResponse.text || undefined,
        })
      );
    }

    tokenData = parsedResponse.data;
  } catch (error) {
    return jsonResponse(
      502,
      buildMdgError({
        environment,
        endpoint: endpoints.tokenUrl,
        source: 'network',
        status: 502,
        message: `No se pudo solicitar el token a MDG. ${error instanceof Error ? error.message : 'Error de red no identificado.'}`.trim(),
      })
    );
  }

  try {
    const { response, parsedResponse } = await postJson({
      endpoint: endpoints.emissionUrl,
      body: requestBody.payload,
      authorization: `Bearer ${tokenData.access_token}`,
    });

    if (!response.ok) {
      return jsonResponse(
        response.status,
        buildMdgError({
          environment,
          endpoint: endpoints.emissionUrl,
          source: 'emision',
          status: response.status,
          message: buildErrorMessage('MDG rechazó el envío del comprobante.', parsedResponse),
          rawBody: parsedResponse.text || undefined,
        })
      );
    }

    if (!isObject(parsedResponse.data)) {
      return jsonResponse(
        502,
        buildMdgError({
          environment,
          endpoint: endpoints.emissionUrl,
          source: 'emision',
          status: 502,
          message: 'MDG respondió la emisión con un formato inesperado.',
          rawBody: parsedResponse.text || undefined,
        })
      );
    }

    return jsonResponse(200, {
      environment,
      endpoints: {
        functionUrl: NETLIFY_FUNCTION_PATH,
        label: endpoints.label,
      },
      token: {
        token_type: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in || 0,
        expires_on: tokenData.expires_on || '',
      },
      response: parsedResponse.data,
      submittedAt: formatCostaRicaTimestamp(),
    });
  } catch (error) {
    return jsonResponse(
      502,
      buildMdgError({
        environment,
        endpoint: endpoints.emissionUrl,
        source: 'network',
        status: 502,
        message: `No se pudo remitir el comprobante a MDG. ${error instanceof Error ? error.message : 'Error de red no identificado.'}`.trim(),
      })
    );
  }
}
