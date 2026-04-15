import { motion } from 'framer-motion';
import { AlertTriangle, Link2, Calendar, XCircle } from 'lucide-react';
import type { CreditNoteSummary } from '../types';
import { formatDateTime } from '../utils/formatters';

interface Props {
  data: CreditNoteSummary;
}

function DataRow({ label, value, mono = false, highlight = false }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 shrink-0">{label}</span>
      <span className={`text-xs text-right break-all ${mono ? 'font-mono text-[11px]' : 'font-medium'} ${highlight ? 'text-red-600 font-semibold' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}

export default function CreditNoteSummaryCard({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-red-50/60">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
          <XCircle className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Nota de Crédito</h3>
          <p className="text-xs text-slate-500">
            Documento pendiente de corrección
            {data.sourceLabel ? ` · ${data.sourceLabel}` : ''}
          </p>
        </div>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          {data.sourceLabel ?? 'Rechazada'}
        </span>
      </div>

      <div className="px-5 py-3 bg-amber-50/60 border-b border-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Motivo de rechazo</p>
            <p className="text-xs text-amber-700 mt-0.5">{data.motivoRechazo}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-1">
        <DataRow label="Estado" value={data.estadoRechazo} highlight />
        <DataRow label="Total actual" value={data.totalActual} />
        <DataRow label="Diferencia detectada" value={data.diferencia} highlight />
      </div>

      <div className="px-5 py-3 bg-slate-50/40 border-t border-slate-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Emisión</span>
        </div>
        <DataRow label="Fecha" value={formatDateTime(data.fechaEmision)} />
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Link2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Referencia</span>
        </div>
        <DataRow label="Tipo ref." value={data.tipoReferencia} />
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Clave NC</p>
        <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">{data.clave}</p>
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1">Doc. referenciado</p>
        <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">{data.documentoReferencia}</p>
      </div>
    </motion.div>
  );
}
