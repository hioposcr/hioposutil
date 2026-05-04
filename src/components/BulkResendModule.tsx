import { useState } from 'react';
import { toast } from 'sonner';
import BulkQueuePanel from './BulkQueuePanel';
import BulkReissueSettingsPanel from './BulkReissueSettingsPanel';
import BulkUploadPanel from './BulkUploadPanel';
import MdgConfigPanel from './MdgConfigPanel';
import { parseOriginalDocumentXml } from '../parsers/xmlParser';
import { prepareBulkResendDocuments } from '../services/bulkResendService';
import { MdgApiError, sendDocumentsBatchToMdg } from '../services/mdgApiService';
import type {
  BulkPreparedDocument,
  BulkResendSettings,
  BulkResendSettingsErrors,
  BulkSourceDocumentItem,
  BulkUploadIssue,
  MdgSettings,
  MdgSettingsErrors,
} from '../types';
import {
  extractTerminalFromConsecutive,
  replaceTerminalAndSequenceInConsecutive,
  suggestNextTerminal,
} from '../utils/consecutive';
import { formatFileSize, readFileAsText, validateFileType } from '../utils/fileReaders';
import { validateMdgSettings } from '../utils/mdgValidation';

const INITIAL_BULK_SETTINGS: BulkResendSettings = {
  terminal: '',
  startingSequence: '1',
  regenerateSecurityCode: true,
  delayMs: '400',
};

const BULK_SEND_BATCH_SIZE = 10;
const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 500;

type UploadResult =
  | { type: 'success'; item: BulkSourceDocumentItem }
  | { type: 'error'; issue: BulkUploadIssue };

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function buildUniqueId(seed: string, index: number): string {
  return `${seed}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

interface Props {
  mdgSettings: MdgSettings;
  mdgErrors: MdgSettingsErrors;
  onMdgSettingsChange: (nextValue: MdgSettings) => void;
  onMdgErrorsChange: (nextErrors: MdgSettingsErrors) => void;
  onSessionActivity?: () => void;
}

export default function BulkResendModule({
  mdgSettings,
  mdgErrors,
  onMdgSettingsChange,
  onMdgErrorsChange,
  onSessionActivity,
}: Props) {
  const [sourceItems, setSourceItems] = useState<BulkSourceDocumentItem[]>([]);
  const [uploadIssues, setUploadIssues] = useState<BulkUploadIssue[]>([]);
  const [preparedItems, setPreparedItems] = useState<BulkPreparedDocument[]>([]);
  const [bulkSettings, setBulkSettings] = useState<BulkResendSettings>(INITIAL_BULK_SETTINGS);
  const [bulkErrors, setBulkErrors] = useState<BulkResendSettingsErrors>({});
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const detectedTerminals = [...new Set(
    sourceItems
      .map((item) => extractTerminalFromConsecutive(item.document.numeroConsecutivo))
      .filter(Boolean)
  )];
  const suggestedTerminal =
    sourceItems.length > 0 ? suggestNextTerminal(sourceItems[0].document.numeroConsecutivo) : '';

  const validateBulkSettings = (
    settings: BulkResendSettings,
    documentCount = sourceItems.length
  ): BulkResendSettingsErrors => {
    const errors: BulkResendSettingsErrors = {};

    if (!/^\d{5}$/.test(settings.terminal.trim())) {
      errors.terminal = 'La terminal debe tener exactamente 5 dígitos.';
    }

    if (!/^\d+$/.test(settings.startingSequence.trim())) {
      errors.startingSequence = 'El número inicial debe contener solo dígitos.';
      return errors;
    }

    const startValue = Number(settings.startingSequence.trim());

    if (!Number.isInteger(startValue) || startValue < 1 || startValue > 9999999999) {
      errors.startingSequence = 'El número inicial debe estar entre 1 y 9999999999.';
      return errors;
    }

    if (documentCount > 0 && startValue + documentCount - 1 > 9999999999) {
      errors.startingSequence =
        'Con la cantidad actual de XML el consecutivo final excedería el máximo permitido de 10 dígitos.';
    }

    if (!/^\d+$/.test(settings.delayMs.trim())) {
      errors.delayMs = 'La pausa debe contener solo dígitos.';
      return errors;
    }

    const delayMs = Number(settings.delayMs.trim());

    if (!Number.isInteger(delayMs) || delayMs < MIN_DELAY_MS || delayMs > MAX_DELAY_MS) {
      errors.delayMs = `La pausa debe estar entre ${MIN_DELAY_MS} y ${MAX_DELAY_MS} ms.`;
    }

    return errors;
  };

  const syncBulkSettings = (nextSettings: BulkResendSettings) => {
    setBulkSettings(nextSettings);
    setBulkErrors(validateBulkSettings(nextSettings));

    if (preparedItems.length > 0) {
      setPreparedItems([]);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setIsLoadingFiles(true);
    onSessionActivity?.();

    try {
      const results: UploadResult[] = await Promise.all(
        files.map(async (file, index) => {
          const fileTypeError = validateFileType(file, 'xml');

          if (fileTypeError) {
            return {
              type: 'error' as const,
              issue: {
                id: buildUniqueId(file.name, index),
                fileName: file.name,
                fileSizeLabel: formatFileSize(file.size),
                message: fileTypeError,
              },
            };
          }

          try {
            const content = await readFileAsText(file);
            const parsed = parseOriginalDocumentXml(content, file.name);

            return {
              type: 'success' as const,
              item: {
                id: buildUniqueId(file.name, index),
                fileName: file.name,
                fileSizeLabel: formatFileSize(file.size),
                document: parsed,
              },
            };
          } catch (error) {
            return {
              type: 'error' as const,
              issue: {
                id: buildUniqueId(file.name, index),
                fileName: file.name,
                fileSizeLabel: formatFileSize(file.size),
                message:
                  error instanceof Error
                    ? error.message
                    : 'No se pudo interpretar el XML seleccionado.',
              },
            };
          }
        })
      );

      const successfulItems = results.flatMap((result) =>
        result.type === 'success' ? [result.item] : []
      );
      const failedItems = results.flatMap((result) =>
        result.type === 'error' ? [result.issue] : []
      );

      if (successfulItems.length > 0) {
        setSourceItems((current) => [...current, ...successfulItems]);
      }

      if (failedItems.length > 0) {
        setUploadIssues((current) => [...current, ...failedItems]);
      }

      if (!bulkSettings.terminal && successfulItems.length > 0) {
        const autoTerminal = suggestNextTerminal(successfulItems[0].document.numeroConsecutivo);
        const nextSettings = {
          ...bulkSettings,
          terminal: autoTerminal,
        };
        setBulkSettings(nextSettings);
        setBulkErrors(validateBulkSettings(nextSettings, sourceItems.length + successfulItems.length));
      } else {
        setBulkErrors(
          validateBulkSettings(bulkSettings, sourceItems.length + successfulItems.length)
        );
      }

      setPreparedItems([]);

      if (successfulItems.length > 0 && failedItems.length === 0) {
        toast.success(`Se cargaron ${successfulItems.length} XML al lote.`);
      } else if (successfulItems.length > 0 && failedItems.length > 0) {
        toast.warning(
          `Se cargaron ${successfulItems.length} XML válidos y ${failedItems.length} quedaron con error.`
        );
      } else {
        toast.error('Ningún XML del lote pudo procesarse.');
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleRemoveSourceItem = (id: string) => {
    const nextItems = sourceItems.filter((item) => item.id !== id);
    setSourceItems(nextItems);
    setBulkErrors(validateBulkSettings(bulkSettings, nextItems.length));
    setPreparedItems([]);
  };

  const handleClearBatch = () => {
    setSourceItems([]);
    setUploadIssues([]);
    setPreparedItems([]);
    setBulkErrors({});
  };

  const handlePrepareBatch = async () => {
    if (sourceItems.length === 0) {
      toast.error('Carga al menos un XML para preparar el lote.');
      return;
    }

    const validation = validateBulkSettings(bulkSettings);
    setBulkErrors(validation);

    if (Object.keys(validation).length > 0) {
      toast.error('Corrige la terminal o el número inicial antes de preparar el lote.');
      return;
    }

    setIsPreparing(true);
    onSessionActivity?.();
    toast.loading('Preparando lote de reenvío…', { id: 'bulk-prepare' });

    try {
      await nextFrame();
      const prepared = prepareBulkResendDocuments(sourceItems, bulkSettings);
      setPreparedItems(prepared);
      toast.success('Lote preparado', {
        id: 'bulk-prepare',
        description: `${prepared.length} documentos quedaron listos para enviarse a MDG.`,
      });
    } catch (error) {
      toast.error('No se pudo preparar el lote', {
        id: 'bulk-prepare',
        description:
          error instanceof Error ? error.message : 'Se produjo un error al renumerar los XML.',
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const handleSendBatch = async () => {
    if (preparedItems.length === 0) {
      toast.error('Prepara primero el lote antes de enviarlo.');
      return;
    }

    const bulkValidation = validateBulkSettings(bulkSettings);
    setBulkErrors(bulkValidation);

    if (Object.keys(bulkValidation).length > 0) {
      toast.error('Corrige la configuración del lote antes de enviarlo.');
      return;
    }

    const validation = validateMdgSettings(mdgSettings);
    onMdgErrorsChange(validation);

    if (Object.keys(validation).length > 0) {
      toast.error('Completa tenant y password del cliente antes de enviar el lote.');
      return;
    }

    const itemsToProcess = preparedItems.filter((item) => item.status !== 'success');

    if (itemsToProcess.length === 0) {
      toast.success('Todos los documentos del lote ya fueron enviados.');
      return;
    }

    setIsSending(true);
    toast.loading('Enviando lote a MDG…', { id: 'bulk-send' });

    try {
      const workingItems = preparedItems.map((item) =>
        item.status === 'processing' ? { ...item, status: 'ready' as const } : { ...item }
      );
      const delayMs = Number(bulkSettings.delayMs.trim());
      const pendingItems = workingItems.filter((item) => item.status !== 'success');
      const batches = Array.from(
        { length: Math.ceil(pendingItems.length / BULK_SEND_BATCH_SIZE) },
        (_, index) => pendingItems.slice(index * BULK_SEND_BATCH_SIZE, (index + 1) * BULK_SEND_BATCH_SIZE)
      );

      let successCount = 0;
      let errorCount = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
        const currentBatch = batches[batchIndex];
        const batchIds = new Set(currentBatch.map((item) => item.id));

        toast.loading(`Enviando lote ${batchIndex + 1} de ${batches.length}…`, {
          id: 'bulk-send',
          description: `${currentBatch.length} documentos con token compartido y pausa de ${delayMs} ms.`,
        });

        for (let index = 0; index < workingItems.length; index += 1) {
          if (!batchIds.has(workingItems[index].id)) {
            continue;
          }

          workingItems[index] = {
            ...workingItems[index],
            status: 'processing',
            errorMessage: undefined,
          };
        }

        setPreparedItems([...workingItems]);
        onSessionActivity?.();

        try {
          const submission = await sendDocumentsBatchToMdg(
            mdgSettings,
            currentBatch.map((item) => ({ id: item.id, payload: item.payload })),
            delayMs
          );
          const resultById = new Map(submission.results.map((result) => [result.id, result]));

          for (let index = 0; index < workingItems.length; index += 1) {
            const currentItem = workingItems[index];

            if (!batchIds.has(currentItem.id)) {
              continue;
            }

            const batchResult = resultById.get(currentItem.id);

            if (batchResult?.success) {
              workingItems[index] = {
                ...currentItem,
                status: 'success',
                executionId: batchResult.response?.ejecucionId,
                responseKey:
                  typeof batchResult.response?.clave === 'string'
                    ? batchResult.response.clave
                    : currentItem.regeneratedKey,
                errorMessage: undefined,
              };
              successCount += 1;
              continue;
            }

            workingItems[index] = {
              ...currentItem,
              status: 'error',
              errorMessage:
                batchResult?.error?.message ||
                'La Function no devolvió un resultado utilizable para este documento.',
            };
            errorCount += 1;
          };

          setPreparedItems([...workingItems]);
        } catch (error) {
          const message =
            error instanceof MdgApiError
              ? error.details.message
              : error instanceof Error
              ? error.message
              : 'No se pudo completar el envío de este lote a MDG.';

          for (let index = 0; index < workingItems.length; index += 1) {
            const currentItem = workingItems[index];

            if (!batchIds.has(currentItem.id)) {
              continue;
            }

            workingItems[index] = {
              ...currentItem,
              status: 'error',
              errorMessage: message,
            };
            errorCount += 1;
          }

          setPreparedItems([...workingItems]);
          throw error;
        }
      }

      if (errorCount === 0) {
        toast.success('Lote enviado correctamente', {
          id: 'bulk-send',
          description: `${successCount} documentos fueron remitidos a MDG.`,
        });
      } else {
        toast.warning('Lote procesado con incidencias', {
          id: 'bulk-send',
          description: `${successCount} enviados y ${errorCount} con error. Puedes reintentar los fallidos.`,
        });
      }
    } catch (error) {
      toast.error('El procesamiento por lote se detuvo', {
        id: 'bulk-send',
        description:
          error instanceof Error
            ? error.message
            : 'Se detuvo el envío del lote. Revisa los resultados parciales antes de reintentar.',
      });
    } finally {
      setIsSending(false);
    }
  };

  let previewStartConsecutive = '';
  let previewEndConsecutive = '';

  try {
    if (sourceItems.length > 0 && /^\d{5}$/.test(bulkSettings.terminal) && /^\d+$/.test(bulkSettings.startingSequence.trim())) {
      const startNumber = Number(bulkSettings.startingSequence.trim());
      const endNumber = startNumber + sourceItems.length - 1;

      previewStartConsecutive = replaceTerminalAndSequenceInConsecutive(
        sourceItems[0].document.numeroConsecutivo,
        bulkSettings.terminal,
        startNumber
      );
      previewEndConsecutive = replaceTerminalAndSequenceInConsecutive(
        sourceItems[sourceItems.length - 1].document.numeroConsecutivo,
        bulkSettings.terminal,
        endNumber
      );
    }
  } catch {
    previewStartConsecutive = '';
    previewEndConsecutive = '';
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-800">Reenvío masivo</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Este módulo toma varios XML, conserva el orden de carga, les asigna una nueva numeración
          secuencial, regenera fecha y clave, y luego los envía uno por uno al ambiente MDG que
          selecciones. Para reducir presión sobre MDG, el envío sale en lotes internos de hasta{' '}
          {BULK_SEND_BATCH_SIZE} documentos, reutilizando un token por lote y respetando la pausa configurada.
        </p>
      </div>

      <BulkUploadPanel
        items={sourceItems}
        issues={uploadIssues}
        disabled={isLoadingFiles || isPreparing || isSending}
        onFilesSelected={handleFilesSelected}
        onRemoveItem={handleRemoveSourceItem}
        onClearAll={handleClearBatch}
      />

      <BulkReissueSettingsPanel
        value={bulkSettings}
        errors={bulkErrors}
        documentCount={sourceItems.length}
        detectedTerminals={detectedTerminals}
        suggestedTerminal={suggestedTerminal}
        previewStartConsecutive={previewStartConsecutive}
        previewEndConsecutive={previewEndConsecutive}
        onChange={syncBulkSettings}
      />

      <MdgConfigPanel
        value={mdgSettings}
        errors={mdgErrors}
        disabled={isPreparing || isSending}
        onChange={onMdgSettingsChange}
      />

      <BulkQueuePanel
        items={preparedItems}
        sourceCount={sourceItems.length}
        isPreparing={isPreparing}
        isSending={isSending}
        onPrepare={handlePrepareBatch}
        onSend={handleSendBatch}
        onClear={handleClearBatch}
      />
    </div>
  );
}
