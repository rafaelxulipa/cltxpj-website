
import React from 'react';

interface ResultCardProps {
  label: string;
  value: number;
  subValue?: string;
  type?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

const ResultCard: React.FC<ResultCardProps> = ({ label, value, subValue, type = 'neutral', icon }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const colors = {
    positive: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    negative: 'text-rose-600 bg-rose-50 border-rose-100',
    neutral: 'text-slate-900 bg-white border-slate-200'
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md ${colors[type]}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium opacity-80">{label}</span>
        {icon && <div className="opacity-60">{icon}</div>}
      </div>
      <div className="text-3xl font-bold tracking-tight">
        {formatCurrency(value)}
      </div>
      {subValue && (
        <div className="mt-2 text-sm font-medium opacity-70">
          {subValue}
        </div>
      )}
    </div>
  );
};

export default ResultCard;
