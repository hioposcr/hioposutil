import { AlertTriangle, Info, Shield, Hash } from 'lucide-react';

interface Warning {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: 'warning' | 'info';
}

const warnings: Warning[] = [
  {
    icon: <Hash className="w-4 h-4" />,
    title: 'Nueva clave y consecutivo recomendados',
    description:
      'En un flujo real, la nota de crédito corregida debería generar una nueva clave electrónica, un nuevo número consecutivo y una nueva fecha de emisión.',
    type: 'warning',
  },
  {
    icon: <Shield className="w-4 h-4" />,
    title: 'Validación fiscal es responsabilidad del sistema final',
    description:
      'Esta herramienta calcula el ajuste necesario, pero la validación definitiva ante Hacienda depende del sistema de facturación electrónica que procese el reenvío.',
    type: 'warning',
  },
  {
    icon: <Info className="w-4 h-4" />,
    title: 'Herramienta operativa de apoyo',
    description:
      'NC Rounding Fixer es un apoyo interno para identificar y corregir diferencias de redondeo. No reemplaza el criterio contable ni la revisión del área fiscal.',
    type: 'info',
  },
];

export default function WarningsCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-amber-50/50">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Notas importantes</h3>
          <p className="text-xs text-slate-500">Consideraciones antes de usar el resultado</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-3 px-5 py-4">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                w.type === 'warning'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-blue-50 text-blue-600 border border-blue-200'
              }`}
            >
              {w.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{w.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{w.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
