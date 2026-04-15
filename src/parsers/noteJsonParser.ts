import type {
  JsonObject,
  JsonValue,
  MdgEnvelope,
  NoteReference,
  RejectedCreditNoteData,
} from '../types';
import { describeReferenceType } from '../utils/documentTypes';
import { buildStrictMdgPayload } from '../services/mdgPayloadBuilder';
import { extractFiscalDocumentBase, resolveFiscalDocumentElement } from './xmlParser';
import { getChildElement, getElementText, parseXmlDocument } from '../utils/xml';

interface XmlLocation {
  path: Array<string | number>;
  xml: string;
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeXml(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('<?xml') || trimmed.startsWith('<');
}

function findXmlLocation(value: JsonValue, path: Array<string | number> = []): XmlLocation | null {
  if (typeof value === 'string' && looksLikeXml(value)) {
    return { path, xml: value };
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const result = findXmlLocation(value[index], [...path, index]);
      if (result) {
        return result;
      }
    }

    return null;
  }

  if (!isJsonObject(value)) {
    return null;
  }

  const priorityKeys = ['documentoElectronico', 'Xml', 'XML', 'xml'];

  for (const key of priorityKeys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && looksLikeXml(candidate)) {
      return { path: [...path, key], xml: candidate };
    }
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const result = findXmlLocation(nestedValue, [...path, key]);
    if (result) {
      return result;
    }
  }

  return null;
}

function findFirstStringByKeys(value: JsonValue, candidates: string[]): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findFirstStringByKeys(item, candidates);
      if (match) {
        return match;
      }
    }

    return '';
  }

  if (!isJsonObject(value)) {
    return '';
  }

  for (const key of candidates) {
    const current = value[key];
    if (typeof current === 'string' && current.trim()) {
      return current.trim();
    }
  }

  for (const nestedValue of Object.values(value)) {
    const match = findFirstStringByKeys(nestedValue, candidates);
    if (match) {
      return match;
    }
  }

  return '';
}

function extractReference(documentElement: Element): NoteReference | null {
  const referenceNode =
    getChildElement(documentElement, 'InformacionReferencia') ??
    getChildElement(
      getChildElement(documentElement, 'InformacionesReferencia') ?? documentElement,
      'InformacionReferencia'
    );

  if (!referenceNode) {
    return null;
  }

  return {
    tipoDoc: getElementText(referenceNode, 'TipoDoc') || getElementText(referenceNode, 'TipoDocIR'),
    numero: getElementText(referenceNode, 'Numero'),
    fechaEmision:
      getElementText(referenceNode, 'FechaEmision') ||
      getElementText(referenceNode, 'FechaEmisionIR'),
    codigo: getElementText(referenceNode, 'Codigo'),
    razon: getElementText(referenceNode, 'Razon'),
  };
}

function parseRejectedNoteFromXml(
  xml: string,
  fileName?: string,
  wrapper?: MdgEnvelope,
  source: 'json' | 'xml' = 'xml',
  stateMessage?: string,
  reasonMessage?: string
): RejectedCreditNoteData {
  const xmlDocument = parseXmlDocument(xml);
  const noteElement = resolveFiscalDocumentElement(xmlDocument, ['NotaCreditoElectronica']);
  const reference = extractReference(noteElement);
  const base = extractFiscalDocumentBase(noteElement, {
    tipoDocumento: 'Nota de Crédito',
    tipoDocumentoCodigo: '03',
  });
  const mdgEnvelope = wrapper ?? buildStrictMdgPayload(xml);

  return {
    ...base,
    fileName,
    source,
    rawJson: mdgEnvelope,
    rawXml: xml,
    xmlFieldPath: ['documentoElectronico'],
    estadoRechazo: stateMessage || (source === 'json' ? 'Rechazada / pendiente de corrección' : 'Cargada desde XML'),
    motivoRechazo:
      reasonMessage ||
      (source === 'json'
        ? 'Se cargó la nota rechazada para analizar diferencias de redondeo.'
        : 'Se cargó una nota de crédito desde XML y se generará un payload JSON compatible con el formato requerido por MDG.'),
    referencia: reference,
    mdgEnvelope,
  };
}

function parseRejectedNoteFromJson(jsonText: string, fileName?: string): RejectedCreditNoteData {
  let payload: JsonValue;

  try {
    payload = JSON.parse(jsonText) as JsonValue;
  } catch {
    throw new Error('El archivo JSON no tiene un formato válido.');
  }

  const xmlLocation = findXmlLocation(payload);

  if (!xmlLocation) {
    throw new Error('No se encontró un XML de comprobante dentro del JSON.');
  }

  const estado =
    findFirstStringByKeys(payload, ['estadoRechazo', 'estado', 'status']) ||
    'Rechazada / pendiente de corrección';

  const reasonCandidate =
    findFirstStringByKeys(payload, [
      'motivoRechazo',
      'mensajeRechazo',
      'motivo',
      'razon',
      'mensaje',
      'error',
    ]) || '';

  const mdgEnvelope = buildStrictMdgPayload(
    xmlLocation.xml,
    isJsonObject(payload) ? payload : undefined
  );

  return parseRejectedNoteFromXml(
    xmlLocation.xml,
    fileName,
    mdgEnvelope,
    'json',
    estado,
    reasonCandidate || undefined
  );
}

export function parseRejectedNoteInput(fileText: string, fileName?: string): RejectedCreditNoteData {
  const normalizedName = fileName?.toLowerCase() ?? '';
  const trimmed = fileText.trim();

  if (normalizedName.endsWith('.xml') || looksLikeXml(trimmed)) {
    return parseRejectedNoteFromXml(trimmed, fileName, buildStrictMdgPayload(trimmed), 'xml');
  }

  return parseRejectedNoteFromJson(fileText, fileName);
}

export function buildCreditNoteSummaryMetadata(note: RejectedCreditNoteData): {
  documentoReferencia: string;
  tipoReferencia: string;
} {
  return {
    documentoReferencia: note.referencia?.numero || 'No informado',
    tipoReferencia: describeReferenceType(note.referencia?.tipoDoc || ''),
  };
}
