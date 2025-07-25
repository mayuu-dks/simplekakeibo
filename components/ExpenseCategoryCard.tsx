import React, { useMemo } from 'react';
import type { ExpenseCategory, ExpenseItem } from '../types';
import { PlusCircle, Trash2 } from 'lucide-react';

interface ExpenseCategoryCardProps {
  category: ExpenseCategory;
  onAddItem: (categoryId: string, item: Omit<ExpenseItem, 'id'>) => void;
  onRemoveItem: (categoryId: string, itemId: string) => void;
  onUpdateBudget: (categoryId: string, budget: number) => void;
  onUpdateCategoryTitle: (categoryId: string, newTitle: string) => void;
  onRemoveCategory: (categoryId: string) => void;
}

const ExpenseCategoryCard: React.FC<ExpenseCategoryCardProps> = ({ category, onAddItem, onRemoveItem, onUpdateBudget, onUpdateCategoryTitle, onRemoveCategory }) => {
  const totalSpent = useMemo(() => {
    return category.items.reduce((sum, item) => sum + item.amount, 0);
  }, [category.items]);

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('itemName') as HTMLInputElement).value;
    const amount = parseFloat((form.elements.namedItem('itemAmount') as HTMLInputElement).value);
    if (name && !isNaN(amount)) {
      onAddItem(category.id, { name, amount });
      form.reset();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col h-full">
      <div className="flex items-center mb-2 gap-2">
        <input
          type="text"
          value={category.title}
          onChange={e => onUpdateCategoryTitle(category.id, e.target.value)}
          className="text-lg font-bold text-slate-800 bg-transparent border-b border-dashed border-pink-300 focus:border-pink-500 outline-none flex-grow min-w-0"
        />
        <button
          onClick={() => {
            if (window.confirm('このカテゴリを削除しますか？（中の支出も全て消えます）')) {
              onRemoveCategory(category.id);
            }
          }}
          className="text-red-400 hover:text-red-600 p-1"
          title="カテゴリ削除"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <div className="mb-4 text-sm text-slate-500">
        予算: ¥
        <input 
            type="number" 
            value={category.budget} 
            onChange={(e) => onUpdateBudget(category.id, parseInt(e.target.value) || 0)} 
            className="inline-block w-24 bg-slate-100 rounded p-1 ml-1"
            placeholder="予算"
        />
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4" style={{maxHeight: '200px'}}>
        {category.items.length > 0 ? (
          category.items.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm group">
              <span className="text-slate-700 truncate">{item.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">¥{item.amount.toLocaleString()}</span>
                <button onClick={() => onRemoveItem(category.id, item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-sm italic">まだ支出がありません。</p>
        )}
      </div>
       <form onSubmit={handleAddItem} className="mt-auto flex items-center space-x-2 border-t pt-3">
            <input name="itemName" type="text" placeholder="新しい項目" className="flex-grow p-1 text-sm border rounded bg-slate-50 focus:ring-1 focus:ring-pink-400 focus:outline-none"/>
            <input name="itemAmount" type="number" placeholder="金額" className="w-20 p-1 text-sm border rounded bg-slate-50 focus:ring-1 focus:ring-pink-400 focus:outline-none"/>
            <button type="submit" className="text-pink-500 hover:text-pink-600">
                <PlusCircle size={20} />
            </button>
        </form>
      <div className="border-t border-dashed mt-4 pt-2 flex justify-between items-center font-semibold">
        <span className="text-slate-600">合計:</span>
        <span className={`text-slate-800 ${totalSpent > category.budget && category.budget > 0 ? 'text-red-500' : ''}`}>
          ¥{totalSpent.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default ExpenseCategoryCard;