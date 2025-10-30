import React, { useState } from 'react';
import { X, Edit3, Trash2, ArrowUp, ArrowDown, Calendar } from 'lucide-react';

interface MonthEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    months: Array<{ monthId: string }>;
    activeMonthId: string;
    onReorderMonths: (fromIndex: number, toIndex: number) => void;
    onDeleteMonth: (monthId: string) => void;
    onRenameMonth: (monthId: string, newMonthId: string) => void;
    onSelectMonth: (monthId: string) => void;
}

const MonthEditModal: React.FC<MonthEditModalProps> = ({
    isOpen,
    onClose,
    months,
    activeMonthId,
    onReorderMonths,
    onDeleteMonth,
    onRenameMonth,
    onSelectMonth
}) => {
    const [editingMonthId, setEditingMonthId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    if (!isOpen) return null;

    const formatMonthId = (monthId: string) => {
        const [year, month] = monthId.split('-');
        return `${year}年${month}月`;
    };

    const parseMonthId = (displayText: string) => {
        const match = displayText.match(/(\d{4})年(\d{1,2})月/);
        if (match) {
            const year = match[1];
            const month = match[2].padStart(2, '0');
            return `${year}-${month}`;
        }
        return null;
    };

    const handleStartEdit = (monthId: string) => {
        setEditingMonthId(monthId);
        setEditValue(formatMonthId(monthId));
    };

    const handleSaveEdit = () => {
        if (editingMonthId && editValue) {
            const newMonthId = parseMonthId(editValue);
            if (newMonthId && newMonthId !== editingMonthId) {
                // 重複チェック
                if (months.some(m => m.monthId === newMonthId)) {
                    alert('同じ年月の月が既に存在します。');
                    return;
                }
                onRenameMonth(editingMonthId, newMonthId);
            }
        }
        setEditingMonthId(null);
        setEditValue('');
    };

    const handleCancelEdit = () => {
        setEditingMonthId(null);
        setEditValue('');
    };

    const handleMoveUp = (index: number) => {
        if (index > 0) {
            onReorderMonths(index, index - 1);
        }
    };

    const handleMoveDown = (index: number) => {
        if (index < months.length - 1) {
            onReorderMonths(index, index + 1);
        }
    };

    const handleDelete = (monthId: string) => {
        if (months.length <= 1) {
            alert('最後の月は削除できません。');
            return;
        }
        if (window.confirm('この月を削除しますか？この操作は取り消せません。')) {
            onDeleteMonth(monthId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-dark font-kaisei flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary" />
                        月の管理
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="space-y-3">
                        {months.map((month, index) => (
                            <div
                                key={month.monthId}
                                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                                    month.monthId === activeMonthId
                                        ? 'border-primary bg-orange-50'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 font-mono">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    {editingMonthId === month.monthId ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="px-3 py-1 border border-gray-300 rounded text-sm font-kaisei"
                                                placeholder="2024年1月"
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleSaveEdit}
                                                className="text-green-600 hover:text-green-800 p-1"
                                                title="保存"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="キャンセル"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-semibold text-dark font-kaisei">
                                                {formatMonthId(month.monthId)}
                                            </span>
                                            {month.monthId === activeMonthId && (
                                                <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                                                    現在
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    {editingMonthId !== month.monthId && (
                                        <>
                                            <button
                                                onClick={() => handleStartEdit(month.monthId)}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                                title="編集"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveUp(index)}
                                                disabled={index === 0}
                                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="上に移動"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveDown(index)}
                                                disabled={index === months.length - 1}
                                                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="下に移動"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(month.monthId)}
                                                disabled={months.length <= 1}
                                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="削除"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">操作説明</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• <strong>編集</strong>: 月の年月を変更できます</li>
                            <li>• <strong>上/下移動</strong>: 月の表示順序を変更できます</li>
                            <li>• <strong>削除</strong>: 月を削除できます（最後の月は削除不可）</li>
                            <li>• 月をクリックするとその月に切り替わります</li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonthEditModal;
