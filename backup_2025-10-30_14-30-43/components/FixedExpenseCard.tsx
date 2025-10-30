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
    <div className="rounded-lg shadow-sm border p-4 flex flex-col" style={{backgroundColor: '#F4E7C8', borderColor: '#E5D4B1'}}>
      <div className="space-y-3 pr-2 mb-4">
        {expenses.length > 0 ? (
          expenses.map(expense => (
            <div key={expense.id} className="flex justify-between items-center text-sm group space-x-2">
              <input
                type="text"
                value={expense.name}
                aria-label={`${expense.name} の名前`}
                onChange={(e) => onUpdateExpense(expense.id, e.target.value, expense.amount)}
                className="flex-grow truncate p-1 rounded focus:outline-none transition-colors font-kaisei" style={{backgroundColor: '#8E8892', borderColor: '#7A7580', color: '#566C8D', textShadow: '0 0 3px #F4E7C8, 0 0 3px #F4E7C8, 0 0 3px #F4E7C8'}} onFocus={(e) => e.target.style.borderColor = '#566C8D'} onBlur={(e) => e.target.style.borderColor = '#7A7580'} onMouseEnter={(e) => e.target.style.backgroundColor = '#7A7580'} onMouseLeave={(e) => e.target.style.backgroundColor = '#8E8892'}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={expense.amount}
                  aria-label={`${expense.name} の金額`}
                  onChange={(e) => onUpdateExpense(expense.id, expense.name, Number(e.target.value))}
                  className="w-24 text-right p-1 rounded focus:outline-none transition-colors font-semibold" style={{backgroundColor: '#8E8892', borderColor: '#7A7580', color: '#566C8D', textShadow: '0 0 3px #F4E7C8, 0 0 3px #F4E7C8, 0 0 3px #F4E7C8'}} onFocus={(e) => e.target.style.borderColor = '#566C8D'} onBlur={(e) => e.target.style.borderColor = '#7A7580'} onMouseEnter={(e) => e.target.style.backgroundColor = '#7A7580'} onMouseLeave={(e) => e.target.style.backgroundColor = '#8E8892'}
                />
                 <span style={{color: '#746155'}}>円</span>
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
          !isAdding && <p className="text-sm italic text-center py-4" style={{color: '#746155'}}>固定費がありません。</p>
        )}
      </div>

      <div className="border-t pt-3 mt-2">
        {isAdding ? (
          <form onSubmit={handleAddSubmit} className="space-y-2">
            <div className="flex items-center space-x-2">
              <input name="expenseName" type="text" placeholder="新しい固定費 (例: ジム)" className="flex-grow p-1 text-sm border rounded focus:outline-none font-kaisei" style={{backgroundColor: '#8E8892', borderColor: '#7A7580', color: '#566C8D', textShadow: '0 0 3px #F4E7C8, 0 0 3px #F4E7C8, 0 0 3px #F4E7C8'}} onFocus={(e) => e.target.style.borderColor = '#566C8D'} onBlur={(e) => e.target.style.borderColor = '#7A7580'} required autoFocus />
              <input name="expenseAmount" type="number" placeholder="金額" className="w-24 p-1 text-sm border rounded focus:outline-none font-semibold" style={{backgroundColor: '#8E8892', borderColor: '#7A7580', color: '#566C8D', textShadow: '0 0 3px #F4E7C8, 0 0 3px #F4E7C8, 0 0 3px #F4E7C8'}} onFocus={(e) => e.target.style.borderColor = '#566C8D'} onBlur={(e) => e.target.style.borderColor = '#7A7580'} required min="0" />
               <span className="text-sm" style={{color: '#746155'}}>円</span>
            </div>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm font-semibold rounded bg-slate-200 hover:bg-slate-300 transition-colors" style={{color: '#746155'}}>キャンセル</button>
                <button type="submit" className="px-3 py-1 text-sm font-semibold rounded text-white transition-colors" style={{backgroundColor: '#566C8D'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#455A75'} onMouseLeave={(e) => e.target.style.backgroundColor = '#566C8D'}>保存</button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center space-x-2 p-2 rounded-md transition-colors font-semibold" style={{color: '#566C8D'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#EBD9BB'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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