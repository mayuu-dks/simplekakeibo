
import React from 'react';

interface SummaryCardProps {
  title: string;
  amount: number;
  color?: 'pink' | 'slate' | 'green' | 'blue';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, color = 'slate', icon, children }) => {
  const colorClasses = {
    pink: 'bg-pink-100 border-pink-200',
    slate: 'bg-slate-100 border-slate-200',
    green: 'bg-green-100 border-green-200 text-green-900',
    blue: 'bg-blue-100 border-blue-200 text-blue-900',
  };

  return (
    <div className={`border rounded-lg p-4 h-full flex flex-col ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-600">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-2">
        ¥{amount.toLocaleString()}
      </p>
      {children && <div className="mt-auto pt-2">{children}</div>}
    </div>
  );
};

export default SummaryCard;
