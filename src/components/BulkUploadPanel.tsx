import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileCode2, Trash2, Upload, X } from 'lucide-react';
import type { BulkSourceDocumentItem, BulkUploadIssue } from '../types';
import { formatCurrency } from '../utils/number';

interface Props {
  items: BulkSourceDocumentItem[];
  issues: BulkUploadIssue[];
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

export default function BulkUploadPanel({
  items,
  issues,
  disabled = false,
  onFilesSelected,
  onRemoveItem,
  onClearAll,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length || disabled) {
      return;
    }

    onFilesSelected(Array.from(fileList));

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const hasItems = items.length > 0 || issues.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Carga masiva de XML</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Sube uno o varios comprobantes XML para renumerarlos y reenviarlos en secuencia.
          </p>
        </div>

        {hasItems && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePick}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              Agregar XML
            </button>
            <button
              type="button"
              onClick={() => {
                if (inputRef.current) {
                  inputRef.current.value = '';
                }
                onClearAll();
              }}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar lote
            </button>
          </div>
        )}
      </div>

      <div className="p-5">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xml"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <button
          type="button"
          onClick={handlePick}
          disabled={disabled}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) {
              setDragging(true);
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
          className={`w-full border-2 border-dashed rounded-2xl px-6 py-8 text-center transition-colors ${
            dragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-200 bg-slate-50/70 hover:bg-blue-50/40 hover:border-blue-300'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="mx-auto w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <FileCode2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-800">
            Arrastra varios XML aquí o selecciónalos manualmente
          </p>
          <p className="mt-1 text-xs text-slate-500">
            El lote conserva el orden de carga para renumerar y enviar uno por uno.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
            <Upload className="w-3 h-3" />
            Seleccionar XML
          </div>
        </button>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Válidos</p>
            <p className="mt-1 text-xl font-semibold text-slate-800">{items.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Rechazados</p>
            <p className="mt-1 text-xl font-semibold text-slate-800">{issues.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Estado</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {items.length > 0 ? 'Listo para preparar lote' : 'Esperando archivos'}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-5 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                XML válidos cargados
              </p>
            </div>
            <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
              {items.map((item, index) => (
                <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.fileName}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-500">
                      <p>{item.document.tipoDocumento}</p>
                      <p className="font-mono break-all">{item.document.numeroConsecutivo}</p>
                      <p>{formatCurrency(item.document.totals.totalComprobante, item.document.moneda)}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">{item.fileSizeLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={disabled}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Quitar del lote"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {issues.length > 0 && (
          <div className="mt-5 rounded-2xl border border-red-200 overflow-hidden">
            <div className="px-4 py-3 bg-red-50 border-b border-red-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Archivos con error
              </p>
            </div>
            <div className="divide-y divide-red-100 max-h-[240px] overflow-y-auto">
              {issues.map((issue) => (
                <div key={issue.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-800 break-all">{issue.fileName}</p>
                    <p className="mt-1 text-xs text-red-700 leading-relaxed">{issue.message}</p>
                    <p className="mt-1 text-[11px] text-red-500">{issue.fileSizeLabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
