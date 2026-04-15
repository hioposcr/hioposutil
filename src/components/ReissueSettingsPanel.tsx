import { Settings2 } from 'lucide-react';

interface Props {
  value: string;
  error?: string;
  originalTerminal?: string;
  suggestedTerminal?: string;
  onChange: (value: string) => void;
}

export default function ReissueSettingsPanel({
  value,
  error,
  originalTerminal,
  suggestedTerminal,
  onChange,
}: Props) {
  return (
    <div className="mt-5 pt-5 border-t border-slate-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <Settings2 className="w-4 h-4 text-slate-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Configuración de reemisión</h3>
          <p className="text-xs text-slate-500">
            Define la terminal que se usará para regenerar consecutivo y clave
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,240px)_1fr] gap-4 items-start">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
            Nueva terminal
          </label>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="00003"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
          />
          <p className="text-[11px] text-slate-400">Debe tener 5 dígitos y ser distinta a la terminal original.</p>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>

        <div className="md:flex md:flex-col md:gap-1.5 md:-translate-y-px">
          <div
            aria-hidden="true"
            className="hidden md:block text-xs font-medium text-slate-600 uppercase tracking-wide opacity-0 select-none"
          >
            Nueva terminal
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 min-h-[42px] flex items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Terminal actual
                </p>
                <p className="text-sm font-mono text-slate-800">
                  {originalTerminal || '-----'}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Sugerida
                </p>
                <p className="text-sm font-mono text-slate-800">
                  {suggestedTerminal || '-----'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
