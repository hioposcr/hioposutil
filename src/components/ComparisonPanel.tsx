import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Minus, CheckCircle2 } from 'lucide-react';
import type { ComparisonResult } from '../types';

interface Props {
  data: ComparisonResult;
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  variant?: 'default' | 'warning' | 'diff' | 'success';
  icon: React.ReactNode;
}

function MetricCard({ label, value, sub, variant = 'default', icon }: MetricCardProps) {
  const variantStyles: Record<string, string> = {
    default: 'bg-white border-slate-200',
    warning: 'bg-red-50 border-red-200',
    diff: 'bg-amber-50 border-amber-200',
    success: 'bg-emerald-50 border-emerald-200',
  };
  const valueStyles: Record<string, string> = {
    default: 'text-slate-900',
    warning: 'text-red-700',
    diff: 'text-amber-700',
    success: 'text-emerald-700',
  };
  const iconBg: Record<string, string> = {
    default: 'bg-slate-100 text-slate-500',
    warning: 'bg-red-100 text-red-500',
    diff: 'bg-amber-100 text-amber-600',
    success: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 ${variantStyles[variant]}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${iconBg[variant]}`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold tracking-tight ${valueStyles[variant]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function ComparisonPanel({ data }: Props) {
  const badgeStyles =
    data.severity === 'warning'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : data.severity === 'success'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : 'text-slate-600 bg-slate-50 border-slate-200';
  const differencePrefix =
    data.differenceDirection === 'up' ? '+' : data.differenceDirection === 'down' ? '-' : '';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">Panel de Comparación</h3>
        <p className="text-xs text-slate-500 mt-0.5">Análisis de diferencia entre documento original y nota de crédito</p>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Total original"
            value={data.totalOriginal}
            sub="Documento aceptado"
            variant="default"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            label="Total rechazado"
            value={data.totalRechazado}
            sub="NC con error"
            variant="warning"
            icon={<Minus className="w-4 h-4" />}
          />
          <MetricCard
            label="Diferencia"
            value={data.diferencia}
            sub={data.porcentajeDiferencia}
            variant="diff"
            icon={<ArrowRight className="w-4 h-4" />}
          />
          <MetricCard
            label="Total corregido"
            value={data.totalCorregido}
            sub="Estimado"
            variant="success"
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-500 mb-1">Original</span>
                <span className="font-mono text-sm font-semibold text-slate-800">{data.totalOriginal}</span>
              </div>
              <div className="flex flex-col items-center px-3">
                <div className="flex items-center gap-1 text-slate-300">
                  <div className="w-8 h-px bg-slate-300" />
                  <ArrowRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-amber-600 font-semibold mt-1 bg-amber-50 border border-amber-200 px-1.5 rounded">
                  {differencePrefix}
                  {data.diferencia}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-500 mb-1">NC enviada</span>
                <span className="font-mono text-sm font-semibold text-red-600">{data.totalRechazado}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 mb-1">Ajuste a aplicar</span>
              <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                {data.ajusteAplicado}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg border ${badgeStyles}`}>
              {data.statusMessage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
