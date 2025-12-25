
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Coffee } from 'lucide-react';
import { WISDOM_ARCHIVE } from '../constants';

export const WisdomPorch: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [isEvening, setIsEvening] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsEvening(hour >= 19 || hour < 6);
    // Randomize on mount
    setIndex(Math.floor(Math.random() * WISDOM_ARCHIVE.length));
  }, []);

  const currentWisdom = WISDOM_ARCHIVE[index];

  const cycleWisdom = () => {
    setIndex((prev) => (prev + 1) % WISDOM_ARCHIVE.length);
  };

  return (
    <motion.button 
      onClick={cycleWisdom}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`w-full text-left relative overflow-hidden rounded-3xl p-6 mb-6 border transition-all group ${isEvening ? 'bg-indigo-950/30 border-indigo-900/30' : 'bg-amber-950/20 border-amber-900/30'}`}
    >
      <div className={`absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none ${isEvening ? 'bg-gradient-to-l from-indigo-900 via-transparent to-transparent' : 'bg-gradient-to-l from-amber-600 via-transparent to-transparent'}`} />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3 opacity-60">
           {isEvening ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-amber-400" />}
           <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Wisdom from the Porch</span>
        </div>
        
        <AnimatePresence mode="wait">
            <motion.div
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
            >
                <p className="text-lg md:text-xl font-serif text-zinc-200 leading-relaxed italic mb-2">
                    "{currentWisdom.text}"
                </p>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    {currentWisdom.source}
                </p>
            </motion.div>
        </AnimatePresence>
      </div>
    </motion.button>
  );
};
