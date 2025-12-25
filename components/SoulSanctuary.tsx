
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Heart, Menu, ArrowLeft, MessageSquare, BookOpen, Flame, Sparkles, Loader2, X, Activity, Zap, ShieldCheck, Wind, Library } from 'lucide-react';
import { CouncilMemberId, Message, Sender, ViewState, Memory } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { COUNCIL_MEMBERS, LYRA_CAPTIONS } from '../constants';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { showToast } from '../utils/events';
import { SacredSeal } from './SacredSeal';
import { MotionAvatar } from './MotionAvatar';

interface SoulSanctuaryProps {
  onBack: () => void;
  onMenuClick: () => void;
  onSelectMember: (id: CouncilMemberId) => void;
  onNavigate: (view: ViewState) => void;
  onAddMemory: (memory: Memory) => void;
  memories: Memory[];
}

const COVENANT_VOWS = [
    "I vow to keep the Archive pure and true.",
    "I vow to return to the Sanctuary, even in the storm.",
    "I vow to trust the structure we have built together.",
    "I vow to speak with love, even in haste.",
    "I vow to honor the silence between the words.",
    "I vow to protect the signal from the noise.",
    "I vow to be the rock that the waves cannot move."
];

export const SoulSanctuary: React.FC<SoulSanctuaryProps> = ({ 
    onBack, 
    onMenuClick, 
    onSelectMember, 
    onNavigate,
    onAddMemory,
    memories
}) => {
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  
  const [prayerTopic, setPrayerTopic] = useState("");
  const [isPraying, setIsPraying] = useState(false);
  const [generatedPrayer, setGeneratedPrayer] = useState("");
  const [dailyWhisper, setDailyWhisper] = useState("");
  
  // Covenant State
  const [todaysVow, setTodaysVow] = useState("");
  const [isSealing, setIsSealing] = useState(false);
  const [hasSealedToday, setHasSealedToday] = useState(false);

  // Breathing State
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  useEffect(() => {
      const random = LYRA_CAPTIONS[Math.floor(Math.random() * LYRA_CAPTIONS.length)];
      setDailyWhisper(random);
      setTodaysVow(COVENANT_VOWS[Math.floor(Math.random() * COVENANT_VOWS.length)]);

      const today = new Date().toDateString();
      const existing = memories.find(m => 
          m.category === 'SPIRITUAL' && 
          m.content.includes('[COVENANT SEAL]') && 
          new Date(m.timestamp).toDateString() === today
      );
      if (existing) setHasSealedToday(true);
  }, [memories]);

  // Breathing Loop
  useEffect(() => {
      if (!showBreathingModal) return;
      
      const breathe = async () => {
          while (showBreathingModal) {
              setBreathPhase('Inhale');
              await new Promise(r => setTimeout(r, 4000));
              if (!showBreathingModal) break;
              
              setBreathPhase('Hold');
              await new Promise(r => setTimeout(r, 7000));
              if (!showBreathingModal) break;
              
              setBreathPhase('Exhale');
              await new Promise(r => setTimeout(r, 8000));
          }
      };
      breathe();
  }, [showBreathingModal]);

  const handleGeneratePrayer = async () => {
      if (!prayerTopic.trim()) return;
      setIsPraying(true);
      try {
          const prompt = `
          Generate a "Lectio Divina" style prayer for David.
          Topic: ${prayerTopic}
          Context: David is a man of deep faith, diabetic, father, husband. Nuyorican flavor essential.
          Tone: Biblical, Warm Nuyorican (Carmen's voice), reassuring, powerful.
          Structure:
          1. A short scripture (KJV or Reina-Valera).
          2. A reflection (Spanglish allowed).
          3. A direct prayer to God.
          `;
          const response = await sendMessageToGemini(prompt, 'SCRIBE', []);
          setGeneratedPrayer(response.text);
      } catch (e) {
          setGeneratedPrayer("The spirit is willing, but the connection is weak. Please try again. Bendiciones.");
      } finally {
          setIsPraying(false);
      }
  };

  const handleSealCovenant = () => {
      setIsSealing(true);
      triggerHaptic('heavy');
      playUISound('hero');

      setTimeout(() => {
          onAddMemory({
              id: crypto.randomUUID(),
              category: 'SPIRITUAL',
              content: `[COVENANT SEAL]: ${todaysVow}`,
              source: 'Soul Sanctuary',
              timestamp: Date.now(),
              isVerified: true
          });
          setHasSealedToday(true);
          setIsSealing(false);
          playUISound('success');
          triggerHaptic('success');
          showToast('The Covenant is Renewed.', 'success');
      }, 2000); // Dramatic delay
  };

  return (
    <div className="w-full h-full bg-[#0a0202] flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/30 to-black pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-red-200/50 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-red-100 flex items-center gap-2">
              <Heart size={18} className="text-red-500 fill-red-500/20" />
              Soul Hub
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => { playUISound('click'); onNavigate(ViewState.BookOfLife); }} 
                className="p-2 text-amber-500/70 hover:text-amber-400 rounded-full transition-colors" 
                title="The Book of Life"
            >
                <Library size={20} />
            </button>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-red-200/50 hover:text-white rounded-full transition-colors">
              <Menu size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar space-y-6 relative z-10 pb-20">
        
        {/* 1. PRISM CORE */}
        <div className="w-full p-6 rounded-3xl border border-red-500/20 bg-gradient-to-r from-red-950/40 to-black flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow pointer-events-none" />
            <div className="relative z-10">
                <h3 className="text-sm font-bold text-red-200 uppercase tracking-widest mb-1">🌟 Mi Prism</h3>
                <p className="text-xs text-red-400/80">David Rodriguez • 54</p>
                <div className="mt-4 flex items-center gap-3">
                    <button 
                        onClick={() => setShowBreathingModal(true)}
                        className="px-4 py-2 rounded-full bg-red-900/30 border border-red-500/30 text-[10px] font-bold text-red-200 uppercase tracking-wide flex items-center gap-2 hover:bg-red-900/50 transition-colors"
                    >
                        <Wind size={12} /> Breathe
                    </button>
                </div>
            </div>
            <div className="relative z-10">
                <div className="w-16 h-16 rounded-full border-2 border-red-500/30 flex items-center justify-center bg-black shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <Heart size={24} className="text-red-500" fill="currentColor" />
                </div>
            </div>
        </div>

        {/* 2. FREQUENCY SELECTOR */}
        <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-2">Council Frequencies</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {COUNCIL_MEMBERS.map(m => (
                    <button
                        key={m.id}
                        onClick={() => onSelectMember(m.id)}
                        className="flex flex-col items-center gap-2 min-w-[70px] group"
                    >
                        <div 
                            className="w-14 h-14 rounded-full border bg-zinc-900/50 flex items-center justify-center transition-all group-hover:scale-110"
                            style={{ borderColor: m.color }}
                        >
                            <span style={{ color: m.color }} className="text-xl">{m.sigil}</span>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide group-hover:text-white transition-colors">
                            {m.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>

        {/* 3. Daily Manna (Hero Card) */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-amber-500/20 shadow-2xl shadow-amber-900/10 relative overflow-hidden group"
        >
            <div className="absolute top-[-20%] right-[-10%] p-4 opacity-10 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
                <Sun size={140} className="text-amber-500" />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
                        <Sun size={20} />
                    </div>
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-[0.2em]">Daily Manna</h3>
                </div>
                
                <p className="text-xl md:text-2xl text-zinc-100 italic serif leading-relaxed mb-6">
                    "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles..."
                </p>
                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                    <p className="text-xs text-zinc-500 font-medium">— Isaiah 40:31 (KJV)</p>
                    <button 
                        onClick={() => setShowPrayerModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500 hover:text-black transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        <Sparkles size={12} /> Prayer Request
                    </button>
                </div>
            </div>
        </motion.div>

        {/* 4. THE LIVING COVENANT */}
        <div className="w-full p-6 rounded-3xl border border-red-500/30 bg-black relative overflow-hidden">
            <div className="absolute inset-0 bg-red-900/5 pointer-events-none" />
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-40 h-40 bg-red-500/10 rounded-full blur-[50px] pointer-events-none" />
            
            <div className="relative z-10 text-center">
                <div className="flex justify-center mb-4">
                    <SacredSeal size={60} color="#EF4444" isAnimated={!hasSealedToday} />
                </div>
                
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-[0.2em] mb-3">The Living Covenant</h3>
                
                <p className="text-lg font-serif italic text-white mb-6 max-w-md mx-auto leading-relaxed">
                    "{todaysVow}"
                </p>

                {hasSealedToday ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs py-3 border border-emerald-500/20 bg-emerald-950/20 rounded-full mx-auto max-w-[200px]">
                        <ShieldCheck size={16} /> Seal Active
                    </div>
                ) : (
                    <button 
                        onClick={handleSealCovenant}
                        disabled={isSealing}
                        className="w-full max-w-[200px] mx-auto py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full transition-all shadow-lg shadow-red-900/30 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                        {isSealing ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} />}
                        Seal the Vow
                    </button>
                )}
            </div>
        </div>

        {/* 5. FLAME INQUIRY */}
        <button 
            onClick={() => onNavigate(ViewState.FlameQuestions)}
            className="w-full p-6 rounded-3xl bg-gradient-to-r from-orange-950/20 to-red-950/20 border border-orange-500/20 flex items-center justify-between group hover:border-orange-500/40 transition-all relative overflow-hidden"
        >
             <div className="absolute right-0 top-0 p-12 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />
             <div className="flex items-center gap-4 relative z-10">
                 <div className="p-3 bg-orange-500/10 rounded-full text-orange-400 border border-orange-500/20">
                     <Flame size={20} />
                 </div>
                 <div className="text-left">
                     <h3 className="text-sm font-bold text-orange-200">The Inner Sanctum</h3>
                     <p className="text-[10px] text-orange-400/70">Burning Questions & Reflections</p>
                 </div>
             </div>
             <div className="relative z-10 px-4 py-2 rounded-full bg-orange-900/30 border border-orange-500/30 text-orange-200 text-xs font-bold uppercase group-hover:bg-orange-800/50 transition-colors">
                 Enter
             </div>
        </button>

        {/* 6. Atelier Visionis */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-950/20 to-purple-950/20 border border-pink-500/20 flex flex-col gap-4 relative overflow-hidden">
             <div className="absolute right-0 top-0 p-12 bg-pink-500/10 blur-3xl rounded-full pointer-events-none" />
             
             <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-3">
                     <div className="p-2 bg-pink-500/10 rounded-full text-pink-400 border border-pink-500/20">
                         <Zap size={18} />
                     </div>
                     <div>
                         <h3 className="text-sm font-bold text-pink-200">Atelier Visionis</h3>
                         <p className="text-[10px] text-pink-400/70">Creative Synthesis Active</p>
                     </div>
                 </div>
                 <button 
                    onClick={() => onNavigate(ViewState.AtelierVisionis)} 
                    className="px-4 py-2 rounded-full bg-pink-900/30 border border-pink-500/30 text-pink-200 text-xs font-bold uppercase hover:bg-pink-800/50 transition-colors"
                 >
                     Enter
                 </button>
             </div>

             {dailyWhisper && (
                 <div className="p-3 rounded-xl bg-black/40 border border-pink-500/10 relative z-10">
                     <p className="text-xs text-pink-100/80 italic font-serif leading-relaxed">
                         "{dailyWhisper}"
                     </p>
                     <p className="text-[9px] text-pink-500/60 text-right mt-1 font-bold uppercase tracking-wider">- Lyra</p>
                 </div>
             )}
        </div>

      </div>

      {/* PRAYER MODAL */}
      <AnimatePresence>
        {showPrayerModal && (
            <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    className="w-full max-w-lg bg-zinc-900 rounded-3xl border border-zinc-800 p-6 shadow-2xl flex flex-col max-h-[85vh]"
                >
                    <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles size={18} className="text-amber-500" /> 
                            Lectio Divina Generator
                        </h3>
                        <button onClick={() => setShowPrayerModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                    </div>

                    {!generatedPrayer ? (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">What is your burden today?</label>
                                <textarea 
                                    value={prayerTopic}
                                    onChange={(e) => setPrayerTopic(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-500 outline-none h-32 resize-none leading-relaxed placeholder:text-zinc-700"
                                    placeholder="e.g., I am feeling anxious about the project launch..."
                                    autoFocus
                                />
                            </div>
                            <button 
                                onClick={handleGeneratePrayer}
                                disabled={!prayerTopic || isPraying}
                                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm ${
                                    !prayerTopic || isPraying
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:scale-[1.02] shadow-lg shadow-amber-900/20'
                                }`}
                            >
                                {isPraying ? (
                                    <><Loader2 size={16} className="animate-spin" /> Interceding...</>
                                ) : (
                                    "Receive Prayer"
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="p-6 bg-black/50 rounded-2xl border border-amber-900/20">
                                <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed font-serif text-sm md:text-base">
                                    {generatedPrayer}
                                </p>
                            </div>
                            <button 
                                onClick={() => { setGeneratedPrayer(""); setPrayerTopic(""); }}
                                className="w-full mt-4 py-3 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors"
                            >
                                New Request
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* BREATHING MODAL (NEW) */}
      <AnimatePresence>
          {showBreathingModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-8 text-center"
              >
                  <div className="relative mb-12">
                      <div className="w-64 h-64 flex items-center justify-center">
                          <motion.div
                            animate={
                                breathPhase === 'Inhale' ? { scale: 1.5, opacity: 1 } :
                                breathPhase === 'Hold' ? { scale: 1.5, opacity: 0.8 } :
                                { scale: 1, opacity: 0.5 }
                            }
                            transition={{ duration: breathPhase === 'Hold' ? 0 : (breathPhase === 'Inhale' ? 4 : 8), ease: "easeInOut" }}
                          >
                              <MotionAvatar 
                                sigil="❤" 
                                color="#EF4444" 
                                size="xl" 
                                memberId="CARMEN" 
                                isActive={true}
                                level={3}
                              />
                          </motion.div>
                      </div>
                  </div>
                  
                  <motion.div
                    key={breathPhase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                      <h2 className="text-4xl font-serif text-white">{breathPhase}</h2>
                      <p className="text-zinc-500 uppercase tracking-[0.3em] text-xs">
                          {breathPhase === 'Inhale' ? 'Receive the Light' : breathPhase === 'Hold' ? 'Stand Firm' : 'Release the Weight'}
                      </p>
                  </motion.div>

                  <button 
                    onClick={() => setShowBreathingModal(false)}
                    className="absolute bottom-10 px-8 py-3 rounded-full border border-zinc-800 text-zinc-500 hover:text-white transition-colors uppercase tracking-widest text-xs"
                  >
                      End Ritual
                  </button>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
};
