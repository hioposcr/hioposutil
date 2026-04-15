const DOCUMENT_TYPE_METADATA: Record<string, { label: string; code: string }> = {
  FacturaElectronica: { label: 'Factura Electrónica', code: '01' },
  NotaDebitoElectronica: { label: 'Nota de Débito', code: '02' },
  NotaCreditoElectronica: { label: 'Nota de Crédito', code: '03' },
  TiqueteElectronico: { label: 'Tiquete Electrónico', code: '04' },
  FacturaElectronicaExportacion: { label: 'Factura Electrónica de Exportación', code: '08' },
  FacturaElectronicaCompra: { label: 'Factura Electrónica de Compra', code: '08' },
  ComprobanteElectronico: { label: 'Comprobante Electrónico', code: '00' },
};

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  '01': '01 — Anula documento de referencia',
  '02': '02 — Corrige texto del documento de referencia',
  '03': '03 — Corrige monto',
  '04': '04 — Referencia a otro documento',
  '05': '05 — Sustituye comprobante provisional',
  '99': '99 — Otro',
};

const TYPE_BY_CODE: Record<string, string> = Object.values(DOCUMENT_TYPE_METADATA).reduce(
  (accumulator, item) => {
    accumulator[item.code] = item.label;
    return accumulator;
  },
  {} as Record<string, string>
);

export function getDocumentTypeLabel(rootTag: string): string {
  return DOCUMENT_TYPE_METADATA[rootTag]?.label ?? rootTag;
}

export function getDocumentTypeCode(rootTag: string): string {
  return DOCUMENT_TYPE_METADATA[rootTag]?.code ?? '00';
}

export function getDocumentTypeLabelFromCode(code: string): string {
  return TYPE_BY_CODE[code] ?? code;
}

export function describeReferenceType(code: string): string {
  return REFERENCE_TYPE_LABELS[code] ?? (code ? `${code} — Tipo no mapeado` : 'No informado');
}

export function extractConsecutiveFromKey(clave: string): string {
  const digits = clave.replace(/\D/g, '');

  if (digits.length >= 42) {
    return digits.slice(21, 41);
  }

  return '';
}
