
export interface Transaction {
  id: string;
  date: string; // ISO String
  timestamp: number; // Unix timestamp for sorting/precision
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  isDeleted?: boolean; // Soft delete flag
  isChargeback?: boolean; // Refund/Reversal flag
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'both'; // 'both' means it can appear in either
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO YYYY-MM-DD
  time: string; // HH:mm
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string; // ISO YYYY-MM-DD
  isCompleted: boolean;
}

export interface FilterCriteria {
  categories?: string[]; // Changed to array to support multiple categories
  type?: 'income' | 'expense';
  startDate?: string; // ISO YYYY-MM-DD
  endDate?: string;   // ISO YYYY-MM-DD
}

export interface AIResponse {
  action: 'add' | 'query' | 'filter' | 'clear_filter' | 'add_category' | 'remove_category' | 'list_categories' | 'add_appointment' | 'query_agenda' | 'reverse_last_transaction' | 'error';
  transactionData?: Omit<Transaction, 'id' | 'timestamp'>;
  categoryData?: { name: string; type: 'income' | 'expense' | 'both' };
  appointmentData?: Omit<Appointment, 'id' | 'isCompleted'>;
  filterCriteria?: FilterCriteria;
  message?: string; // For query answers or errors
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  CATEGORIES = 'CATEGORIES',
  ANALYSIS = 'ANALYSIS',
  AGENDA = 'AGENDA',
  ABOUT = 'ABOUT'
}
