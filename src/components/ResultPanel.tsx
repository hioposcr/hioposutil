import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import type { CorrectionResult } from '../types';

interface Props {
  result: CorrectionResult;
  totalCorregidoLabel: string;
  onDownloadJson: () => void;
  onDownloadXml: () => void;
}

export default function ResultPanel({
  result,
  totalCorregidoLabel,
  onDownloadJson,
  onDownloadXml,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [previewType, setPreviewType] = useState<'json' | 'xml'>('json');

  const previewContent = previewType === 'json' ? result.correctedJsonText : result.correctedXmlText;
  const previewTitle =
    previewType === 'json'
      ? `${result.fileBaseName}.json`
      : `${result.fileBaseName}.xml`;

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent).catch(() => {});
    toast.success(`${previewType.toUpperCase()} copiado al portapapeles`);
  };

  const handleDownload = () => {
    if (previewType === 'json') {
      onDownloadJson();
    } else {
      onDownloadXml();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white border border-emerald-200 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-100 bg-emerald-50/60">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Corrección generada</h3>
          <p className="text-xs text-slate-500">Resultado local listo para revisión y exportación</p>
        </div>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
          Listo
        </span>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-medium text-slate-500">Total corregido</span>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCorregidoLabel}</span>
          <span className="text-xs text-emerald-600 font-medium">
            {result.status === 'adjusted'
              ? `Queda ₡${result.targetBuffer.toFixed(2)} por debajo del documento original`
              : 'La nota ya estaba dentro del rango permitido'}
          </span>
        </div>
        <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-medium text-slate-500">Ajuste aplicado</span>
          <span className="text-sm font-semibold text-slate-800 mt-1">{result.adjustmentDescription}</span>
          <span className="text-xs text-slate-400 mt-0.5">
            {result.changedFields[0] ?? 'Sin cambios adicionales'}
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Nueva fecha</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{result.regeneratedFechaEmision}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Terminal usada</p>
          <p className="text-sm font-mono text-slate-800 mt-1 break-all">{result.usedTerminal}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Nuevo consecutivo</p>
          <p className="text-sm font-mono text-slate-800 mt-1 break-all">{result.regeneratedConsecutive}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-3">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Nueva clave</p>
          <p className="text-sm font-mono text-slate-800 mt-1 break-all">{result.regeneratedKey}</p>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <span>Preview del JSON requerido / XML corregido</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-slate-100"
          >
            <div className="relative">
              <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewType('json')}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        previewType === 'json'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setPreviewType('xml')}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        previewType === 'xml'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      XML
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{previewTitle}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-slate-700 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-slate-700 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Descargar
                  </button>
                </div>
              </div>
              <pre className="overflow-x-auto p-5 bg-slate-950 text-slate-300 text-xs font-mono leading-relaxed max-h-80">
                <code>{previewContent}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
