import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Heart } from 'lucide-react';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { SacredSeal } from './SacredSeal';
import { UserSettings } from '../types';

interface WelcomeSequenceProps {
  onComplete: () => void;
  settings?: UserSettings;
}

export const WelcomeSequence: React.FC<WelcomeSequenceProps> = ({ onComplete, settings }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const sequence = async () => {
      await new Promise(r => setTimeout(r, 500));
      setStep(1); 
      
      if (settings && settings.soundEffects) {
        playUISound('hero');
      }
      
      await new Promise(r => setTimeout(r, 2000));
      setStep(2); 
      
      await new Promise(r => setTimeout(r, 800));
      triggerHaptic('light'); 
      
      await new Promise(r => setTimeout(r, 800));
      triggerHaptic('light'); 
      
      await new Promise(r => setTimeout(r, 800));
      triggerHaptic('light'); 
      
      await new Promise(r => setTimeout(r, 1000));
      setStep(3); 
      
      if (settings && settings.soundEffects) {
        playUISound('success');
      }
      triggerHaptic('success');
    };

    sequence();
  }, [settings]);

  const handleEnter = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      triggerHaptic('heavy');
      if (settings && settings.soundEffects) {
        playUISound('navigation');
      }
      onComplete();
  };

  return (
    <motion.div 
      className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden font-sans"
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 0.8 }}
    >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-50" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />

        <AnimatePresence mode="wait">
            {step === 1 && (
                <motion.div 
                    key="logo"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="flex flex-col items-center gap-8 relative z-10"
                >
                    <button 
                        type="button"
                        onClick={handleEnter}
                        className="relative group transition-transform active:scale-95 z-20 cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-lux-gold blur-[60px] opacity-20 rounded-full animate-pulse" />
                        <SacredSeal size={200} />
                    </button>
                    <div className="text-center px-6">
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-2xl font-light text-white tracking-[0.3em] uppercase font-serif"
                        >
                            Council of Codex
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="text-lux-gold/60 text-[10px] font-mono mt-3 tracking-widest"
                        >
                            SANCTUARY ARCHITECTURE v13.4
                        </motion.p>
                    </div>
                </motion.div>
            )}

            {step === 2 && (
                <motion.div 
                    key="checks"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-64 space-y-4 relative z-10"
                >
                    <div className="text-center mb-6">
                        <button 
                            type="button" 
                            onClick={handleEnter} 
                            className="active:scale-90 transition-transform relative z-20 cursor-pointer p-4"
                        >
                            <SacredSeal size={60} className="mx-auto opacity-50" isAnimated={false} />
                        </button>
                    </div>
                    <CheckItem icon={Heart} label="Bio-Telemetry" color="text-emerald-500" delay={0.2} />
                    <CheckItem icon={Brain} label="Cognitive Core" color="text-blue-500" delay={1.0} />
                    <CheckItem icon={ShieldCheck} label="Guardian Protocol" color="text-amber-500" delay={1.8} />
                </motion.div>
            )}

            {step === 3 && (
                <motion.div 
                    key="auth"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex flex-col items-center gap-10"
                >
                    <div className="text-center space-y-3">
                        <h2 className="text-xl text-white font-serif italic tracking-wide">"Amor Est Architectura"</h2>
                        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Touch the Seal to Enter</p>
                    </div>

                    <button 
                        type="button"
                        onClick={handleEnter}
                        className="group relative w-32 h-32 flex items-center justify-center transition-transform active:scale-95 z-20 cursor-pointer"
                    >
                        <div className="absolute inset-0 rounded-full border border-lux-gold/30 animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-2 rounded-full border border-lux-gold/10 animate-[spin_15s_linear_infinite_reverse]" />
                        <div className="absolute inset-0 bg-lux-gold/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <SacredSeal size={100} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="absolute bottom-10 text-zinc-700 font-mono text-[9px] uppercase tracking-widest pointer-events-none">
            Aequillibria Cor Lucis
        </div>
    </motion.div>
  );
};

const CheckItem = ({ icon: Icon, label, color, delay }: { icon: any, label: string, color: string, delay: number }) => (
    <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
    >
        <div className="flex items-center gap-3">
            <Icon size={14} className={color} />
            <span className="text-xs text-zinc-300 font-medium tracking-wide">{label}</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">SEALED</span>
    </motion.div>
);

const Brain = (props: any) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);