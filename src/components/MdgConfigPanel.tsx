import { KeyRound, LockKeyhole, Send, ShieldCheck } from 'lucide-react';
import type { MdgSettings, MdgSettingsErrors } from '../types';

interface Props {
  value: MdgSettings;
  errors: MdgSettingsErrors;
  disabled?: boolean;
  onChange: (nextValue: MdgSettings) => void;
}

export default function MdgConfigPanel({
  value,
  errors,
  disabled = false,
  onChange,
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Configuración MDG</h3>
          <p className="text-xs text-slate-500">
            Selecciona el ambiente e ingresa las credenciales del cliente. El envío seguirá pasando por la Function del sitio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5 items-start">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Ambiente
            </label>
            <div className="mt-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 grid grid-cols-2 gap-1">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, environment: 'test' })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  value.environment === 'test'
                    ? 'bg-white text-blue-700 shadow-sm border border-blue-100'
                    : 'text-slate-500 hover:text-slate-700'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                Testing
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, environment: 'prod' })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  value.environment === 'prod'
                    ? 'bg-white text-amber-700 shadow-sm border border-amber-100'
                    : 'text-slate-500 hover:text-slate-700'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                Producción
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Tenant ID
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled}
                value={value.tenantId}
                onChange={(event) =>
                  onChange({
                    ...value,
                    tenantId: event.target.value.replace(/\D/g, '').slice(0, 10),
                  })
                }
                placeholder="63"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              />
            </div>
            {errors.tenantId ? (
              <p className="text-[11px] text-red-600">{errors.tenantId}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Se usa únicamente para solicitar el token del cliente en este envío.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              disabled={disabled}
              value={value.password}
              onChange={(event) => onChange({ ...value, password: event.target.value })}
              placeholder="Ingresa la contraseña de MDG"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
            />
            {errors.password ? (
              <p className="text-[11px] text-red-600">{errors.password}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                La contraseña se envía a la Function solo para esta operación y no se persiste en el sitio.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <LockKeyhole className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Credenciales no persistidas</p>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  El `tenantId` y el `password` del cliente no viajan directo a MDG desde el navegador.
                  Se mandan primero a la Netlify Function para evitar CORS y no quedan visibles en la
                  configuración estática del sitio.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Ambiente activo</p>
              <p className="text-xs text-slate-500">
                El envío usará el ambiente{' '}
                <span className="font-medium">
                  {value.environment === 'prod' ? 'Producción' : 'Testing'}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-4">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Operación interna
            </p>
            <p className="mt-1 text-sm text-slate-700 leading-relaxed">
              El frontend enviará el comprobante corregido a una Netlify Function del mismo sitio,
              y esa Function será la encargada de pedir el token y remitir el documento a MDG
              según el ambiente seleccionado.
            </p>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Si más adelante quieren un modo híbrido, la Function también puede usar variables de
            entorno como respaldo, pero ya no depende de ellas para operar con múltiples clientes.
          </p>
        </div>
      </div>
    </div>
  );
}
