import type { MonthData } from '../types';

const getStyles = () => `
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #FDFBF7;
    color: #334155;
    margin: 0;
    padding: 2rem;
  }
  .container {
    max-width: 1100px;
    margin: 0 auto;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }
  .header h1 {
    font-size: 2rem;
    font-weight: bold;
    color: #334155;
    margin: 0;
  }
  .header .date {
    text-align: right;
  }
  .header .month {
    font-size: 1.5rem;
    font-weight: 600;
  }
  .header .year {
    font-size: 1rem;
    color: #64748b;
  }
  .grid {
    display: grid;
    gap: 1.5rem;
  }
  .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

  .card {
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1rem;
    background-color: #ffffff;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  }
  .summary-card {
      padding: 1.5rem;
      border-radius: 0.75rem;
  }
  .summary-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #475569;
    margin: 0 0 0.5rem 0;
  }
  .summary-card .amount {
    font-size: 2rem;
    font-weight: bold;
    color: #1e293b;
  }
   .summary-card .notes {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 1rem;
   }
  
  .bg-blue-100 { background-color: #DBEAFE; border-color: #BFDBFE; }
  .bg-pink-100 { background-color: #FCE7F3; border-color: #FBCFE8; }
  .bg-slate-100 { background-color: #F1F5F9; border-color: #E2E8F0; }
  .bg-green-100 { background-color: #D1FAE5; border-color: #A7F3D0; }


  .section-title {
    font-size: 1.25rem;
    font-weight: bold;
    color: #334155;
    margin-top: 2rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid #F472B6;
    padding-bottom: 0.5rem;
  }
  
  .expense-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .expense-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0.25rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .expense-item:last-child {
      border-bottom: none;
  }
  .expense-item span:first-child {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
  }

  .category-card .total {
    border-top: 1px dashed #cbd5e1;
    margin-top: 1rem;
    padding-top: 0.5rem;
    display: flex;
    justify-content: space-between;
    font-weight: 600;
  }
  .budget-info {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 1rem;
  }

  .memo-content {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1.5rem;
    white-space: pre-line;
    font-size: 1rem;
    line-height: 1.6;
    color: #475569;
    min-height: 100px;
  }
  
  @media (max-width: 768px) {
    .grid-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    body { padding: 1rem; }
    .grid-cols-4, .grid-cols-3, .grid-cols-2 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  }
</style>
`;

const formatCurrency = (amount: number) => `¥${amount.toLocaleString()}`;

export const generateHtmlForMonth = (monthData: MonthData, categoryFreeMemos?: { [categoryId: string]: string }): string => {
  const { monthId, income, extraIncome, preemptiveSavings, fixedExpenses, categories, memo } = monthData;

  // Re-calculate summaries
  const totalFixedExpenses = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = income + (extraIncome || 0);
  const discretionarySpending = totalIncome - preemptiveSavings - totalFixedExpenses;
  
  // 自由記入メモの合計を計算（半角数字のみ）
  const calcFreeMemoTotal = (memo: string): number => {
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
  
  const totalVariableExpenses = categories.reduce((sum, cat) => {
    const memo = categoryFreeMemos?.[cat.id] || '';
    return sum + calcFreeMemoTotal(memo);
  }, 0);
  const remainingDiscretionary = discretionarySpending - totalVariableExpenses;
  const totalSavingsThisMonth = preemptiveSavings + (remainingDiscretionary > 0 ? remainingDiscretionary : 0);

  const [year, month] = monthId.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  const displayMonth = date.toLocaleString('ja-JP', { month: 'long' });
  const displayYear = date.getFullYear();
  
  const escapeHtml = (unsafe: string) => 
    unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");

  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>家計簿 - ${displayYear}年${displayMonth}</title>
      ${getStyles()}
    </head>
    <body>
      <div class="container">
        <header class="header">
          <h1>家計簿</h1>
          <div class="date">
            <div class="month">${displayMonth}</div>
            <div class="year">${displayYear}年</div>
          </div>
        </header>

        <main>
          <div class="grid grid-cols-4">
            <div class="summary-card bg-blue-100">
              <h3>収入</h3>
              <p class="amount">${formatCurrency(totalIncome)}</p>
              <div class="notes">
                <div>月収: ${formatCurrency(income)}</div>
                ${extraIncome > 0 ? `<div>臨時収入: ${formatCurrency(extraIncome)}</div>` : ''}
              </div>
            </div>
            <div class="summary-card bg-pink-100"><h3>先取り貯蓄額</h3><p class="amount">${formatCurrency(preemptiveSavings)}</p></div>
            <div class="summary-card bg-slate-100"><h3>必ず出ていくお金（固定費）</h3><p class="amount">${formatCurrency(totalFixedExpenses)}</p></div>
            <div class="summary-card bg-green-100"><h3>やりくり費</h3><p class="amount">${formatCurrency(discretionarySpending)}</p></div>
          </div>

          <section>
            <h2 class="section-title">必ず出ていくお金（固定費）</h2>
            <div class="card">
              <ul class="expense-list">
                ${fixedExpenses.map(item => `
                  <li class="expense-item">
                    <span>${escapeHtml(item.name)}</span>
                    <span>${formatCurrency(item.amount)}</span>
                  </li>
                `).join('') || '<li class="expense-item"><span>項目がありません</span><span></span></li>'}
              </ul>
            </div>
          </section>

          <section>
            <h2 class="section-title">使ったお金メモ</h2>
            <div class="grid grid-cols-4">
              ${categories.map(cat => {
                const memo = categoryFreeMemos?.[cat.id] || '';
                const total = calcFreeMemoTotal(memo);
                return `
                <div class="card category-card">
                  <h3>${escapeHtml(cat.title)}</h3>
                  <div class="memo-content" style="min-height: 120px; margin-bottom: 1rem; white-space: pre-line;">
                    ${memo ? escapeHtml(memo.trim()) : '<p style="color: #94a3b8; font-style: italic;">メモがありません</p>'}
                  </div>
                  <div class="total">
                    <span>合計:</span>
                    <span>${formatCurrency(total)}</span>
                  </div>
                </div>
              `;
              }).join('')}
            </div>
          </section>

          <section>
            <h2 class="section-title">今月のまとめ</h2>
            <div class="grid grid-cols-3">
              <div class="summary-card bg-slate-100"><h3>今月使ったお金の合計</h3><p class="amount">${formatCurrency(totalFixedExpenses + totalVariableExpenses)}</p></div>
              <div class="summary-card bg-blue-100"><h3>残りのやりくり費</h3><p class="amount">${formatCurrency(remainingDiscretionary)}</p></div>
              <div class="summary-card bg-green-100"><h3>今月の貯蓄額</h3><p class="amount">${formatCurrency(totalSavingsThisMonth)}</p></div>
            </div>
          </section>

           <section>
            <h2 class="section-title">メモ欄</h2>
            <div class="card">
                <div class="memo-content">${memo ? escapeHtml(memo) : '<p>メモはありません。</p>'}</div>
            </div>
          </section>

        </main>

      </div>
    </body>
    </html>
  `;
};