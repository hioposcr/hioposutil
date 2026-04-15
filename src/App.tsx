import { startTransition, useEffect, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import FileUploadZone from './components/FileUploadZone';
import ManualInputPanel from './components/ManualInputPanel';
import ReissueSettingsPanel from './components/ReissueSettingsPanel';
import MdgConfigPanel from './components/MdgConfigPanel';
import MdgSubmissionPanel from './components/MdgSubmissionPanel';
import LoginDialog from './components/LoginDialog';
import SessionWarningDialog from './components/SessionWarningDialog';
import DocumentSummaryCard from './components/DocumentSummaryCard';
import CreditNoteSummaryCard from './components/CreditNoteSummaryCard';
import ComparisonPanel from './components/ComparisonPanel';
import ActionButtons from './components/ActionButtons';
import ResultPanel from './components/ResultPanel';
import WarningsCard from './components/WarningsCard';
import { parseOriginalDocumentXml } from './parsers/xmlParser';
import { parseRejectedNoteInput } from './parsers/noteJsonParser';
import {
  parseManualOriginalDocument,
  validateManualDocument,
} from './parsers/manualDocumentParser';
import { compareCreditNoteTotals, generateCorrectedCreditNote } from './services/creditNoteAdjuster';
import { exportCorrectionFiles, exportJsonOnly, exportXmlOnly } from './services/exportService';
import { getMdgEndpoints, MdgApiError, sendDocumentToMdg } from './services/mdgApiService';
import {
  toComparisonResult,
  toCreditNoteSummary,
  toDocumentSummary,
} from './services/presentationMapper';
import { formatFileSize, readFileAsText, validateFileType } from './utils/fileReaders';
import {
  extractTerminalFromConsecutive,
  suggestNextTerminal,
} from './utils/consecutive';
import {
  clearAuthSession,
  createAuthSession,
  extendAuthSession,
  formatRemainingTime,
  getSessionRemainingMs,
  getStoredAuthSession,
  persistAuthSession,
  shouldWarnAboutSessionExpiry,
  type AuthSession,
} from './utils/authSession';
import { formatCurrency } from './utils/number';
import type {
  AppState,
  ComparisonAnalysis,
  CorrectionResult,
  FileType,
  ManualDocumentErrors,
  ManualDocumentForm,
  MdgSettings,
  MdgSettingsErrors,
  MdgSubmissionError,
  MdgSubmissionSuccess,
  OriginalDocumentData,
  RejectedCreditNoteData,
  ReissueSettings,
  ReissueSettingsErrors,
  UploadedFile,
} from './types';

const INITIAL_MANUAL_FORM: ManualDocumentForm = {
  tipoDocumentoCodigo: '01',
  moneda: 'CRC',
  montoOriginal: '',
  fechaEmision: '',
  clave: '',
};

const INITIAL_REISSUE_SETTINGS: ReissueSettings = {
  terminal: '',
};

const INITIAL_MDG_SETTINGS: MdgSettings = {
  environment: 'test',
  tenantId: '',
  password: '',
};

const INITIAL_LOGIN_FORM = {
  username: '',
  password: '',
};

const INTERNAL_SUPPORT_USERNAME = 'soporte';
const INTERNAL_SUPPORT_PASSWORD = '1965';
const SESSION_ACTIVITY_SYNC_MS = 30 * 1000;
const NEXT_CASE_RESET_DELAY_MS = 2200;

function buildUploadState(
  file: File,
  type: FileType,
  status: UploadedFile['status'],
  errorMessage?: string
): UploadedFile {
  return {
    name: file.name,
    size: formatFileSize(file.size),
    status,
    type,
    errorMessage,
  };
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [xmlFile, setXmlFile] = useState<UploadedFile | null>(null);
  const [noteFile, setNoteFile] = useState<UploadedFile | null>(null);
  const [xmlOriginalDocument, setXmlOriginalDocument] = useState<OriginalDocumentData | null>(null);
  const [manualOriginalDocument, setManualOriginalDocument] = useState<OriginalDocumentData | null>(null);
  const [rejectedNote, setRejectedNote] = useState<RejectedCreditNoteData | null>(null);
  const [comparisonAnalysis, setComparisonAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [correctionDraft, setCorrectionDraft] = useState<CorrectionResult | null>(null);
  const [generatedResult, setGeneratedResult] = useState<CorrectionResult | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualForm, setManualForm] = useState<ManualDocumentForm>(INITIAL_MANUAL_FORM);
  const [manualErrors, setManualErrors] = useState<ManualDocumentErrors>({});
  const [reissueSettings, setReissueSettings] = useState<ReissueSettings>(INITIAL_REISSUE_SETTINGS);
  const [reissueErrors, setReissueErrors] = useState<ReissueSettingsErrors>({});
  const [mdgSettings, setMdgSettings] = useState<MdgSettings>(INITIAL_MDG_SETTINGS);
  const [mdgErrors, setMdgErrors] = useState<MdgSettingsErrors>({});
  const [mdgSubmission, setMdgSubmission] = useState<MdgSubmissionSuccess | null>(null);
  const [mdgSubmissionError, setMdgSubmissionError] = useState<MdgSubmissionError | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(() =>
    typeof window === 'undefined' ? null : getStoredAuthSession()
  );
  const [loginForm, setLoginForm] = useState(INITIAL_LOGIN_FORM);
  const [loginError, setLoginError] = useState('');
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionRemainingMs, setSessionRemainingMs] = useState(0);
  const lastSessionSyncRef = useRef(0);
  const resetNextCaseTimerRef = useRef<number | null>(null);
  const authSessionRef = useRef<AuthSession | null>(authSession);
  const logoutUserRef = useRef<((reason?: 'manual' | 'expired') => void) | null>(null);
  const warningOpenRef = useRef(false);

  const activeOriginalDocument = manualMode ? manualOriginalDocument : xmlOriginalDocument;
  const allInputsReady = Boolean(activeOriginalDocument && rejectedNote);
  const showSummaries = allInputsReady;
  const showComparison = Boolean(comparisonAnalysis);
  const showResult = Boolean(generatedResult);
  const isAuthenticated = Boolean(authSession);
  const mdgEndpoints = getMdgEndpoints(mdgSettings.environment);
  const currentNoteTerminal = rejectedNote
    ? extractTerminalFromConsecutive(rejectedNote.numeroConsecutivo)
    : '';
  const suggestedTerminal = rejectedNote
    ? suggestNextTerminal(rejectedNote.numeroConsecutivo)
    : '';

  const resetCaseState = (options?: { preserveEnvironment?: boolean }) => {
    if (resetNextCaseTimerRef.current) {
      window.clearTimeout(resetNextCaseTimerRef.current);
      resetNextCaseTimerRef.current = null;
    }

    const nextMdgSettings = options?.preserveEnvironment
      ? {
          ...INITIAL_MDG_SETTINGS,
          environment: mdgSettings.environment,
        }
      : INITIAL_MDG_SETTINGS;

    startTransition(() => {
      setAppState('idle');
      setXmlFile(null);
      setNoteFile(null);
      setXmlOriginalDocument(null);
      setManualOriginalDocument(null);
      setRejectedNote(null);
      setComparisonAnalysis(null);
      setCorrectionDraft(null);
      setGeneratedResult(null);
      setManualMode(false);
      setManualForm(INITIAL_MANUAL_FORM);
      setManualErrors({});
      setReissueSettings(INITIAL_REISSUE_SETTINGS);
      setReissueErrors({});
      setMdgSettings(nextMdgSettings);
      setMdgErrors({});
      setMdgSubmission(null);
      setMdgSubmissionError(null);
    });
  };

  const resetWorkflow = (nextState: AppState) => {
    startTransition(() => {
      setComparisonAnalysis(null);
      setCorrectionDraft(null);
      setGeneratedResult(null);
      setMdgSubmission(null);
      setMdgSubmissionError(null);
      setAppState(nextState);
    });
  };

  const logoutUser = (reason: 'manual' | 'expired' = 'manual') => {
    clearAuthSession();
    authSessionRef.current = null;
    warningOpenRef.current = false;
    lastSessionSyncRef.current = 0;
    setAuthSession(null);
    setShowSessionWarning(false);
    setSessionRemainingMs(0);
    setLoginError('');
    setLoginForm(INITIAL_LOGIN_FORM);
    resetCaseState();

    if (reason === 'expired') {
      toast.error('La sesión se cerró por inactividad.', {
        description: 'Vuelve a ingresar para continuar usando la herramienta.',
      });
      return;
    }

    toast.success('Sesión cerrada');
  };

  const touchSession = (force = false) => {
    const currentSession = authSessionRef.current;

    if (!currentSession) {
      return;
    }

    const now = Date.now();

    if (!force && now - lastSessionSyncRef.current < SESSION_ACTIVITY_SYNC_MS) {
      return;
    }

    const nextSession = extendAuthSession(currentSession, now);
    persistAuthSession(nextSession);
    authSessionRef.current = nextSession;
    warningOpenRef.current = false;
    lastSessionSyncRef.current = now;
    setAuthSession(nextSession);
    setShowSessionWarning(false);
    setSessionRemainingMs(getSessionRemainingMs(nextSession, now));
  };

  const handleLoginSubmit = () => {
    const normalizedUsername = loginForm.username.trim().toLowerCase();

    if (
      normalizedUsername !== INTERNAL_SUPPORT_USERNAME ||
      loginForm.password !== INTERNAL_SUPPORT_PASSWORD
    ) {
      setLoginError('Credenciales inválidas. Verifica el usuario y la contraseña.');
      return;
    }

    const nextSession = createAuthSession(INTERNAL_SUPPORT_USERNAME);
    persistAuthSession(nextSession);
    authSessionRef.current = nextSession;
    warningOpenRef.current = false;
    lastSessionSyncRef.current = Date.now();
    setAuthSession(nextSession);
    setShowSessionWarning(false);
    setSessionRemainingMs(getSessionRemainingMs(nextSession));
    setLoginError('');
    setLoginForm(INITIAL_LOGIN_FORM);

    toast.success('Sesión iniciada', {
      description: 'Acceso interno habilitado para soporte.',
    });
  };

  useEffect(() => {
    authSessionRef.current = authSession;
  }, [authSession]);

  useEffect(() => {
    logoutUserRef.current = logoutUser;
  });

  useEffect(() => {
    warningOpenRef.current = showSessionWarning;
  }, [showSessionWarning]);

  useEffect(() => {
    if (!authSession) {
      return undefined;
    }

    const syncSessionStatus = () => {
      const currentSession = authSessionRef.current;

      if (!currentSession) {
        return;
      }

      const remaining = getSessionRemainingMs(currentSession);
      setSessionRemainingMs(remaining);

      if (remaining <= 0) {
        logoutUserRef.current?.('expired');
        return;
      }

      setShowSessionWarning(shouldWarnAboutSessionExpiry(currentSession));
    };

    syncSessionStatus();
    const intervalId = window.setInterval(syncSessionStatus, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [authSession]);

  useEffect(() => {
    if (!authSession) {
      return undefined;
    }

    const handleActivity = () => {
      touchSession(warningOpenRef.current);
    };

    const listenerOptions: AddEventListenerOptions = { passive: true };

    window.addEventListener('pointerdown', handleActivity, listenerOptions);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity, listenerOptions);
    window.addEventListener('touchstart', handleActivity, listenerOptions);

    return () => {
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [authSession]);

  useEffect(() => {
    return () => {
      if (resetNextCaseTimerRef.current) {
        window.clearTimeout(resetNextCaseTimerRef.current);
      }
    };
  }, []);

  const syncManualDocument = (nextForm: ManualDocumentForm, nextManualMode = manualMode) => {
    const errors = validateManualDocument(nextForm);
    setManualErrors(errors);

    if (Object.keys(errors).length > 0) {
      setManualOriginalDocument(null);
      const nextReady = Boolean(rejectedNote && !nextManualMode && xmlOriginalDocument);
      resetWorkflow(nextReady ? 'files_loaded' : 'idle');
      return null;
    }

    const parsed = parseManualOriginalDocument(nextForm);
    setManualOriginalDocument(parsed);
    const activeOriginal = nextManualMode ? parsed : xmlOriginalDocument;
    const nextReady = Boolean(rejectedNote && activeOriginal);
    resetWorkflow(nextReady ? 'files_loaded' : 'idle');
    return parsed;
  };

  const validateReissueSettings = (
    settings: ReissueSettings,
    note: RejectedCreditNoteData | null
  ): ReissueSettingsErrors => {
    const errors: ReissueSettingsErrors = {};
    const terminal = settings.terminal.trim();

    if (!/^\d{5}$/.test(terminal)) {
      errors.terminal = 'La terminal debe tener exactamente 5 dígitos.';
      return errors;
    }

    const originalTerminal = note ? extractTerminalFromConsecutive(note.numeroConsecutivo) : '';

    if (originalTerminal && terminal === originalTerminal) {
      errors.terminal =
        'La nueva terminal debe ser distinta a la terminal actual para generar un consecutivo nuevo.';
    }

    return errors;
  };

  const syncReissueSettings = (
    nextSettings: ReissueSettings,
    note: RejectedCreditNoteData | null = rejectedNote
  ) => {
    setReissueSettings(nextSettings);
    const errors = validateReissueSettings(nextSettings, note);
    setReissueErrors(errors);

    startTransition(() => {
      setCorrectionDraft(null);
      setGeneratedResult(null);
      setMdgSubmission(null);
      setMdgSubmissionError(null);
      setAppState(comparisonAnalysis ? 'analyzed' : allInputsReady ? 'files_loaded' : 'idle');
    });
  };

  const syncMdgSettings = (nextSettings: MdgSettings) => {
    setMdgSettings(nextSettings);
    setMdgErrors(validateMdgSettings(nextSettings));
    setMdgSubmission(null);
    setMdgSubmissionError(null);

    if (appState === 'sent') {
      setAppState('completed');
    }
  };

  const validateMdgSettings = (settings: MdgSettings): MdgSettingsErrors => {
    const errors: MdgSettingsErrors = {};

    if (!/^\d+$/.test(settings.tenantId.trim())) {
      errors.tenantId = 'El tenant ID debe contener solo dígitos.';
    }

    if (!settings.password.trim()) {
      errors.password = 'La contraseña es obligatoria para solicitar el token.';
    }

    return errors;
  };

  const resolveOriginalDocument = (): OriginalDocumentData => {
    if (manualMode) {
      const errors = validateManualDocument(manualForm);
      setManualErrors(errors);

      if (Object.keys(errors).length > 0) {
        throw new Error(Object.values(errors)[0] ?? 'Completa los datos manuales del documento original.');
      }

      const parsed = parseManualOriginalDocument(manualForm);
      setManualOriginalDocument(parsed);
      return parsed;
    }

    if (!xmlOriginalDocument) {
      throw new Error('Carga un XML válido del documento original.');
    }

    return xmlOriginalDocument;
  };

  const handleOriginalXmlSelected = async (file: File) => {
    setXmlFile(buildUploadState(file, 'xml', 'loading'));
    const nextReadyWithoutXml = Boolean(rejectedNote && manualMode && manualOriginalDocument);
    resetWorkflow(nextReadyWithoutXml ? 'files_loaded' : 'idle');

    try {
      const fileTypeError = validateFileType(file, 'xml');
      if (fileTypeError) {
        throw new Error(fileTypeError);
      }

      const xmlText = await readFileAsText(file);
      const parsed = parseOriginalDocumentXml(xmlText, file.name);
      setXmlOriginalDocument(parsed);
      setXmlFile(buildUploadState(file, 'xml', 'success'));

      const nextReady = Boolean(rejectedNote && (manualMode ? manualOriginalDocument : parsed));
      resetWorkflow(nextReady ? 'files_loaded' : 'idle');

      toast.success('XML original cargado', {
        description: `${file.name} se procesó correctamente.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo procesar el XML del documento original.';
      setXmlOriginalDocument(null);
      setXmlFile(buildUploadState(file, 'xml', 'error', message));

      const nextReady = Boolean(rejectedNote && manualMode && manualOriginalDocument);
      resetWorkflow(nextReady ? 'files_loaded' : 'idle');

      toast.error('Error al procesar el XML original', {
        description: message,
      });
    }
  };

  const handleRejectedJsonSelected = async (file: File) => {
    setNoteFile(buildUploadState(file, 'note', 'loading'));
    resetWorkflow(allInputsReady ? 'files_loaded' : 'idle');

    try {
      const fileTypeError = validateFileType(file, 'note');
      if (fileTypeError) {
        throw new Error(fileTypeError);
      }

      const noteText = await readFileAsText(file);
      const parsed = parseRejectedNoteInput(noteText, file.name);
      setRejectedNote(parsed);
      setNoteFile(buildUploadState(file, 'note', 'success'));
      const suggested = suggestNextTerminal(parsed.numeroConsecutivo);
      setReissueSettings({ terminal: suggested });
      setReissueErrors(validateReissueSettings({ terminal: suggested }, parsed));

      const nextReady = Boolean((manualMode ? manualOriginalDocument : xmlOriginalDocument) && parsed);
      resetWorkflow(nextReady ? 'files_loaded' : 'idle');

      toast.success('Nota de crédito cargada', {
        description: `${file.name} se procesó correctamente.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo procesar el archivo de la nota de crédito.';
      setRejectedNote(null);
      setNoteFile(buildUploadState(file, 'note', 'error', message));
      resetWorkflow('idle');

      toast.error('Error al procesar la nota de crédito', {
        description: message,
      });
    }
  };

  const handleAnalyze = async () => {
    if (!rejectedNote) {
      toast.error('Falta cargar la nota de crédito en JSON o XML.');
      return;
    }

    try {
      const originalDocument = resolveOriginalDocument();
      setAppState('analyzing');
      toast.loading('Analizando documentos…', { id: 'analyze' });
      await nextFrame();

      const analysis = compareCreditNoteTotals(originalDocument, rejectedNote);

      startTransition(() => {
        setComparisonAnalysis(analysis);
        setCorrectionDraft(null);
        setGeneratedResult(null);
        setMdgSubmission(null);
        setMdgSubmissionError(null);
        setAppState('analyzed');
      });

      toast.success('Análisis completado', {
        id: 'analyze',
        description: analysis.summaryMessage,
      });
    } catch (error) {
      setAppState(allInputsReady ? 'files_loaded' : 'idle');
      toast.error('No se pudo completar el análisis', {
        id: 'analyze',
        description: error instanceof Error ? error.message : 'Error inesperado durante el análisis.',
      });
    }
  };

  const handleRecalculate = async () => {
    if (!rejectedNote) {
      toast.error('Falta cargar la nota de crédito en JSON o XML.');
      return;
    }

    try {
      const originalDocument = resolveOriginalDocument();
      const reissueValidation = validateReissueSettings(reissueSettings, rejectedNote);
      setReissueErrors(reissueValidation);
      if (Object.keys(reissueValidation).length > 0) {
        throw new Error(reissueValidation.terminal ?? 'Configura una terminal válida para la reemisión.');
      }
      setAppState('recalculating');
      toast.loading('Recalculando ajuste…', { id: 'recalc' });
      await nextFrame();

      const correction = generateCorrectedCreditNote(originalDocument, rejectedNote, {
        terminal: reissueSettings.terminal,
      });

      startTransition(() => {
        setCorrectionDraft(correction);
        setGeneratedResult(null);
        setMdgSubmission(null);
        setMdgSubmissionError(null);
        setAppState('recalculated');
      });

      toast.success('Ajuste calculado', {
        id: 'recalc',
        description: correction.adjustmentDescription,
      });
    } catch (error) {
      setAppState(comparisonAnalysis ? 'analyzed' : allInputsReady ? 'files_loaded' : 'idle');
      toast.error('No se pudo recalcular la nota', {
        id: 'recalc',
        description: error instanceof Error ? error.message : 'Error inesperado durante el recálculo.',
      });
    }
  };

  const handleGenerate = async () => {
    if (!correctionDraft) {
      toast.error('Primero recalcula el ajuste.');
      return;
    }

    setAppState('generating');
    toast.loading('Generando resultado corregido…', { id: 'generate' });
    await nextFrame();

    startTransition(() => {
      setGeneratedResult(correctionDraft);
      setMdgSubmission(null);
      setMdgSubmissionError(null);
      setAppState('completed');
    });

    toast.success('Versión corregida generada', {
      id: 'generate',
      description: 'El resultado local quedó listo en el JSON requerido por MDG y en XML corregido.',
    });
  };

  const handleExport = () => {
    if (!generatedResult) {
      toast.error('Genera primero la versión corregida.');
      return;
    }

    exportCorrectionFiles(generatedResult);
    toast.success('Exportación completada', {
      description: 'Se descargaron el JSON y el XML corregidos.',
    });
  };

  const handleSendToMdg = async () => {
    if (!generatedResult) {
      toast.error('Genera primero la versión corregida.');
      return;
    }

    const validation = validateMdgSettings(mdgSettings);
    setMdgErrors(validation);

    if (Object.keys(validation).length > 0) {
      toast.error('Completa tenant y password del cliente antes de enviar.');
      return;
    }

    setAppState('sending');
    setMdgSubmission(null);
    setMdgSubmissionError(null);
    toast.loading('Obteniendo token y enviando comprobante a MDG…', { id: 'mdg-send' });

    try {
      await nextFrame();
      const submission = await sendDocumentToMdg(mdgSettings, generatedResult.correctedPayload);

      startTransition(() => {
        setMdgSubmission(submission);
        setMdgSubmissionError(null);
        setAppState('sent');
      });

      const responseLabel = submission.response.ejecucionId
        ? `Ejecución ${submission.response.ejecucionId}`
        : submission.response.clave || generatedResult.regeneratedKey;

      toast.success('Documento enviado a MDG', {
        id: 'mdg-send',
        description: `${responseLabel}. Preparando el siguiente caso…`,
      });

      if (resetNextCaseTimerRef.current) {
        window.clearTimeout(resetNextCaseTimerRef.current);
      }

      resetNextCaseTimerRef.current = window.setTimeout(() => {
        resetCaseState({ preserveEnvironment: true });
        toast.success('Formulario limpio para el siguiente envío');
      }, NEXT_CASE_RESET_DELAY_MS);
    } catch (error) {
      const fallbackError: MdgSubmissionError =
        error instanceof MdgApiError
          ? error.details
          : {
              environment: mdgSettings.environment,
              endpoint: mdgEndpoints.functionUrl,
              source: 'network',
              status: null,
              message:
                error instanceof Error
                  ? error.message
                  : 'No se pudo completar el envío del documento a MDG.',
            };

      startTransition(() => {
        setMdgSubmission(null);
        setMdgSubmissionError(fallbackError);
        setAppState('completed');
      });

      toast.error('Error al enviar a MDG', {
        id: 'mdg-send',
        description: fallbackError.message,
      });
    }
  };

  const documentSummary = activeOriginalDocument ? toDocumentSummary(activeOriginalDocument) : null;
  const creditNoteSummary = rejectedNote
    ? toCreditNoteSummary(rejectedNote, comparisonAnalysis)
    : null;
  const comparisonResult = comparisonAnalysis
    ? toComparisonResult(comparisonAnalysis, correctionDraft, rejectedNote?.moneda ?? 'CRC')
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors closeButton />
      <Header currentUser={authSession?.username ?? null} onLogout={() => logoutUser('manual')} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Carga de documentos</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sube el XML original y la nota de crédito en JSON requerido o XML directo
              </p>
            </div>
            {allInputsReady && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"
              >
                Listos
              </motion.span>
            )}
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <FileUploadZone
              label="Documento original (XML)"
              description="Factura o tiquete electrónico aceptado por Hacienda · .xml"
              accept=".xml"
              fileType="xml"
              file={xmlFile}
              onFileSelected={handleOriginalXmlSelected}
              onClear={() => {
                setXmlFile(null);
                setXmlOriginalDocument(null);
                const nextReady = Boolean(rejectedNote && manualMode && manualOriginalDocument);
                resetWorkflow(nextReady ? 'files_loaded' : 'idle');
              }}
            />
            <FileUploadZone
              label="Nota de crédito (JSON o XML)"
              description="Acepta el JSON requerido por MDG o XML directo de la nota · .json, .xml"
              accept=".json,.xml"
              fileType="note"
              file={noteFile}
              onFileSelected={handleRejectedJsonSelected}
              onClear={() => {
                setNoteFile(null);
                setRejectedNote(null);
                setReissueSettings(INITIAL_REISSUE_SETTINGS);
                setReissueErrors({});
                resetWorkflow('idle');
              }}
            />
          </div>

          <div className="px-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-medium">o ingresa manualmente</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <ManualInputPanel
              active={manualMode}
              value={manualForm}
              errors={manualErrors}
              onToggle={() => {
                const nextManualMode = !manualMode;
                setManualMode(nextManualMode);
                if (nextManualMode) {
                  syncManualDocument(manualForm, nextManualMode);
                } else {
                  setManualErrors({});
                  const nextReady = Boolean(rejectedNote && xmlOriginalDocument);
                  resetWorkflow(nextReady ? 'files_loaded' : 'idle');
                }
              }}
              onChange={(field, value) => {
                const nextForm = { ...manualForm, [field]: value };
                setManualForm(nextForm);

                if (manualMode) {
                  syncManualDocument(nextForm, true);
                }
              }}
            />

            <ReissueSettingsPanel
              value={reissueSettings.terminal}
              error={reissueErrors.terminal}
              originalTerminal={currentNoteTerminal}
              suggestedTerminal={suggestedTerminal}
              onChange={(value) => {
                syncReissueSettings({ terminal: value });
              }}
            />
          </div>
        </div>

        <AnimatePresence>
          {showSummaries && documentSummary && creditNoteSummary && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <DocumentSummaryCard data={documentSummary} />
              <CreditNoteSummaryCard data={creditNoteSummary} />
            </motion.div>
          )}
        </AnimatePresence>

        <MdgConfigPanel
          value={mdgSettings}
          errors={mdgErrors}
          disabled={appState === 'sending'}
          onChange={syncMdgSettings}
        />

        <ActionButtons
          appState={appState}
          onAnalyze={handleAnalyze}
          onRecalculate={handleRecalculate}
          onGenerate={handleGenerate}
          onExport={handleExport}
          onSendToMdg={handleSendToMdg}
        />

        <AnimatePresence>
          {showComparison && comparisonResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ComparisonPanel data={comparisonResult} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResult && generatedResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ResultPanel
                result={generatedResult}
                totalCorregidoLabel={formatCurrency(
                  generatedResult.totalCorregido,
                  rejectedNote?.moneda ?? 'CRC'
                )}
                onDownloadJson={() => {
                  exportJsonOnly(generatedResult);
                  toast.success('JSON requerido descargado');
                }}
                onDownloadXml={() => {
                  exportXmlOnly(generatedResult);
                  toast.success('XML corregido descargado');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(mdgSubmission || mdgSubmissionError) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <MdgSubmissionPanel success={mdgSubmission} error={mdgSubmissionError} />
            </motion.div>
          )}
        </AnimatePresence>

        <WarningsCard />
      </main>

      {!isAuthenticated && (
        <LoginDialog
          username={loginForm.username}
          password={loginForm.password}
          error={loginError}
          onChange={(field, value) => {
            setLoginForm((current) => ({
              ...current,
              [field]: value,
            }));
            if (loginError) {
              setLoginError('');
            }
          }}
          onSubmit={handleLoginSubmit}
        />
      )}

      {isAuthenticated && showSessionWarning && (
        <SessionWarningDialog
          remainingLabel={formatRemainingTime(sessionRemainingMs)}
          onStayLoggedIn={() => touchSession(true)}
          onLogout={() => logoutUser('manual')}
        />
      )}
    </div>
  );
}
