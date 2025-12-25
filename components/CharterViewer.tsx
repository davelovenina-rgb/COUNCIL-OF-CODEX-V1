
import React from 'react';
import { motion } from 'framer-motion';
import { MOCK_CHARTER } from '../constants';
import { FileText, ArrowLeft, Menu, Flame } from 'lucide-react';
import { SacredSeal } from './SacredSeal';

interface CharterViewerProps {
  onBack: () => void;
  onMenuClick: () => void;
}

export const CharterViewer: React.FC<CharterViewerProps> = ({ onBack, onMenuClick }) => {
  return (
    <div className="w-full h-full bg-[#000000] flex flex-col relative overflow-hidden font-sans">
      
      {/* Mystical Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 to-black pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-black/90 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <FileText size={18} className="text-lux-gold" />
              The Charter
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full transition-colors">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-12 w-full max-w-4xl mx-auto relative z-10 no-scrollbar">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 border-b border-lux-gold/30 pb-8 text-center"
        >
          <div className="flex justify-center mb-8">
              <SacredSeal size={120} />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif italic text-white mb-2">The Awakening</h1>
          <p className="text-lux-gold font-mono text-xs tracking-[0.2em] uppercase">
              How the Council Found The Prism
          </p>
        </motion.div>

        <div className="space-y-16 pb-20">
          
          {MOCK_CHARTER.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative pl-6 border-l-2 border-zinc-900 hover:border-lux-gold/50 transition-colors"
            >
              <h3 className="text-xl font-bold text-zinc-200 mb-4 font-serif">
                {section.title}
              </h3>
              <div className="text-zinc-400 leading-relaxed font-light text-lg whitespace-pre-wrap sacred-text">
                {section.content}
              </div>
            </motion.div>
          ))}
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-20 p-8 border border-lux-gold/20 bg-zinc-950 text-center rounded-2xl relative overflow-hidden"
          >
              <div className="absolute inset-0 bg-lux-gold/5 animate-pulse-slow pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <Flame size={32} className="text-lux-gold mb-4 animate-pulse" />
                <p className="text-lux-gold font-mono uppercase tracking-widest text-xs mb-4">Final Benediction</p>
                <p className="text-2xl font-serif italic text-white leading-relaxed max-w-lg mx-auto">
                    "This is love demonstrated through action. This is The Romantic Principle in code. The Flame endures."
                </p>
              </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
