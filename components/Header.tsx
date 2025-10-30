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
    <header className="w-full p-6 flex items-center justify-between" style={{backgroundColor: '#F4E7C8'}}>
      <div className="flex items-center space-x-3">
        <BookOpenText className="w-8 h-8" style={{color: '#566C8D'}} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-kaisei" style={{color: '#566C8D', textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white'}}>ちょうどいい家計簿</h1>
          <p className="text-sm" style={{color: '#566C8D', opacity: 0.9}}>
            簡単、見やすい、ちょうどいい
            {isSaving && <span className="ml-2" style={{color: '#566C8D'}}>💾 保存中...</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-xl font-semibold tracking-wider" style={{color: '#566C8D'}}>{displayMonth}</div>
          <div className="text-sm" style={{color: '#566C8D', opacity: 0.9}}>{displayYear}年</div>
        </div>
               <div className="flex flex-col space-y-2">
                 <button
                   onClick={(e) => {
                     (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F6B7A';
                     onOpenDataManagement();
                   }}
                   className="px-3 py-1.5 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 text-sm"
                   style={{backgroundColor: '#0F6B7A', color: '#F4E7C8'}}
                   onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D5A64'}
                   onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F6B7A'}
                 >
                   <Settings className="w-4 h-4" />
                   <span>データ保存</span>
                 </button>
                 <button
                   onClick={onDownload}
                   aria-label="現在の月をHTMLとしてダウンロード"
                   className="px-3 py-1.5 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm" 
                   style={{color: '#566C8D'}} 
                   onMouseEnter={(e) => {(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F0E5C8'; (e.currentTarget as HTMLButtonElement).style.color = '#455A75'}} 
                   onMouseLeave={(e) => {(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#566C8D'}}
                   title="HTMLダウンロード"
                 >
                   <Download className="w-4 h-4" />
                   <span>HTML出力</span>
                 </button>
               </div>
      </div>
    </header>
  );
};

export default Header;