import React, { useMemo, useState } from 'react';
import type { ExpenseCategory, ExpenseItem } from '../types';
import { PlusCircle, Trash2, Edit2, Check, X } from 'lucide-react';

interface ExpenseCategoryCardProps {
  category: ExpenseCategory;
  onAddItem: (categoryId: string, item: Omit<ExpenseItem, 'id'>) => void;
  onRemoveItem: (categoryId: string, itemId: string) => void;
  onUpdateBudget: (categoryId: string, budget: number) => void;
  onUpdateCategoryTitle: (categoryId: string, newTitle: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  onUpdateItem: (categoryId: string, itemId: string, name: string, amount: number) => void;
}

const ExpenseCategoryCard: React.FC<ExpenseCategoryCardProps> = ({ 
  category, 
  onAddItem, 
  onRemoveItem, 
  onUpdateBudget, 
  onUpdateCategoryTitle, 
  onRemoveCategory,
  onUpdateItem 
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

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

  const handleStartEdit = (item: ExpenseItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditAmount(item.amount.toString());
  };

  const handleSaveEdit = () => {
    if (editingItemId && editName && !isNaN(parseFloat(editAmount))) {
      onUpdateItem(category.id, editingItemId, editName, parseFloat(editAmount));
      setEditingItemId(null);
      setEditName('');
      setEditAmount('');
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditName('');
    setEditAmount('');
  };

  return (
    <div className="rounded-lg shadow-sm border p-4 flex flex-col h-full" style={{backgroundColor: '#8E8892', borderColor: '#7A7580'}}>
      <div className="flex items-center mb-2 gap-2">
        <input
          type="text"
          value={category.title}
          onChange={e => onUpdateCategoryTitle(category.id, e.target.value)}
          className="text-lg font-bold bg-transparent border-b border-dashed outline-none flex-grow min-w-0" style={{borderBottomColor: '#566C8D', color: '#F4E7C8'}} onFocus={(e) => e.target.style.borderBottomColor = '#455A75'} onBlur={(e) => e.target.style.borderBottomColor = '#566C8D'}
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
      <div className="mb-4 text-sm" style={{color: '#F4E7C8'}}>
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
              {editingItemId === item.id ? (
                // 編集モード
                <div className="flex items-center space-x-2 flex-grow">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-grow p-1 text-xs border rounded bg-white focus:outline-none" style={{borderColor: '#566C8D'}} onFocus={(e) => e.target.style.borderColor = '#455A75'} onBlur={(e) => e.target.style.borderColor = '#566C8D'}
                  />
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-16 p-1 text-xs border rounded bg-white focus:outline-none" style={{borderColor: '#566C8D'}} onFocus={(e) => e.target.style.borderColor = '#455A75'} onBlur={(e) => e.target.style.borderColor = '#566C8D'}
                  />
                  <button 
                    onClick={handleSaveEdit}
                    className="text-green-500 hover:text-green-600 p-1"
                    title="保存"
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-600 p-1"
                    title="キャンセル"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                // 表示モード
                <>
                  <span className="truncate flex-grow" style={{color: '#F4E7C8'}}>{item.name}</span>
                  <div className="flex items-center space-x-2">
                    <span style={{color: '#F4E7C8'}}>¥{item.amount.toLocaleString()}</span>
                    <button 
                      onClick={() => handleStartEdit(item)} 
                      className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="編集"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onRemoveItem(category.id, item.id)} 
                      className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm italic" style={{color: '#F4E7C8'}}>まだ支出がありません。</p>
        )}
      </div>
       <form onSubmit={handleAddItem} className="mt-auto flex items-center space-x-2 border-t pt-3">
            <input name="itemName" type="text" placeholder="新しい項目" className="flex-grow p-1 text-sm border rounded bg-slate-50 focus:outline-none" style={{borderColor: '#566C8D'}} onFocus={(e) => e.target.style.borderColor = '#455A75'} onBlur={(e) => e.target.style.borderColor = '#566C8D'}/>
            <input name="itemAmount" type="number" placeholder="金額" className="w-20 p-1 text-sm border rounded bg-slate-50 focus:outline-none" style={{borderColor: '#566C8D'}} onFocus={(e) => e.target.style.borderColor = '#455A75'} onBlur={(e) => e.target.style.borderColor = '#566C8D'}/>
            <button type="submit" style={{color: '#566C8D'}} onMouseEnter={(e) => e.target.style.color = '#455A75'} onMouseLeave={(e) => e.target.style.color = '#566C8D'}>
                <PlusCircle size={20} />
            </button>
        </form>
      <div className="border-t border-dashed mt-4 pt-2 flex justify-between items-center font-semibold">
        <span style={{color: '#F4E7C8'}}>合計:</span>
        <span style={{color: totalSpent > category.budget && category.budget > 0 ? '#FF6B6B' : '#F4E7C8'}}>
          ¥{totalSpent.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default ExpenseCategoryCard;