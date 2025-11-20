
import React from 'react';
import { Transaction } from '../types';
import { Icons } from './Icons';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onChargeback: (id: string) => void;
  hasActiveFilter?: boolean;
}

export const TransactionList: React.FC<Props> = ({ transactions, onDelete, onChargeback, hasActiveFilter }) => {
  // Group by date
  const grouped = transactions.reduce((acc, t) => {
    const dateKey = t.date.split('T')[0]; // YYYY-MM-DD
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Sort groups by date descending
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Function to sort transactions within a date group by timestamp (descending)
  const getSortedTransactionsForDate = (dateKey: string) => {
      return grouped[dateKey].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 text-center animate-fadeIn px-4">
        <div className="bg-card/50 p-4 rounded-full mb-4">
             <Icons.List className="w-8 h-8 opacity-30" />
        </div>
        {hasActiveFilter ? (
            <>
                <p className="text-lg font-medium text-gray-400">Nenhum resultado</p>
                <p className="text-sm max-w-[200px]">Tente mudar o filtro ou diga "Finanças... mostrar tudo".</p>
            </>
        ) : (
            <>
                <p className="text-lg font-medium text-gray-400">Ouvindo...</p>
                <p className="text-sm text-gray-500 mb-4">Experimente falar:</p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                    <div className="bg-white/5 p-3 rounded-lg text-xs italic text-primary/80 border border-primary/20">
                        "Finanças, gastei 50 reais em mercado"
                    </div>
                    <div className="text-xs text-gray-600 font-medium">- OU -</div>
                    <div className="bg-white/5 p-3 rounded-lg text-xs italic text-secondary/80 border border-secondary/20">
                        1. Diga "Finanças" (aguarde o sinal)<br/>
                        2. "Quanto gastei hoje?"
                    </div>
                </div>
            </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {sortedDates.map(date => (
        <div key={date}>
          <h3 className="text-primary/70 text-xs font-bold uppercase tracking-wider mb-3 pl-1 sticky top-0 bg-darker/95 backdrop-blur py-2 z-10">
            {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <div className="space-y-3">
            {getSortedTransactionsForDate(date).map(t => (
              <div 
                key={t.id} 
                className={`group relative bg-card border rounded-xl p-4 flex items-center justify-between transition-all
                    ${t.isDeleted 
                        ? 'border-red-900/20 bg-red-900/5 opacity-60 grayscale-[0.8]' 
                        : t.isChargeback 
                            ? 'border-orange-500/20 bg-orange-500/5 opacity-80'
                            : 'border-white/5 hover:border-white/10 hover:bg-white/5'
                    }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${t.isDeleted ? 'bg-gray-800' : t.isChargeback ? 'bg-orange-500/10 text-orange-400' : t.type === 'expense' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {t.isChargeback ? <Icons.Refund className="w-5 h-5" /> : t.type === 'expense' ? <Icons.TrendingDown className="w-5 h-5" /> : <Icons.TrendingUp className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`font-medium capitalize ${t.isDeleted ? 'text-gray-500 line-through' : t.isChargeback ? 'text-orange-300' : 'text-slate-200'}`}>
                        {t.description} 
                        {t.isDeleted && <span className="text-xs ml-2 text-red-500 no-underline">(Excluído)</span>}
                        {t.isChargeback && !t.isDeleted && <span className="text-xs ml-2 text-orange-500 font-bold uppercase tracking-wider">(Estornado)</span>}
                    </p>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500 capitalize">{t.category}</p>
                        {t.date.includes('T') && (
                            <span className="text-[10px] text-gray-600 bg-gray-800/50 px-1.5 py-0.5 rounded">
                                {new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold tracking-tight ${t.isDeleted || t.isChargeback ? 'text-gray-500 line-through' : t.type === 'expense' ? 'text-slate-200' : 'text-green-400'}`}>
                    {t.type === 'expense' ? '-' : '+'} R$ {t.amount.toFixed(2).replace('.', ',')}
                  </span>
                  
                  {!t.isDeleted && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onChargeback(t.id);
                        }}
                        className={`transition-colors p-2 rounded-full 
                            ${t.isChargeback 
                                ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10' 
                                : 'text-gray-500 hover:text-orange-400 hover:bg-orange-500/10'
                            }`}
                        title={t.isChargeback ? "Cancelar Estorno" : "Estornar"}
                    >
                        <Icons.Refund className="w-4 h-4" />
                    </button>
                  )}

                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(t.id);
                    }}
                    className={`transition-colors p-2 rounded-full 
                        ${t.isDeleted 
                            ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10' 
                            : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                    aria-label={t.isDeleted ? "Restaurar" : "Excluir"}
                  >
                    {t.isDeleted ? <Icons.Undo className="w-4 h-4" /> : <Icons.Trash className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
