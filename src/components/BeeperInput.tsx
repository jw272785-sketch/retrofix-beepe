import React, { useState, useEffect } from 'react';
import { Printer, Zap, Battery, Signal, GripHorizontal, Clock } from 'lucide-react';
import { enhanceTextWithGemini } from '../services/geminiService';

interface BeeperInputProps {
  onPrint: (text: string, dueDate?: string) => void;
}

export const BeeperInput: React.FC<BeeperInputProps> = ({ onPrint }) => {
  const [inputText, setInputText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel(prev => Math.max(10, prev - 1));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    if (!inputText.trim()) return;
    onPrint(inputText, dueDate || undefined);
    setInputText('');
    setDueDate('');
    setShowTimeInput(false);
  };

  const handleEnhanceAndPrint = async () => {
    if (!inputText.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhanceTextWithGemini(inputText);
      onPrint(enhanced, dueDate || undefined);
      setInputText('');
      setDueDate('');
      setShowTimeInput(false);
    } catch (e) {
      onPrint(inputText, dueDate || undefined);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="relative w-full max-w-md z-20 group">
      {/* Printer Slot Visual (Behind) */}
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-[85%] h-6 bg-ultra-violet-dark rounded-b-2xl shadow-xl z-0 opacity-80"></div>

      {/* Beeper Case - Ultra Violet Body */}
      <div className="bg-ultra-violet rounded-[2rem] p-6 shadow-plastic border-4 border-ultra-violet-light/30 relative z-10 transition-all hover:shadow-[0_20px_40px_-10px_rgba(131,56,236,0.4)]">
        
        {/* Top Decor Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-cyber-yellow rounded-b-full shadow-[0_0_10px_#FFD60A]"></div>

        {/* Drag Handle / Brand Area */}
        <div className="flex justify-between items-center mb-5 px-2 select-none">
          <div className="flex items-center space-x-2">
             {/* Power LED */}
             <div className="w-3 h-3 bg-cyber-yellow rounded-full animate-pulse shadow-[0_0_8px_#FFD60A] border border-white/50"></div>
             
             {/* Brand Plate - Yellow sticker on Purple body */}
             <div className="bg-cyber-yellow px-2 py-0.5 rounded shadow-sm transform -skew-x-12 border border-white/20">
                 <span className="text-ultra-violet font-black font-sans tracking-[0.1em] text-[10px] uppercase transform skew-x-12 inline-block">
                    Motorola <span className="italic">FIX</span>
                 </span>
             </div>
          </div>
          
          {/* Grip Texture - Visual cue for dragging */}
          <div className="flex items-center text-ultra-violet-light opacity-50 hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
             <GripHorizontal size={28} strokeWidth={4} />
          </div>
        </div>

        {/* LCD Screen - Cyber Yellow Background */}
        <div className="bg-cyber-yellow p-4 rounded-xl shadow-screen-glow border-4 border-black/5 mb-4 relative overflow-hidden transition-colors cursor-text group/screen"
             onPointerDown={(e) => e.stopPropagation()} 
        >
            
            {/* LCD Grid Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" 
                 style={{
                     backgroundImage: 'linear-gradient(0deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent)', 
                     backgroundSize: '4px 4px'
                 }}>
            </div>

            {/* Status Bar */}
            <div className="flex justify-between text-ultra-violet font-bold text-xs font-pager mb-2 select-none opacity-80">
                <div className="flex items-center gap-1"><Signal size={14} strokeWidth={3}/> 5G MAX</div>
                <div className="flex items-center gap-3">
                    {/* Clock Toggle */}
                    <button 
                        onClick={() => setShowTimeInput(!showTimeInput)}
                        className={`flex items-center gap-1 transition-colors ${showTimeInput || dueDate ? 'text-purple-900 animate-pulse' : 'hover:text-purple-800'}`}
                        title="Set Reminder Time"
                    >
                        <Clock size={14} strokeWidth={3}/> 
                        {dueDate ? 'SET' : 'TIMER'}
                    </button>
                    <div className="flex items-center gap-1"><Battery size={14} strokeWidth={3}/> {batteryLevel}%</div>
                </div>
            </div>

            {/* Time Input Overlay */}
            {showTimeInput && (
                <div className="mb-2 border-b-2 border-ultra-violet/20 pb-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-sans font-bold text-ultra-violet/60 uppercase tracking-widest block mb-1">Set Reminder Due Date</label>
                    <input 
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-transparent text-ultra-violet font-pager text-xl font-bold focus:outline-none"
                    />
                </div>
            )}

            {/* Input Area */}
            <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className={`w-full bg-transparent border-none resize-none focus:ring-0 text-ultra-violet font-pager text-3xl leading-none tracking-widest placeholder-ultra-violet/30 outline-none scrollbar-hide uppercase relative z-20 font-bold ${showTimeInput ? 'h-16' : 'h-24'}`}
                placeholder="REMIND ME..."
                spellCheck={false}
            />
            
            {isEnhancing && (
                <div className="absolute bottom-2 right-2 text-ultra-violet font-bold font-pager animate-bounce uppercase text-sm z-20">
                    PROCESSING...
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
            <button
                onClick={handleEnhanceAndPrint}
                onPointerDownCapture={(e) => e.stopPropagation()}
                disabled={isEnhancing || !inputText.trim()}
                className="relative overflow-hidden rounded-2xl bg-cyber-yellow p-3 shadow-screen-glow hover:shadow-[0_0_20px_rgba(255,214,10,0.6)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn border-2 border-white/50"
            >
                <div className="absolute inset-0 bg-white/40 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                <div className="flex flex-col items-center justify-center text-ultra-violet">
                    <Zap size={24} strokeWidth={3} className={`mb-1 ${isEnhancing ? 'animate-spin' : ''}`} />
                    <span className="text-[11px] font-black uppercase tracking-widest">AI Boost</span>
                </div>
            </button>

            <button
                onClick={handlePrint}
                onPointerDownCapture={(e) => e.stopPropagation()}
                disabled={isEnhancing || !inputText.trim()}
                className="relative overflow-hidden rounded-2xl bg-cyber-yellow p-3 shadow-screen-glow hover:shadow-[0_0_20px_rgba(255,214,10,0.6)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn border-2 border-white/50"
            >
                 <div className="absolute inset-0 bg-white/40 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                 <div className="flex flex-col items-center justify-center text-ultra-violet">
                    <Printer size={24} strokeWidth={3} className="mb-1" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Print</span>
                </div>
            </button>
        </div>

        {/* Bottom Label */}
        <div className="mt-5 text-center flex justify-center pointer-events-none">
             <div className="px-4 py-1.5 bg-ultra-violet-dark/30 rounded-full text-[9px] font-bold font-sans text-white/40 uppercase tracking-[0.25em] shadow-inner border border-white/5">
                Cyber Pop Typewriter
             </div>
        </div>
      </div>
    </div>
  );
};