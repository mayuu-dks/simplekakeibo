import React, { useState } from 'react';
import type { FixedExpense } from '../types';
import { PlusCircle, Trash2 } from 'lucide-react';

interface FixedExpenseCardProps {
  expenses: FixedExpense[];
  onAddExpense: (expense: Omit<FixedExpense, 'id'>) => void;
  onRemoveExpense: (id: string) => void;
  onUpdateExpense: (id: string, name: string, amount: number) => void;
}

const FixedExpenseCard: React.FC<FixedExpenseCardProps> = ({ expenses, onAddExpense, onRemoveExpense, onUpdateExpense }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const nameInput = form.elements.namedItem('expenseName') as HTMLInputElement;
    const amountInput = form.elements.namedItem('expenseAmount') as HTMLInputElement;
    const name = nameInput.value;
    const amount = parseFloat(amountInput.value);

    if (name && !isNaN(amount) && amount >= 0) {
      onAddExpense({ name, amount });
      form.reset();
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col">
      <div className="space-y-3 pr-2 mb-4">
        {expenses.length > 0 ? (
          expenses.map(expense => (
            <div key={expense.id} className="flex justify-between items-center text-sm group space-x-2">
              <input
                type="text"
                value={expense.name}
                aria-label={`${expense.name} の名前`}
                onChange={(e) => onUpdateExpense(expense.id, e.target.value, expense.amount)}
                className="flex-grow text-slate-700 truncate p-1 rounded bg-slate-50 hover:bg-slate-100 focus:bg-slate-100 focus:ring-1 focus:ring-pink-400 focus:outline-none transition-colors"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={expense.amount}
                  aria-label={`${expense.name} の金額`}
                  onChange={(e) => onUpdateExpense(expense.id, expense.name, Number(e.target.value))}
                  className="w-24 text-right p-1 rounded bg-slate-50 hover:bg-slate-100 focus:bg-slate-100 focus:ring-1 focus:ring-pink-400 focus:outline-none transition-colors"
                />
                 <span className="text-slate-500">円</span>
                <button 
                  onClick={() => onRemoveExpense(expense.id)} 
                  className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                  aria-label={`${expense.name}を削除`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          !isAdding && <p className="text-slate-400 text-sm italic text-center py-4">固定費がありません。</p>
        )}
      </div>

      <div className="border-t pt-3 mt-2">
        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="space-y-2">
            <div className="flex items-center space-x-2">
              <input name="expenseName" type="text" placeholder="新しい固定費 (例: ジム)" className="flex-grow p-1 text-sm border rounded bg-slate-50 focus:ring-1 focus:ring-pink-400 focus:outline-none" required autoFocus />
              <input name="expenseAmount" type="number" placeholder="金額" className="w-24 p-1 text-sm border rounded bg-slate-50 focus:ring-1 focus:ring-pink-400 focus:outline-none" required min="0" />
               <span className="text-slate-500 text-sm">円</span>
            </div>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm font-semibold rounded text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors">キャンセル</button>
                <button type="submit" className="px-3 py-1 text-sm font-semibold rounded bg-pink-500 text-white hover:bg-pink-600 transition-colors">保存</button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center space-x-2 text-pink-500 hover:bg-pink-50 p-2 rounded-md transition-colors font-semibold"
            aria-label="新しい固定費を追加"
          >
              <PlusCircle size={20} />
              <span className="font-kaisei">固定費を追加</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default FixedExpenseCard;