import type {
  ComparisonAnalysis,
  ComparisonResult,
  CorrectionResult,
  CreditNoteSummary,
  DocumentSummary,
  OriginalDocumentData,
  RejectedCreditNoteData,
} from '../types';
import { describeReferenceType } from '../utils/documentTypes';
import { formatCurrency, formatPercentage } from '../utils/number';

export function toDocumentSummary(document: OriginalDocumentData): DocumentSummary {
  return {
    tipoDocumento: document.tipoDocumento,
    clave: document.clave,
    consecutivo: document.numeroConsecutivo,
    fechaEmision: document.fechaEmision,
    emisor: document.emisor.displayName,
    receptor: document.receptor.displayName,
    totalServGravados: formatCurrency(document.totals.totalServGravados, document.moneda),
    totalMercanciasGravadas: formatCurrency(document.totals.totalMercanciasGravadas, document.moneda),
    totalImpuesto: formatCurrency(document.totals.totalImpuesto, document.moneda),
    totalOtrosCargos: formatCurrency(document.totals.totalOtrosCargos, document.moneda),
    totalComprobante: formatCurrency(document.totals.totalComprobante, document.moneda),
    moneda: document.moneda,
    sourceLabel: document.source === 'manual' ? 'Manual' : 'Aceptado',
    subtitle:
      document.source === 'manual'
        ? 'Referencia ingresada manualmente'
        : 'Documento fiscal usado como base',
  };
}

export function toCreditNoteSummary(
  note: RejectedCreditNoteData,
  analysis: ComparisonAnalysis | null
): CreditNoteSummary {
  const rawDifference = analysis ? analysis.difference : 0;
  const differenceLabel = analysis
    ? formatCurrency(Math.abs(rawDifference), note.moneda)
    : 'Pendiente de análisis';

  return {
    clave: note.clave,
    fechaEmision: note.fechaEmision,
    totalActual: formatCurrency(note.totals.totalComprobante, note.moneda),
    estadoRechazo: note.estadoRechazo,
    motivoRechazo: note.motivoRechazo,
    diferencia: differenceLabel,
    documentoReferencia: note.referencia?.numero || 'No informado',
    tipoReferencia: describeReferenceType(note.referencia?.tipoDoc || ''),
    sourceLabel: note.source === 'xml' ? 'XML directo' : 'JSON requerido',
  };
}

export function toComparisonResult(
  analysis: ComparisonAnalysis,
  correction: CorrectionResult | null,
  currency = 'CRC'
): ComparisonResult {
  const correctedTotal = correction?.totalCorregido ?? analysis.expectedCorrectedTotal;
  const severity = correction
    ? 'success'
    : analysis.exceedsOriginal
    ? 'warning'
    : 'neutral';

  return {
    totalOriginal: formatCurrency(analysis.originalTotal, currency),
    totalRechazado: formatCurrency(analysis.rejectedTotal, currency),
    diferencia: formatCurrency(Math.abs(analysis.difference), currency),
    differenceDirection:
      analysis.difference > 0 ? 'up' : analysis.difference < 0 ? 'down' : 'same',
    totalCorregido: formatCurrency(correctedTotal, currency),
    ajusteAplicado: correction
      ? correction.adjustmentDescription
      : analysis.requiresAdjustment
      ? `Reducir hasta ${formatCurrency(analysis.targetTotal, currency)}`
      : 'No aplica',
    porcentajeDiferencia: formatPercentage(analysis.percentageDifference),
    statusMessage: correction
      ? `Corrección preparada${correction.signatureRemoved ? ' y firma anterior removida' : ''}.`
      : analysis.summaryMessage,
    severity,
  };
}
