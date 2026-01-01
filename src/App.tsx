import React, { useState, useRef, useEffect } from 'react';
import { BeeperInput } from './components/BeeperInput';
import { TypewriterCard } from './components/TypewriterCard';
import { PrintedCard } from './types';
import { Info } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';

// 安全导入 Tauri API
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
import { invoke } from '@tauri-apps/api/tauri';

const App: React.FC = () => {
  const [cards, setCards] = useState<PrintedCard[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const beeperRef = useRef<HTMLDivElement>(null);

  // Use motion values for beeper position
  const beeperX = useMotionValue(window.innerWidth / 2 - 192);
  const beeperY = useMotionValue(100);

  // Calculate and send hit boxes to backend
  const updateHitBoxes = () => {
    if (!isTauri) return;

    const hitBoxes: Array<{ x: number, y: number, width: number, height: number }> = [];

    // Add beeper hit box
    if (beeperRef.current) {
      const rect = beeperRef.current.getBoundingClientRect();
      hitBoxes.push({
        x: Math.round(rect.left + window.screenX),
        y: Math.round(rect.top + window.screenY),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
      console.log('Beeper hit box:', hitBoxes[hitBoxes.length - 1]);
    }

    // Add card hit boxes - calculate from cards state
    console.log('Cards array:', cards);
    cards.forEach((card) => {
      // Card is w-72 (288px) and height is roughly 300px
      const cardWidth = 288;
      const cardHeight = 300;
      hitBoxes.push({
        x: Math.round(card.x + window.screenX),
        y: Math.round(card.y + window.screenY),
        width: cardWidth,
        height: cardHeight
      });
      console.log('Card hit box:', hitBoxes[hitBoxes.length - 1], 'for card:', card.id);
    });

    console.log('Sending hit boxes:', hitBoxes);
    invoke('update_hit_boxes', { hitBoxes }).catch((e) => console.error('Failed to update hit boxes:', e));
  };

  // Update hit boxes when cards change or beeper moves
  useEffect(() => {
    updateHitBoxes();
    // Set up interval to update hit boxes periodically (in case of window resize, etc.)
    const interval = setInterval(updateHitBoxes, 200);
    return () => clearInterval(interval);
  }, [cards]);

  // Load cards from localStorage on mount
  useEffect(() => {
    const savedCards = localStorage.getItem('retrofix-cards');
    if (savedCards) {
      try {
        setCards(JSON.parse(savedCards));
      } catch (e) {
        console.error('Failed to load saved cards:', e);
        // Show intro card if loading fails
        showIntroCard();
      }
    } else {
      // Show intro card for first-time users
      showIntroCard();
    }
  }, []);

  // Save cards to localStorage whenever they change
  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem('retrofix-cards', JSON.stringify(cards));
    }
  }, [cards]);

  const showIntroCard = () => {
    const introId = Math.random().toString(36).substr(2, 9);
    const startX = window.innerWidth / 2 - 140;
    const introCard: PrintedCard = {
      id: introId,
      text: "Welcome to the CYBER POP Beeper! \n1. Click TIMER to set a due date.\n2. Click the checkmark when done.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      x: startX, y: 320, rotation: -1, dueDate: new Date(Date.now() + 86400000).toISOString()
    };
    setCards([introCard]);
  };

  const handleUpdatePosition = (id: string, newX: number, newY: number) => {
    setCards(prev => prev.map(card =>
      card.id === id ? { ...card, x: newX, y: newY } : card
    ));
  };

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
    <div
      className="min-h-screen w-full relative overflow-hidden flex flex-col font-sans"
    >
      {/* Interactive elements container */}
      <div ref={containerRef} className="absolute inset-0 z-10">
        {cards.map((card) => (
          <div key={card.id}
            className="inline-block absolute"
            style={{ left: 0, top: 0 }}
            data-card="true"
          >
            <TypewriterCard
              card={card}
              containerRef={containerRef}
              onDelete={handleDelete}
              onToggleComplete={handleToggleComplete}
              onDragEnd={updateHitBoxes}
              onUpdatePosition={handleUpdatePosition}
            />
          </div>
        ))}
        <motion.div
          ref={beeperRef}
          drag
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={containerRef}
          className="absolute z-50 inline-block"
          style={{
            cursor: 'grab',
            x: beeperX,
            y: beeperY
          }}
          onDragEnd={updateHitBoxes}
        >
          <div className="w-96"><BeeperInput onPrint={handlePrint} /></div>
        </motion.div>
      </div>

      {/* Header - also interactive */}
      <header className="relative z-20 p-6 flex justify-between items-start">
        <div className="flex flex-col">
          <div className="bg-ultra-violet text-cyber-yellow px-4 py-2 rounded-lg transform -rotate-2 mb-2 border-2 border-white/20 inline-block">
            <h1 className="font-pager text-4xl font-bold tracking-wider drop-shadow-md">FIX BEEPER</h1>
          </div>
        </div>
      </header>
    </div>
  );
};
export default App;