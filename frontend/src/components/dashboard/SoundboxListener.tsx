import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Activity } from 'lucide-react';

interface SoundboxListenerProps {
  isActive: boolean;
  onPaymentDetected: (amount: number) => void;
}

const HINDI_NUMBER_MAP: Record<string, number> = {
  'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'panch': 5, 'paanch': 5, 'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9,
  'das': 10, 'gyarah': 11, 'barah': 12, // adding some common ones just in case
  'bees': 20, 'tees': 30, 'chalis': 40, 'pachaas': 50, 'pachas': 50, 'saath': 60, 'sattar': 70, 'assi': 80, 'nabbe': 90,
  'sau': 100, 'hazaar': 1000, 'hazar': 1000, 'lakh': 100000, 'laakh': 100000
};

// Parser to convert hindi phrase to number
const parseHindiAmount = (transcript: string): number | null => {
  const lower = transcript.toLowerCase();
  
  // 1. Direct number check (Web Speech API often just returns the digit)
  const digitMatch = lower.match(/(\d+)/);
  if (digitMatch && digitMatch[1]) {
    return parseInt(digitMatch[1], 10);
  }

  // 2. Hindi word parsing
  // Fix combined words like 'paanchsau' -> 'paanch sau'
  let cleaned = lower
    .replace(/paanchsau/g, 'paanch sau')
    .replace(/panchsau/g, 'panch sau')
    .replace(/teenhazaar/g, 'teen hazaar')
    .replace(/ekhazaar/g, 'ek hazaar');

  const words = cleaned.split(/[\s,]+/);
  
  let total = 0;
  let current = 0;
  let foundNumberWord = false;

  for (const word of words) {
    if (HINDI_NUMBER_MAP[word] !== undefined) {
      foundNumberWord = true;
      const val = HINDI_NUMBER_MAP[word];
      
      if (val >= 100) {
        if (current === 0) current = 1; // e.g., "sau rupaye" -> 100
        current *= val;
        if (val >= 1000) {
          total += current;
          current = 0;
        }
      } else {
        current += val;
      }
    }
  }

  const finalAmount = total + current;
  return foundNumberWord && finalAmount > 0 ? finalAmount : null;
};

const SoundboxListener: React.FC<SoundboxListenerProps> = ({ onPaymentDetected }) => {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>('Ready to listen...');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check support for Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Web Speech API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN'; // Set to Hindi

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      // Get the latest transcript
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.trim();
      
      setLastTranscript(transcript);

      // Check for keywords indicating receipt (optional, but makes it robust)
      // We will just parse the amount if it looks like a payment announcement
      const amount = parseHindiAmount(transcript);
      if (amount) {
        onPaymentDetected(amount);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      // Don't show error for 'no-speech' as it's common in continuous mode
      if (event.error !== 'no-speech') {
        setError(`Error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // If still supposed to be listening, restart (continuous mode sometimes stops)
      if (isListening) {
        try {
          recognition.start();
        } catch(e) {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    } else {
      setLastTranscript('Listening...');
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const simulatePayment = () => {
    const randomAmount = Math.floor(Math.random() * (3000 - 200 + 1) + 200);
    setLastTranscript(`(Simulated) ${randomAmount} mil gaye`);
    onPaymentDetected(randomAmount);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EBF0] rounded-2xl p-6 flex flex-col relative overflow-hidden h-full shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-[#101010] flex items-center gap-2">
          <Volume2 size={24} className="text-[#00BAF2]" />
          Soundbox Listener
        </h3>
        {isListening && (
          <div className="flex items-center gap-2 text-xs font-bold text-khata-green bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-khata-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-khata-green"></span>
            </span>
            ACTIVE
          </div>
        )}
      </div>

      {/* Mic Button */}
      <div className="flex-1 flex flex-col items-center justify-center mb-4">
        <button
          onClick={toggleListening}
          disabled={!!error}
          className={`relative flex items-center justify-center w-20 h-20 rounded-full mb-6 transition-all ${
            isListening 
              ? 'bg-[#00BAF2] shadow-[0_4px_20px_rgba(0,186,242,0.4)]' 
              : 'bg-[#F5F8FA] hover:bg-[#E8EBF0] shadow-sm'
          }`}
        >
          {isListening ? (
             <>
               <Mic size={32} className="text-white z-10" />
               <div className="absolute inset-0 rounded-full border-4 border-[#00BAF2] animate-ping opacity-20"></div>
             </>
          ) : (
             <MicOff size={32} className="text-[#707070]" />
          )}
        </button>

        {/* Debug Terminal */}
        <div className="w-full bg-[#F5F8FA] border border-[#E8EBF0] rounded-xl p-4 relative shadow-sm">
          <div className="absolute top-0 left-0 bg-[#E8EBF0] text-[10px] font-bold text-[#707070] px-3 py-1 rounded-br-xl rounded-tl-xl tracking-wider">TRANSCRIPT</div>
          <p className="font-mono text-sm text-[#002970] mt-3 font-bold h-10 flex items-center justify-center text-center">
            {error ? <span className="text-khata-red">{error}</span> : `> ${lastTranscript}`}
          </p>
        </div>
      </div>

      {/* Manual Simulator Fallback */}
      <div className="pt-4 border-t border-[#E8EBF0] flex justify-center">
        <button
          onClick={simulatePayment}
          className="text-sm font-bold bg-[#00BAF2] hover:bg-[#00A8DC] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-md border border-transparent"
        >
          <Activity size={16} />
          Simulate Payment
        </button>
      </div>

    </div>
  );
};

export default SoundboxListener;
