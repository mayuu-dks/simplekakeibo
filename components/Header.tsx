import React from 'react';
import { BookOpenText, Download } from 'lucide-react';

interface HeaderProps {
    activeMonthId: string; // YYYY-MM format
    onDownload: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeMonthId, onDownload }) => {
  const [year, month] = activeMonthId.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  
  const displayMonth = date.toLocaleString('ja-JP', { month: 'long' });
  const displayYear = date.getFullYear();

  return (
    <header className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between text-slate-700">
      <div className="flex items-center space-x-3">
        <BookOpenText className="w-8 h-8 text-pink-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">家計簿</h1>
          <p className="text-sm text-slate-500">月々の収支を記録しましょう</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-xl font-semibold tracking-wider">{displayMonth}</div>
          <div className="text-sm text-slate-500">{displayYear}年</div>
        </div>
         <button
            onClick={onDownload}
            aria-label="現在の月をHTMLとしてダウンロード"
            className="p-2 text-slate-500 hover:text-pink-600 hover:bg-pink-100 rounded-full transition-colors duration-200"
        >
            <Download className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;