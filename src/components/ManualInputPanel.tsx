import { SlidersHorizontal } from 'lucide-react';
import type { ManualDocumentErrors, ManualDocumentForm } from '../types';

interface Props {
  active: boolean;
  onToggle: () => void;
  value: ManualDocumentForm;
  errors: ManualDocumentErrors;
  onChange: (field: keyof ManualDocumentForm, value: string) => void;
}

function InputError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-[11px] text-red-600">{message}</p>;
}

export default function ManualInputPanel({ active, onToggle, value, errors, onChange }: Props) {
  return (
    <div className="mt-4">
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
          active
            ? 'border-slate-300 bg-slate-100 text-slate-700'
            : 'border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Modo manual
        <span className={`ml-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${active ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
          {active ? 'Activo' : 'Off'}
        </span>
      </button>

      {active && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Tipo de documento
            </label>
            <select
              value={value.tipoDocumentoCodigo}
              onChange={(event) => onChange('tipoDocumentoCodigo', event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
            >
              <option value="01">01 — Factura Electrónica</option>
              <option value="08">08 — Factura Electrónica de Exportación</option>
              <option value="04">04 — Tiquete Electrónico</option>
            </select>
            <InputError message={errors.tipoDocumentoCodigo} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Moneda
            </label>
            <select
              value={value.moneda}
              onChange={(event) => onChange('moneda', event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
            >
              <option value="CRC">CRC — Colón costarricense</option>
              <option value="USD">USD — Dólar estadounidense</option>
            </select>
            <InputError message={errors.moneda} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Monto original
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">₡</span>
              <input
                type="text"
                value={value.montoOriginal}
                onChange={(event) => onChange('montoOriginal', event.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              />
            </div>
            <InputError message={errors.montoOriginal} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Fecha de emisión
            </label>
            <input
              type="date"
              value={value.fechaEmision}
              onChange={(event) => onChange('fechaEmision', event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
            />
            <InputError message={errors.fechaEmision} />
          </div>
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Clave del documento original
            </label>
            <input
              type="text"
              value={value.clave}
              onChange={(event) => onChange('clave', event.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
            />
            <p className="text-[11px] text-slate-400">
              Opcional si solo quieres usar monto, fecha y tipo de documento como referencia base.
            </p>
            <InputError message={errors.clave} />
          </div>
        </div>
      )}
    </div>
  );
}
