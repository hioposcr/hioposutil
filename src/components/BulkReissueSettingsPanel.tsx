import { Clock3, Hash, KeyRound, Settings2 } from 'lucide-react';
import type { BulkResendSettings, BulkResendSettingsErrors } from '../types';

interface Props {
  value: BulkResendSettings;
  errors: BulkResendSettingsErrors;
  documentCount: number;
  detectedTerminals: string[];
  suggestedTerminal?: string;
  previewStartConsecutive?: string;
  previewEndConsecutive?: string;
  onChange: (nextValue: BulkResendSettings) => void;
}

export default function BulkReissueSettingsPanel({
  value,
  errors,
  documentCount,
  detectedTerminals,
  suggestedTerminal,
  previewStartConsecutive,
  previewEndConsecutive,
  onChange,
}: Props) {
  const detectedTerminalLabel =
    detectedTerminals.length > 0 ? detectedTerminals.join(', ') : 'Sin XML cargados';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
          <Settings2 className="w-4 h-4 text-slate-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Configuración de renumeración</h3>
          <p className="text-xs text-slate-500">
            Define la terminal nueva y desde qué número consecutivo debe empezar el lote.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Nueva terminal
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={value.terminal}
                onChange={(event) =>
                  onChange({
                    ...value,
                    terminal: event.target.value.replace(/\D/g, '').slice(0, 5),
                  })
                }
                placeholder={suggestedTerminal || '00003'}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-700 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              />
            </div>
            {errors.terminal ? (
              <p className="text-[11px] text-red-600">{errors.terminal}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Debe tener 5 dígitos. Para evitar choques, conviene usar una terminal distinta a la original.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Número inicial
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                value={value.startingSequence}
                onChange={(event) =>
                  onChange({
                    ...value,
                    startingSequence: event.target.value.replace(/\D/g, '').slice(0, 10),
                  })
                }
                placeholder="1"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-700 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              />
            </div>
            {errors.startingSequence ? (
              <p className="text-[11px] text-red-600">{errors.startingSequence}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                El primer XML tomará este número y los siguientes avanzarán uno por uno.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              Pausa entre envíos
            </label>
            <div className="relative">
              <Clock3 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                value={value.delayMs}
                onChange={(event) =>
                  onChange({
                    ...value,
                    delayMs: event.target.value.replace(/\D/g, '').slice(0, 3),
                  })
                }
                placeholder="400"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-700 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              />
            </div>
            {errors.delayMs ? (
              <p className="text-[11px] text-red-600">{errors.delayMs}</p>
            ) : (
              <p className="text-[11px] text-slate-400">
                Solo para envío masivo. Se recomienda mantenerlo entre 300 y 500 ms para no castigar el servicio.
              </p>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={value.regenerateSecurityCode}
              onChange={(event) =>
                onChange({
                  ...value,
                  regenerateSecurityCode: event.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
            />
            <div>
              <p className="text-sm font-medium text-slate-800">Regenerar clave de seguridad</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Si está activa, la app recalcula el segmento final de la clave al reemitir.
                Si la desactivas, intentará conservar el segmento actual del XML.
              </p>
            </div>
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                XML cargados
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-800">{documentCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Terminales detectadas
              </p>
              <p className="mt-1 text-sm font-mono text-slate-800 break-all">{detectedTerminalLabel}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Primer consecutivo estimado
              </p>
              <p className="mt-1 text-sm font-mono text-slate-800 break-all">
                {previewStartConsecutive || '-----'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Último consecutivo estimado
              </p>
              <p className="mt-1 text-sm font-mono text-slate-800 break-all">
                {previewEndConsecutive || '-----'}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">Cómo funciona la renumeración</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              El lote conserva el orden en que subes los XML. Si indicas número inicial `1`, el primer
              documento quedará con `0000000001`, el siguiente con `0000000002`, y así sucesivamente,
              manteniendo el tipo de comprobante que ya traía el consecutivo.
            </p>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-800">Cómo funciona el envío por lote</p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              La app divide el lote en grupos internos pequeños. Cada grupo solicita un solo token y
              reutiliza ese token para varios documentos, aplicando la pausa configurada entre envíos
              hacia MDG para reducir la probabilidad de bloqueo o saturación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
