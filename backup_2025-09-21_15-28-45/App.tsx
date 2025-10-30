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
        income: 0,
        preemptiveSavings: 0,
        fixedExpenses: [
            { id: 'fe1', name: '住居費', amount: 0 },
            { id: 'fe2', name: '電気代', amount: 0 },
            { id: 'fe3', name: 'ガス代', amount: 0 },
            { id: 'fe4', name: '水道代', amount: 0 },
            { id: 'fe5', name: '通信費', amount: 0 },
        ],
        categories: [
            { id: 'cat1', title: '日用品', budget: 0, items: [] },
            { id: 'cat2', title: '臨時出費', budget: 0, items: [] },
            { id: 'cat3', title: 'ローン残高', budget: 0, items: [] },
        ],
        memo: ''
    };
};

// メモ欄の自動計算ロジック（共通）
const calcFreeMemoTotal = (memo: string): number => {
    // 全角数字を半角に変換
    let text = memo.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    // （）内を除去
    text = text.replace(/（[^）]*）/g, '');
    // カンマを除去
    text = text.replace(/,/g, '');
    // 円や¥を除去
    text = text.replace(/[円¥]/g, '');
    let total = 0;
    // 掛け算・割り算式を先に計算
    text = text.replace(/([\d\.\-]+)\s*([×xX*÷/])\s*([\d\.\-]+)/g, (match, a, op, b) => {
        let res = 0;
        const na = parseFloat(a);
        const nb = parseFloat(b);
        if (op === '×' || op === 'x' || op === 'X' || op === '*') res = na * nb;
        else if (op === '÷' || op === '/') res = na / nb;
        else res = 0;
        total += res;
        return '';
    });
    // 残りの数字を合計
    const numMatches = text.match(/-?\d+(?:\.\d+)?/g);
    if (numMatches) {
        for (const n of numMatches) {
            total += parseFloat(n);
        }
    }
    return total;
};

const App: React.FC = () => {
    const [allMonthsData, setAllMonthsData] = useState<MonthData[]>([createInitialMonth()]);
    const [activeMonthId, setActiveMonthId] = useState<string>(allMonthsData[0].monthId);
    const [freeMemo, setFreeMemo] = useState('');

    // カテゴリごとの自由記入欄を管理
    const [categoryFreeMemos, setCategoryFreeMemos] = useState<{ [categoryId: string]: string }>({});
    
    // カテゴリの履歴管理（追加・削除・名前変更の記録）
    const [categoryHistory, setCategoryHistory] = useState<{
        added: Array<{ title: string; budget: number }>;
        removed: Array<{ title: string }>;
        renamed: Array<{ oldTitle: string; newTitle: string }>;
    }>({
        added: [],
        removed: [],
        renamed: []
    });

    const activeMonthData = useMemo(() => {
        return allMonthsData.find(m => m.monthId === activeMonthId) ?? allMonthsData[0];
    }, [allMonthsData, activeMonthId]);

    const { income, preemptiveSavings, fixedExpenses, categories, memo } = activeMonthData;

    const totalFixedExpenses = useMemo(() => fixedExpenses.reduce((sum, item) => sum + item.amount, 0), [fixedExpenses]);
    const discretionarySpending = useMemo(() => income - preemptiveSavings - totalFixedExpenses, [income, preemptiveSavings, totalFixedExpenses]);
    // 各カテゴリの自由記入欄の合計値を集計
    const totalVariableExpenses = useMemo(() => {
        return categories.reduce((sum, cat) => {
            const memo = categoryFreeMemos[cat.id] || '';
            return sum + calcFreeMemoTotal(memo);
        }, 0);
    }, [categories, categoryFreeMemos]);

    // 今月使ったお金の合計 = 固定費 + 変動費
    const totalSpentThisMonth = useMemo(() => totalFixedExpenses + totalVariableExpenses, [totalFixedExpenses, totalVariableExpenses]);
    // 残りのやりくり費 = 月収 - 先取り貯蓄 - 固定費 - 変動費
    const remainingDiscretionary = useMemo(() => income - preemptiveSavings - totalFixedExpenses - totalVariableExpenses, [income, preemptiveSavings, totalFixedExpenses, totalVariableExpenses]);
    // 今月の貯蓄額 = 先取り貯蓄 + (残りのやりくり費がプラスならその分)
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

    // 品目更新ハンドラーを追加
    const handleUpdateItem = useCallback((categoryId: string, itemId: string, name: string, amount: number) => {
        updateActiveMonth((m: MonthData) => ({
            ...m,
            categories: m.categories.map(cat =>
                cat.id === categoryId
                    ? {
                        ...cat,
                        items: cat.items.map(item =>
                            item.id === itemId ? { ...item, name, amount } : item
                        )
                    }
                    : cat
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
        
        // 履歴に追加を記録
        setCategoryHistory(prev => ({
            ...prev,
            added: [...prev.added, { title, budget }]
        }));
    }, [updateActiveMonth]);

    const handleUpdateCategoryTitle = useCallback((categoryId: string, newTitle: string) => {
        updateActiveMonth((m: MonthData) => {
            const oldCategory = m.categories.find(cat => cat.id === categoryId);
            const updatedCategories = m.categories.map(cat =>
                cat.id === categoryId ? { ...cat, title: newTitle } : cat
            );
            
            // 履歴に名前変更を記録
            if (oldCategory && oldCategory.title !== newTitle) {
                setCategoryHistory(prev => ({
                    ...prev,
                    renamed: [...prev.renamed, { oldTitle: oldCategory.title, newTitle }]
                }));
            }
            
            return {
                ...m,
                categories: updatedCategories
            };
        });
    }, [updateActiveMonth]);

    const handleRemoveCategory = useCallback((categoryId: string) => {
        updateActiveMonth((m: MonthData) => {
            const removedCategory = m.categories.find(cat => cat.id === categoryId);
            
            // 履歴に削除を記録
            if (removedCategory) {
                setCategoryHistory(prev => ({
                    ...prev,
                    removed: [...prev.removed, { title: removedCategory.title }]
                }));
            }
            
            return {
                ...m,
                categories: m.categories.filter(cat => cat.id !== categoryId)
            };
        });
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
        
        // 履歴に基づいてカテゴリの変更を適用
        let updatedCategories = [...newMonthData.categories];
        
        // 追加されたカテゴリを適用
        categoryHistory.added.forEach(({ title, budget }) => {
            const existingCategory = updatedCategories.find(cat => cat.title === title);
            if (!existingCategory) {
                updatedCategories.push({
                    id: `cat_${Date.now()}_${title}`,
                    title,
                    budget,
                    items: []
                });
            }
        });
        
        // 削除されたカテゴリを除外
        updatedCategories = updatedCategories.filter(cat => 
            !categoryHistory.removed.some(removed => removed.title === cat.title)
        );
        
        // 名前変更されたカテゴリを適用
        categoryHistory.renamed.forEach(({ oldTitle, newTitle }) => {
            const categoryToRename = updatedCategories.find(cat => cat.title === oldTitle);
            if (categoryToRename) {
                categoryToRename.title = newTitle;
            }
        });
        
        // 更新されたカテゴリで月データを更新
        const finalMonthData = {
            ...newMonthData,
            categories: updatedCategories
        };
        
        setAllMonthsData((prev: MonthData[]) => 
            prev.map(month => 
                month.monthId === newMonthId ? finalMonthData : month
            ).sort((a: MonthData, b: MonthData) => a.monthId.localeCompare(b.monthId))
        );
        
        // 自由記入メモのカテゴリ情報も引き継ぐ
        const newCategoryIds = finalMonthData.categories.map(cat => cat.id);
        const oldCategoryIds = lastMonth.categories.map(cat => cat.id);
        
        // 既存のカテゴリの自由記入データを新しいIDにマッピング
        const newCategoryFreeMemos: { [categoryId: string]: string } = {};
        oldCategoryIds.forEach((oldId, index) => {
            const oldMemo = categoryFreeMemos[oldId] || '';
            const newId = newCategoryIds[index];
            if (newId) {
                newCategoryFreeMemos[newId] = oldMemo;
            }
        });
        
        setCategoryFreeMemos(prev => ({ ...prev, ...newCategoryFreeMemos }));
    }, [allMonthsData, categoryFreeMemos]);

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

    const freeMemoTotal = useMemo(() => calcFreeMemoTotal(freeMemo), [freeMemo]);

    return (
        <div className="min-h-screen bg-light-bg font-mplus text-slate-800">
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
                     <h2 className="text-xl font-bold text-dark mb-4 border-b-2 border-primary pb-2 font-kaisei">必ず出ていくお金（固定費）</h2>
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
                   <div className="flex items-center justify-between mb-4">
                       <h2 className="text-xl font-bold text-dark border-b-2 border-primary pb-2 font-kaisei">使ったお金メモ</h2>
                       <button
                           onClick={() => {
                               const newTitle = prompt('新しいカテゴリ名を入力してください:');
                               if (newTitle && newTitle.trim()) {
                                   handleAddCategory(newTitle.trim(), 0);
                                   // 新しいカテゴリの自由記入欄を初期化
                                   const newCategoryId = `cat_${Date.now()}_${newTitle.trim()}`;
                                   setCategoryFreeMemos(prev => ({ ...prev, [newCategoryId]: '' }));
                               }
                           }}
                           className="bg-secondary hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                       >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                           </svg>
                           <span className="font-kaisei">カテゴリ追加</span>
                       </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {categories.map(cat => {
                           const memo = categoryFreeMemos[cat.id] || '';
                           const total = calcFreeMemoTotal(memo);
                           return (
                               <div key={cat.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col h-full">
                                   <div className="flex items-center mb-2 gap-2">
                                       <input
                                           type="text"
                                           value={cat.title}
                                           onChange={e => handleUpdateCategoryTitle(cat.id, e.target.value)}
                                           className="text-lg font-bold text-dark bg-transparent border-b border-dashed border-secondary focus:border-secondary outline-none flex-grow min-w-0 font-kaisei"
                                       />
                                       <button
                                           onClick={() => {
                                               if (window.confirm('このカテゴリを削除しますか？（中のメモも全て消えます）')) {
                                                   handleRemoveCategory(cat.id);
                                                   // 自由記入欄も削除
                                                   setCategoryFreeMemos(prev => {
                                                       const newMemos = { ...prev };
                                                       delete newMemos[cat.id];
                                                       return newMemos;
                                                   });
                                               }
                                           }}
                                           className="text-red-400 hover:text-red-600 p-1"
                                           title="カテゴリ削除"
                                       >
                                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                           </svg>
                                       </button>
                                   </div>
                                   <textarea
                                       value={memo}
                                       onChange={e => setCategoryFreeMemos(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                       placeholder="自由にメモを記入\n例: スーパー 1200\n-500\n100×3\n(家族分 3000)"
                                       className="w-full p-2 text-base border-2 border-slate-200 rounded-lg shadow-inner bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all mb-2"
                                       rows={6}
                                   />
                                   <div className="text-right text-lg font-bold text-pink-600">合計: ¥{total.toLocaleString()}</div>
                               </div>
                           );
                       })}
                   </div>
               </div>

                <div className="mb-8">
                     <h2 className="text-xl font-bold text-dark mb-4 border-b-2 border-primary pb-2 font-kaisei">今月のまとめ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-lg shadow-md">
                         <SummaryCard title="今月使ったお金の合計" amount={totalSpentThisMonth} color="slate" icon={<BarChart2 className="text-slate-500" />} />
                         <SummaryCard title="残りのやりくり費" amount={remainingDiscretionary} color="blue" icon={<Wallet className="text-blue-500" />} />
                         <SummaryCard title="今月の貯蓄額" amount={totalSavingsThisMonth} color="green" icon={<PiggyBank className="text-green-500" />} />
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-bold text-dark mb-4 border-b-2 border-primary pb-2 font-kaisei">メモ欄</h2>
                    <textarea
                        value={memo}
                        onChange={(e) => handleUpdateMemo(e.target.value)}
                        placeholder="今月の振り返りや来月の目標などを自由に記入できます..."
                        className="w-full p-4 text-base border-2 border-slate-200 rounded-lg shadow-inner bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        rows={5}
                    />
                </div>

            </main>
            
            <footer className="w-full bg-primary py-6 mt-12">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-white opacity-90 font-mplus">
                            © 2025 MayuÜ. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;