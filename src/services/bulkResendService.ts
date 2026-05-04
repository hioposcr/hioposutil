import { resolveFiscalDocumentElement } from '../parsers/xmlParser';
import type {
  BulkPreparedDocument,
  BulkResendSettings,
  BulkSourceDocumentItem,
} from '../types';
import { buildStrictMdgPayload } from './mdgPayloadBuilder';
import { replaceTerminalAndSequenceInConsecutive } from '../utils/consecutive';
import {
  getChildElement,
  getElementText,
  parseXmlDocument,
  serializeXmlDocument,
  setElementText,
} from '../utils/xml';

const COSTA_RICA_TIMEZONE = 'America/Costa_Rica';

function buildCostaRicaDateTime(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: COSTA_RICA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== 'literal') {
      accumulator[part.type] = part.value;
    }
    return accumulator;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

function buildClaveDateSegment(fechaEmision: string): string {
  const match = fechaEmision.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    throw new Error('No se pudo derivar la fecha para regenerar la clave electrónica.');
  }

  const [, year, month, day] = match;
  return `${day}${month}${year.slice(-2)}`;
}

function buildEmitterIdSegment(documentElement: Element): string {
  const emisor = getChildElement(documentElement, 'Emisor');
  const identificacion = emisor ? getChildElement(emisor, 'Identificacion') : null;
  const numero = identificacion ? getElementText(identificacion, 'Numero') : '';
  const digits = numero.replace(/\D/g, '');

  if (!digits) {
    throw new Error('No se encontró la identificación del emisor para regenerar la clave.');
  }

  return digits.padStart(12, '0').slice(-12);
}

function extractSituationCode(clave: string): string {
  const digits = clave.replace(/\D/g, '');
  return digits.length >= 42 ? digits.charAt(41) : '1';
}

function extractSecurityCode(clave: string): string {
  const digits = clave.replace(/\D/g, '');
  return digits.length >= 50 ? digits.slice(42, 50) : '';
}

function removeExistingSignatures(document: Document): void {
  const removableNames = ['Signature', 'QualifyingProperties'];

  for (const localName of removableNames) {
    const matches = Array.from(document.getElementsByTagName('*')).filter(
      (element) => (element.localName || element.nodeName.split(':').pop()) === localName
    );

    for (const element of matches) {
      element.remove();
    }
  }
}

function validateSequenceNumber(sequenceNumber: number): void {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1 || sequenceNumber > 9999999999) {
    throw new Error('El número inicial del documento debe estar entre 1 y 9999999999.');
  }
}

function buildRegeneratedIdentity(
  documentElement: Element,
  currentKey: string,
  settings: BulkResendSettings,
  sequenceNumber: number
): { clave: string; consecutivo: string; fechaEmision: string } {
  validateSequenceNumber(sequenceNumber);

  const fechaEmision = buildCostaRicaDateTime();
  const consecutivoActual = getElementText(documentElement, 'NumeroConsecutivo');
  const consecutivo = replaceTerminalAndSequenceInConsecutive(
    consecutivoActual,
    settings.terminal,
    sequenceNumber
  );
  const dateSegment = buildClaveDateSegment(fechaEmision);
  const emitterSegment = buildEmitterIdSegment(documentElement);
  const situationCode = extractSituationCode(currentKey);
  const preservedSecurityCode = extractSecurityCode(currentKey);
  const securityCode = settings.regenerateSecurityCode
    ? `${dateSegment}01`
    : preservedSecurityCode || `${dateSegment}01`;
  const clave = `506${dateSegment}${emitterSegment}${consecutivo}${situationCode}${securityCode}`;

  setElementText(documentElement, 'FechaEmision', fechaEmision);
  setElementText(documentElement, 'NumeroConsecutivo', consecutivo);
  setElementText(documentElement, 'Clave', clave);

  return {
    clave,
    consecutivo,
    fechaEmision,
  };
}

function buildPreparedDocument(
  sourceItem: BulkSourceDocumentItem,
  settings: BulkResendSettings,
  sequenceNumber: number
): BulkPreparedDocument {
  if (!sourceItem.document.rawXml) {
    throw new Error(`El XML del documento ${sourceItem.fileName} no está disponible para reprocesar.`);
  }

  const xmlDocument = parseXmlDocument(sourceItem.document.rawXml);
  const documentElement = resolveFiscalDocumentElement(xmlDocument);
  const regeneratedIdentity = buildRegeneratedIdentity(
    documentElement,
    sourceItem.document.clave,
    settings,
    sequenceNumber
  );

  removeExistingSignatures(xmlDocument);

  const xmlText = serializeXmlDocument(xmlDocument);
  const payload = buildStrictMdgPayload(xmlText);

  return {
    id: sourceItem.id,
    fileName: sourceItem.fileName,
    fileSizeLabel: sourceItem.fileSizeLabel,
    documentType: sourceItem.document.tipoDocumento,
    originalConsecutive: sourceItem.document.numeroConsecutivo,
    originalKey: sourceItem.document.clave,
    regeneratedConsecutive: regeneratedIdentity.consecutivo,
    regeneratedKey: regeneratedIdentity.clave,
    regeneratedFechaEmision: regeneratedIdentity.fechaEmision,
    sequenceNumber,
    totalComprobante: sourceItem.document.totals.totalComprobante,
    xmlText,
    payload,
    status: 'ready',
  };
}

export function prepareBulkResendDocuments(
  sourceItems: BulkSourceDocumentItem[],
  settings: BulkResendSettings
): BulkPreparedDocument[] {
  const startSequence = Number(settings.startingSequence.trim());
  validateSequenceNumber(startSequence);

  return sourceItems.map((sourceItem, index) =>
    buildPreparedDocument(sourceItem, settings, startSequence + index)
  );
}
