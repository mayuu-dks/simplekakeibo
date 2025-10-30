import React from 'react';
import { BookOpenText, Download, RotateCcw, Settings } from 'lucide-react';

interface HeaderProps {
  activeMonthId: string; // YYYY-MM format
  onDownload: () => void;
  onReset: () => void;
  onOpenDataManagement: () => void;
  isSaving?: boolean;
}

const Header: React.FC<HeaderProps> = ({ activeMonthId, onDownload, onReset, onOpenDataManagement, isSaving = false }) => {
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
          <p className="text-sm text-white opacity-90">
            月々の収支を記録しましょう
            {isSaving && <span className="ml-2 text-yellow-300">💾 保存中...</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-xl font-semibold tracking-wider text-white">{displayMonth}</div>
          <div className="text-sm text-white opacity-90">{displayYear}年</div>
        </div>
               <div className="flex items-center space-x-3">
                 <button
                   onClick={onOpenDataManagement}
                   className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                 >
                   <Settings className="w-4 h-4" />
                   <span>データ保存</span>
                 </button>
                 <button
                   onClick={onDownload}
                   aria-label="現在の月をHTMLとしてダウンロード"
                   className="p-2 text-white hover:text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
                   title="HTMLダウンロード"
                 >
                   <Download className="w-6 h-6" />
                 </button>
               </div>
      </div>
    </header>
  );
};

export default Header;