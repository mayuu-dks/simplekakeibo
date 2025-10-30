import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { MonthData, ExpenseCategory, FixedExpense, ExpenseItem, ParsedExpense } from './types';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import ExpenseCategoryCard from './components/ExpenseCategoryCard';
import FixedExpenseCard from './components/FixedExpenseCard';
import MonthTabs from './components/MonthTabs';
import DataManagementModal from './components/DataManagementModal';
import MonthEditModal from './components/MonthEditModal';
import { generateHtmlForMonth } from './services/exportService';
import { DollarSign, PiggyBank, ReceiptText, Wallet, BarChart2 } from 'lucide-react';
// import SmartInput from './components/SmartInput'; // 削除

const createInitialMonth = (): MonthData => {
    const initialMonthId = new Date().toISOString().slice(0, 7); // e.g., "2024-07"
    return {
        monthId: initialMonthId,
        income: 0,
        extraIncome: 0,
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
    // 全角・半角括弧内を除去（例：(完)、(1/3)、（完）、（1/3））
    let text = memo;
    // まず完全な括弧ペアを除去
    text = text.replace(/[（(][^）)]*[）)]/g, '');
    // 残った不完全な括弧を除去
    text = text.replace(/[（(][^）)]*/g, ''); // 開き括弧から行末まで
    text = text.replace(/[^（(]*[）)]/g, ''); // 行頭から閉じ括弧まで
    // カンマを除去
    text = text.replace(/,/g, '');
    // 円や¥を除去
    text = text.replace(/[円¥]/g, '');
    let total = 0;
    // 掛け算・割り算式を先に計算（半角数字のみ）
    text = text.replace(/([0-9\.\-]+)\s*([×xX*÷/])\s*([0-9\.\-]+)/g, (match, a, op, b) => {
        let res = 0;
        const na = parseFloat(a);
        const nb = parseFloat(b);
        if (op === '×' || op === 'x' || op === 'X' || op === '*') res = na * nb;
        else if (op === '÷' || op === '/') res = na / nb;
        else res = 0;
        total += res;
        return '';
    });
    // 残りの半角数字のみを合計
    const numMatches = text.match(/-?[0-9]+(?:\.[0-9]+)?/g);
    if (numMatches) {
        for (const n of numMatches) {
            total += parseFloat(n);
        }
    }
    return Math.round(total);
};

const App: React.FC = () => {
    // ローカルストレージからデータを読み込む関数
    const loadDataFromStorage = useCallback(() => {
        try {
            const savedMonthsData = localStorage.getItem('kakeibo-months-data');
            const savedCategoryFreeMemos = localStorage.getItem('kakeibo-category-free-memos');
            const savedCategoryHistory = localStorage.getItem('kakeibo-category-history');
            
            const monthsData = savedMonthsData ? JSON.parse(savedMonthsData).map((month: any) => ({
                ...month,
                extraIncome: month.extraIncome || 0 // 既存データにextraIncomeがない場合は0を設定
            })) : [createInitialMonth()];
            const categoryFreeMemos = savedCategoryFreeMemos ? JSON.parse(savedCategoryFreeMemos) : {};
            const categoryHistory = savedCategoryHistory ? JSON.parse(savedCategoryHistory) : {
                added: [],
                removed: [],
                renamed: []
            };
            
            return { monthsData, categoryFreeMemos, categoryHistory };
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            return {
                monthsData: [createInitialMonth()],
                categoryFreeMemos: {},
                categoryHistory: { added: [], removed: [], renamed: [] }
            };
        }
    }, []);

    // データをローカルストレージに保存する関数
    const saveDataToStorage = useCallback((monthsData: MonthData[], categoryFreeMemos: { [categoryId: string]: string }, categoryHistory: any) => {
        try {
            localStorage.setItem('kakeibo-months-data', JSON.stringify(monthsData));
            localStorage.setItem('kakeibo-category-free-memos', JSON.stringify(categoryFreeMemos));
            localStorage.setItem('kakeibo-category-history', JSON.stringify(categoryHistory));
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
        }
    }, []);

    // textareaの高さを保存する関数
    const saveTextareaHeights = useCallback((heights: { [categoryId: string]: number }) => {
        try {
            localStorage.setItem('kakeibo-textarea-heights', JSON.stringify(heights));
        } catch (error) {
            console.error('textareaの高さの保存に失敗しました:', error);
        }
    }, []);

    // 初期データの読み込み
    const initialData = useMemo(() => loadDataFromStorage(), [loadDataFromStorage]);
    
    const [allMonthsData, setAllMonthsData] = useState<MonthData[]>(initialData.monthsData);
    const [activeMonthId, setActiveMonthId] = useState<string>(initialData.monthsData[0].monthId);
    const [freeMemo, setFreeMemo] = useState('');

    // カテゴリごとの自由記入欄を管理
    const [categoryFreeMemos, setCategoryFreeMemos] = useState<{ [categoryId: string]: string }>(initialData.categoryFreeMemos);
    
    // カテゴリごとのtextareaの高さを管理
    const [categoryTextareaHeights, setCategoryTextareaHeights] = useState<{ [categoryId: string]: number }>(() => {
        try {
            const saved = localStorage.getItem('kakeibo-textarea-heights');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });
    
    // カテゴリの履歴管理（追加・削除・名前変更の記録）
    const [categoryHistory, setCategoryHistory] = useState<{
        added: Array<{ title: string; budget: number }>;
        removed: Array<{ title: string }>;
        renamed: Array<{ oldTitle: string; newTitle: string }>;
    }>(initialData.categoryHistory);

    const activeMonthData = useMemo(() => {
        return allMonthsData.find(m => m.monthId === activeMonthId) ?? allMonthsData[0];
    }, [allMonthsData, activeMonthId]);

    const { income, extraIncome, preemptiveSavings, fixedExpenses, categories, memo } = activeMonthData;

    // データが変更されるたびに自動保存
    const [isSaving, setIsSaving] = useState(false);
    
    // データ管理モーダルの状態
    const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
    
    // 月編集モーダルの状態
    const [isMonthEditOpen, setIsMonthEditOpen] = useState(false);
    
    useEffect(() => {
        setIsSaving(true);
        saveDataToStorage(allMonthsData, categoryFreeMemos, categoryHistory);
        // 保存完了のアニメーション
        const timer = setTimeout(() => setIsSaving(false), 1000);
        return () => clearTimeout(timer);
    }, [allMonthsData, categoryFreeMemos, categoryHistory, saveDataToStorage]);

    // textareaの高さが変更されたら保存
    useEffect(() => {
        saveTextareaHeights(categoryTextareaHeights);
    }, [categoryTextareaHeights, saveTextareaHeights]);

    const totalFixedExpenses = useMemo(() => fixedExpenses.reduce((sum, item) => sum + item.amount, 0), [fixedExpenses]);
    const totalIncome = useMemo(() => income + extraIncome, [income, extraIncome]);
    const discretionarySpending = useMemo(() => totalIncome - preemptiveSavings - totalFixedExpenses, [totalIncome, preemptiveSavings, totalFixedExpenses]);
    // 各カテゴリの自由記入欄の合計値を集計
    const totalVariableExpenses = useMemo(() => {
        return categories.reduce((sum, cat) => {
            const memo = categoryFreeMemos[cat.id] || '';
            return sum + calcFreeMemoTotal(memo);
        }, 0);
    }, [categories, categoryFreeMemos]);

    // 今月使ったお金の合計 = 固定費 + 変動費
    const totalSpentThisMonth = useMemo(() => totalFixedExpenses + totalVariableExpenses, [totalFixedExpenses, totalVariableExpenses]);
    // 残りのやりくり費 = 総収入 - 先取り貯蓄 - 固定費 - 変動費
    const remainingDiscretionary = useMemo(() => totalIncome - preemptiveSavings - totalFixedExpenses - totalVariableExpenses, [totalIncome, preemptiveSavings, totalFixedExpenses, totalVariableExpenses]);
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
    const handleUpdateExtraIncome = (newExtraIncome: number) => updateActiveMonth((m: MonthData) => ({...m, extraIncome: newExtraIncome}));
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
            extraIncome: 0, // 臨時収入は新しい月では0から開始
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
        
        // 自由記入メモのカテゴリ情報は引き継がない（空の状態で開始）
        // カテゴリの構造のみが引き継がれ、記入内容は新しい月で空から開始される
    }, [allMonthsData, categoryFreeMemos]);

    const handleDownloadHtml = useCallback(() => {
        if (!activeMonthData) return;
    
        const htmlContent = generateHtmlForMonth(activeMonthData, categoryFreeMemos);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.href = url;
        a.download = `家計簿-${activeMonthData.monthId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, [activeMonthData, categoryFreeMemos]);

    // データをリセットする関数
    const handleResetData = useCallback(() => {
        if (window.confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
            // ローカルストレージをクリア
            localStorage.removeItem('kakeibo-months-data');
            localStorage.removeItem('kakeibo-category-free-memos');
            localStorage.removeItem('kakeibo-category-history');
            localStorage.removeItem('kakeibo-textarea-heights');
            
            // 状態を初期化
            const initialData = loadDataFromStorage();
            setAllMonthsData(initialData.monthsData);
            setActiveMonthId(initialData.monthsData[0].monthId);
            setCategoryFreeMemos(initialData.categoryFreeMemos);
            setCategoryHistory(initialData.categoryHistory);
            setCategoryTextareaHeights({});
            
            alert('データをリセットしました。');
        }
    }, [loadDataFromStorage]);


    // データをエクスポートする関数
    const handleExportData = useCallback(() => {
        try {
            const exportData = {
                monthsData: allMonthsData,
                categoryFreeMemos: categoryFreeMemos,
                categoryHistory: categoryHistory,
                categoryTextareaHeights: categoryTextareaHeights,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `kakeibo-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('データをエクスポートしました。');
        } catch (error) {
            console.error('エクスポートに失敗しました:', error);
            alert('エクスポートに失敗しました。');
        }
    }, [allMonthsData, categoryFreeMemos, categoryHistory, categoryTextareaHeights]);

    // データをインポートする関数
    const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importData = JSON.parse(content);
                
                // バージョンチェック
                if (!importData.version || importData.version !== '1.0') {
                    alert('サポートされていないファイル形式です。');
                    return;
                }
                
                if (window.confirm('現在のデータを上書きしますか？この操作は取り消せません。')) {
                    // データを復元
                    setAllMonthsData(importData.monthsData || [createInitialMonth()]);
                    setCategoryFreeMemos(importData.categoryFreeMemos || {});
                    setCategoryHistory(importData.categoryHistory || { added: [], removed: [], renamed: [] });
                    setCategoryTextareaHeights(importData.categoryTextareaHeights || {});
                    
                    // ローカルストレージに保存
                    saveDataToStorage(
                        importData.monthsData || [createInitialMonth()],
                        importData.categoryFreeMemos || {},
                        importData.categoryHistory || { added: [], removed: [], renamed: [] }
                    );
                    saveTextareaHeights(importData.categoryTextareaHeights || {});
                    
                    alert('データをインポートしました。');
                }
            } catch (error) {
                console.error('インポートに失敗しました:', error);
                alert('ファイルの読み込みに失敗しました。正しいファイルを選択してください。');
            }
        };
        reader.readAsText(file);
        
        // ファイル入力をリセット
        event.target.value = '';
    }, [saveDataToStorage]);

    // データの統計情報を取得する関数
    const getDataStats = useCallback(() => {
        const totalMonths = allMonthsData.length;
        const totalCategories = allMonthsData.reduce((sum, month) => sum + month.categories.length, 0);
        const totalFixedExpenses = allMonthsData.reduce((sum, month) => sum + month.fixedExpenses.length, 0);
        const totalMemoEntries = Object.keys(categoryFreeMemos).length;
        
        return {
            totalMonths,
            totalCategories,
            totalFixedExpenses,
            totalMemoEntries,
            lastModified: new Date().toLocaleString('ja-JP')
        };
    }, [allMonthsData, categoryFreeMemos]);

    const monthsForTabs = useMemo(() => allMonthsData.map((m: MonthData) => ({ monthId: m.monthId })), [allMonthsData]);

    const freeMemoTotal = useMemo(() => calcFreeMemoTotal(freeMemo), [freeMemo]);

    // データ統計情報を取得
    const dataStats = useMemo(() => getDataStats(), [getDataStats]);

    // 月編集のハンドラー関数
    const handleReorderMonths = useCallback((fromIndex: number, toIndex: number) => {
        setAllMonthsData((prev: MonthData[]) => {
            const newMonths = [...prev];
            const [movedMonth] = newMonths.splice(fromIndex, 1);
            newMonths.splice(toIndex, 0, movedMonth);
            return newMonths;
        });
    }, []);

    const handleDeleteMonth = useCallback((monthId: string) => {
        if (allMonthsData.length <= 1) {
            alert('最後の月は削除できません。');
            return;
        }
        
        setAllMonthsData((prev: MonthData[]) => {
            const newMonths = prev.filter(month => month.monthId !== monthId);
            return newMonths;
        });
        
        // 削除された月がアクティブな月の場合、最初の月に切り替え
        if (activeMonthId === monthId) {
            const remainingMonths = allMonthsData.filter(month => month.monthId !== monthId);
            if (remainingMonths.length > 0) {
                setActiveMonthId(remainingMonths[0].monthId);
            }
        }
        
        // 削除された月のカテゴリの自由記入メモも削除
        setCategoryFreeMemos((prev: { [categoryId: string]: string }) => {
            const newMemos = { ...prev };
            const deletedMonth = allMonthsData.find(month => month.monthId === monthId);
            if (deletedMonth) {
                deletedMonth.categories.forEach(cat => {
                    delete newMemos[cat.id];
                });
            }
            return newMemos;
        });
    }, [allMonthsData, activeMonthId]);

    const handleRenameMonth = useCallback((oldMonthId: string, newMonthId: string) => {
        // 重複チェック
        if (allMonthsData.some(month => month.monthId === newMonthId)) {
            alert('同じ年月の月が既に存在します。');
            return;
        }
        
        setAllMonthsData((prev: MonthData[]) => 
            prev.map(month => 
                month.monthId === oldMonthId 
                    ? { ...month, monthId: newMonthId }
                    : month
            )
        );
        
        // アクティブな月が変更された場合、新しいIDに更新
        if (activeMonthId === oldMonthId) {
            setActiveMonthId(newMonthId);
        }
    }, [allMonthsData, activeMonthId]);

    return (
        <div className="min-h-screen font-mplus" style={{backgroundColor: '#746155', color: '#2D1B1B'}}>
            <Header 
                activeMonthId={activeMonthId} 
                onDownload={handleDownloadHtml} 
                onReset={handleResetData} 
                onOpenDataManagement={() => setIsDataManagementOpen(true)}
                isSaving={isSaving} 
            />

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <MonthTabs
                    months={monthsForTabs}
                    activeMonthId={activeMonthId}
                    onSelectMonth={setActiveMonthId}
                    onAddMonth={handleAddMonth}
                    onOpenMonthEdit={() => setIsMonthEditOpen(true)}
                />
            </div>
            
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <SummaryCard title="収入" amount={totalIncome} color="blue" icon={<DollarSign className="text-blue-500" />}>
                        <div className="space-y-2">
                            <div>
                                <label className="text-xs font-medium" style={{color: '#F4E7C8'}}>月収（手取り）</label>
                                <input 
                                    type="number" 
                                    value={income} 
                                    onChange={e => handleUpdateIncome(Number(e.target.value))} 
                                    onFocus={e => e.target.select()}
                                    className="w-full p-1 rounded text-sm" style={{backgroundColor: '#F4E7C8', border: '1px solid #E5D4B1', color: '#746155'}} 
                                />
                            </div>
                            {extraIncome > 0 && (
                                <div>
                                    <label className="text-xs font-medium" style={{color: '#F4E7C8'}}>臨時収入</label>
                                    <div className="flex items-center space-x-1">
                                        <input 
                                            type="number" 
                                            value={extraIncome} 
                                            onChange={e => handleUpdateExtraIncome(Number(e.target.value))} 
                                            onFocus={e => e.target.select()}
                                            className="flex-1 p-1 rounded text-sm" style={{backgroundColor: '#F4E7C8', border: '1px solid #E5D4B1', color: '#746155'}} 
                                        />
                                        <button
                                            onClick={() => handleUpdateExtraIncome(0)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            title="臨時収入を削除"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                            {extraIncome === 0 && (
                                <button
                                    onClick={() => handleUpdateExtraIncome(1)}
                                    className="w-full flex items-center justify-center space-x-1 bg-green-50 hover:bg-green-100 p-2 rounded transition-colors text-sm font-kaisei"
                                    style={{color: '#566C8D', textShadow: '0 0 3px #f0fdf4, 0 0 3px #f0fdf4, 0 0 3px #f0fdf4'}}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{filter: 'drop-shadow(0 0 3px #f0fdf4) drop-shadow(0 0 3px #f0fdf4)'}}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>臨時収入を追加</span>
                                </button>
                            )}
                            <div className="pt-2 border-t border-blue-200">
                                <div className="text-xs font-medium" style={{color: '#F4E7C8'}}>総収入: ¥{totalIncome.toLocaleString()}</div>
                            </div>
                        </div>
                    </SummaryCard>
                    <SummaryCard title="先取り貯蓄額" amount={preemptiveSavings} color="pink" icon={<PiggyBank style={{color: '#566C8D'}} />}>
                         <input 
                             type="number" 
                             value={preemptiveSavings} 
                             onChange={e => handleUpdatePreemptiveSavings(Number(e.target.value))} 
                             onFocus={e => e.target.select()}
                             className="w-full p-1 rounded" style={{backgroundColor: '#F4E7C8', border: '1px solid #E5D4B1', color: '#746155'}} 
                         />
                    </SummaryCard>
                    <SummaryCard title="必ず出ていくお金（固定費）" amount={totalFixedExpenses} color="slate" icon={<ReceiptText className="text-slate-500" />}>
                       <p className="text-xs" style={{color: '#F4E7C8'}}>内訳は下記で編集できます。</p>
                    </SummaryCard>
                    <SummaryCard title="やりくり費" amount={discretionarySpending} color="green" icon={<Wallet className="text-green-500" />}>
                        <p className="text-xs" style={{color: '#F4E7C8'}}>この金額が変動費の予算です。</p>
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
                           className="bg-secondary hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2" style={{color: '#F4E7C8'}}
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
                               <div key={cat.id} className="rounded-lg shadow-sm border p-4 flex flex-col h-full" style={{backgroundColor: '#F4E7C8', borderColor: '#E5D4B1'}}>
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
                                       onMouseUp={e => {
                                           const target = e.target as HTMLTextAreaElement;
                                           const newHeight = target.offsetHeight;
                                           if (newHeight !== categoryTextareaHeights[cat.id]) {
                                               setCategoryTextareaHeights(prev => ({
                                                   ...prev,
                                                   [cat.id]: newHeight
                                               }));
                                           }
                                       }}
                                       onKeyUp={e => {
                                           const target = e.target as HTMLTextAreaElement;
                                           const newHeight = target.scrollHeight;
                                           if (newHeight !== categoryTextareaHeights[cat.id]) {
                                               setCategoryTextareaHeights(prev => ({
                                                   ...prev,
                                                   [cat.id]: newHeight
                                               }));
                                           }
                                       }}
                                       onResize={e => {
                                           const target = e.target as HTMLTextAreaElement;
                                           const newHeight = target.offsetHeight;
                                           if (newHeight !== categoryTextareaHeights[cat.id]) {
                                               setCategoryTextareaHeights(prev => ({
                                                   ...prev,
                                                   [cat.id]: newHeight
                                               }));
                                           }
                                       }}
                                       placeholder="自由にメモを記入\n例: スーパー 1200\n-500\n100×3\n(家族分 3000)"
                                       className="w-full p-2 text-base border-2 rounded-lg shadow-inner focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all mb-2" style={{borderColor: '#E5D4B1', backgroundColor: '#FDFBF7'}}
                                       style={{ height: categoryTextareaHeights[cat.id] || 'auto', minHeight: '120px' }}
                                       rows={6}
                                   />
                                   <div className="text-right text-lg font-bold" style={{color: '#566C8D'}}>合計: ¥{total.toLocaleString()}</div>
                               </div>
                           );
                       })}
                   </div>
               </div>

                <div className="mb-8">
                     <h2 className="text-xl font-bold text-dark mb-4 border-b-2 border-primary pb-2 font-kaisei">今月のまとめ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-lg shadow-md border" style={{backgroundColor: '#8E8892', borderColor: '#7A7580'}}>
                         <SummaryCard title="今月使ったお金の合計" amount={totalSpentThisMonth} color="slate" icon={<BarChart2 className="text-slate-500" />} isSummarySection={true} customAmountColor="#566C8D" />
                         <SummaryCard title="残りのやりくり費" amount={remainingDiscretionary} color="blue" icon={<Wallet className="text-blue-500" />} isSummarySection={true} customAmountColor="#566C8D" />
                         <SummaryCard title="今月の貯蓄額" amount={totalSavingsThisMonth} color="green" icon={<PiggyBank className="text-green-500" />} isSummarySection={true} customAmountColor="#566C8D" />
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-bold text-dark mb-4 border-b-2 border-primary pb-2 font-kaisei">メモ欄</h2>
                    <textarea
                        value={memo}
                        onChange={(e) => handleUpdateMemo(e.target.value)}
                        placeholder="今月の振り返りや来月の目標などを自由に記入できます..."
                        className="w-full p-4 text-base border-2 rounded-lg shadow-inner focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" style={{borderColor: '#E5D4B1', backgroundColor: '#FDFBF7'}}
                        rows={5}
                    />
                </div>

            </main>
            
            <footer className="w-full py-6 mt-12" style={{backgroundColor: '#F4E7C8'}}>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="font-mplus" style={{color: '#566C8D', opacity: 0.9}}>
                            © 2025 MayuÜ. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>

            {/* データ管理モーダル */}
            <DataManagementModal
                isOpen={isDataManagementOpen}
                onClose={() => setIsDataManagementOpen(false)}
                onExport={handleExportData}
                onImport={handleImportData}
                onReset={handleResetData}
                dataStats={dataStats}
            />

            {/* 月編集モーダル */}
            <MonthEditModal
                isOpen={isMonthEditOpen}
                onClose={() => setIsMonthEditOpen(false)}
                months={monthsForTabs}
                activeMonthId={activeMonthId}
                onReorderMonths={handleReorderMonths}
                onDeleteMonth={handleDeleteMonth}
                onRenameMonth={handleRenameMonth}
                onSelectMonth={setActiveMonthId}
            />
        </div>
    );
};

export default App;