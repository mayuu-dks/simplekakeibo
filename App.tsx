import React, { useState, useMemo, useCallback } from 'react';
import type { MonthData, ExpenseCategory, FixedExpense, ExpenseItem, ParsedExpense } from './types';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import ExpenseCategoryCard from './components/ExpenseCategoryCard';
import FixedExpenseCard from './components/FixedExpenseCard';
import MonthTabs from './components/MonthTabs';
import { generateHtmlForMonth } from './services/exportService';
import { DollarSign, PiggyBank, ReceiptText, Wallet, BarChart2 } from 'lucide-react';
// import SmartInput from './components/SmartInput'; // 削除

const createInitialMonth = (): MonthData => {
    const initialMonthId = new Date().toISOString().slice(0, 7); // e.g., "2024-07"
    return {
        monthId: initialMonthId,
        income: 190000,
        preemptiveSavings: 30000,
        fixedExpenses: [
            { id: 'fe1', name: '住居費', amount: 47000 },
            { id: 'fe2', name: '水道・光熱費', amount: 12500 },
            { id: 'fe3', name: '通信費', amount: 2483 },
            { id: 'fe4', name: 'その他', amount: 9600 },
        ],
        categories: [
            { id: 'cat1', title: '定期', budget: 20000, items: [{ id: 'i1', name: 'ブルーベリーアイ', amount: 1584 }] },
            { id: 'cat2', title: '日用品', budget: 45000, items: [{ id: 'i2', name: 'Amazon', amount: 20000 }, { id: 'i3', name: 'ペイペイ', amount: 15000 }] },
            { id: 'cat3', title: '臨時出費', budget: 8000, items: [{ id: 'i4', name: 'ギフトカード', amount: 3300 }] },
            { id: 'cat4', title: 'ローン返済', budget: 20000, items: [{ id: 'i5', name: 'Loop Cloude', amount: 2700 }, { id: 'i6', name: 'Amazon年会費', amount: 1670 }] },
        ],
        memo: '月初に立てた目標：\n・週の食費を15,000円以内に抑える。\n・月末に5,000円余らせて貯金に回す。'
    };
};

const App: React.FC = () => {
    const [allMonthsData, setAllMonthsData] = useState<MonthData[]>([createInitialMonth()]);
    const [activeMonthId, setActiveMonthId] = useState<string>(allMonthsData[0].monthId);

    const activeMonthData = useMemo(() => {
        return allMonthsData.find(m => m.monthId === activeMonthId) ?? allMonthsData[0];
    }, [allMonthsData, activeMonthId]);

    const { income, preemptiveSavings, fixedExpenses, categories, memo } = activeMonthData;

    const totalFixedExpenses = useMemo(() => fixedExpenses.reduce((sum, item) => sum + item.amount, 0), [fixedExpenses]);
    const discretionarySpending = useMemo(() => income - preemptiveSavings - totalFixedExpenses, [income, preemptiveSavings, totalFixedExpenses]);
    const totalVariableExpenses = useMemo(() => categories.reduce((sum, cat) => sum + cat.items.reduce((itemSum, item) => itemSum + item.amount, 0), 0), [categories]);
    const remainingDiscretionary = useMemo(() => discretionarySpending - totalVariableExpenses, [discretionarySpending, totalVariableExpenses]);
    const totalSavingsThisMonth = useMemo(() => preemptiveSavings + (remainingDiscretionary > 0 ? remainingDiscretionary : 0), [preemptiveSavings, remainingDiscretionary]);
    
    const updateActiveMonth = useCallback((updateFn: (month: MonthData) => MonthData) => {
        setAllMonthsData((prevData: MonthData[]) =>
            prevData.map(month =>
                month.monthId === activeMonthId ? updateFn(month) : month
            )
        );
    }, [activeMonthId]);

    const handleUpdateIncome = (newIncome: number) => updateActiveMonth((m: MonthData) => ({...m, income: newIncome}));
    const handleUpdatePreemptiveSavings = (newSavings: number) => updateActiveMonth((m: MonthData) => ({...m, preemptiveSavings: newSavings}));
    
    // --- 固定費ハンドラ ---
    const handleAddFixedExpense = useCallback((expense: Omit<FixedExpense, 'id'>) => {
        updateActiveMonth((m: MonthData) => ({ ...m, fixedExpenses: [...m.fixedExpenses, { ...expense, id: `fe_${Date.now()}` }] }));
    }, [updateActiveMonth]);

    const handleRemoveFixedExpense = useCallback((id: string) => {
        updateActiveMonth((m: MonthData) => ({ ...m, fixedExpenses: m.fixedExpenses.filter(exp => exp.id !== id) }));
    }, [updateActiveMonth]);

    const handleUpdateFixedExpense = useCallback((id: string, name: string, amount: number) => {
        updateActiveMonth((m: MonthData) => ({...m, fixedExpenses: m.fixedExpenses.map(exp => exp.id === id ? { ...exp, name, amount: isNaN(amount) ? 0 : amount } : exp)}));
    }, [updateActiveMonth]);

    // --- 変動費ハンドラ ---
    const handleAddItem = useCallback((categoryId: string, item: Omit<ExpenseItem, 'id'>) => {
        updateActiveMonth((m: MonthData) => ({
            ...m,
            categories: m.categories.map(cat =>
                cat.id === categoryId
                    ? { ...cat, items: [...cat.items, { ...item, id: `item_${Date.now()}` }] }
                    : cat
            )
        }));
    }, [updateActiveMonth]);

    const handleRemoveItem = useCallback((categoryId: string, itemId: string) => {
        updateActiveMonth((m: MonthData) => ({
            ...m,
            categories: m.categories.map(cat =>
                cat.id === categoryId
                    ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
                    : cat
            )
        }));
    }, [updateActiveMonth]);
    
    const handleUpdateBudget = useCallback((categoryId: string, budget: number) => {
        updateActiveMonth((m: MonthData) => ({
            ...m,
            categories: m.categories.map(cat =>
                cat.id === categoryId ? { ...cat, budget: isNaN(budget) ? 0 : budget } : cat
            )
        }));
    }, [updateActiveMonth]);

    // カテゴリ追加・編集・削除ハンドラ
    const handleAddCategory = useCallback((title: string, budget: number) => {
        updateActiveMonth((m: MonthData) => ({
            ...m,
            categories: [
                ...m.categories,
                { id: `cat_${Date.now()}_${title}`, title, budget, items: [] }
            ]
        }));
    }, [updateActiveMonth]);

    const handleUpdateCategoryTitle = useCallback((categoryId: string, newTitle: string) => {
        updateActiveMonth((m: MonthData) => ({
            ...m,
            categories: m.categories.map(cat =>
                cat.id === categoryId ? { ...cat, title: newTitle } : cat
            )
        }));
    }, [updateActiveMonth]);

    const handleRemoveCategory = useCallback((categoryId: string) => {
        updateActiveMonth((m: MonthData) => ({
            ...m,
            categories: m.categories.filter(cat => cat.id !== categoryId)
        }));
    }, [updateActiveMonth]);

    // handleExpenseParsed 削除
    
    const handleUpdateMemo = useCallback((memo: string) => {
        updateActiveMonth((m: MonthData) => ({ ...m, memo }));
    }, [updateActiveMonth]);

    const handleAddMonth = useCallback(() => {
        const lastMonth = allMonthsData.sort((a: MonthData, b: MonthData) => a.monthId.localeCompare(b.monthId)).slice(-1)[0];
        const [year, month] = lastMonth.monthId.split('-').map(Number);
        const nextMonthDate = new Date(year, month, 1);
        
        const newMonthId = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

        if (allMonthsData.some((m: MonthData) => m.monthId === newMonthId)) return;

        const newMonthData: MonthData = {
            monthId: newMonthId,
            income: lastMonth.income,
            preemptiveSavings: lastMonth.preemptiveSavings,
            fixedExpenses: lastMonth.fixedExpenses.map(({ name, amount }: { name: string; amount: number }) => ({ id: `fe_${Date.now()}_${name}`, name, amount })),
            categories: lastMonth.categories.map(({ title, budget }: { title: string; budget: number }) => ({
                id: `cat_${Date.now()}_${title}`,
                title,
                budget,
                items: [],
            })),
            memo: '',
        };

        setAllMonthsData((prev: MonthData[]) => [...prev, newMonthData].sort((a: MonthData, b: MonthData) => a.monthId.localeCompare(b.monthId)));
        setActiveMonthId(newMonthId);
    }, [allMonthsData]);

    const handleDownloadHtml = useCallback(() => {
        if (!activeMonthData) return;
    
        const htmlContent = generateHtmlForMonth(activeMonthData);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.href = url;
        a.download = `家計簿-${activeMonthData.monthId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, [activeMonthData]);

    const monthsForTabs = useMemo(() => allMonthsData.map((m: MonthData) => ({ monthId: m.monthId })), [allMonthsData]);

    return (
        <div className="min-h-screen bg-stone-50 font-sans text-slate-800">
            <Header activeMonthId={activeMonthId} onDownload={handleDownloadHtml} />

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <MonthTabs
                    months={monthsForTabs}
                    activeMonthId={activeMonthId}
                    onSelectMonth={setActiveMonthId}
                    onAddMonth={handleAddMonth}
                />
            </div>
            
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <SummaryCard title="月収（手取り）" amount={income} color="blue" icon={<DollarSign className="text-blue-500" />}>
                        <input type="number" value={income} onChange={e => handleUpdateIncome(Number(e.target.value))} className="w-full p-1 rounded bg-blue-50 border border-blue-200" />
                    </SummaryCard>
                    <SummaryCard title="先取り貯蓄額" amount={preemptiveSavings} color="pink" icon={<PiggyBank className="text-pink-500" />}>
                         <input type="number" value={preemptiveSavings} onChange={e => handleUpdatePreemptiveSavings(Number(e.target.value))} className="w-full p-1 rounded bg-pink-50 border border-pink-200" />
                    </SummaryCard>
                    <SummaryCard title="必ず出ていくお金（固定費）" amount={totalFixedExpenses} color="slate" icon={<ReceiptText className="text-slate-500" />}>
                       <p className="text-xs text-slate-500">内訳は下記で編集できます。</p>
                    </SummaryCard>
                     <SummaryCard title="やりくり費" amount={discretionarySpending} color="green" icon={<Wallet className="text-green-500" />}>
                        <p className="text-xs text-green-700">この金額が変動費の予算です。</p>
                    </SummaryCard>
                </div>

                <div className="mb-8">
                     <h2 className="text-xl font-bold text-slate-700 mb-4 border-b-2 border-pink-300 pb-2">必ず出ていくお金（固定費）</h2>
                     <div className="max-w-3xl">
                        <FixedExpenseCard
                            expenses={fixedExpenses}
                            onAddExpense={handleAddFixedExpense}
                            onRemoveExpense={handleRemoveFixedExpense}
                            onUpdateExpense={handleUpdateFixedExpense}
                        />
                     </div>
                </div>

                 <div className="mb-8">
                    <h2 className="text-xl font-bold text-slate-700 mb-4 border-b-2 border-pink-300 pb-2">使ったお金メモ</h2>
                    {/* カテゴリ追加フォーム */}
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const title = (form.elements.namedItem('categoryTitle') as HTMLInputElement).value.trim();
                            const budget = parseInt((form.elements.namedItem('categoryBudget') as HTMLInputElement).value) || 0;
                            if (title) {
                                handleAddCategory(title, budget);
                                form.reset();
                            }
                        }}
                        className="flex flex-col md:flex-row items-start md:items-end gap-2 mb-6"
                    >
                        <input name="categoryTitle" type="text" placeholder="新しいカテゴリ名" className="p-2 border rounded w-full md:w-64" required />
                        <input name="categoryBudget" type="number" placeholder="予算（任意）" className="p-2 border rounded w-full md:w-40" min="0" />
                        <button type="submit" className="bg-pink-500 text-white px-4 py-2 rounded font-semibold hover:bg-pink-600 transition-colors">カテゴリ追加</button>
                    </form>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map(cat => (
                            <ExpenseCategoryCard 
                                key={cat.id} 
                                category={cat} 
                                onAddItem={handleAddItem} 
                                onRemoveItem={handleRemoveItem}
                                onUpdateBudget={handleUpdateBudget}
                                onUpdateCategoryTitle={handleUpdateCategoryTitle}
                                onRemoveCategory={handleRemoveCategory}
                            />
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                     <h2 className="text-xl font-bold text-slate-700 mb-4 border-b-2 border-pink-300 pb-2">今月のまとめ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-lg shadow-md">
                         <SummaryCard title="今月使ったお金の合計" amount={totalVariableExpenses} color="slate" icon={<BarChart2 className="text-slate-500" />} />
                         <SummaryCard title="残りのやりくり費" amount={remainingDiscretionary} color="blue" icon={<Wallet className="text-blue-500" />} />
                         <SummaryCard title="今月の貯蓄額" amount={totalSavingsThisMonth} color="green" icon={<PiggyBank className="text-green-500" />} />
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-bold text-slate-700 mb-4 border-b-2 border-pink-300 pb-2">メモ欄</h2>
                    <textarea
                        value={memo}
                        onChange={(e) => handleUpdateMemo(e.target.value)}
                        placeholder="今月の振り返りや来月の目標などを自由に記入できます..."
                        className="w-full p-4 text-base border-2 border-slate-200 rounded-lg shadow-inner bg-white focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none transition-all"
                        rows={5}
                    />
                </div>

            </main>
        </div>
    );
};

export default App;