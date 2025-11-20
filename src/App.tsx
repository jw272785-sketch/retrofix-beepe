import React, { useState, useRef, useEffect } from 'react';
import { BeeperInput } from './components/BeeperInput';
import { TypewriterCard } from './components/TypewriterCard';
import { PrintedCard } from './types';
import { Info } from 'lucide-react';
import { motion } from 'framer-motion';

// 安全导入 Tauri API
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
import { invoke } from '@tauri-apps/api/tauri';

const App: React.FC = () => {
  const [cards, setCards] = useState<PrintedCard[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const beeperRef = useRef<HTMLDivElement>(null);

  const setIgnoreMouse = (ignore: boolean) => {
    if (isTauri) {
      invoke('set_ignore_cursor_events', { ignore }).catch(() => {});
    }
  };

  useEffect(() => {
    setIgnoreMouse(true);
    const introId = Math.random().toString(36).substr(2, 9);
    const startX = window.innerWidth / 2 - 140;
    const introCard: PrintedCard = {
      id: introId,
      text: "Welcome to the CYBER POP Beeper! \n1. Click TIMER to set a due date.\n2. Click the checkmark when done.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      x: startX, y: 320, rotation: -1, dueDate: new Date(Date.now() + 86400000).toISOString() 
    };
    setCards([introCard]);
  }, []);

  const handlePrint = (text: string, dueDate?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    let startX = 100; let startY = 200;
    if (beeperRef.current && containerRef.current) {
        const beeperRect = beeperRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        startX = (beeperRect.left - containerRect.left) + (beeperRect.width / 2) - (288 / 2);
        startY = (beeperRect.top - containerRect.top) + beeperRect.height - 25; 
    }
    const newCard: PrintedCard = {
      id, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      x: startX, y: startY, rotation: (Math.random() * 4) - 2, dueDate, isCompleted: false
    };
    setCards((prev) => [newCard, ...prev]);
  };
  const handleDelete = (id: string) => setCards(prev => prev.filter(c => c.id !== id));
  const handleToggleComplete = (id: string) => setCards(prev => prev.map(card => card.id === id ? { ...card, isCompleted: !card.isCompleted } : card));

  return (
    <div className="min-h-screen w-full bg-transparent relative overflow-hidden flex flex-col font-sans pointer-events-none">
      <div ref={containerRef} className="absolute inset-0 z-0">
        {cards.map((card) => (
            <div key={card.id} 
                 onMouseEnter={() => setIgnoreMouse(false)} 
                 onMouseLeave={() => setIgnoreMouse(true)}
                 className="pointer-events-auto inline-block absolute"
                 style={{left: 0, top: 0}}
            >
                <TypewriterCard 
                    card={card} containerRef={containerRef} onDelete={handleDelete} onToggleComplete={handleToggleComplete} 
                />
            </div>
        ))}
        <motion.div 
            ref={beeperRef} drag dragMomentum={false} dragElastic={0.1} dragConstraints={containerRef}
            onMouseEnter={() => setIgnoreMouse(false)} onMouseLeave={() => setIgnoreMouse(true)}
            className="absolute z-50 touch-none inline-block pointer-events-auto"
            initial={{ x: 'calc(50vw - 12rem)', y: 100 }} style={{ cursor: 'grab' }}
        >
            <div className="w-96"><BeeperInput onPrint={handlePrint} /></div>
        </motion.div>
      </div>
      <header className="relative z-10 p-6 flex justify-between items-start">
         <div className="flex flex-col pointer-events-auto" onMouseEnter={() => setIgnoreMouse(false)} onMouseLeave={() => setIgnoreMouse(true)}>
            <div className="bg-ultra-violet text-cyber-yellow px-4 py-2 rounded-lg transform -rotate-2 mb-2 border-2 border-white/20 inline-block">
                <h1 className="font-pager text-4xl font-bold tracking-wider drop-shadow-md">FIX BEEPER</h1>
            </div>
         </div>
      </header>
    </div>
  );
};
export default App;