
import React from 'react';
import { Icons } from './Icons';

export const About: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full pb-32 animate-fadeIn px-6 text-center">
      
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-20 blur-3xl rounded-full"></div>
        <div className="relative bg-card border border-white/10 p-8 rounded-3xl shadow-2xl shadow-black/50">
            <Icons.Code className="w-16 h-16 text-white mb-2 mx-auto" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Finanças Voz
            </h1>
            <span className="text-xs text-gray-500 font-mono mt-1 block">Versão 2.5.0 (IA Híbrida)</span>
        </div>
      </div>

      <div className="space-y-6 max-w-xs">
        <div className="space-y-2">
            <p className="text-gray-400 text-sm">Desenvolvido com inovação e tecnologia por</p>
            <h2 className="text-2xl font-bold text-white tracking-wide">
                Multiverso Digital
            </h2>
        </div>

        <div className="h-px w-1/2 bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-auto"></div>

        <p className="text-sm text-gray-500 leading-relaxed">
            Transformando a maneira como você interage com suas finanças e seu tempo através do poder da voz e da inteligência artificial.
        </p>

        <div className="pt-4 flex justify-center gap-4">
            <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-primary transition-all">
                <Icons.Globe className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-secondary transition-all">
                <Icons.ShieldCheck className="w-5 h-5" />
            </button>
        </div>
        
        <p className="text-[10px] text-gray-600 pt-8">
            © {new Date().getFullYear()} Multiverso Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
