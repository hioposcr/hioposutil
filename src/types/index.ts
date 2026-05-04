export type AppState =
  | 'idle'
  | 'files_loaded'
  | 'analyzing'
  | 'analyzed'
  | 'recalculating'
  | 'recalculated'
  | 'generating'
  | 'completed'
  | 'sending'
  | 'sent';

export type AppModule = 'single' | 'bulk';

export type FileStatus = 'idle' | 'loading' | 'success' | 'error';
export type FileType = 'xml' | 'json' | 'note';

export interface UploadedFile {
  name: string;
  size: string;
  status: FileStatus;
  type: FileType;
  errorMessage?: string;
}

export interface DocumentSummary {
  tipoDocumento: string;
  clave: string;
  consecutivo: string;
  fechaEmision: string;
  emisor: string;
  receptor: string;
  totalServGravados: string;
  totalMercanciasGravadas: string;
  totalImpuesto: string;
  totalOtrosCargos: string;
  totalComprobante: string;
  moneda: string;
  sourceLabel?: string;
  subtitle?: string;
}

export interface CreditNoteSummary {
  clave: string;
  fechaEmision: string;
  totalActual: string;
  estadoRechazo: string;
  motivoRechazo: string;
  diferencia: string;
  documentoReferencia: string;
  tipoReferencia: string;
  sourceLabel?: string;
}

export interface ComparisonResult {
  totalOriginal: string;
  totalRechazado: string;
  diferencia: string;
  differenceDirection: 'up' | 'down' | 'same';
  totalCorregido: string;
  ajusteAplicado: string;
  porcentajeDiferencia: string;
  statusMessage: string;
  severity: 'neutral' | 'warning' | 'success';
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface TaxBreakdown {
  codigo: string;
  codigoTarifa: string;
  monto: number;
}

export interface OtherChargeSummary {
  detalle: string;
  monto: number;
}

export interface FiscalParty {
  nombre: string;
  identificacion: string;
  displayName: string;
}

export interface FiscalTotals {
  totalServGravados: number;
  totalMercanciasGravadas: number;
  totalImpuesto: number;
  totalOtrosCargos: number;
  totalComprobante: number;
}

export interface FiscalDocumentBase {
  tipoDocumento: string;
  tipoDocumentoCodigo: string;
  rootTag: string;
  clave: string;
  numeroConsecutivo: string;
  fechaEmision: string;
  emisor: FiscalParty;
  receptor: FiscalParty;
  moneda: string;
  totals: FiscalTotals;
  impuestos: TaxBreakdown[];
  otrosCargos: OtherChargeSummary[];
}

export interface OriginalDocumentData extends FiscalDocumentBase {
  source: 'xml' | 'manual';
  fileName?: string;
  rawXml?: string;
}

export interface NoteReference {
  tipoDoc: string;
  numero: string;
  fechaEmision: string;
  codigo: string;
  razon: string;
}

export interface MdgEnvelope {
  configuracionOpcionesAdicionales: JsonObject;
  correosElectronicosAdicionales: JsonObject;
  adjuntos: JsonValue[];
  documentoElectronico: string;
  emisionComprobanteElectronicoRequest: JsonObject;
  ejecucionInternaClienteId: string;
  generacionPdfComprobante: JsonObject;
  tipoSerializacion: number;
  xmlns: string;
  [key: string]: JsonValue;
}

export interface RejectedCreditNoteData extends FiscalDocumentBase {
  fileName?: string;
  source: 'json' | 'xml';
  rawJson: JsonValue;
  rawXml: string;
  xmlFieldPath: Array<string | number>;
  estadoRechazo: string;
  motivoRechazo: string;
  referencia: NoteReference | null;
  mdgEnvelope: MdgEnvelope;
}

export interface ComparisonAnalysis {
  originalTotal: number;
  rejectedTotal: number;
  difference: number;
  absoluteDifference: number;
  percentageDifference: number;
  exceedsOriginal: boolean;
  requiresAdjustment: boolean;
  safeForAutomaticAdjustment: boolean;
  recommendedBuffer: number;
  targetTotal: number;
  expectedCorrectedTotal: number;
  summaryMessage: string;
}

export interface CorrectionResult {
  correctedPayload: JsonValue;
  correctedJsonText: string;
  correctedXmlText: string;
  fileBaseName: string;
  totalCorregido: number;
  adjustmentApplied: number;
  targetBuffer: number;
  adjustmentDescription: string;
  changedFields: string[];
  signatureRemoved: boolean;
  usedTerminal: string;
  regeneratedKey: string;
  regeneratedConsecutive: string;
  regeneratedFechaEmision: string;
  status: 'unchanged' | 'adjusted';
}

export interface ManualDocumentForm {
  tipoDocumentoCodigo: string;
  moneda: string;
  montoOriginal: string;
  fechaEmision: string;
  clave: string;
}

export interface ManualDocumentErrors {
  tipoDocumentoCodigo?: string;
  moneda?: string;
  montoOriginal?: string;
  fechaEmision?: string;
  clave?: string;
}

export interface ReissueSettings {
  terminal: string;
}

export interface ReissueSettingsErrors {
  terminal?: string;
}

export interface BulkResendSettings {
  terminal: string;
  startingSequence: string;
  regenerateSecurityCode: boolean;
  delayMs: string;
}

export interface BulkResendSettingsErrors {
  terminal?: string;
  startingSequence?: string;
  delayMs?: string;
}

export interface BulkSourceDocumentItem {
  id: string;
  fileName: string;
  fileSizeLabel: string;
  document: OriginalDocumentData;
}

export interface BulkUploadIssue {
  id: string;
  fileName: string;
  fileSizeLabel: string;
  message: string;
}

export type BulkQueueStatus = 'ready' | 'processing' | 'success' | 'error';

export interface BulkPreparedDocument {
  id: string;
  fileName: string;
  fileSizeLabel: string;
  documentType: string;
  originalConsecutive: string;
  originalKey: string;
  regeneratedConsecutive: string;
  regeneratedKey: string;
  regeneratedFechaEmision: string;
  sequenceNumber: number;
  totalComprobante: number;
  xmlText: string;
  payload: JsonValue;
  status: BulkQueueStatus;
  executionId?: number;
  responseKey?: string;
  errorMessage?: string;
}

export type MdgEnvironment = 'test' | 'prod';

export interface MdgSettings {
  environment: MdgEnvironment;
  tenantId: string;
  password: string;
}

export interface MdgEndpoints {
  functionUrl: string;
  label: string;
}

export interface MdgSettingsErrors {
  tenantId?: string;
  password?: string;
}

export interface MdgTokenMeta {
  token_type: string;
  expires_in: number;
  expires_on: string;
}

export interface MdgSubmissionResponse {
  ejecucionId?: number;
  ejecucionInternaClienteId?: string;
  requestKey?: string | null;
  clave?: string;
  consecutivo?: string;
  xmlns?: string;
  tipoComprobanteDocumentoElectronicoEnum?: number;
  [key: string]: JsonValue | undefined;
}

export interface MdgSubmissionSuccess {
  environment: MdgEnvironment;
  endpoints: MdgEndpoints;
  token: MdgTokenMeta;
  response: MdgSubmissionResponse;
  submittedAt: string;
}

export interface MdgBatchSubmissionItem {
  id: string;
  success: boolean;
  response?: MdgSubmissionResponse;
  error?: MdgSubmissionError;
}

export interface MdgBatchSubmissionSuccess {
  environment: MdgEnvironment;
  endpoints: MdgEndpoints;
  token: MdgTokenMeta;
  results: MdgBatchSubmissionItem[];
  submittedAt: string;
}

export interface MdgSubmissionError {
  environment: MdgEnvironment;
  endpoint: string;
  source: 'config' | 'function' | 'token' | 'emision' | 'network';
  status: number | null;
  message: string;
  rawBody?: string;
}
