import type { ManualDocumentErrors, ManualDocumentForm, OriginalDocumentData } from '../types';
import { extractConsecutiveFromKey, getDocumentTypeLabelFromCode } from '../utils/documentTypes';
import { parseAmount } from '../utils/number';

export function validateManualDocument(form: ManualDocumentForm): ManualDocumentErrors {
  const errors: ManualDocumentErrors = {};
  const amount = parseAmount(form.montoOriginal);

  if (!form.tipoDocumentoCodigo) {
    errors.tipoDocumentoCodigo = 'Selecciona el tipo de documento.';
  }

  if (!form.moneda) {
    errors.moneda = 'Selecciona la moneda.';
  }

  if (!(amount > 0)) {
    errors.montoOriginal = 'Ingresa un monto original válido.';
  }

  if (!form.fechaEmision) {
    errors.fechaEmision = 'Ingresa la fecha de emisión.';
  }

  if (form.clave.trim() && form.clave.trim().replace(/\D/g, '').length !== 50) {
    errors.clave = 'La clave debe tener 50 dígitos si se completa manualmente.';
  }

  return errors;
}

export function parseManualOriginalDocument(form: ManualDocumentForm): OriginalDocumentData {
  const errors = validateManualDocument(form);

  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0] ?? 'Datos manuales incompletos.');
  }

  const totalComprobante = parseAmount(form.montoOriginal);
  const clave = form.clave.trim();

  return {
    source: 'manual',
    rootTag: 'Manual',
    tipoDocumento: getDocumentTypeLabelFromCode(form.tipoDocumentoCodigo),
    tipoDocumentoCodigo: form.tipoDocumentoCodigo,
    clave: clave || 'No suministrada',
    numeroConsecutivo: clave ? extractConsecutiveFromKey(clave) || 'No disponible' : 'No disponible',
    fechaEmision: form.fechaEmision,
    emisor: {
      nombre: 'No disponible',
      identificacion: '',
      displayName: 'Fuente manual',
    },
    receptor: {
      nombre: 'No disponible',
      identificacion: '',
      displayName: 'No disponible',
    },
    moneda: form.moneda,
    totals: {
      totalServGravados: 0,
      totalMercanciasGravadas: 0,
      totalImpuesto: 0,
      totalOtrosCargos: 0,
      totalComprobante,
    },
    impuestos: [],
    otrosCargos: [],
  };
}
