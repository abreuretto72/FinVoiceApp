
import React from 'react';
import { Category } from '../types';
import { Icons } from './Icons';

interface Props {
  categories: Category[];
  onRemove: (id: string) => void;
}

export const CategoryList: React.FC<Props> = ({ categories, onRemove }) => {
  
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Nenhuma categoria cadastrada.</p>
        <p className="text-sm">Diga "Criar categoria [nome]"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-32">
        <div className="bg-card border border-white/5 p-6 rounded-2xl mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Gerenciar Categorias</h2>
            <p className="text-sm text-gray-400">
                Fale "Criar categoria X" para adicionar novas ou clique na lixeira para remover.
            </p>
        </div>

      <div className="grid grid-cols-1 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="group bg-card border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-white/10 hover:bg-white/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Icons.Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-200 capitalize">{cat.name}</p>
                <p className="text-xs text-gray-500">
                    {cat.type === 'both' ? 'Entrada e Saída' : cat.type === 'income' ? 'Entrada' : 'Saída'}
                </p>
              </div>
            </div>
            <button 
                onClick={() => onRemove(cat.id)}
                className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-500/10"
                aria-label="Excluir Categoria"
            >
                <Icons.Trash className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
