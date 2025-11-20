
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

interface Props {
  onComplete: () => void;
}

export const VoiceSetup: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<'intro' | 'recording' | 'analyzing' | 'success'>('intro');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize recognition for the setup phase
    const { webkitSpeechRecognition, SpeechRecognition } = window as any;
    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setStep('analyzing');
        
        // Simulate analysis delay
        setTimeout(() => {
            // Simple validation: check if they said something close to the phrase or just something valid
            if (text.length > 5) {
                setStep('success');
                setTimeout(onComplete, 2000);
            } else {
                setStep('intro');
                alert("Não ouvi direito. Tente novamente.");
            }
        }, 2000);
      };

      recognition.onerror = () => {
        setStep('intro');
        alert("Erro ao capturar áudio. Tente novamente.");
      };

      recognitionRef.current = recognition;
    }
  }, [onComplete]);

  const startRecording = () => {
    setStep('recording');
    recognitionRef.current?.start();
  };

  return (
    <div className="fixed inset-0 bg-darker z-50 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      
      <div className="max-w-sm w-full bg-card/30 backdrop-blur border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center">
            
            <div className="mb-6 relative">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${step === 'success' ? 'bg-green-500/20 text-green-400' : step === 'recording' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-primary/10 text-primary'}`}>
                    {step === 'success' ? <Icons.ShieldCheck className="w-10 h-10" /> : 
                     step === 'recording' ? <Icons.Mic className="w-10 h-10" /> :
                     step === 'analyzing' ? <Icons.Activity className="w-10 h-10 animate-spin" /> :
                     <Icons.Lock className="w-10 h-10" />}
                </div>
                {step === 'recording' && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
                {step === 'intro' && "Configuração de Segurança"}
                {step === 'recording' && "Ouvindo..."}
                {step === 'analyzing' && "Analisando Biometria..."}
                {step === 'success' && "Voz Autenticada!"}
            </h2>

            <p className="text-gray-400 text-sm mb-8 h-12">
                {step === 'intro' && "Para proteger seus dados, precisamos registrar sua voz inicial. Toque no botão e diga a frase abaixo."}
                {step === 'recording' && "Diga: \"Autorizar acesso financeiro\""}
                {step === 'analyzing' && "Criando assinatura de voz única..."}
                {step === 'success' && "Tudo pronto. Seu app está seguro."}
            </p>

            {step === 'intro' && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-8 w-full">
                    <p className="text-primary font-mono text-sm">"Autorizar acesso financeiro"</p>
                </div>
            )}

            {step === 'intro' && (
                <button 
                    onClick={startRecording}
                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Icons.Fingerprint className="w-5 h-5" />
                    Registrar Voz
                </button>
            )}

            {step === 'recording' && (
                <div className="h-12 flex items-center gap-1">
                    <div className="w-1 h-3 bg-secondary animate-[pulse_1s_ease-in-out_infinite]"></div>
                    <div className="w-1 h-6 bg-secondary animate-[pulse_1.1s_ease-in-out_infinite]"></div>
                    <div className="w-1 h-4 bg-secondary animate-[pulse_1.2s_ease-in-out_infinite]"></div>
                    <div className="w-1 h-7 bg-secondary animate-[pulse_0.9s_ease-in-out_infinite]"></div>
                    <div className="w-1 h-3 bg-secondary animate-[pulse_1s_ease-in-out_infinite]"></div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
