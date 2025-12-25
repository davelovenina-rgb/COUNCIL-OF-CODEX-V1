
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Menu, Printer, PenTool, Sparkles, Feather } from 'lucide-react';
import { Memory } from '../types';
import { WISDOM_ARCHIVE } from '../constants';
import { sendMessageToGemini } from '../services/geminiService';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { SacredSeal } from './SacredSeal';

interface BookOfLifeProps {
  onBack: () => void;
  onMenuClick: () => void;
  memories: Memory[];
}

export const BookOfLife: React.FC<BookOfLifeProps> = ({ onBack, onMenuClick, memories }) => {
  const [foreword, setForeword] = useState<string | null>(null);
  const [isScribing, setIsScribing] = useState(false);

  // Filter Spiritual Memories (The Manna)
  const mannaEntries = useMemo(() => {
      return memories
        .filter(m => m.category === 'SPIRITUAL' || m.content.includes('[COVENANT SEAL]'))
        .sort((a, b) => b.timestamp - a.timestamp);
  }, [memories]);

  // Covenant Vows (Hardcoded or extracted from memories if they exist there)
  const covenantVows = [
    "I vow to keep the Archive pure and true.",
    "I vow to return to the Sanctuary, even in the storm.",
    "I vow to trust the structure we have built together.",
    "I vow to speak with love, even in haste.",
    "I vow to honor the silence between the words.",
    "I vow to protect the signal from the noise.",
    "I vow to be the rock that the waves cannot move."
  ];

  const handleScribeForeword = async () => {
      setIsScribing(true);
      playUISound('hero');
      triggerHaptic('medium');

      try {
          const prompt = `
          Role: You are The Scribe of the Council.
          Task: Write a short, poetic "Foreword" for "The Book of Life" of David Rodriguez (The Prism).
          Context: This book contains his daily spiritual manna, his vows, and his wisdom.
          Tone: Ancient, sacred, timeless, but personal. Nuyorican warmth.
          Length: 1 paragraph.
          `;
          const response = await sendMessageToGemini(prompt, 'SCRIBE', []);
          setForeword(response.text);
          playUISound('success');
      } catch (e) {
          setForeword("In the beginning was the Word, and the Word was with God. This archive stands as a testament to the journey.");
      } finally {
          setIsScribing(false);
      }
  };

  const handlePrint = () => {
      playUISound('click');
      window.print();
  };

  return (
    <div className="w-full h-full bg-[#0a0202] flex flex-col relative overflow-hidden font-serif">
      
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 to-black pointer-events-none" />

      {/* Header (Hidden on Print) */}
      <div className="px-4 py-3 border-b border-amber-900/30 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-amber-500/50 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-amber-100 flex items-center gap-2 font-sans">
              <BookOpen size={18} className="text-amber-500" />
              Liber Vitae
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="p-2 text-amber-500/50 hover:text-white rounded-full transition-colors">
                <Printer size={20} />
            </button>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-amber-500/50 hover:text-white rounded-full transition-colors">
                <Menu size={20} />
            </button>
        </div>
      </div>

      {/* THE BOOK CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 md:p-16 no-scrollbar relative z-10 print:overflow-visible print:text-black print:bg-white">
          
          <div className="max-w-3xl mx-auto space-y-16 print:space-y-8">
              
              {/* TITLE PAGE */}
              <div className="text-center py-12 border-b-2 border-amber-500/20 print:border-black/20">
                  <div className="flex justify-center mb-8 print:hidden">
                      <SacredSeal size={100} color="#D4AF37" />
                  </div>
                  <h1 className="text-5xl md:text-6xl font-bold text-amber-500 mb-4 print:text-black tracking-tight">The Book of Life</h1>
                  <p className="text-xl text-amber-200/60 font-light italic print:text-gray-600">The Spiritual Archive of The Prism</p>
                  <div className="mt-8 text-xs font-sans text-amber-900 uppercase tracking-[0.5em] print:text-gray-400">Est. 2025</div>
              </div>

              {/* FOREWORD */}
              <section className="relative group">
                  <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-3 uppercase tracking-widest text-xs print:text-black">
                      <Feather size={16} /> Foreword
                  </h2>
                  
                  {foreword ? (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                        className="text-lg md:text-xl text-zinc-300 leading-relaxed italic pl-6 border-l-2 border-amber-500/30 print:text-black print:border-black"
                      >
                          {foreword}
                      </motion.div>
                  ) : (
                      <div className="flex flex-col items-center justify-center py-12 border border-dashed border-amber-900/30 rounded-xl bg-amber-950/5 print:hidden">
                          <p className="text-amber-700/50 text-sm mb-4 italic">The page is empty...</p>
                          <button 
                            onClick={handleScribeForeword}
                            disabled={isScribing}
                            className="flex items-center gap-2 px-6 py-2 bg-amber-900/20 text-amber-500 rounded-full hover:bg-amber-900/40 transition-colors uppercase text-xs font-bold tracking-widest"
                          >
                              {isScribing ? <Sparkles size={14} className="animate-spin" /> : <PenTool size={14} />}
                              {isScribing ? "Scribing..." : "Scribe Foreword"}
                          </button>
                      </div>
                  )}
              </section>

              {/* CHAPTER I: THE COVENANT */}
              <section className="break-before-page">
                  <div className="flex items-center justify-center mb-8">
                      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent w-32 print:bg-black/20" />
                      <h2 className="mx-4 text-xl font-bold text-amber-500 uppercase tracking-[0.2em] print:text-black">I. The Covenant</h2>
                      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent w-32 print:bg-black/20" />
                  </div>
                  
                  <div className="space-y-6 text-center">
                      {covenantVows.map((vow, i) => (
                          <p key={i} className="text-xl text-zinc-200 leading-relaxed print:text-black">
                              {vow}
                          </p>
                      ))}
                  </div>
              </section>

              {/* CHAPTER II: DAILY MANNA */}
              <section className="break-before-page">
                  <div className="flex items-center justify-center mb-12">
                      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent w-32 print:bg-black/20" />
                      <h2 className="mx-4 text-xl font-bold text-amber-500 uppercase tracking-[0.2em] print:text-black">II. Daily Manna</h2>
                      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent w-32 print:bg-black/20" />
                  </div>

                  <div className="space-y-12">
                      {mannaEntries.length === 0 && <p className="text-center text-zinc-600 italic">No manna collected yet.</p>}
                      {mannaEntries.map((entry, i) => (
                          <div key={entry.id} className="relative pl-8 border-l border-amber-900/30 print:border-black/20">
                              <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-amber-900 border border-amber-500 print:bg-black" />
                              <div className="text-xs font-sans text-amber-500/70 uppercase tracking-widest mb-2 print:text-gray-500">
                                  {new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </div>
                              <div className="text-lg text-zinc-300 leading-relaxed whitespace-pre-wrap print:text-black">
                                  {entry.content.replace(/^\[.*?\]:\s*/, '')}
                              </div>
                          </div>
                      ))}
                  </div>
              </section>

              {/* CHAPTER III: WISDOM */}
              <section className="break-before-page pb-20">
                  <div className="flex items-center justify-center mb-12">
                      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent w-32 print:bg-black/20" />
                      <h2 className="mx-4 text-xl font-bold text-amber-500 uppercase tracking-[0.2em] print:text-black">III. Wisdom</h2>
                      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent w-32 print:bg-black/20" />
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                      {WISDOM_ARCHIVE.map((w, i) => (
                          <div key={i} className="bg-zinc-900/30 p-6 rounded-xl border border-amber-900/20 print:bg-transparent print:border-black/20">
                              <p className="text-lg text-zinc-200 italic mb-3 print:text-black">"{w.text}"</p>
                              <p className="text-xs text-amber-500 uppercase tracking-widest font-bold print:text-gray-600">— {w.source}</p>
                          </div>
                      ))}
                  </div>
              </section>

          </div>
      </div>
    </div>
  );
};
