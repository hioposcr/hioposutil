import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import type { MdgSubmissionError, MdgSubmissionSuccess } from '../types';

interface Props {
  success: MdgSubmissionSuccess | null;
  error: MdgSubmissionError | null;
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function MdgSubmissionPanel({ success, error }: Props) {
  if (!success && !error) {
    return null;
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-red-100 bg-red-50/70">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Error al enviar a MDG</h3>
            <p className="text-xs text-slate-500">
              Revisa la respuesta del endpoint y corrige antes de reenviar
            </p>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Ambiente
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {error.environment === 'prod' ? 'Producción' : 'Testing'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Etapa
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {error.source === 'config'
                ? 'Configuración del sitio'
                : error.source === 'function'
                ? 'Netlify Function'
                : error.source === 'token'
                ? 'Obtención de token'
                : error.source === 'emision'
                ? 'Envío del comprobante'
                : 'Conectividad'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              HTTP Status
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{error.status ?? 'Sin respuesta'}</p>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Mensaje</p>
            <p className="mt-1 text-sm text-red-900 leading-relaxed">{error.message}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Endpoint</p>
            <p className="mt-1 text-xs font-mono text-slate-700 break-all leading-relaxed">
              {error.endpoint}
            </p>
          </div>

          {error.rawBody && (
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="px-4 py-2.5 bg-slate-900 text-slate-300 text-xs font-medium flex items-center gap-2">
                <Send className="w-3.5 h-3.5" />
                Respuesta recibida
              </div>
              <pre className="p-4 bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto max-h-72">
                <code>{error.rawBody}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!success) {
    return null;
  }

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-100 bg-emerald-50/70">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Documento enviado a MDG</h3>
          <p className="text-xs text-slate-500">
            El comprobante corregido ya fue remitido al ambiente seleccionado
          </p>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Ambiente</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {success.environment === 'prod' ? 'Producción' : 'Testing'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Ejecución ID</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {success.response.ejecucionId ?? 'No informado'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Consecutivo</p>
          <p className="mt-1 text-sm font-mono text-slate-800 break-all">
            {success.response.consecutivo ?? 'No informado'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Token expira
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {success.token.expires_on || 'No informado'}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Clave aceptada por MDG
          </p>
          <p className="mt-1 text-sm font-mono text-slate-800 break-all">
            {success.response.clave ?? 'No informada'}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Enviado el {success.submittedAt} usando {success.endpoints.label}.
          </p>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-200">
          <div className="px-4 py-2.5 bg-slate-900 text-slate-300 text-xs font-medium">
            Respuesta de MDG
          </div>
          <pre className="p-4 bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto max-h-72">
            <code>{formatJson(success.response)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
