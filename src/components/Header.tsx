import { FileText, LogOut, ShieldCheck, Wrench } from 'lucide-react';

interface Props {
  currentUser?: string | null;
  onLogout?: () => void;
}

export default function Header({ currentUser, onLogout }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                NC Rounding Fixer
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                MVP Funcional
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Corrección de notas de crédito rechazadas por diferencias de redondeo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Wrench className="w-3.5 h-3.5" />
            Herramienta Interna
          </div>

          {currentUser && onLogout && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {currentUser}
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium px-3 py-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
