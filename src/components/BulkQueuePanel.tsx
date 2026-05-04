import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, Play, RotateCcw, Trash2 } from 'lucide-react';
import type { BulkPreparedDocument } from '../types';

interface Props {
  items: BulkPreparedDocument[];
  sourceCount: number;
  isPreparing: boolean;
  isSending: boolean;
  onPrepare: () => void;
  onSend: () => void;
  onClear: () => void;
}

function getStatusPresentation(status: BulkPreparedDocument['status']) {
  switch (status) {
    case 'processing':
      return {
        label: 'Procesando',
        className: 'bg-blue-50 text-blue-700 border border-blue-200',
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
      };
    case 'success':
      return {
        label: 'Enviado',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      };
    case 'error':
      return {
        label: 'Con error',
        className: 'bg-red-50 text-red-700 border border-red-200',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
      };
    default:
      return {
        label: 'Listo',
        className: 'bg-slate-50 text-slate-600 border border-slate-200',
        icon: <RotateCcw className="w-3.5 h-3.5" />,
      };
  }
}

export default function BulkQueuePanel({
  items,
  sourceCount,
  isPreparing,
  isSending,
  onPrepare,
  onSend,
  onClear,
}: Props) {
  const totalPrepared = items.length;
  const successCount = items.filter((item) => item.status === 'success').length;
  const errorCount = items.filter((item) => item.status === 'error').length;
  const processingCount = items.filter((item) => item.status === 'processing').length;
  const readyCount = items.filter((item) => item.status === 'ready').length;
  const completedCount = successCount + errorCount;
  const progress = totalPrepared > 0 ? Math.round((completedCount / totalPrepared) * 100) : 0;
  const hasPreparedItems = totalPrepared > 0;
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalPrepared / pageSize));
  const pageStartIndex = hasPreparedItems ? (currentPage - 1) * pageSize : 0;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, totalPrepared);
  const visibleItems = items.slice(pageStartIndex, pageEndIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Cola de procesamiento</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Prepara el lote y luego envíalo secuencialmente a MDG reutilizando la misma configuración.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onPrepare}
            disabled={sourceCount === 0 || isPreparing || isSending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPreparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Preparar lote
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={!hasPreparedItems || isPreparing || isSending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {successCount > 0 || errorCount > 0 ? 'Continuar / reintentar' : 'Enviar lote a MDG'}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={sourceCount === 0 || isPreparing || isSending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Preparados</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{totalPrepared}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Listos</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{readyCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Procesando</p>
          <p className="mt-1 text-xl font-semibold text-slate-800">{processingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Enviados</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">{successCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Con error</p>
          <p className="mt-1 text-xl font-semibold text-red-700">{errorCount}</p>
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-slate-800">Progreso del lote</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasPreparedItems
                  ? `${completedCount} de ${totalPrepared} documentos ya devolvieron una respuesta.`
                  : 'Cuando prepares el lote aquí aparecerá la cola de documentos.'}
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-800">{progress}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {hasPreparedItems ? (
        <div className="border-t border-slate-100">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-slate-800">Documentos del lote</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Mostrando {pageStartIndex + 1} a {pageEndIndex} de {totalPrepared} documentos preparados.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                Por página
                <select
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                >
                  {[25, 50, 100, 250].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>

              <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </button>
                <span className="px-2 text-xs font-medium text-slate-500">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Archivo</th>
                <th className="px-4 py-3 font-medium">Original</th>
                <th className="px-4 py-3 font-medium">Nuevo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleItems.map((item) => {
                const status = getStatusPresentation(item.status);

                return (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3 font-mono text-slate-500">{item.sequenceNumber}</td>
                    <td className="px-4 py-3 min-w-[240px]">
                      <p className="font-semibold text-slate-800 break-all">{item.fileName}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.documentType}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{item.fileSizeLabel}</p>
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      <p className="font-mono text-slate-700 break-all">{item.originalConsecutive}</p>
                      <p className="mt-1 text-[11px] text-slate-400 break-all">{item.originalKey}</p>
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      <p className="font-mono text-slate-800 break-all">{item.regeneratedConsecutive}</p>
                      <p className="mt-1 text-[11px] text-slate-500 break-all">{item.regeneratedKey}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[260px]">
                      {item.status === 'success' ? (
                        <div className="text-xs text-slate-600 space-y-1">
                          <p className="font-semibold text-emerald-700">
                            Ejecución {item.executionId ?? 'no informada'}
                          </p>
                          <p className="break-all">{item.responseKey || item.regeneratedKey}</p>
                        </div>
                      ) : item.status === 'error' ? (
                        <p className="text-xs text-red-700 leading-relaxed">{item.errorMessage}</p>
                      ) : item.status === 'processing' ? (
                        <p className="text-xs text-blue-700">Esperando respuesta de MDG…</p>
                      ) : (
                        <p className="text-xs text-slate-500">Pendiente de envío</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-slate-700">Todavía no hay lote preparado</p>
            <p className="mt-1 text-xs text-slate-500">
              Carga XML, define la terminal y el número inicial, y luego presiona `Preparar lote`.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
