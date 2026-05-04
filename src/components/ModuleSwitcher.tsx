import { Boxes, Files } from 'lucide-react';
import type { AppModule } from '../types';

interface Props {
  activeModule: AppModule;
  onChange: (module: AppModule) => void;
}

const MODULE_OPTIONS: Array<{
  id: AppModule;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'single',
    title: 'Corrección individual',
    description: 'Corrige una nota rechazada por redondeo y luego la reenvía a MDG.',
    icon: <Boxes className="w-4 h-4" />,
  },
  {
    id: 'bulk',
    title: 'Reenvío masivo',
    description: 'Renumera, regenera clave y envía múltiples XML secuencialmente.',
    icon: <Files className="w-4 h-4" />,
  },
];

export default function ModuleSwitcher({ activeModule, onChange }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Módulo de trabajo</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Usa el mismo entorno visual para trabajar un caso puntual o un lote completo.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
          Soporte interno
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {MODULE_OPTIONS.map((option) => {
          const isActive = option.id === activeModule;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`text-left rounded-2xl border px-4 py-4 transition-all ${
                isActive
                  ? 'border-blue-300 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-white border border-blue-200 text-blue-600'
                      : 'bg-slate-100 border border-slate-200 text-slate-500'
                  }`}
                >
                  {option.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{option.title}</p>
                    {isActive && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
