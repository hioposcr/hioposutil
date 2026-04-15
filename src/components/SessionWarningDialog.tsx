import { AlertTriangle, LogOut, ShieldCheck } from 'lucide-react';

interface Props {
  remainingLabel: string;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export default function SessionWarningDialog({
  remainingLabel,
  onStayLoggedIn,
  onLogout,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] flex items-end justify-center px-4 pb-6 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/80 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Sesión por vencer</h3>
            <p className="mt-1 text-xs text-slate-600">
              Si no confirmas actividad, la sesión se cerrará para proteger el acceso interno.
            </p>
          </div>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Tiempo restante
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              {remainingLabel}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onStayLoggedIn}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Continuar sesión
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
