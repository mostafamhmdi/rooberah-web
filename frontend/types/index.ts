export interface Transaction {
    id: number;
    amount: number;
    category: string;
    description: string;
    card: string;
    date: string;
    transaction_type: 'income' | 'expense'; // <--- این خط جدید است
}
export interface Task {
    id: number;
    title: string;
    is_done: boolean;
    category: string;
}

// فعلاً همین دو تا کافیست