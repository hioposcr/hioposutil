import type {
  FiscalDocumentBase,
  FiscalParty,
  FiscalTotals,
  OriginalDocumentData,
  OtherChargeSummary,
  TaxBreakdown,
} from '../types';
import { getDocumentTypeCode, getDocumentTypeLabel } from '../utils/documentTypes';
import { parseAmount } from '../utils/number';
import {
  findElementsByLocalName,
  findFirstElementByLocalNames,
  getChildElement,
  getChildElements,
  getElementText,
  getLocalName,
  parseXmlDocument,
} from '../utils/xml';

const FISCAL_DOCUMENT_NAMES = [
  'FacturaElectronica',
  'NotaDebitoElectronica',
  'NotaCreditoElectronica',
  'TiqueteElectronico',
  'FacturaElectronicaCompra',
  'FacturaElectronicaExportacion',
  'ComprobanteElectronico',
] as const;

function buildParty(parent: Element | null): FiscalParty {
  if (!parent) {
    return {
      nombre: 'No disponible',
      identificacion: '',
      displayName: 'No disponible',
    };
  }

  const nombre = getElementText(parent, 'Nombre') || 'No disponible';
  const identificacionNode = getChildElement(parent, 'Identificacion');
  const identificacion = identificacionNode
    ? [getElementText(identificacionNode, 'Tipo'), getElementText(identificacionNode, 'Numero')]
        .filter(Boolean)
        .join(' · ')
    : '';

  return {
    nombre,
    identificacion,
    displayName: [nombre, identificacion].filter(Boolean).join(' — '),
  };
}

function extractTaxBreakdown(documentElement: Element): TaxBreakdown[] {
  const summary = getChildElement(documentElement, 'ResumenFactura');

  if (summary) {
    const summaryTaxes = getChildElements(summary, 'TotalDesgloseImpuesto').map((item) => ({
      codigo: getElementText(item, 'Codigo') || 'N/D',
      codigoTarifa:
        getElementText(item, 'CodigoTarifaIVA') || getElementText(item, 'CodigoTarifa') || 'N/D',
      monto: parseAmount(getElementText(item, 'TotalMontoImpuesto')),
    }));

    if (summaryTaxes.length > 0) {
      return summaryTaxes;
    }
  }

  return findElementsByLocalName(documentElement, 'Impuesto').map((item) => ({
    codigo: getElementText(item, 'Codigo') || 'N/D',
    codigoTarifa:
      getElementText(item, 'CodigoTarifaIVA') || getElementText(item, 'CodigoTarifa') || 'N/D',
    monto: parseAmount(getElementText(item, 'Monto')),
  }));
}

function extractOtherCharges(documentElement: Element): OtherChargeSummary[] {
  return getChildElements(documentElement, 'OtrosCargos').map((item) => ({
    detalle:
      getElementText(item, 'Detalle') ||
      getElementText(item, 'TipoDocumentoOTROS') ||
      getElementText(item, 'TipoDocumentoOC') ||
      'Otro cargo',
    monto: parseAmount(getElementText(item, 'MontoCargo')),
  }));
}

function extractTotals(documentElement: Element): FiscalTotals {
  const summary = getChildElement(documentElement, 'ResumenFactura');

  if (!summary) {
    throw new Error('El XML no contiene un bloque ResumenFactura.');
  }

  return {
    totalServGravados: parseAmount(getElementText(summary, 'TotalServGravados')),
    totalMercanciasGravadas: parseAmount(getElementText(summary, 'TotalMercanciasGravadas')),
    totalImpuesto: parseAmount(getElementText(summary, 'TotalImpuesto')),
    totalOtrosCargos: parseAmount(getElementText(summary, 'TotalOtrosCargos')),
    totalComprobante: parseAmount(getElementText(summary, 'TotalComprobante')),
  };
}

export function resolveFiscalDocumentElement(
  document: Document,
  preferredNames: string[] = []
): Element {
  const root = document.documentElement;
  const rootName = getLocalName(root);
  const preferred = findFirstElementByLocalNames(document, preferredNames);

  if (preferred) {
    return preferred;
  }

  if (FISCAL_DOCUMENT_NAMES.includes(rootName as (typeof FISCAL_DOCUMENT_NAMES)[number])) {
    return root;
  }

  const fallback = findFirstElementByLocalNames(document, [...FISCAL_DOCUMENT_NAMES]);

  if (!fallback) {
    throw new Error('No se pudo identificar un comprobante electrónico dentro del XML.');
  }

  return fallback;
}

export function extractFiscalDocumentBase(
  documentElement: Element,
  overrides?: Partial<Pick<FiscalDocumentBase, 'tipoDocumento' | 'tipoDocumentoCodigo'>>
): FiscalDocumentBase {
  const rootTag = getLocalName(documentElement);
  const tipoDocumento = overrides?.tipoDocumento ?? getDocumentTypeLabel(rootTag);
  const tipoDocumentoCodigo = overrides?.tipoDocumentoCodigo ?? getDocumentTypeCode(rootTag);
  const summary = getChildElement(documentElement, 'ResumenFactura');
  const currencyNode = summary ? getChildElement(summary, 'CodigoTipoMoneda') : null;

  return {
    rootTag,
    tipoDocumento,
    tipoDocumentoCodigo,
    clave: getElementText(documentElement, 'Clave') || 'No disponible',
    numeroConsecutivo: getElementText(documentElement, 'NumeroConsecutivo') || 'No disponible',
    fechaEmision: getElementText(documentElement, 'FechaEmision') || 'No disponible',
    emisor: buildParty(getChildElement(documentElement, 'Emisor')),
    receptor: buildParty(getChildElement(documentElement, 'Receptor')),
    moneda: currencyNode ? getElementText(currencyNode, 'CodigoMoneda') || 'CRC' : 'CRC',
    totals: extractTotals(documentElement),
    impuestos: extractTaxBreakdown(documentElement),
    otrosCargos: extractOtherCharges(documentElement),
  };
}

export function parseOriginalDocumentXml(xmlString: string, fileName?: string): OriginalDocumentData {
  const document = parseXmlDocument(xmlString);
  const documentElement = resolveFiscalDocumentElement(document);

  return {
    ...extractFiscalDocumentBase(documentElement),
    source: 'xml',
    fileName,
    rawXml: xmlString,
  };
}
