
import React, { useRef, useState, useEffect } from 'react';
import { ViewState, Project, GlucoseReading, LifeDomainState, CouncilMemberId } from '../types';
import { Activity, Heart, Menu, Camera, Sun, Brain, Sunrise, CloudMoon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { SYSTEM_HEARTBEAT_MESSAGES, THEME_COLORS } from '../constants';
import { SacredSeal } from './SacredSeal';

interface CouncilHallProps {
    onNavigate: (view: ViewState) => void;
    onMenuClick: () => void;
    prismSealImage: string | null;
    onSealUpload: (file: File) => void;
    projects?: Project[];
    healthReadings?: GlucoseReading[];
    lifeDomains?: LifeDomainState[];
    onEnterDriveMode?: (id: CouncilMemberId) => void;
}

interface GlassMonolithProps {
    label: string;
    sub: string;
    icon: React.ElementType;
    onClick: () => void;
    color: string;
    delay: number;
    compact?: boolean;
}

const GlassMonolith: React.FC<GlassMonolithProps> = ({ label, sub, icon: Icon, onClick, color, delay, compact = false }) => (
    <motion.button 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => { playUISound('toggle'); onClick(); }} 
        className={`relative group overflow-hidden w-full ${compact ? 'py-4' : 'py-5'} rounded-2xl bg-gradient-to-b from-white/[0.02] to-black border border-white/5 flex flex-col items-center justify-center gap-1.5 shadow-md backdrop-blur-md px-3`}
    >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `radial-gradient(circle at center bottom, ${color}, transparent 80%)` }} />
        <div className={`relative z-10 p-2 rounded-full bg-black/40 border border-white/5 shadow-inner group-hover:scale-105 transition-transform duration-500 group-hover:border-white/20`}>
            <Icon size={compact ? 16 : 18} strokeWidth={1.5} style={{ color }} />
        </div>
        <div className="relative z-10 text-center">
            <div className={`${compact ? 'text-[0.7rem]' : 'text-[0.8rem]'} font-bold tracking-widest text-white/70 group-hover:text-white transition-colors uppercase font-sans`}>{label}</div>
            {!compact && <div className="text-[0.5rem] text-zinc-600 group-hover:text-zinc-500 transition-colors uppercase tracking-[0.2em] mt-0.5 font-mono">{sub}</div>}
        </div>
    </motion.button>
);

const SystemTicker = () => {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => { setIndex(prev => (prev + 1) % SYSTEM_HEARTBEAT_MESSAGES.length); }, 5000); 
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center w-full pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div key={index} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }} className="text-[0.5rem] tracking-[0.4em] font-mono text-lux-gold/30 uppercase whitespace-nowrap px-3 py-1 rounded-full border border-lux-gold/5 bg-black/10">
                    {SYSTEM_HEARTBEAT_MESSAGES[index]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export const CouncilHall: React.FC<CouncilHallProps> = ({ 
    onNavigate, onMenuClick, prismSealImage, onSealUpload,
    onEnterDriveMode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timeOfDay, setTimeOfDay] = useState<'MORNING' | 'DAY' | 'EVENING'>('DAY');

  useEffect(() => {
      const updateTime = () => {
          const hour = new Date().getHours();
          if (hour >= 5 && hour < 12) setTimeOfDay('MORNING');
          else if (hour >= 18 || hour < 5) setTimeOfDay('EVENING');
          else setTimeOfDay('DAY');
      };
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
  }, []);

  const chronos = React.useMemo(() => {
      switch (timeOfDay) {
          case 'MORNING': return { greeting: "Rise, Sovereign.", sub: "Dawn Protocol", icon: Sunrise, color: THEME_COLORS.GOLD_AMBER };
          case 'EVENING': return { greeting: "Rest, Sovereign.", sub: "Starlight Guard", icon: CloudMoon, color: '#818CF8' };
          default: return { greeting: "Command, Sovereign.", sub: "Systems Nominal", icon: Sun, color: THEME_COLORS.GOLD_PRIMARY };
      }
  }, [timeOfDay]);

  const handleSealClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      triggerHaptic('medium');
      fileInputRef.current?.click();
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white relative overflow-hidden">
        <header className="shrink-0 relative z-20 px-6 pt-4 pb-2 flex justify-between items-center">
            <button onClick={onMenuClick} className="text-zinc-800 p-2 -ml-2 hover:text-white transition-colors"><Menu size={20} /></button>
            <div className="flex gap-2">
                {onEnterDriveMode && (
                    <button onClick={() => onEnterDriveMode('GEMINI')} className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 active:scale-95 transition-all">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse" />
                        <span className="text-[0.6rem] font-bold text-zinc-600 uppercase tracking-widest font-sans">Live Link</span>
                    </button>
                )}
            </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center py-4 px-6 overflow-y-auto no-scrollbar relative z-10">
            <div className="w-full max-w-[min(92vw,400px)] flex flex-col items-center">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-12">
                    <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-2 mb-1.5">
                        <chronos.icon size={12} style={{ color: chronos.color }} />
                        <span className="text-[0.6rem] font-bold uppercase tracking-[0.4em] text-zinc-800 font-mono">{chronos.sub}</span>
                    </motion.div>
                    <motion.h1 initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="text-xl md:text-2xl font-serif italic text-white/40 tracking-wider font-light">{chronos.greeting}</motion.h1>
                </motion.div>

                {/* Perfect Centering of the Seal - Requirement 4 */}
                <div className="relative w-full aspect-square flex items-center justify-center mb-16">
                    <div className="relative inline-flex items-center justify-center">
                        <button 
                            onClick={handleSealClick} 
                            className="relative z-10 transition-all active:scale-90 group/seal flex items-center justify-center cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-lux-gold/5 blur-3xl rounded-full opacity-0 group-hover/seal:opacity-40 transition-opacity duration-1000" />
                            {!prismSealImage ? (
                                <SacredSeal size={180} mode="reactor" isAnimated={true} />
                            ) : (
                                <div className="relative z-10 w-44 h-44 flex items-center justify-center">
                                    <motion.img 
                                        src={prismSealImage} 
                                        alt="The Prism Seal" 
                                        className="w-full h-full object-cover rounded-full shadow-[0_0_30px_rgba(255,215,0,0.2)] border border-lux-gold/20" 
                                        animate={{ y: [-1, 1, -1] }} 
                                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover/seal:opacity-100 transition-opacity">
                                        <Camera size={24} className="text-white/60" />
                                    </div>
                                </div>
                            )}
                        </button>
                        <SystemTicker />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full px-1 mb-8">
                    <div className="col-span-3 mb-2">
                        <GlassMonolith label="Morning Rise" sub="Protocol Daily" icon={Sunrise} color={THEME_COLORS.GOLD_AMBER} onClick={() => onNavigate(ViewState.DailyProtocol)} delay={0.1} />
                    </div>
                    <GlassMonolith label="Mind" sub="Focus" icon={Brain} color={THEME_COLORS.GOLD_PRIMARY} onClick={() => onNavigate(ViewState.LifeDomains)} delay={0.12} compact />
                    <GlassMonolith label="Body" sub="Vital" icon={Activity} color={THEME_COLORS.GREEN_EMERALD} onClick={() => onNavigate(ViewState.Health)} delay={0.14} compact />
                    <GlassMonolith label="Soul" sub="Sanctum" icon={Heart} color="#EF4444" onClick={() => onNavigate(ViewState.Soul)} delay={0.16} compact />
                </div>

                <div className="text-center opacity-10 mt-auto pb-6">
                    <p className="text-[0.5rem] font-bold text-zinc-900 uppercase tracking-[0.5em] font-mono">Sovereign Legacy • 2025</p>
                </div>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onSealUpload(e.target.files[0])} />
        </main>
    </div>
  );
};
