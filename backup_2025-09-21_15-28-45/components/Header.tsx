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
    <header className="w-full bg-header p-6 flex items-center justify-between text-header">
      <div className="flex items-center space-x-3">
        <BookOpenText className="w-8 h-8 text-white" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-kaisei text-white">ちょうどいい家計簿</h1>
          <p className="text-sm text-white opacity-90">月々の収支を記録しましょう</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-xl font-semibold tracking-wider text-white">{displayMonth}</div>
          <div className="text-sm text-white opacity-90">{displayYear}年</div>
        </div>
         <button
            onClick={onDownload}
            aria-label="現在の月をHTMLとしてダウンロード"
            className="p-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
        >
            <Download className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;