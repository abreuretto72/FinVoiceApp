
import React, { useState, useEffect } from 'react';
import { Transaction, AppView, FilterCriteria, Category, Appointment } from './types';
import { processUserInput } from './services/aiService';
import { VoiceInput } from './components/VoiceInput';
import { TransactionList } from './components/TransactionList';
import { Dashboard } from './components/Dashboard';
import { CategoryList } from './components/CategoryList';
import { AgendaList } from './components/AgendaList';
import { Icons } from './components/Icons';
import { AmbientBackground } from './components/AmbientBackground';
import { VoiceSetup } from './components/VoiceSetup';
import { Menu } from './components/Menu';
import { About } from './components/About';

// Robust ID generator using native crypto if available
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Habitação', type: 'expense' },
  { id: 'cat_2', name: 'Alimentação', type: 'expense' },
  { id: 'cat_3', name: 'Transporte', type: 'expense' },
  { id: 'cat_4', name: 'Saúde', type: 'expense' },
  { id: 'cat_5', name: 'Educação', type: 'expense' },
  { id: 'cat_6', name: 'Vestuário e Cuidados', type: 'expense' },
  { id: 'cat_7', name: 'Lazer e Entretenimento', type: 'expense' },
  { id: 'cat_8', name: 'Despesas Pessoais', type: 'expense' },
  { id: 'cat_9', name: 'Serviços Financeiros', type: 'expense' },
  { id: 'cat_10', name: 'Investimentos', type: 'expense' },
  { id: 'cat_11', name: 'Salário', type: 'income' },
  { id: 'cat_12', name: 'Outros', type: 'both' },
];

export default function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  const [filter, setFilter] = useState<FilterCriteria | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  
  // State for "Wake/Sleep" mode
  const [isAppActive, setIsAppActive] = useState(false);
  
  // State for Initial Voice Setup
  const [isVoiceConfigured, setIsVoiceConfigured] = useState(false);

  // State for Side Menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedData = localStorage.getItem('financas-voz-data');
    const savedCats = localStorage.getItem('financas-voz-categories');
    const savedAgenda = localStorage.getItem('financas-voz-agenda');
    const voiceSetup = localStorage.getItem('financas-voz-setup-complete');
    
    if (voiceSetup === 'true') {
        setIsVoiceConfigured(true);
    }
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const migratedData = parsed.map((t: any) => ({
            ...t,
            timestamp: t.timestamp || new Date(t.date).getTime()
        }));
        setTransactions(migratedData);
      } catch (e) { console.error("Storage error", e); }
    }

    if (savedCats) {
      try {
        setCategories(JSON.parse(savedCats));
      } catch (e) { console.error("Storage error", e); }
    }

    if (savedAgenda) {
        try {
            setAppointments(JSON.parse(savedAgenda));
        } catch (e) { console.error("Storage error", e); }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('financas-voz-data', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('financas-voz-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('financas-voz-agenda', JSON.stringify(appointments));
  }, [appointments]);

  const handleVoiceSetupComplete = () => {
      localStorage.setItem('financas-voz-setup-complete', 'true');
      setIsVoiceConfigured(true);
  };

  const handleWake = (mode: 'finance' | 'agenda') => {
      setIsAppActive(true);
      if (mode === 'agenda') {
          setView(AppView.AGENDA);
      } else {
          // If we are already on a finance view, stay there, else go to dashboard
          if (view === AppView.AGENDA || view === AppView.ABOUT) {
              setView(AppView.DASHBOARD);
          }
      }
  };

  const handleUserInput = async (text: string) => {
    setIsProcessing(true);
    setLastMessage(null);

    try {
      const response = await processUserInput(text, transactions, categories, appointments);

      if (response.action === 'add' && response.transactionData) {
        const dateStr = response.transactionData.date || new Date().toISOString();
        const timestamp = new Date(dateStr).getTime();

        const newTransaction: Transaction = {
          id: generateId(),
          ...response.transactionData,
          date: dateStr,
          timestamp: timestamp,
          isDeleted: false,
          isChargeback: false
        } as Transaction; 

        setTransactions(prev => [newTransaction, ...prev]);
        setLastMessage(response.message || "Transação adicionada!");
        
        setFilter(null);
        if (view !== AppView.HISTORY) setView(AppView.HISTORY);

      } else if (response.action === 'query' && response.message) {
        setLastMessage(response.message);
      
      } else if (response.action === 'filter' && response.filterCriteria) {
        setFilter(response.filterCriteria);
        setView(AppView.HISTORY);
        setLastMessage(response.message || "Extrato gerado com sucesso.");
      
      } else if (response.action === 'clear_filter') {
        setFilter(null);
        if (view === AppView.HISTORY) {
            setLastMessage(response.message || "Mostrando tudo.");
        } else {
            setView(AppView.DASHBOARD);
        }

      } else if (response.action === 'reverse_last_transaction') {
         const active = transactions.filter(t => !t.isDeleted && !t.isChargeback);
         if (active.length > 0) {
             // Sort by timestamp desc to find the latest
             const latest = [...active].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
             toggleTransactionChargeback(latest.id);
             setLastMessage(response.message || `Transação "${latest.description}" estornada.`);
             setView(AppView.HISTORY);
         } else {
             setLastMessage("Nenhuma transação recente encontrada para estornar.");
         }

      } else if (response.action === 'add_category' && response.categoryData) {
        const name = response.categoryData.name;
        const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
        
        if (exists) {
            setLastMessage(`A categoria "${name}" já existe.`);
        } else {
            const newCat: Category = {
                id: generateId(),
                name: response.categoryData.name,
                type: response.categoryData.type || 'both'
            };
            setCategories(prev => [...prev, newCat]);
            setLastMessage(`Categoria "${name}" criada com sucesso.`);
            setView(AppView.CATEGORIES);
        }

      } else if (response.action === 'remove_category' && response.categoryData) {
         const name = response.categoryData.name.toLowerCase();
         const catToDelete = categories.find(c => c.name.toLowerCase() === name);
         
         if (catToDelete) {
            setCategories(prev => prev.filter(c => c.id !== catToDelete.id));
            setLastMessage(`Categoria "${catToDelete.name}" removida.`);
            setView(AppView.CATEGORIES);
         } else {
            setLastMessage(`Não encontrei a categoria "${response.categoryData.name}".`);
         }

      } else if (response.action === 'list_categories') {
         setView(AppView.CATEGORIES);
         setLastMessage(response.message || "Aqui estão suas categorias.");

      } else if (response.action === 'add_appointment' && response.appointmentData) {
          const newAppt: Appointment = {
              id: generateId(),
              title: response.appointmentData.title,
              description: response.appointmentData.description,
              date: response.appointmentData.date,
              time: response.appointmentData.time,
              repeat: (response.appointmentData.repeat as any) || 'none',
              repeatEndDate: response.appointmentData.repeatEndDate,
              isCompleted: false
          };
          setAppointments(prev => [...prev, newAppt]);
          setLastMessage(response.message || "Compromisso agendado.");
          setView(AppView.AGENDA);

      } else if (response.action === 'query_agenda') {
          setLastMessage(response.message || "Verifique sua agenda.");
          setView(AppView.AGENDA);

      } else if (response.action === 'error') {
        setLastMessage(response.message || "Erro ao processar.");
      }
    } catch (error) {
      setLastMessage("Erro de conexão ou API.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTransactionStatus = (id: string) => {
      setTransactions(prev => prev.map(t => {
          if (t.id === id) return { ...t, isDeleted: !t.isDeleted };
          return t;
      }));
  };

  const toggleTransactionChargeback = (id: string) => {
      setTransactions(prev => prev.map(t => {
          if (t.id === id) return { ...t, isChargeback: !t.isChargeback };
          return t;
      }));
  };
  
  const handleDeleteCategory = (id: string) => {
    if (window.confirm("Excluir categoria?")) {
        setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const toggleAppointmentComplete = (id: string) => {
      setAppointments(prev => prev.map(a => {
          if (a.id === id) return { ...a, isCompleted: !a.isCompleted };
          return a;
      }));
  }

  const deleteAppointment = (id: string) => {
      setAppointments(prev => prev.filter(a => a.id !== id));
  }

  const clearFilter = () => setFilter(null);

  // Apply Filter Logic
  const filteredTransactions = transactions.filter(t => {
    if (!filter) return true;
    let matches = true;
    if (filter.categories && filter.categories.length > 0) {
        const isMatch = filter.categories.some(fc => fc.toLowerCase() === t.category.toLowerCase());
        if (!isMatch) matches = false;
    }
    if (filter.type && t.type !== filter.type) matches = false;
    if (filter.startDate && t.date < filter.startDate) matches = false;
    if (filter.endDate && t.date > filter.endDate) matches = false;
    return matches;
  });

  const getFilterDateText = () => {
     if (!filter) return '';
     if (filter.startDate && filter.endDate) {
         const start = new Date(filter.startDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
         const end = new Date(filter.endDate).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
         return `${start} até ${end}`;
     }
     if (filter.startDate) return `A partir de ${new Date(filter.startDate).toLocaleDateString('pt-BR')}`;
     return '';
  }

  return (
    <div className="h-full w-full flex flex-col relative max-w-md mx-auto bg-darker shadow-2xl overflow-hidden">
      
      {!isVoiceConfigured && <VoiceSetup onComplete={handleVoiceSetupComplete} />}

      {isVoiceConfigured && (
        <>
            {!isAppActive && <AmbientBackground />}

            {isAppActive && (
                <>
                    <Menu 
                        isOpen={isMenuOpen} 
                        onClose={() => setIsMenuOpen(false)} 
                        onNavigate={setView}
                        currentView={view}
                        onSleep={() => setIsAppActive(false)}
                    />

                    <header className="p-6 pt-10 flex items-center justify-between bg-darker z-10 shrink-0 animate-slideDown">
                        <button 
                            onClick={() => setIsMenuOpen(true)}
                            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        >
                            <Icons.Menu className="w-6 h-6" />
                        </button>

                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                {view === AppView.AGENDA ? "Agenda" : view === AppView.ABOUT ? "Sobre" : "Finanças"}
                            </h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                {view === AppView.AGENDA ? "Compromissos" : view === AppView.ABOUT ? "Multiverso Digital" : "Gestão Pessoal"}
                            </p>
                        </div>

                        <div className={`w-10 h-10 rounded-full bg-card border border-white/10 flex items-center justify-center overflow-hidden ${view === AppView.AGENDA ? 'text-secondary' : 'text-primary'}`}>
                            {view === AppView.AGENDA ? <Icons.Calendar className="w-6 h-6" /> : view === AppView.ABOUT ? <Icons.Info className="w-6 h-6" /> : <Icons.Activity className="w-6 h-6" />}
                        </div>
                    </header>

                    {/* Filters */}
                    {filter && view === AppView.HISTORY && (
                        <div className="px-6 pb-2 shrink-0 animate-fadeIn">
                        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3 flex flex-col gap-1 text-sm text-secondary">
                            <div className="flex justify-between items-start">
                                <span className="font-bold uppercase text-xs tracking-wider opacity-70">Extrato Ativo</span>
                                <button onClick={clearFilter} className="text-xs underline hover:text-white">Limpar</button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {filter.categories && filter.categories.length > 0 ? (
                                    filter.categories.map((c, i) => (
                                        <span key={i} className="bg-secondary/20 px-2 py-0.5 rounded text-xs font-semibold truncate max-w-[100px]">{c}</span>
                                    ))
                                ) : (
                                    <span className="bg-secondary/20 px-2 py-0.5 rounded text-xs font-semibold">Todas Categorias</span>
                                )}
                                {filter.startDate && (
                                    <div className="text-xs mt-1 flex items-center gap-1 opacity-80">
                                        <Icons.List className="w-3 h-3" />
                                        {getFilterDateText()}
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                    )}

                    {lastMessage && (
                        <div className="px-6 mb-4 shrink-0 animate-bounce-in z-20">
                        <div className="bg-card border border-primary/30 text-slate-200 p-3 rounded-xl text-sm shadow-lg shadow-black/50 flex gap-3 items-start relative overflow-hidden">
                            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                            <div className="mt-1 text-primary"><Icons.Activity className="w-4 h-4" /></div>
                            <p className="flex-1 leading-relaxed">{lastMessage}</p>
                            <button onClick={() => setLastMessage(null)} className="ml-auto text-gray-500 hover:text-white p-1">
                                x
                            </button>
                        </div>
                        </div>
                    )}

                    <main className="flex-1 overflow-y-auto px-6 no-scrollbar scroll-smooth pb-40 animate-fadeIn">
                        {view === AppView.DASHBOARD && <Dashboard transactions={transactions} />}
                        {view === AppView.HISTORY && (
                            <TransactionList 
                                transactions={filteredTransactions} 
                                onDelete={toggleTransactionStatus} 
                                onChargeback={toggleTransactionChargeback}
                                hasActiveFilter={!!filter}
                            />
                        )}
                        {view === AppView.CATEGORIES && (
                            <CategoryList 
                                categories={categories} 
                                onRemove={handleDeleteCategory} 
                                transactions={transactions}
                            />
                        )}
                        {view === AppView.AGENDA && (
                            <AgendaList 
                                appointments={appointments}
                                onToggleComplete={toggleAppointmentComplete}
                                onDelete={deleteAppointment}
                            />
                        )}
                        {view === AppView.ABOUT && <About />}
                    </main>

                    {view !== AppView.ABOUT && (
                        <div className="fixed bottom-28 left-0 right-0 flex justify-center pointer-events-none z-40 animate-slideUp">
                            <div className="bg-card/90 backdrop-blur-lg border border-white/10 rounded-full p-1 flex gap-1 pointer-events-auto shadow-2xl shadow-black/50">
                                <button 
                                    onClick={() => setView(AppView.DASHBOARD)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${view === AppView.DASHBOARD ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Icons.Dashboard className="w-4 h-4" />
                                    <span className="hidden sm:inline">Finanças</span>
                                </button>
                                <button 
                                    onClick={() => setView(AppView.HISTORY)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${view === AppView.HISTORY ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Icons.List className="w-4 h-4" />
                                    <span className="hidden sm:inline">Histórico</span>
                                </button>
                                <button 
                                    onClick={() => setView(AppView.AGENDA)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${view === AppView.AGENDA ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Icons.Calendar className="w-4 h-4" />
                                    <span className="hidden sm:inline">Agenda</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <VoiceInput 
                onSend={handleUserInput} 
                isProcessing={isProcessing} 
                isActive={isAppActive}
                onWake={handleWake}
                onSleep={() => setIsAppActive(false)}
            />
        </>
      )}
    </div>
  );
}
