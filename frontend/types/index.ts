export interface Transaction {
    id: number;
    amount: number;
    category: string;
    description: string;
    card: string;
    date: string;
    transaction_type: 'income' | 'expense'; // <--- این خط جدید است
}

// export interface Category {
//   id: number;
//   title: string;
//   color: string;
// }

// export interface Task {
//   id: number;
//   title: string;
//   category: Category | null;
//   is_done: boolean;
//   created_at: string;
//   due_date: string | null;
// }

export interface Category {
  id: number;
  title: string;
  color: string;
}

// interface Goal {
//   id: number;
//   title: string;
//   tasks: Task[];
// }

// interface Task {
//   id: number;
//   title: string;
//   is_done: boolean;
//   is_frog_today: boolean;
//   energy_level: 'high' | 'medium' | 'low';
//   is_blocked: boolean;
//   goal: number | null; // اگر null باشد یعنی Orphan Task است
//   goal_title?: string;
//   steps: Step[];
// }

// interface Step {
//   id: number;
//   title: string;
//   is_done: boolean;
// }
interface Step {
  id: number;
  title: string;
  is_done: boolean;
  task: number;
  duration_minutes?: number;
}

interface Task {
  id: number;
  title: string;
  is_done: boolean;
  goal?: number | null;
  goal_title?: string;
  energy_level: 'high' | 'medium' | 'low';
  is_frog_today: boolean;
  is_blocked: boolean;
  depends_on?: number;
  due_date?: string;
  steps: Step[];
  duration_minutes?: number;
}

interface Goal {
  id: number;
  title: string;
  due_date?: string;
  tasks: Task[];
}




export interface Habit {
  id: number;
  name: string;
  is_active: boolean;
  is_completed_today: boolean;
}

interface TimeLog {
  id: number;
  title: string;
  duration_minutes: number;
  date: string;
  start_time: string; // اضافه شد
  end_time: string;   // اضافه شد
  category_details?: {
    id: number;
    title: string;
    color: string;
  } | null;
}
