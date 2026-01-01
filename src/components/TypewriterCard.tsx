import React, { useEffect, useState } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { PrintedCard } from '../types';
import { X, Check, AlarmClock } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

interface TypewriterCardProps {
  card: PrintedCard;
  containerRef: React.RefObject<HTMLDivElement>;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onDragEnd?: () => void;
  onUpdatePosition?: (id: string, newX: number, newY: number) => void;
}

export const TypewriterCard: React.FC<TypewriterCardProps> = ({ card, containerRef, onDelete, onToggleComplete, onDragEnd, onUpdatePosition }) => {
  const [isDragging, setIsDragging] = useState(false);

  // Disable click-through during drag
  const handleDragStart = () => {
    setIsDragging(true);
    if (isTauri) {
      invoke('set_ignore_cursor_events', { ignore: false }).catch(() => { });
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);

    // Get the absolute truth of the element's position
    const element = event.target as HTMLElement;
    const rect = element.getBoundingClientRect();

    // Update card position in state with screen-relative coordinates
    if (onUpdatePosition) {
      onUpdatePosition(card.id, rect.left, rect.top);
    }

    // Update hit boxes
    if (onDragEnd) onDragEnd();

    // Re-enable click-through after a short delay
    setTimeout(() => {
      if (isTauri) {
        // The backend will handle this based on mouse position
      }
    }, 100);
  };
  const [displayText, setDisplayText] = useState('');
  const dragControls = useDragControls();

  // Typewriter effect logic
  useEffect(() => {
    let currentIndex = 0;
    const speed = Math.max(20, 80 - (card.text.length * 0.2));

    const typeChar = () => {
      if (currentIndex < card.text.length) {
        setDisplayText(card.text.slice(0, currentIndex + 1));
        currentIndex++;

        const randomVariance = Math.random() * 30;
        setTimeout(typeChar, speed + randomVariance);
      }
    };

    const initialDelay = setTimeout(typeChar, 500);
    return () => clearTimeout(initialDelay);
  }, [card.text]);

  // Calculate status
  const isCompleted = card.isCompleted;
  const hasDueDate = !!card.dueDate;
  const isOverdue = hasDueDate && !isCompleted && new Date(card.dueDate!) < new Date();

  // Format Date
  const formattedDueDate = card.dueDate ? new Date(card.dueDate).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  }) : null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragControls={dragControls}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      // Remove dragConstraints for now to unblock dragging

      // Use initial/animate for appearance only, NOT position
      initial={{ opacity: 0, scale: 0.9, rotate: 0 }}
      animate={{
        x: card.x,
        y: card.y,
        opacity: isCompleted ? 0.8 : 1,
        scale: isCompleted ? 0.98 : 1,
        rotate: card.rotation
      }}
      whileHover={{ scale: 1.02, zIndex: 40, boxShadow: "0 20px 30px -5px rgba(131, 56, 236, 0.15)" }}
      whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 100, boxShadow: "0 25px 50px -12px rgba(131, 56, 236, 0.25)" }}
      className={`w-64 sm:w-72 bg-paper-white text-gray-900 p-6 shadow-xl cursor-grab select-none overflow-hidden border-t-4 transition-colors duration-500
        ${isOverdue ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-cyber-yellow'}
        ${isCompleted ? 'grayscale-[0.5]' : ''}
      `}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundImage: `url("https://www.transparenttextures.com/patterns/cream-paper.png")`,
      }}
    >
      {/* Overdue Pulse Overlay */}
      {isOverdue && (
        <div className="absolute inset-0 border-2 border-red-500/30 animate-pulse pointer-events-none z-0"></div>
      )}

      {/* Tape/Pin visual at top */}
      <div className={`absolute -top-2.5 left-1/2 transform -translate-x-1/2 w-10 h-8 bg-ultra-violet/20 rotate-1 backdrop-blur-[1px] rounded-sm ${isCompleted ? 'bg-green-500/20' : ''}`}></div>

      {/* Controls: Delete & Check */}
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        {/* Completion Toggle */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(card.id);
          }}
          className={`p-1 rounded-full transition-all ${isCompleted ? 'text-green-600 bg-green-100' : 'text-gray-300 hover:text-green-500 hover:bg-green-50'}`}
          title={isCompleted ? "Mark as Undone" : "Mark as Done"}
        >
          <Check size={16} strokeWidth={3} />
        </button>

        {/* Delete */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full p-1"
          title="Discard"
        >
          <X size={16} />
        </button>
      </div>

      {/* Header Info */}
      <div className="mb-4 border-b-2 border-stone-100 pb-1 flex justify-between items-end relative z-10">
        <div className="flex flex-col">
          <span className="font-typewriter text-[10px] text-ultra-violet font-bold uppercase tracking-widest">ID.{card.id.slice(0, 4)}</span>
          {hasDueDate && (
            <span className={`font-pager text-[12px] flex items-center gap-1 ${isOverdue ? 'text-red-500 animate-pulse font-bold' : 'text-ultra-violet/70'}`}>
              <AlarmClock size={10} />
              {formattedDueDate}
            </span>
          )}
        </div>
        {!hasDueDate && <span className="font-typewriter text-[10px] text-gray-400">{card.timestamp}</span>}
      </div>

      {/* Content */}
      <div className={`font-typewriter text-base leading-relaxed text-gray-800 min-h-[60px] break-words relative z-10 transition-all ${isCompleted ? 'line-through text-gray-400 blur-[0.5px]' : ''}`}>
        {displayText}
        {displayText.length < card.text.length && !isCompleted && (
          <span className="inline-block w-2 h-4 bg-cyber-yellow animate-pulse ml-0.5 align-middle"></span>
        )}
      </div>

      {/* COMPLETED STAMP */}
      {isCompleted && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] border-4 border-red-600/40 text-red-600/40 px-4 py-2 rounded font-black text-3xl tracking-widest pointer-events-none z-30 mix-blend-multiply animate-in zoom-in duration-300 select-none">
          DONE
        </div>
      )}

      <div className="mt-6 flex justify-center opacity-30">
        <div className="text-[8px] font-sans tracking-[0.3em] text-ultra-violet font-bold uppercase">
          Motorola Fix
        </div>
      </div>
    </motion.div>
  );
};