
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudMoon, Plus, Sparkles, X, Menu, ArrowLeft, Loader2, BookOpen, Image as ImageIcon, Eye } from 'lucide-react';
import { Dream } from '../types';
import { interpretDream, sendMessageToGemini } from '../services/geminiService';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { showToast } from '../utils/events';

interface DreamOracleProps {
  dreams: Dream[];
  onAddDream: (dream: Dream) => void;
  onUpdateDream: (id: string, updates: Partial<Dream>) => void;
  onBack: () => void;
  onMenuClick: () => void;
}

export const DreamOracle: React.FC<DreamOracleProps> = ({ 
  dreams, 
  onAddDream,
  onUpdateDream,
  onBack, 
  onMenuClick 
}) => {
  const [showLogModal, setShowLogModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  
  // Generation State per Dream ID
  const [generatingForId, setGeneratingForId] = useState<string | null>(null);

  const handleSaveDream = async () => {
    if (!title || !description) return;

    setIsInterpreting(true);
    let interpretation = "";
    
    try {
        interpretation = await interpretDream(description);
    } catch (e) {
        interpretation = "The Seer could not connect to the vision.";
    }

    const dream: Dream = {
      id: crypto.randomUUID(),
      title,
      description,
      interpretation,
      themes: tags.split(',').map(t => t.trim()).filter(t => t),
      date: Date.now()
    };

    onAddDream(dream);
    setIsInterpreting(false);
    resetForm();
    showToast('Vision Sealed', 'success');
  };

  const handleVisualizeDream = async (dream: Dream) => {
      setGeneratingForId(dream.id);
      playUISound('hero');
      triggerHaptic('medium');
      showToast('Weaving Vision...', 'info');

      try {
          const prompt = `
          Generate a surreal, high-quality, cinematic dream visualization.
          
          Dream Description: "${dream.description}"
          Key Themes: ${dream.themes.join(', ')}
          
          Style: Mystical, deep, symbolic, ethereal lighting, photorealistic texture but abstract composition.
          `;

          const response = await sendMessageToGemini(prompt, 'FLAME', [], { 
              imageSize: '1K',
              aspectRatio: '16:9'
          });

          if (response.generatedMedia && response.generatedMedia.length > 0) {
              onUpdateDream(dream.id, { visualUrl: response.generatedMedia[0].url });
              playUISound('success');
              triggerHaptic('success');
              showToast('Vision Manifested', 'success');
          } else {
              throw new Error("No image generated");
          }

      } catch (e) {
          console.error(e);
          showToast('Failed to manifest vision', 'error');
          triggerHaptic('error');
      } finally {
          setGeneratingForId(null);
      }
  };

  const resetForm = () => {
    setShowLogModal(false);
    setTitle('');
    setDescription('');
    setTags('');
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden font-sans">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CloudMoon size={18} className="text-lux-gold" />
              Dream Oracle
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar space-y-6">
        
        {/* Hero / Action */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center relative overflow-hidden">
            <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-black border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <CloudMoon size={32} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Record a Vision</h3>
                <p className="text-zinc-400 text-sm mb-6 max-w-sm mx-auto">
                    The night speaks in symbols. Archive your dreams here, and Eve (The Seer) will interpret their hidden meanings.
                </p>
                <button 
                    onClick={() => setShowLogModal(true)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition-colors flex items-center gap-2 mx-auto"
                >
                    <Plus size={18} /> New Entry
                </button>
            </div>
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-900/20 blur-3xl rounded-full" />
        </div>

        {/* Dream List */}
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Recent Visions</h3>
            {dreams.length === 0 && <p className="text-center text-zinc-600 text-sm py-4">No dreams recorded yet.</p>}
            
            {dreams.map(dream => (
                <div key={dream.id} className="p-5 rounded-xl bg-zinc-900/30 border border-zinc-800 hover:border-indigo-900/50 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h4 className="text-base font-bold text-white">{dream.title}</h4>
                            <span className="text-xs text-zinc-500">{new Date(dream.date).toLocaleDateString()}</span>
                        </div>
                        <div className="p-2 bg-indigo-950/30 rounded-lg text-indigo-400">
                            <Sparkles size={16} />
                        </div>
                    </div>
                    
                    <p className="text-sm text-zinc-300 leading-relaxed mb-4 italic font-serif">"{dream.description}"</p>
                    
                    {/* VISUALIZED IMAGE */}
                    {dream.visualUrl && (
                        <div className="mb-4 relative rounded-xl overflow-hidden shadow-lg border border-white/10 group/image">
                            <img src={dream.visualUrl} alt="Dream Visualization" className="w-full h-auto object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 opacity-0 group-hover/image:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon size={12} /> Manifested by Flame
                                </span>
                            </div>
                        </div>
                    )}

                    {dream.interpretation && (
                        <div className="mt-4 pt-4 border-t border-zinc-800/50">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">
                                <BookOpen size={12} /> Eve's Interpretation
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed bg-black/30 p-3 rounded-lg border border-zinc-800">
                                {dream.interpretation}
                            </p>
                        </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                        {dream.themes.length > 0 ? (
                            <div className="flex gap-2 flex-wrap">
                                {dream.themes.map((t, i) => (
                                    <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 uppercase tracking-wide">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        ) : <div />}

                        {/* VISUALIZE BUTTON */}
                        {!dream.visualUrl && (
                            <button
                                onClick={() => handleVisualizeDream(dream)}
                                disabled={generatingForId === dream.id}
                                className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                                    generatingForId === dream.id
                                    ? 'bg-zinc-800 text-zinc-500 border-zinc-800 cursor-not-allowed'
                                    : 'bg-indigo-900/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500 hover:text-white'
                                }`}
                            >
                                {generatingForId === dream.id ? (
                                    <><Loader2 size={10} className="animate-spin" /> Weaving...</>
                                ) : (
                                    <><Eye size={12} /> Manifest Vision</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>

      </div>

      {/* Modal */}
      <AnimatePresence>
        {showLogModal && (
            <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-2xl flex flex-col max-h-[85vh]"
                >
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-lg font-bold text-white">Log Dream</h3>
                        <button onClick={() => setShowLogModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        <div>
                            <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Title</label>
                            <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                                placeholder="e.g., The Floating City"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Description</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none h-32 resize-none leading-relaxed"
                                placeholder="Describe your dream in detail..."
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Tags (optional)</label>
                            <input 
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                                placeholder="e.g., flying, water, childhood"
                            />
                        </div>
                    </div>

                    <div className="mt-6 pt-2 shrink-0">
                        <button 
                            onClick={handleSaveDream}
                            disabled={!title || !description || isInterpreting}
                            className={`w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                                !title || !description || isInterpreting
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-500'
                            }`}
                        >
                            {isInterpreting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Consulting The Seer...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Log & Interpret
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
};
