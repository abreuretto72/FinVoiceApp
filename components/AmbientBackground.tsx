
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

export const AmbientBackground: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-40 bg-darker flex flex-col items-center justify-center text-slate-200 p-6 animate-fadeIn">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Pulse Ring */}
        <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-card border border-white/10 p-6 rounded-full shadow-[0_0_50px_rgba(139,92,246,0.15)]">
                <Icons.Mic className="w-10 h-10 text-primary animate-pulse" />
            </div>
        </div>

        <div className="text-center space-y-1">
            <h2 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </h2>
            <p className="text-lg text-gray-500 font-medium">
                {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
        </div>
      </div>
    </div>
  );
};
