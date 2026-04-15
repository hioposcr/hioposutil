import { LockKeyhole, UserRound } from 'lucide-react';

interface Props {
  username: string;
  password: string;
  error?: string;
  onChange: (field: 'username' | 'password', value: string) => void;
  onSubmit: () => void;
}

export default function LoginDialog({ username, password, error, onChange, onSubmit }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            Acceso interno
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Esta herramienta es solo para soporte interno de HIOPOS.
          </p>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Usuario
            </label>
            <div className="relative">
              <UserRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => onChange('username', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onSubmit();
                  }
                }}
                placeholder="Usuario de soporte"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Contraseña
            </label>
            <div className="relative">
              <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => onChange('password', event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onSubmit();
                  }
                }}
                placeholder="Contraseña"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={onSubmit}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2.5 transition-colors"
          >
            Entrar a la herramienta
          </button>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            La sesión quedará activa hasta que cierres sesión manualmente o pasen 5 horas sin
            actividad.
          </p>
        </div>
      </div>
    </div>
  );
}
