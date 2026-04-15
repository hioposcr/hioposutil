import type { JsonObject, JsonValue, MdgEnvelope } from '../types';
import { parseXmlDocument } from '../utils/xml';

const DEFAULT_CONFIGURACION_OPCIONES_ADICIONALES = {
  numeroInternoComprobante: '',
  envioManualComprobanteAceptado: false,
} as const;

const DEFAULT_CORREOS_ELECTRONICOS_ADICIONALES = {
  bcc: [],
  cc: [],
  cuerpoMensajeHTML: '',
  cuerpoMensajePlano: '',
  asunto: '',
  to: [],
} as const;

const DEFAULT_GENERACION_PDF_COMPROBANTE = {
  cantidadDecimalesMostrarMontos: 2,
  cantidadDecimalesMostrarCantidades: 3,
  logoBytes: '',
  colorBaseFondo: '2E64A5',
  colorBaseBorde: '2E64A5',
  colorBaseFuente: 'FFFFFF',
  reporteId: '7fa5db46-5042-4f6a-b41e-348d1b2490d9',
  colorBaseFondoSecundario: 'F5F5F5',
  colorBaseBordeSecundario: 'D3D3D3',
  colorBaseFuenteSecundario: '000000',
  mostrarOtroTexto: true,
} as const;

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeJsonObject(defaultValue: JsonObject, candidate: JsonValue | undefined): JsonObject {
  if (!isJsonObject(candidate)) {
    return { ...defaultValue };
  }

  return {
    ...defaultValue,
    ...candidate,
  };
}

function resolveArray(candidate: JsonValue | undefined): JsonValue[] {
  return Array.isArray(candidate) ? candidate : [];
}

function resolveString(candidate: JsonValue | undefined, fallback = ''): string {
  return typeof candidate === 'string' ? candidate : fallback;
}

function resolveNumber(candidate: JsonValue | undefined, fallback: number): number {
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : fallback;
}

export function resolveXmlnsFromXml(xml: string): string {
  try {
    const document = parseXmlDocument(xml);
    return document.documentElement.namespaceURI || '';
  } catch {
    return '';
  }
}

export function buildStrictMdgPayload(xml: string, sourcePayload?: JsonValue): MdgEnvelope {
  const sourceObject = isJsonObject(sourcePayload) ? sourcePayload : undefined;
  const xmlNamespace = resolveXmlnsFromXml(xml);

  return {
    configuracionOpcionesAdicionales: mergeJsonObject(
      DEFAULT_CONFIGURACION_OPCIONES_ADICIONALES as unknown as JsonObject,
      sourceObject?.configuracionOpcionesAdicionales
    ),
    correosElectronicosAdicionales: mergeJsonObject(
      DEFAULT_CORREOS_ELECTRONICOS_ADICIONALES as unknown as JsonObject,
      sourceObject?.correosElectronicosAdicionales
    ),
    adjuntos: resolveArray(sourceObject?.adjuntos),
    documentoElectronico: xml,
    emisionComprobanteElectronicoRequest: mergeJsonObject(
      {},
      sourceObject?.emisionComprobanteElectronicoRequest
    ),
    ejecucionInternaClienteId: resolveString(sourceObject?.ejecucionInternaClienteId, ''),
    generacionPdfComprobante: mergeJsonObject(
      DEFAULT_GENERACION_PDF_COMPROBANTE as unknown as JsonObject,
      sourceObject?.generacionPdfComprobante
    ),
    tipoSerializacion: resolveNumber(sourceObject?.tipoSerializacion, 2),
    xmlns: resolveString(sourceObject?.xmlns, xmlNamespace),
  };
}
