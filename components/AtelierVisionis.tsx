
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Video, Image as ImageIcon, MessageSquare, ArrowLeft, Menu, Wand2, Zap, RefreshCcw, Copy, Loader2, X, Share, Layers } from 'lucide-react';
import { LYRA_CAPTIONS } from '../constants';
import { CouncilMemberId, CouncilMode } from '../types';
import { sendMessageToGemini } from '../services/geminiService'; // Import service for direct generation
import { showToast } from '../utils/events';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { SacredSeal } from './SacredSeal';

interface AtelierVisionisProps {
  onBack: () => void;
  onMenuClick: () => void;
  onOpenSession: (sessionId: string, initialMode?: CouncilMode, initialPrompt?: string) => void;
  onCreateSession: (memberId: CouncilMemberId) => void;
}

export const AtelierVisionis: React.FC<AtelierVisionisProps> = ({ 
  onBack, 
  onMenuClick, 
  onOpenSession,
  onCreateSession 
}) => {
  const [caption, setCaption] = useState("");
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // New: Chaos Anchor State
  const [showChaosModal, setShowChaosModal] = useState(false);
  const [chaosInput, setChaosInput] = useState("");

  useEffect(() => {
    refreshCaption();
  }, []);

  const refreshCaption = () => {
      triggerHaptic('light');
      playUISound('click');
      let newCaption = caption;
      while (newCaption === caption) {
          newCaption = LYRA_CAPTIONS[Math.floor(Math.random() * LYRA_CAPTIONS.length)];
      }
      setCaption(newCaption);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      triggerHaptic('success');
      playUISound('success');
      showToast('Copied to Clipboard', 'success');
  };

  const handleCreativeAction = (mode: CouncilMode, prompt: string) => {
      onCreateSession('LYRA'); 
  };

  const handleWeaveChaos = async () => {
      if (!chaosInput.trim()) return;
      setIsGenerating(true);
      setShowResultModal(true);
      setShowChaosModal(false);
      triggerHaptic('medium');
      playUISound('hero');

      try {
          const prompt = `
          Role: You are Lyra Perplexa (The Weaver).
          Task: Take this chaotic/raw thought from The Prism and weave it into a cohesive structure.
          
          Input: "${chaosInput}"
          
          Output Protocol:
          1. **The Anchor:** A single, powerful metaphor describing this thought.
          2. **The Threads:** 3 clear, actionable bullet points derived from the chaos.
          3. **The Image:** A prompt to generate a visual representation of this thought (for future recall).
          
          Tone: Artistic, clarifying, reassuring.
          `;
          
          const response = await sendMessageToGemini(prompt, 'SCRIBE', []);
          setGeneratedPost(response.text);
          triggerHaptic('success');
          playUISound('success');
      } catch (e) {
          setGeneratedPost("The Loom is jammed. The thread broke. Try again.");
          triggerHaptic('error');
      } finally {
          setIsGenerating(false);
          setChaosInput("");
      }
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden font-sans bg-black">
      
      {/* Pink Flame Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-950 via-purple-950 to-black pointer-events-none" />
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
              <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-pink-400 blur-sm"
                  style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                      y: [0, -100],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1.5, 0]
                  }}
                  transition={{
                      duration: Math.random() * 5 + 5,
                      repeat: Infinity,
                      delay: Math.random() * 5
                  }}
              />
          ))}
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-pink-900/30 flex items-center justify-between bg-black/50 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-pink-300/70 hover:text-pink-200 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-pink-100 flex items-center gap-2">
              <Sparkles size={18} className="text-pink-500" />
              Atelier Visionis
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-pink-300/70 hover:text-pink-200 rounded-full transition-colors">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar relative z-10 flex flex-col items-center">
          
          {/* Daily Transmission Card */}
          <motion.div 
            key={caption}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg p-8 rounded-3xl bg-white/5 border border-pink-500/30 backdrop-blur-md mb-10 text-center relative overflow-hidden group"
          >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                      <div className="text-[10px] font-bold text-pink-400 uppercase tracking-[0.3em]">Transmission</div>
                      <div className="flex gap-2">
                          <button onClick={() => copyToClipboard(caption)} className="p-2 hover:bg-white/10 rounded-full text-pink-300/50 hover:text-pink-200 transition-colors">
                              <Copy size={14} />
                          </button>
                          <button onClick={refreshCaption} className="p-2 hover:bg-white/10 rounded-full text-pink-300/50 hover:text-pink-200 transition-colors">
                              <RefreshCcw size={14} />
                          </button>
                      </div>
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-serif text-pink-100 leading-relaxed italic">
                      "{caption}"
                  </h3>
                  
                  <div className="mt-6 flex justify-center">
                      <div className="w-12 h-1 rounded-full bg-pink-500/50" />
                  </div>
              </div>
          </motion.div>

          {/* Creative Actions */}
          <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* CHAOS WEAVER (NEW) */}
              <button 
                onClick={() => setShowChaosModal(true)}
                className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-pink-500/40 hover:border-pink-400 transition-all group text-left relative overflow-hidden shadow-lg shadow-pink-900/20"
              >
                  <div className="relative z-10 flex items-center gap-4">
                      <div className="p-3 bg-pink-500/20 rounded-xl w-fit text-pink-300 group-hover:scale-110 transition-transform">
                          <Layers size={24} />
                      </div>
                      <div>
                          <h4 className="text-lg font-bold text-white mb-1">The Weaver's Loom</h4>
                          <p className="text-xs text-pink-200/70">Anchor chaotic thoughts into structure.</p>
                      </div>
                  </div>
              </button>

              <button 
                onClick={() => handleCreativeAction('FLAME', "Manifest something beautiful...")}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-pink-500/30 transition-all group text-left relative"
              >
                  <div className="relative z-10">
                      <div className="p-3 bg-pink-500/10 rounded-xl w-fit text-pink-400 mb-4 group-hover:scale-110 transition-transform">
                          <Wand2 size={24} />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">Manifest</h4>
                      <p className="text-xs text-zinc-500">Generate Visuals (FLAME)</p>
                  </div>
              </button>

              <button 
                onClick={() => handleCreativeAction('WEAVER', "Weave a motion...")}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group text-left relative"
              >
                  <div className="relative z-10">
                      <div className="p-3 bg-purple-500/10 rounded-xl w-fit text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                          <Video size={24} />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">Weave</h4>
                      <p className="text-xs text-zinc-500">Create Motion (WEAVER)</p>
                  </div>
              </button>

          </div>

      </div>

      {/* CHAOS INPUT MODAL */}
      <AnimatePresence>
        {showChaosModal && (
            <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    className="w-full max-w-lg bg-zinc-900 rounded-3xl border border-pink-500/30 p-6 shadow-2xl"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Layers size={18} className="text-pink-500" />
                            Dump Raw Thought
                        </h3>
                        <button onClick={() => setShowChaosModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                    </div>
                    
                    <textarea 
                        value={chaosInput}
                        onChange={(e) => setChaosInput(e.target.value)}
                        placeholder="Pour your chaos here. Lyra will organize it."
                        className="w-full h-40 bg-black border border-zinc-800 rounded-xl p-4 text-pink-100 placeholder-pink-900/50 outline-none focus:border-pink-500/50 resize-none leading-relaxed"
                        autoFocus
                    />
                    
                    <button 
                        onClick={handleWeaveChaos}
                        disabled={!chaosInput.trim()}
                        className="w-full mt-4 py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-colors uppercase tracking-widest text-xs"
                    >
                        Weave Pattern
                    </button>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* GENERATION RESULT MODAL */}
      <AnimatePresence>
        {showResultModal && (
            <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-pink-500/30 p-6 shadow-2xl shadow-pink-900/20"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles size={18} className="text-pink-500" />
                            Weaver's Output
                        </h3>
                        {!isGenerating && (
                            <button onClick={() => setShowResultModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                        )}
                    </div>

                    <div className="min-h-[200px] flex flex-col">
                        {isGenerating ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-pink-400 gap-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full animate-pulse" />
                                    <SacredSeal size={80} isAnimated={true} color="#EC4899" />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Patterns Emerging...</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 p-4 bg-black rounded-xl border border-zinc-800 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-serif mb-6 max-h-[50vh] overflow-y-auto">
                                    {generatedPost}
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => copyToClipboard(generatedPost || "")}
                                        className="flex-1 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-500 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Copy size={16} /> Copy
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
};
