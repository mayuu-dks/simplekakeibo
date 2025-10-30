import React from 'react';
import { X, Download, Upload, RotateCcw, Database, FileText, Calendar, Tag, Receipt } from 'lucide-react';

interface DataManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: () => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onReset: () => void;
    dataStats: {
        totalMonths: number;
        totalCategories: number;
        totalFixedExpenses: number;
        totalMemoEntries: number;
        lastModified: string;
    };
}

const DataManagementModal: React.FC<DataManagementModalProps> = ({
    isOpen,
    onClose,
    onExport,
    onImport,
    onReset,
    dataStats
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-dark font-kaisei flex items-center gap-2">
                        <Database className="w-6 h-6 text-primary" />
                        データ管理
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* データ統計情報 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-dark mb-3 font-kaisei">データ統計</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <span className="text-sm text-gray-600">月数:</span>
                                <span className="font-semibold text-dark">{dataStats.totalMonths}ヶ月</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Tag className="w-5 h-5 text-green-500" />
                                <span className="text-sm text-gray-600">カテゴリ数:</span>
                                <span className="font-semibold text-dark">{dataStats.totalCategories}個</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-purple-500" />
                                <span className="text-sm text-gray-600">固定費項目:</span>
                                <span className="font-semibold text-dark">{dataStats.totalFixedExpenses}個</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange-500" />
                                <span className="text-sm text-gray-600">メモ項目:</span>
                                <span className="font-semibold text-dark">{dataStats.totalMemoEntries}個</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                最終更新: {dataStats.lastModified}
                            </p>
                        </div>
                    </div>

                    {/* エクスポート機能 */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-dark font-kaisei">データのエクスポート</h3>
                        <p className="text-sm text-gray-600">
                            現在のデータをJSONファイルとしてダウンロードできます。バックアップや他のデバイスへの移行に使用してください。
                        </p>
                        <button
                            onClick={onExport}
                            className="w-full bg-primary hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            データをエクスポート
                        </button>
                    </div>

                    {/* インポート機能 */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-dark font-kaisei">データのインポート</h3>
                        <p className="text-sm text-gray-600">
                            以前にエクスポートしたJSONファイルからデータを復元できます。現在のデータは上書きされます。
                        </p>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={onImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                id="import-file"
                            />
                            <label
                                htmlFor="import-file"
                                className="w-full bg-secondary hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Upload className="w-5 h-5" />
                                ファイルを選択してインポート
                            </label>
                        </div>
                    </div>

                    {/* データリセット */}
                    <div className="space-y-3 border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-red-600 font-kaisei">危険な操作</h3>
                        <p className="text-sm text-gray-600">
                            すべてのデータを削除します。この操作は取り消せません。事前にエクスポートすることをお勧めします。
                        </p>
                        <button
                            onClick={onReset}
                            className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" />
                            すべてのデータをリセット
                        </button>
                    </div>

                    {/* 注意事項 */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-2">注意事項</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>• データはブラウザのローカルストレージに保存されています</li>
                            <li>• ブラウザのデータを削除すると、保存されたデータも失われます</li>
                            <li>• 定期的にエクスポートしてバックアップを取ることをお勧めします</li>
                            <li>• インポート時は、正しいJSONファイルを選択してください</li>
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

export default DataManagementModal;






