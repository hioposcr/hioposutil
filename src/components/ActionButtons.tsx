import { motion } from 'framer-motion';
import { Search, RefreshCw, FileOutput, Download, Loader2, Send } from 'lucide-react';
import type { AppState } from '../types';

interface Props {
  appState: AppState;
  onAnalyze: () => void;
  onRecalculate: () => void;
  onGenerate: () => void;
  onExport: () => void;
  onSendToMdg: () => void;
}

interface ActionBtnProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

function ActionBtn({ label, icon, onClick, variant = 'outline', loading, disabled }: ActionBtnProps) {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm shadow-blue-200',
    secondary: 'bg-slate-800 hover:bg-slate-900 text-white border-slate-800',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${styles[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </motion.button>
  );
}

export default function ActionButtons({
  appState,
  onAnalyze,
  onRecalculate,
  onGenerate,
  onExport,
  onSendToMdg,
}: Props) {
  const isIdle = appState === 'idle';
  const isAnalyzing = appState === 'analyzing';
  const isAnalyzed =
    appState === 'analyzed' ||
    appState === 'recalculating' ||
    appState === 'recalculated' ||
    appState === 'generating' ||
    appState === 'completed' ||
    appState === 'sending' ||
    appState === 'sent';
  const isRecalculating = appState === 'recalculating';
  const isRecalculated =
    appState === 'recalculated' ||
    appState === 'generating' ||
    appState === 'completed' ||
    appState === 'sending' ||
    appState === 'sent';
  const isGenerating = appState === 'generating';
  const isCompleted = appState === 'completed' || appState === 'sending' || appState === 'sent';
  const isSending = appState === 'sending';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">Acciones</h3>
      <p className="text-xs text-slate-500 mb-4">Ejecuta el flujo de corrección y remisión paso a paso</p>

      <div className="flex flex-wrap gap-2.5">
        <ActionBtn
          label="Analizar documento"
          icon={<Search className="w-4 h-4" />}
          onClick={onAnalyze}
          variant="primary"
          loading={isAnalyzing}
          disabled={isIdle || isSending}
        />
        <ActionBtn
          label="Recalcular ajuste"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={onRecalculate}
          variant="secondary"
          loading={isRecalculating}
          disabled={!isAnalyzed || isSending}
        />
        <ActionBtn
          label="Generar versión corregida"
          icon={<FileOutput className="w-4 h-4" />}
          onClick={onGenerate}
          loading={isGenerating}
          disabled={!isRecalculated || isSending}
        />
        <ActionBtn
          label="Exportar resultado"
          icon={<Download className="w-4 h-4" />}
          onClick={onExport}
          disabled={!isCompleted || isSending}
        />
        <ActionBtn
          label="Enviar a MDG"
          icon={<Send className="w-4 h-4" />}
          onClick={onSendToMdg}
          variant="primary"
          loading={isSending}
          disabled={!isCompleted}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {['Carga', 'Análisis', 'Recálculo', 'Generación', 'Envío MDG'].map((step, i) => {
          const stepMap: AppState[] = ['files_loaded', 'analyzed', 'recalculated', 'completed', 'sent'];
          const isActive = stepMap.slice(0, i + 1).includes(appState);
          const isCurrent =
            (i === 0 && (appState === 'files_loaded' || appState === 'analyzing')) ||
            (i === 1 && (appState === 'analyzed' || appState === 'recalculating')) ||
            (i === 2 && (appState === 'recalculated' || appState === 'generating')) ||
            (i === 3 && (appState === 'completed' || appState === 'sending')) ||
            (i === 4 && (appState === 'sending' || appState === 'sent'));

          return (
            <div key={step} className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md transition-colors ${
                  isCurrent
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : isActive
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-blue-500' : isActive ? 'bg-emerald-400' : 'bg-slate-300'}`}
                />
                {step}
              </div>
              {i < 4 && <div className="w-3 h-px bg-slate-200" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
