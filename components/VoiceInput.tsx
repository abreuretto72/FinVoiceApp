
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

interface VoiceInputProps {
  onSend: (text: string) => void;
  isProcessing: boolean;
  isActive: boolean;
  onWake: (mode: 'finance' | 'agenda') => void;
  onSleep: () => void;
}

// Type definition for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onSend, isProcessing, isActive, onWake, onSleep }) => {
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<'inactive' | 'listening' | 'processing'>('inactive');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const shouldBeListening = useRef(true);
  const awakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset auto-sleep timer on activity
  useEffect(() => {
    if (isActive) {
        if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
        // Auto sleep after 45 seconds of inactivity if in active mode
        awakeTimeoutRef.current = setTimeout(() => {
            onSleep();
        }, 45000);
    }
    return () => {
        if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
    };
  }, [isActive, inputText, isProcessing, onSleep]);

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false; 

      recognition.onstart = () => {
        setStatus('listening');
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim();
        
        console.log("Ouvido:", transcript);

        if (isProcessing) return;

        const lowerTranscript = transcript.toLowerCase();
        
        // 1. Check for "Fechar" / "Sair" command (Priority)
        if (isActive && (lowerTranscript.includes('fechar') || lowerTranscript === 'sair' || lowerTranscript.includes('dormir'))) {
            onSleep();
            setInputText('');
            return;
        }

        // 2. Wake Word Logic
        const isFinanceWake = lowerTranscript.includes('finanças') || lowerTranscript.includes('financas');
        const isAgendaWake = lowerTranscript.includes('agenda');

        if (isActive) {
            // We are awake. Process commands.
            
            // Check for mode switching explicitly
            if (lowerTranscript === 'ir para agenda' || lowerTranscript === 'abrir agenda') {
                onWake('agenda');
                return;
            }
            if (lowerTranscript === 'ir para finanças' || lowerTranscript === 'abrir finanças') {
                onWake('finance');
                return;
            }

            // If user repeats wake word, strip it but perform mode switch if necessary
            let cleanCommand = transcript;
            if (isFinanceWake) {
                 cleanCommand = cleanCommand.replace(/finanças|financas/gi, '').trim();
                 // If just wake word said while active, ensure we are on that view
                 if (!cleanCommand) onWake('finance');
            } else if (isAgendaWake) {
                 cleanCommand = cleanCommand.replace(/agenda/gi, '').trim();
                 // If just wake word said while active, ensure we are on that view
                 if (!cleanCommand) onWake('agenda');
            }
            
            if (cleanCommand) {
                handleSend(cleanCommand);
                recognition.stop();
            }
        } else {
            // Ambient Mode
            if (isFinanceWake || isAgendaWake) {
                const mode = isAgendaWake ? 'agenda' : 'finance';
                
                // Strip keywords
                let cleanCommand = transcript.replace(/finanças|financas/gi, '').replace(/agenda/gi, '').trim();
                
                onWake(mode);
                
                if (cleanCommand.length > 0) {
                    handleSend(cleanCommand);
                    recognition.stop();
                }
            }
        }
      };

      recognition.onend = () => {
        if (shouldBeListening.current) {
           setTimeout(() => {
             try {
                if (shouldBeListening.current && recognitionRef.current) {
                    recognitionRef.current.start();
                }
             } catch (e) {
                console.log("Restart delay error", e);
                setStatus('inactive');
             }
           }, 150);
        } else {
            setStatus('inactive');
        }
      };
      
      recognition.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
              shouldBeListening.current = false;
              setStatus('inactive');
              setError("Permissão necessária");
          }
      };

      recognitionRef.current = recognition;
      startListening();
    }

    return () => {
      shouldBeListening.current = false;
      if (awakeTimeoutRef.current) clearTimeout(awakeTimeoutRef.current);
      recognitionRef.current?.stop();
    };
  }, [isActive, isProcessing, onWake, onSleep]); 

  const startListening = () => {
    shouldBeListening.current = true;
    if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
        } catch (e) { /* ignore */ }
    }
  };

  const stopListening = () => {
      shouldBeListening.current = false;
      recognitionRef.current?.stop();
  };

  const toggleListening = () => {
    if (status === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSend = (textOverride?: string) => {
    const text = textOverride || inputText;
    if (!text.trim()) return;
    
    onSend(text);
    setInputText('');
  };

  if (!isActive) {
      return <div className="hidden"></div>;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-darker/95 pb-8 pt-4 shadow-[0_-20px_50px_rgba(16,185,129,0.3)] transition-all duration-500 animate-slideUp`}>
      
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent animate-pulse"></div>

      <div className="max-w-3xl mx-auto flex flex-col items-center gap-3 relative px-4">
        
        <div className="flex items-center gap-2 mb-1 h-6">
            {status === 'listening' ? (
                <div className="flex items-center gap-2 animate-bounce">
                    <span className="w-2 h-2 bg-secondary rounded-full shadow-[0_0_10px_#10b981]"></span>
                    <span className="text-xs text-secondary font-bold uppercase tracking-widest">Ouvindo... (Diga "Fechar" para sair)</span>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="text-xs text-red-400 font-medium uppercase tracking-widest">Pausado</span>
                </div>
            )}
        </div>

        <div className="w-full flex items-center gap-3">
            <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Comando (ex: 'Agendar reunião', 'Gastei 50')..."
            disabled={isProcessing}
            className={`flex-1 bg-darker/50 border border-secondary/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] rounded-full px-5 py-3 text-white placeholder-gray-500 focus:outline-none transition-all disabled:opacity-50 text-sm`}
            />

            <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`relative p-4 rounded-full transition-all duration-500 flex items-center justify-center shrink-0 bg-secondary/20 text-secondary border border-secondary/50 scale-110 shadow-[0_0_30px_rgba(16,185,129,0.4)]`}
            >
            {isProcessing ? (
                <Icons.Activity className="w-6 h-6 animate-spin" />
            ) : (
                <Icons.Mic className={`w-6 h-6 animate-pulse`} />
            )}
             <span className="absolute inset-0 rounded-full border border-secondary/30 animate-ping"></span>
            </button>

            {inputText && (
            <button
                onClick={() => handleSend()}
                disabled={isProcessing}
                className="p-3 bg-secondary rounded-full text-white hover:bg-secondary/90 shadow-lg transition-all animate-fadeIn"
            >
                <Icons.Send className="w-5 h-5" />
            </button>
            )}
            
            <button
                onClick={onSleep}
                className="p-3 bg-card border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                title="Modo Ambiente"
            >
                <Icons.Moon className="w-5 h-5" />
            </button>
        </div>
        
        {error && (
            <p className="text-xs text-red-400 mt-1 bg-red-500/10 px-3 py-1 rounded-full cursor-pointer border border-red-500/20" onClick={startListening}>
                {error} - Toque para tentar novamente
            </p>
        )}
      </div>
    </div>
  );
};
