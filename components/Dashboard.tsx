
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export const Dashboard: React.FC<Props> = ({ transactions }) => {
  
  // Only calculate based on non-deleted AND non-chargeback transactions
  const activeTransactions = transactions.filter(t => !t.isDeleted && !t.isChargeback);

  const totalIncome = activeTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = activeTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Calculate Category Data for Pie Chart (Expenses only)
  const categoryDataMap = activeTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const cat = t.category.toLowerCase();
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.keys(categoryDataMap).map(key => ({
    name: key,
    value: categoryDataMap[key]
  })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

  // Last 7 days spending
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dailyData = last7Days.map(dateStr => {
    const dayExpense = activeTransactions
      .filter(t => t.type === 'expense' && t.date.startsWith(dateStr))
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      date: new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      amount: dayExpense
    };
  });

  return (
    <div className="space-y-6 pb-32 animate-fadeIn">
      {/* Cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-card to-darker border border-white/5 p-6 rounded-2xl">
          <p className="text-gray-400 text-sm mb-1">Saldo Atual</p>
          <h2 className="text-4xl font-bold text-white">
            R$ {balance.toFixed(2).replace('.', ',')}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-white/5 p-4 rounded-2xl">
                <p className="text-gray-400 text-xs mb-1">Entradas</p>
                <p className="text-xl font-semibold text-green-400">+ {totalIncome.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-white/5 p-4 rounded-2xl">
                <p className="text-gray-400 text-xs mb-1">Saídas</p>
                <p className="text-xl font-semibold text-red-400">- {totalExpense.toFixed(2)}</p>
            </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-card border border-white/5 p-4 rounded-2xl">
        <h3 className="text-white font-medium mb-4">Gastos: Últimos 7 dias</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false}
                axisLine={false} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
              />
              <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {categoryData.length > 0 && (
        <div className="bg-card border border-white/5 p-4 rounded-2xl">
          <h3 className="text-white font-medium mb-4">Top Categorias (Despesas)</h3>
          <div className="h-48 w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                   itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                      <span className="text-xs text-gray-300 capitalize truncate">{entry.name}</span>
                  </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
