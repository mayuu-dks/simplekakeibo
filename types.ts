export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface ExpenseCategory {
  id:string;
  title: string;
  budget: number;
  items: ExpenseItem[];
}

export interface FixedExpense extends ExpenseItem {}

export interface ParsedExpense {
  itemName: string;
  amount: number;
  category: string;
}

export interface MonthData {
  monthId: string; // YYYY-MM format, e.g., "2023-09"
  income: number;
  preemptiveSavings: number;
  fixedExpenses: FixedExpense[];
  categories: ExpenseCategory[];
  memo: string;
}