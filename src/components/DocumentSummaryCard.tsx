import { motion } from 'framer-motion';
import { FileText, Calendar, Building2, Hash } from 'lucide-react';
import type { DocumentSummary } from '../types';
import { formatDateTime } from '../utils/formatters';

interface Props {
  data: DocumentSummary;
}

function DataRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500 shrink-0">{label}</span>
      <span className={`text-xs text-right text-slate-800 ${mono ? 'font-mono text-[11px] break-all' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}

export default function DocumentSummaryCard({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Documento Original</h3>
          <p className="text-xs text-slate-500">{data.subtitle ?? 'Documento base de referencia'}</p>
        </div>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          {data.sourceLabel ?? 'Aceptado'}
        </span>
      </div>

      <div className="px-5 py-1">
        <DataRow label="Tipo" value={data.tipoDocumento} />
        <DataRow label="Consecutivo" value={data.consecutivo} mono />
        <DataRow label="Moneda" value={data.moneda} />
      </div>

      <div className="px-5 py-3 bg-slate-50/40 border-t border-slate-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Fechas y partes</span>
        </div>
        <DataRow label="Emisión" value={formatDateTime(data.fechaEmision)} />
        <DataRow label="Emisor" value={data.emisor} />
        <DataRow label="Receptor" value={data.receptor} />
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Montos</span>
        </div>
        <DataRow label="Serv. gravados" value={data.totalServGravados} />
        <DataRow label="Merc. gravadas" value={data.totalMercanciasGravadas} />
        <DataRow label="Impuesto total" value={data.totalImpuesto} />
        <DataRow label="Otros cargos" value={data.totalOtrosCargos} />
      </div>

      <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Total comprobante</span>
          <span className="text-base font-bold text-slate-900">{data.totalComprobante}</span>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 mb-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Clave electrónica</span>
        </div>
        <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed">{data.clave}</p>
      </div>
    </motion.div>
  );
}
