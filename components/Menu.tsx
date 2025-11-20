
import React from 'react';
import { AppView } from '../types';
import { Icons } from './Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  currentView: AppView;
  onSleep: () => void;
}

export const Menu: React.FC<Props> = ({ isOpen, onClose, onNavigate, currentView, onSleep }) => {
  
  const menuItems = [
    { view: AppView.DASHBOARD, label: 'Painel Financeiro', icon: Icons.Dashboard, desc: 'Resumo de saldos e gráficos' },
    { view: AppView.HISTORY, label: 'Histórico de Transações', icon: Icons.List, desc: 'Extratos e lançamentos' },
    { view: AppView.AGENDA, label: 'Agenda Inteligente', icon: Icons.Calendar, desc: 'Compromissos e tarefas' },
    { view: AppView.CATEGORIES, label: 'Gerenciar Categorias', icon: Icons.Tag, desc: 'Personalize seus gastos' },
    { view: AppView.ABOUT, label: 'Sobre o App', icon: Icons.Info, desc: 'Desenvolvedor e versão' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-darker border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-6 flex items-center justify-between border-b border-white/5">
            <h2 className="text-xl font-bold text-white">Menu</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                <Icons.X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-160px)]">
            {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                return (
                    <button
                        key={item.view}
                        onClick={() => {
                            onNavigate(item.view);
                            onClose();
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group
                            ${isActive 
                                ? 'bg-primary/10 border border-primary/20' 
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <div className={`p-3 rounded-full ${isActive ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <span className={`block font-medium ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                {item.label}
                            </span>
                            <span className="text-xs text-gray-500 group-hover:text-gray-400">
                                {item.desc}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-darker">
            <button 
                onClick={() => {
                    onSleep();
                    onClose();
                }}
                className="w-full py-3 bg-card border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-2 transition-all"
            >
                <Icons.Moon className="w-4 h-4" />
                Modo Ambiente (Sair)
            </button>
            <p className="text-center text-[10px] text-gray-600 mt-4">
                Multiverso Digital Technology
            </p>
        </div>

      </div>
    </>
  );
};
