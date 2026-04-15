import { FileText, Wrench } from 'lucide-react';

export default function Header() {
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

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Wrench className="w-3.5 h-3.5" />
          Herramienta Interna
        </div>
      </div>
    </header>
  );
}
