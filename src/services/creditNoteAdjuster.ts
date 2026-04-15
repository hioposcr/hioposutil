import type {
  ComparisonAnalysis,
  CorrectionResult,
  JsonObject,
  JsonValue,
  OriginalDocumentData,
  RejectedCreditNoteData,
  ReissueSettings,
} from '../types';
import { clampToZero, formatDecimal, isGreaterThan, parseAmount, roundTo } from '../utils/number';
import { replaceTerminalInConsecutive } from '../utils/consecutive';
import {
  findElementsByLocalName,
  getChildElement,
  getChildElements,
  getElementText,
  parseXmlDocument,
  serializeXmlDocument,
  setElementText,
} from '../utils/xml';

const AUTO_ROUNDING_MAX_DIFFERENCE = 2;
const TARGET_BUFFERS = [2, 1];
const COSTA_RICA_TIMEZONE = 'America/Costa_Rica';

interface OtherChargeAdjustment {
  applied: number;
  remaining: number;
  changedLabels: string[];
}

interface LineAdjustment {
  applied: number;
  remaining: number;
  changedLabel: string;
  baseDelta: number;
  taxDelta: number;
  categoryField?: string;
  aggregateField: string;
}

interface SummaryMutation {
  baseDelta: number;
  taxDelta: number;
  otherChargesDelta: number;
  totalDelta: number;
  categoryField?: string;
  aggregateField: string;
}

interface RegeneratedDocumentIdentity {
  clave: string;
  consecutivo: string;
  fechaEmision: string;
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneJsonValue<T extends JsonValue>(value: T): T {
  return structuredClone(value);
}

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

function regenerateDocumentIdentity(
  documentElement: Element,
  reissueSettings: ReissueSettings
): RegeneratedDocumentIdentity {
  const fechaEmision = buildCostaRicaDateTime();
  const consecutivoActual = getElementText(documentElement, 'NumeroConsecutivo');
  const consecutivo = replaceTerminalInConsecutive(consecutivoActual, reissueSettings.terminal);
  const dateSegment = buildClaveDateSegment(fechaEmision);
  const emitterSegment = buildEmitterIdSegment(documentElement);
  const securityCode = `${dateSegment}01`;
  const clave = `506${dateSegment}${emitterSegment}${consecutivo}1${securityCode}`;

  setElementText(documentElement, 'FechaEmision', fechaEmision);
  setElementText(documentElement, 'NumeroConsecutivo', consecutivo);
  setElementText(documentElement, 'Clave', clave);

  return {
    clave,
    consecutivo,
    fechaEmision,
  };
}

function setNestedValue(target: JsonValue, path: Array<string | number>, replacement: string): JsonValue {
  const cloned = cloneJsonValue(target);
  let current: JsonValue = cloned;

  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];

    if (Array.isArray(current) && typeof key === 'number') {
      current = current[key];
      continue;
    }

    if (isJsonObject(current) && typeof key === 'string') {
      current = current[key];
      continue;
    }

    throw new Error('No se pudo actualizar la ruta del XML dentro del JSON.');
  }

  const lastKey = path[path.length - 1];

  if (Array.isArray(current) && typeof lastKey === 'number') {
    current[lastKey] = replacement;
    return cloned;
  }

  if (isJsonObject(current) && typeof lastKey === 'string') {
    current[lastKey] = replacement;
    return cloned;
  }

  throw new Error('No se pudo actualizar el XML dentro del JSON.');
}

function removeExistingSignatures(document: Document): boolean {
  const removableNames = ['Signature', 'QualifyingProperties'];
  let removedAny = false;

  for (const localName of removableNames) {
    const matches = findElementsByLocalName(document, localName);
    for (const element of matches) {
      element.remove();
      removedAny = true;
    }
  }

  return removedAny;
}

function analyzeAutomaticSafety(originalTotal: number, rejectedTotal: number): boolean {
  return isGreaterThan(rejectedTotal, originalTotal)
    ? roundTo(rejectedTotal - originalTotal, 2) <= AUTO_ROUNDING_MAX_DIFFERENCE
    : true;
}

export function compareCreditNoteTotals(
  original: OriginalDocumentData,
  note: RejectedCreditNoteData
): ComparisonAnalysis {
  const originalTotal = original.totals.totalComprobante;
  const rejectedTotal = note.totals.totalComprobante;
  const difference = roundTo(rejectedTotal - originalTotal);
  const absoluteDifference = Math.abs(difference);
  const exceedsOriginal = isGreaterThan(rejectedTotal, originalTotal);
  const requiresAdjustment = exceedsOriginal;
  const safeForAutomaticAdjustment = analyzeAutomaticSafety(originalTotal, rejectedTotal);
  const recommendedBuffer = exceedsOriginal ? 1 : 0;
  const targetTotal = exceedsOriginal ? roundTo(originalTotal - recommendedBuffer) : rejectedTotal;
  const expectedCorrectedTotal = targetTotal;
  const percentageDifference = originalTotal > 0 ? roundTo((absoluteDifference / originalTotal) * 100, 6) : 0;

  let summaryMessage = 'La nota no supera al documento original. No se requiere ajuste automático.';

  if (exceedsOriginal) {
    summaryMessage = safeForAutomaticAdjustment
      ? 'La nota supera al documento original por una diferencia pequeña de redondeo y puede corregirse automáticamente.'
      : 'La diferencia excede el rango típico de redondeo. La app puede calcular un ajuste, pero conviene revisarlo manualmente.';
  }

  return {
    originalTotal,
    rejectedTotal,
    difference,
    absoluteDifference,
    percentageDifference,
    exceedsOriginal,
    requiresAdjustment,
    safeForAutomaticAdjustment,
    recommendedBuffer,
    targetTotal,
    expectedCorrectedTotal,
    summaryMessage,
  };
}

function parseTaxes(line: Element): Array<{ element: Element; amount: number }> {
  return getChildElements(line, 'Impuesto').map((taxElement) => ({
    element: taxElement,
    amount: parseAmount(getElementText(taxElement, 'Monto')),
  }));
}

function reduceOtherCharges(documentElement: Element, amountToReduce: number): OtherChargeAdjustment {
  let remaining = amountToReduce;
  let applied = 0;
  const changedLabels: string[] = [];

  const charges = getChildElements(documentElement, 'OtrosCargos')
    .map((charge) => {
      const label =
        getElementText(charge, 'Detalle') ||
        getElementText(charge, 'TipoDocumentoOTROS') ||
        getElementText(charge, 'TipoDocumentoOC') ||
        'Otro cargo';
      return {
        charge,
        label,
        amount: parseAmount(getElementText(charge, 'MontoCargo')),
      };
    })
    .sort((left, right) => {
      const leftScore = /redondeo/i.test(left.label) ? 1 : 0;
      const rightScore = /redondeo/i.test(right.label) ? 1 : 0;
      return rightScore - leftScore;
    });

  for (const item of charges) {
    if (!(remaining > 0) || !(item.amount > 0)) {
      continue;
    }

    const reduction = Math.min(item.amount, remaining);
    const nextAmount = clampToZero(item.amount - reduction);
    setElementText(item.charge, 'MontoCargo', formatDecimal(nextAmount));

    applied = roundTo(applied + reduction);
    remaining = roundTo(remaining - reduction);
    changedLabels.push(`${item.label}: -${reduction.toFixed(2)}`);
  }

  return { applied, remaining, changedLabels };
}

function inferSummaryFields(
  summary: Element,
  line: Element
): { categoryField?: string; aggregateField: string } {
  const hasTaxes = parseTaxes(line).some((tax) => tax.amount > 0);

  if (hasTaxes) {
    const services = parseAmount(getElementText(summary, 'TotalServGravados'));
    const goods = parseAmount(getElementText(summary, 'TotalMercanciasGravadas'));

    if (services > 0 && goods <= 0) {
      return { categoryField: 'TotalServGravados', aggregateField: 'TotalGravado' };
    }

    if (goods > 0 && services <= 0) {
      return { categoryField: 'TotalMercanciasGravadas', aggregateField: 'TotalGravado' };
    }

    return { aggregateField: 'TotalGravado' };
  } else {
    const serviceExempt = parseAmount(getElementText(summary, 'TotalServExentos'));
    const goodsExempt = parseAmount(getElementText(summary, 'TotalMercanciasExentas'));
    const totalNoSujeto = parseAmount(getElementText(summary, 'TotalNoSujeto'));
    const totalExonerado = parseAmount(getElementText(summary, 'TotalExonerado'));

    if (serviceExempt > 0 && goodsExempt <= 0) {
      return { categoryField: 'TotalServExentos', aggregateField: 'TotalExento' };
    }

    if (goodsExempt > 0 && serviceExempt <= 0) {
      return { categoryField: 'TotalMercanciasExentas', aggregateField: 'TotalExento' };
    }

    if (totalNoSujeto > 0) {
      return { aggregateField: 'TotalNoSujeto' };
    }

    if (totalExonerado > 0) {
      return { aggregateField: 'TotalExonerado' };
    }
  }

  return { aggregateField: 'TotalExento' };
}

function adjustLineTotals(line: Element, amountToReduce: number, summary: Element): LineAdjustment {
  const quantity = parseAmount(getElementText(line, 'Cantidad'), 1) || 1;
  const montoTotal = parseAmount(getElementText(line, 'MontoTotal'));
  const subTotal = parseAmount(getElementText(line, 'SubTotal')) || montoTotal;
  const totalLinea = parseAmount(getElementText(line, 'MontoTotalLinea'));
  const taxes = parseTaxes(line);
  const taxTotal = taxes.reduce((accumulator, tax) => roundTo(accumulator + tax.amount), 0);

  if (!(totalLinea > amountToReduce)) {
    throw new Error('No hay una línea con monto suficiente para aplicar el ajuste.');
  }

  const discountAmount = Math.max(0, roundTo(montoTotal - subTotal));
  const nextTotalLinea = roundTo(totalLinea - amountToReduce);
  const ratio = subTotal > 0 ? taxTotal / subTotal : 0;
  const nextSubTotal = ratio > 0 ? roundTo(nextTotalLinea / (1 + ratio)) : nextTotalLinea;
  const nextTaxTotal = roundTo(nextTotalLinea - nextSubTotal);
  const nextMontoTotal = roundTo(nextSubTotal + discountAmount);
  const nextUnitPrice = roundTo(nextMontoTotal / quantity);

  setElementText(line, 'PrecioUnitario', formatDecimal(nextUnitPrice));
  setElementText(line, 'MontoTotal', formatDecimal(nextMontoTotal));
  setElementText(line, 'SubTotal', formatDecimal(nextSubTotal));

  if (getChildElement(line, 'BaseImponible')) {
    setElementText(line, 'BaseImponible', formatDecimal(nextSubTotal));
  }

  if (taxes.length > 0 && taxTotal > 0) {
    let assignedTax = 0;

    taxes.forEach((tax, index) => {
      const proportion = tax.amount / taxTotal;
      const nextAmount =
        index === taxes.length - 1
          ? roundTo(nextTaxTotal - assignedTax)
          : roundTo(nextTaxTotal * proportion);

      setElementText(tax.element, 'Monto', formatDecimal(nextAmount));
      assignedTax = roundTo(assignedTax + nextAmount);
    });

    if (getChildElement(line, 'ImpuestoNeto')) {
      setElementText(line, 'ImpuestoNeto', formatDecimal(nextTaxTotal));
    }
  }

  setElementText(line, 'MontoTotalLinea', formatDecimal(nextTotalLinea));
  const summaryFields = inferSummaryFields(summary, line);

  return {
    applied: amountToReduce,
    remaining: 0,
    changedLabel: `${getElementText(line, 'Detalle') || 'Línea de detalle'}: -${amountToReduce.toFixed(2)}`,
    baseDelta: roundTo(subTotal - nextSubTotal),
    taxDelta: roundTo(taxTotal - nextTaxTotal),
    categoryField: summaryFields.categoryField,
    aggregateField: summaryFields.aggregateField,
  };
}

function applySummaryMutation(summary: Element, mutation: SummaryMutation): void {
  const adjustField = (field: string, delta: number) => {
    const current = parseAmount(getElementText(summary, field));
    if (current > 0 || delta !== 0 || getChildElement(summary, field)) {
      setElementText(summary, field, formatDecimal(clampToZero(current - delta)));
    }
  };

  adjustField('TotalOtrosCargos', mutation.otherChargesDelta);
  adjustField('TotalImpuesto', mutation.taxDelta);
  adjustField('TotalComprobante', mutation.totalDelta);
  adjustField('TotalVenta', mutation.baseDelta);
  adjustField('TotalVentaNeta', mutation.baseDelta);
  adjustField(mutation.aggregateField, mutation.baseDelta);

  if (mutation.categoryField) {
    adjustField(mutation.categoryField, mutation.baseDelta);
  }
}

function rebuildTaxBreakdown(summary: Element, documentElement: Element): void {
  const currentBreakdown = getChildElements(summary, 'TotalDesgloseImpuesto');
  currentBreakdown.forEach((item) => item.remove());

  const grouped = new Map<string, { codigo: string; tarifa: string; amount: number }>();

  findElementsByLocalName(documentElement, 'Impuesto').forEach((taxElement) => {
    const codigo = getElementText(taxElement, 'Codigo') || 'N/D';
    const tarifa = getElementText(taxElement, 'CodigoTarifaIVA') || getElementText(taxElement, 'CodigoTarifa') || '';
    const amount = parseAmount(getElementText(taxElement, 'Monto'));

    if (!(amount > 0)) {
      return;
    }

    const key = `${codigo}:${tarifa}`;
    const current = grouped.get(key);

    grouped.set(key, {
      codigo,
      tarifa,
      amount: roundTo((current?.amount ?? 0) + amount),
    });
  });

  const totalImpuestoElement = getChildElement(summary, 'TotalImpuesto');

  grouped.forEach((item) => {
    const breakdown = summary.ownerDocument.createElementNS(summary.namespaceURI, 'TotalDesgloseImpuesto');
    setElementText(breakdown, 'Codigo', item.codigo);
    if (item.tarifa) {
      setElementText(breakdown, 'CodigoTarifaIVA', item.tarifa);
    }
    setElementText(breakdown, 'TotalMontoImpuesto', formatDecimal(item.amount));

    if (totalImpuestoElement) {
      summary.insertBefore(breakdown, totalImpuestoElement);
    } else {
      summary.appendChild(breakdown);
    }
  });
}

function updatePaymentTotals(summary: Element): void {
  const totalComprobante = parseAmount(getElementText(summary, 'TotalComprobante'));
  const paymentTotals = findElementsByLocalName(summary, 'TotalMedioPago');

  if (paymentTotals.length === 1) {
    paymentTotals[0].textContent = formatDecimal(totalComprobante);
    return;
  }

  if (paymentTotals.length > 1) {
    const currentValues = paymentTotals.map((item) => parseAmount(item.textContent));
    const sum = currentValues.reduce((accumulator, item) => roundTo(accumulator + item), 0);
    const delta = roundTo(sum - totalComprobante);
    const last = paymentTotals[paymentTotals.length - 1];
    const currentLast = parseAmount(last.textContent);
    last.textContent = formatDecimal(clampToZero(currentLast - delta));
  }
}

function buildFileBaseName(fileName?: string): string {
  const cleanName = (fileName || 'nota_credito')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return `${cleanName || 'nota_credito'}_corregida`;
}

function buildMdgWrapperChange(note: RejectedCreditNoteData): string | null {
  if (note.source !== 'xml') {
    return null;
  }

  return 'Se generó automáticamente el JSON requerido por MDG a partir del XML de la nota.';
}

function tryBuildCorrection(
  original: OriginalDocumentData,
  note: RejectedCreditNoteData,
  targetBuffer: number,
  reissueSettings: ReissueSettings
): CorrectionResult {
  const xmlDocument = parseXmlDocument(note.rawXml);
  const documentElement = findElementsByLocalName(xmlDocument, 'NotaCreditoElectronica')[0] ?? xmlDocument.documentElement;
  const summary = getChildElement(documentElement, 'ResumenFactura');

  if (!summary) {
    throw new Error('La nota de crédito no contiene ResumenFactura.');
  }

  const targetTotal = roundTo(original.totals.totalComprobante - targetBuffer);
  const currentTotal = parseAmount(getElementText(summary, 'TotalComprobante'));
  const regeneratedIdentity = regenerateDocumentIdentity(documentElement, reissueSettings);

  if (!(currentTotal > targetTotal)) {
    const signatureRemoved = removeExistingSignatures(xmlDocument);
    const correctedXml = serializeXmlDocument(xmlDocument);
    const correctedPayload = setNestedValue(note.rawJson, note.xmlFieldPath, correctedXml);
    const changedFields = [
      buildMdgWrapperChange(note),
      `Nueva fecha de emisión: ${regeneratedIdentity.fechaEmision}`,
      `Nuevo consecutivo: ${regeneratedIdentity.consecutivo}`,
      `Nueva clave: ${regeneratedIdentity.clave}`,
    ].filter(Boolean) as string[];

    return {
      correctedPayload,
      correctedJsonText: JSON.stringify(correctedPayload, null, 2),
      correctedXmlText: correctedXml,
      fileBaseName: buildFileBaseName(note.fileName),
      totalCorregido: currentTotal,
      adjustmentApplied: 0,
      targetBuffer,
      adjustmentDescription: 'La nota ya estaba dentro del rango permitido y no requirió cambios.',
      changedFields,
      signatureRemoved,
      usedTerminal: reissueSettings.terminal,
      regeneratedKey: regeneratedIdentity.clave,
      regeneratedConsecutive: regeneratedIdentity.consecutivo,
      regeneratedFechaEmision: regeneratedIdentity.fechaEmision,
      status: 'unchanged',
    };
  }

  const requiredReduction = roundTo(currentTotal - targetTotal);
  const otherChargeAdjustment = reduceOtherCharges(documentElement, requiredReduction);
  let remaining = otherChargeAdjustment.remaining;
  let lineAdjustment: LineAdjustment | null = null;

  if (remaining > 0) {
    const detailService = getChildElement(documentElement, 'DetalleServicio');
    const lines = detailService ? getChildElements(detailService, 'LineaDetalle') : [];

    const targetLine = [...lines]
      .reverse()
      .find((line) => parseAmount(getElementText(line, 'MontoTotalLinea')) > remaining);

    if (!targetLine) {
      throw new Error('No se encontró una línea apta para absorber el ajuste.');
    }

    lineAdjustment = adjustLineTotals(targetLine, remaining, summary);
    remaining = lineAdjustment.remaining;
  }

  if (remaining > 0) {
    throw new Error('No fue posible aplicar todo el ajuste requerido.');
  }

  applySummaryMutation(summary, {
    baseDelta: lineAdjustment?.baseDelta ?? 0,
    taxDelta: lineAdjustment?.taxDelta ?? 0,
    otherChargesDelta: otherChargeAdjustment.applied,
    totalDelta: requiredReduction,
    categoryField: lineAdjustment?.categoryField,
    aggregateField: lineAdjustment?.aggregateField ?? 'TotalGravado',
  });
  rebuildTaxBreakdown(summary, documentElement);
  updatePaymentTotals(summary);

  const signatureRemoved = removeExistingSignatures(xmlDocument);
  const correctedXml = serializeXmlDocument(xmlDocument);
  const correctedPayload = setNestedValue(note.rawJson, note.xmlFieldPath, correctedXml);
  const correctedTotal = parseAmount(getElementText(summary, 'TotalComprobante'));
  const changedFields = [
    buildMdgWrapperChange(note),
    `Nueva fecha de emisión: ${regeneratedIdentity.fechaEmision}`,
    `Nuevo consecutivo: ${regeneratedIdentity.consecutivo}`,
    `Nueva clave: ${regeneratedIdentity.clave}`,
    ...otherChargeAdjustment.changedLabels,
  ].filter(Boolean) as string[];

  if (lineAdjustment?.changedLabel) {
    changedFields.push(lineAdjustment.changedLabel);
  }

  if (signatureRemoved) {
    changedFields.push('Se eliminó la firma XML previa porque deja de ser válida tras modificar montos.');
  }

  return {
    correctedPayload,
    correctedJsonText: JSON.stringify(correctedPayload, null, 2),
    correctedXmlText: correctedXml,
    fileBaseName: buildFileBaseName(note.fileName),
    totalCorregido: correctedTotal,
    adjustmentApplied: requiredReduction,
    targetBuffer,
    adjustmentDescription:
      changedFields.length > 0
        ? `Se redujo la nota en ₡${requiredReduction.toFixed(2)} para dejarla ₡${targetBuffer.toFixed(2)} por debajo del documento original.`
        : 'No se detectaron cambios para aplicar.',
    changedFields,
    signatureRemoved,
    usedTerminal: reissueSettings.terminal,
    regeneratedKey: regeneratedIdentity.clave,
    regeneratedConsecutive: regeneratedIdentity.consecutivo,
    regeneratedFechaEmision: regeneratedIdentity.fechaEmision,
    status: requiredReduction > 0 ? 'adjusted' : 'unchanged',
  };
}

export function generateCorrectedCreditNote(
  original: OriginalDocumentData,
  note: RejectedCreditNoteData,
  reissueSettings: ReissueSettings
): CorrectionResult {
  const analysis = compareCreditNoteTotals(original, note);

  if (!analysis.requiresAdjustment) {
    return tryBuildCorrection(original, note, 0, reissueSettings);
  }

  let lastError: Error | null = null;

  for (const buffer of TARGET_BUFFERS) {
    try {
      const result = tryBuildCorrection(original, note, buffer, reissueSettings);
      if (result.totalCorregido < original.totals.totalComprobante) {
        return result;
      }
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError ?? new Error('No fue posible generar la corrección de la nota.');
}
