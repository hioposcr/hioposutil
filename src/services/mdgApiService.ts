import type {
  MdgBatchSubmissionSuccess,
  JsonObject,
  JsonValue,
  MdgEndpoints,
  MdgEnvironment,
  MdgSettings,
  MdgSubmissionError,
  MdgSubmissionSuccess,
} from '../types';

const NETLIFY_FUNCTION_PATH = '/.netlify/functions/mdg-submit';

interface ParsedApiResponse {
  text: string;
  data: JsonValue | null;
}

function isJsonObject(value: JsonValue | null | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function collectErrorMessages(value: unknown): string[] {
  if (typeof value === 'string') {
    const normalized = normalizeText(value);
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectErrorMessages(item));
  }

  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    const preferredKeys = ['message', 'mensaje', 'detail', 'title', 'error', 'errors'];
    const preferredMessages = preferredKeys.flatMap((key) => collectErrorMessages(objectValue[key]));

    if (preferredMessages.length > 0) {
      return preferredMessages;
    }

    return Object.values(objectValue).flatMap((item) => collectErrorMessages(item));
  }

  return [];
}

async function parseApiResponse(response: Response): Promise<ParsedApiResponse> {
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
      data: JSON.parse(text) as JsonValue,
    };
  } catch {
    return {
      text,
      data: text,
    };
  }
}

function buildApiErrorMessage(fallback: string, parsedResponse: ParsedApiResponse): string {
  const messages = collectErrorMessages(parsedResponse.data);
  const uniqueMessages = [...new Set(messages.map((message) => normalizeText(message)).filter(Boolean))];

  if (uniqueMessages.length > 0) {
    return uniqueMessages.join(' | ');
  }

  return normalizeText(parsedResponse.text) || fallback;
}

function createNetworkError(
  environment: MdgEnvironment,
  endpoint: string,
  fallback: string,
  error: unknown
): MdgSubmissionError {
  const detail = error instanceof Error ? error.message : 'Error de red no identificado.';

  return {
    environment,
    endpoint,
    source: 'network',
    status: null,
    message: `${fallback} ${detail}`.trim(),
    rawBody: detail,
  };
}

function ensureObjectPayload(payload: JsonValue): JsonObject {
  if (!isJsonObject(payload)) {
    throw new Error('El documento corregido no tiene una estructura JSON válida para enviar.');
  }

  return payload;
}

export class MdgApiError extends Error {
  details: MdgSubmissionError;

  constructor(details: MdgSubmissionError) {
    super(details.message);
    this.name = 'MdgApiError';
    this.details = details;
  }
}

export function getMdgEndpoints(environment: MdgEnvironment): MdgEndpoints {
  return {
    functionUrl: NETLIFY_FUNCTION_PATH,
    label: environment === 'prod' ? 'Producción' : 'Testing',
  };
}

export async function sendDocumentToMdg(
  settings: MdgSettings,
  correctedPayload: JsonValue
): Promise<MdgSubmissionSuccess> {
  const payload = ensureObjectPayload(correctedPayload);
  const endpoints = getMdgEndpoints(settings.environment);
  let response: Response;

  try {
    response = await fetch(endpoints.functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        environment: settings.environment,
        tenantId: settings.tenantId.trim(),
        password: settings.password,
        payload,
      }),
    });
  } catch (error) {
    throw new MdgApiError(
      createNetworkError(
        settings.environment,
        endpoints.functionUrl,
        'No se pudo contactar la Netlify Function encargada del envío.',
        error
      )
    );
  }

  const parsedResponse = await parseApiResponse(response);

  if (!response.ok) {
    if (isJsonObject(parsedResponse.data) && typeof parsedResponse.data.message === 'string') {
      throw new MdgApiError(parsedResponse.data as unknown as MdgSubmissionError);
    }

    throw new MdgApiError({
      environment: settings.environment,
      endpoint: endpoints.functionUrl,
      source: response.status === 404 ? 'function' : 'network',
      status: response.status,
      message:
        response.status === 404
          ? 'La Netlify Function `mdg-submit` no está disponible. En local usa `netlify dev` y en producción despliega el sitio con Functions habilitadas.'
          : buildApiErrorMessage('No se pudo completar el envío mediante la Netlify Function.', parsedResponse),
      rawBody: parsedResponse.text || undefined,
    });
  }

  if (!isJsonObject(parsedResponse.data)) {
    throw new MdgApiError({
      environment: settings.environment,
      endpoint: endpoints.functionUrl,
      source: 'function',
      status: response.status,
      message: 'La Netlify Function respondió con un formato inesperado.',
      rawBody: parsedResponse.text || undefined,
    });
  }

  return parsedResponse.data as unknown as MdgSubmissionSuccess;
}

export async function sendDocumentsBatchToMdg(
  settings: MdgSettings,
  batchItems: Array<{ id: string; payload: JsonValue }>,
  delayMs: number
): Promise<MdgBatchSubmissionSuccess> {
  const endpoints = getMdgEndpoints(settings.environment);
  let response: Response;

  try {
    response = await fetch(endpoints.functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        environment: settings.environment,
        tenantId: settings.tenantId.trim(),
        password: settings.password,
        delayMs,
        payloads: batchItems.map((item) => ({
          id: item.id,
          payload: ensureObjectPayload(item.payload),
        })),
      }),
    });
  } catch (error) {
    throw new MdgApiError(
      createNetworkError(
        settings.environment,
        endpoints.functionUrl,
        'No se pudo contactar la Netlify Function encargada del envío por lote.',
        error
      )
    );
  }

  const parsedResponse = await parseApiResponse(response);

  if (!response.ok) {
    if (isJsonObject(parsedResponse.data) && typeof parsedResponse.data.message === 'string') {
      throw new MdgApiError(parsedResponse.data as unknown as MdgSubmissionError);
    }

    throw new MdgApiError({
      environment: settings.environment,
      endpoint: endpoints.functionUrl,
      source: response.status === 404 ? 'function' : 'network',
      status: response.status,
      message:
        response.status === 404
          ? 'La Netlify Function `mdg-submit` no está disponible. En local usa `netlify dev` y en producción despliega el sitio con Functions habilitadas.'
          : buildApiErrorMessage(
              'No se pudo completar el envío por lote mediante la Netlify Function.',
              parsedResponse
            ),
      rawBody: parsedResponse.text || undefined,
    });
  }

  if (!isJsonObject(parsedResponse.data) || !Array.isArray(parsedResponse.data.results)) {
    throw new MdgApiError({
      environment: settings.environment,
      endpoint: endpoints.functionUrl,
      source: 'function',
      status: response.status,
      message: 'La Netlify Function respondió el lote con un formato inesperado.',
      rawBody: parsedResponse.text || undefined,
    });
  }

  return parsedResponse.data as unknown as MdgBatchSubmissionSuccess;
}
