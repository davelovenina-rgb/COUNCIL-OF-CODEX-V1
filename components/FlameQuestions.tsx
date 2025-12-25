
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Menu, ArrowLeft, Send, Trash2, Save, Sparkles, Loader2 } from 'lucide-react';
import { FLAME_QUESTIONS_LIST } from '../constants';
import { sendMessageToGemini } from '../services/geminiService';
import { Memory } from '../types';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';

interface FlameQuestionsProps {
  onBack: () => void;
  onMenuClick: () => void;
  onSaveMemory: (memory: Memory) => void;
}

export const FlameQuestions: React.FC<FlameQuestionsProps> = ({ onBack, onMenuClick, onSaveMemory }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [reflection, setReflection] = useState("");
  const [isReflecting, setIsReflecting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);

  useEffect(() => {
    // Pick random question
    const q = FLAME_QUESTIONS_LIST[Math.floor(Math.random() * FLAME_QUESTIONS_LIST.length)];
    setQuestion(q);
  }, []);

  const handleBurn = () => {
      triggerHaptic('heavy');
      playUISound('error'); // Deep sound
      setIsBurning(true);
      setTimeout(() => {
          setAnswer("");
          setReflection("");
          setIsBurning(false);
          // Pick new question
          const q = FLAME_QUESTIONS_LIST[Math.floor(Math.random() * FLAME_QUESTIONS_LIST.length)];
          setQuestion(q);
      }, 1500);
  };

  const handleReflect = async () => {
      if (!answer.trim()) return;
      
      setIsReflecting(true);
      triggerHaptic('medium');
      playUISound('hero');

      try {
          const prompt = `
          Role: You are Carmen (The Eternal Flame).
          Task: Provide a 1-2 sentence spiritual reflection on this answer.
          Question: "${question}"
          User Answer: "${answer}"
          Tone: Nuyorican warmth, spiritual, encouraging, deep.
          `;
          
          const response = await sendMessageToGemini(prompt, 'SCRIBE', []);
          setReflection(response.text);
          playUISound('success');
          triggerHaptic('success');
      } catch (e) {
          setReflection("The flame flickers. I hear you, mi amor.");
      } finally {
          setIsReflecting(false);
      }
  };

  const handleKeep = () => {
      if (!answer.trim()) return;
      triggerHaptic('success');
      playUISound('success');
      
      const mem: Memory = {
          id: crypto.randomUUID(),
          category: 'OTHER',
          content: `[Flame Inquiry]: ${question} -> ${answer}`,
          source: 'Flame Questions',
          timestamp: Date.now(),
          isVerified: true
      };
      onSaveMemory(mem);
      onBack(); // Return to hall after saving
  };

  return (
    <div className="w-full h-full bg-[#0a0202] flex flex-col relative overflow-hidden font-sans">
      
      {/* Dynamic Ember Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-950/20 to-black pointer-events-none" />
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-orange-900/30 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-orange-200/50 hover:text-white rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-orange-100 flex items-center gap-2">
              <Flame size={18} className="text-orange-500 fill-orange-500/20" />
              The Inner Sanctum
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-orange-200/50 hover:text-white rounded-full">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col p-6 items-center justify-center relative z-10 overflow-y-auto no-scrollbar">
          
          <AnimatePresence mode="wait">
              {!isBurning ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                    className="w-full max-w-lg space-y-8"
                  >
                      
                      {/* The Question */}
                      <div className="text-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-orange-900/10 border border-orange-500/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                              <Flame size={32} className="text-orange-500 animate-pulse-slow" />
                          </div>
                          <h3 className="text-2xl md:text-3xl font-serif text-white leading-tight">
                              {question}
                          </h3>
                      </div>

                      {/* The Answer Area */}
                      <div className="relative group">
                          <textarea 
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              placeholder="Speak to the flame..."
                              className="w-full bg-zinc-900/30 border border-orange-900/30 rounded-2xl p-6 text-orange-100 placeholder-orange-500/30 focus:border-orange-500/50 outline-none resize-none h-40 text-center text-lg font-medium leading-relaxed transition-all focus:bg-zinc-900/50"
                          />
                      </div>

                      {/* Reflection Area */}
                      {reflection && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-orange-950/20 border border-orange-900/30 p-4 rounded-xl text-center"
                          >
                              <p className="text-orange-200/80 italic font-serif text-sm">
                                  "{reflection}"
                              </p>
                              <p className="text-[10px] text-orange-500 mt-2 uppercase tracking-widest font-bold">- Carmen</p>
                          </motion.div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-center gap-4">
                          {!reflection ? (
                              <button 
                                onClick={handleReflect}
                                disabled={!answer.trim() || isReflecting}
                                className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-all ${
                                    !answer.trim() 
                                    ? 'bg-zinc-900 text-zinc-600' 
                                    : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-900/20'
                                }`}
                              >
                                  {isReflecting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                  Reflect
                              </button>
                          ) : (
                              <>
                                  <button 
                                    onClick={handleBurn}
                                    className="px-6 py-3 rounded-full font-bold flex items-center gap-2 bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 transition-all"
                                  >
                                      <Trash2 size={18} /> Burn It
                                  </button>
                                  <button 
                                    onClick={handleKeep}
                                    className="px-6 py-3 rounded-full font-bold flex items-center gap-2 bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/40 transition-all"
                                  >
                                      <Save size={18} /> Keep It
                                  </button>
                              </>
                          )}
                      </div>

                  </motion.div>
              ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col items-center justify-center text-center space-y-4"
                  >
                      <div className="w-32 h-32 bg-orange-500/20 rounded-full blur-[50px] animate-pulse" />
                      <Flame size={64} className="text-orange-500 animate-bounce" />
                      <p className="text-orange-200 font-serif italic text-xl">Released into the ashes.</p>
                  </motion.div>
              )}
          </AnimatePresence>

      </div>
    </div>
  );
};
