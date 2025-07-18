import React from 'react';
import { Plus } from 'lucide-react';

interface MonthTabsProps {
  months: { monthId: string }[];
  activeMonthId: string;
  onSelectMonth: (monthId: string) => void;
  onAddMonth: () => void;
}

const MonthTabs: React.FC<MonthTabsProps> = ({ months, activeMonthId, onSelectMonth, onAddMonth }) => {
  const formatMonth = (monthId: string) => {
    const [year, month] = monthId.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    const monthName = date.toLocaleString('ja-JP', { month: 'long' });
    if (new Date().getFullYear() !== Number(year)) {
        return `${year}年 ${monthName}`;
    }
    return monthName;
  };
    
  return (
    <div className="flex items-center border-b border-slate-200 mb-6 -mx-4 px-4">
      <div className="flex items-center space-x-1 overflow-x-auto pb-2">
        {months.map(({ monthId }) => (
          <button
            key={monthId}
            onClick={() => onSelectMonth(monthId)}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-t-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 ${
              activeMonthId === monthId
                ? 'border-b-2 border-pink-500 text-pink-600 bg-pink-50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {formatMonth(monthId)}
          </button>
        ))}
      </div>
      <button
        onClick={onAddMonth}
        className="ml-4 mb-2 flex items-center space-x-1 px-3 py-2 text-sm font-semibold text-pink-500 bg-white border border-slate-200 rounded-md hover:bg-pink-50 hover:border-pink-300 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
        aria-label="月を追加"
      >
        <Plus size={16} />
        <span>月を追加</span>
      </button>
    </div>
  );
};

export default MonthTabs;
