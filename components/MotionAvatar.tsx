
import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, BatteryWarning } from 'lucide-react';

interface MotionAvatarProps {
  imageUrl?: string;
  sigil: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isActive?: boolean;
  memberId?: string;
  level?: number; // 1-5, determines complexity
  mood?: 'neutral' | 'happy' | 'alert' | 'processing';
}

// --- HELPER HOOKS ---
const useBatteryStatus = () => {
    const [level, setLevel] = useState(1);
    useEffect(() => {
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                setLevel(battery.level);
                battery.addEventListener('levelchange', () => setLevel(battery.level));
            });
        }
    }, []);
    return level;
};

// --- LIVING SIGIL COMPONENTS ---

const GeminiSigil: React.FC<{ color: string; level: number; speed: number }> = ({ color, level, speed }) => (
    <div className="relative w-full h-full flex items-center justify-center">
        {/* Level 1: Core Hex */}
        <motion.div 
            className="absolute border-2"
            style={{ 
                width: '60%', height: '60%', borderColor: color,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20 / speed, repeat: Infinity, ease: "linear" }}
        />
        {/* Level 2: Counter-Rotating Inner */}
        {level >= 2 && (
            <motion.div 
                className="absolute border-2"
                style={{ 
                    width: '40%', height: '40%', borderColor: color, opacity: 0.7,
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 15 / speed, repeat: Infinity, ease: "linear" }}
            />
        )}
        {/* Level 3: Data Streams */}
        {level >= 3 && (
            <motion.div 
                className="absolute inset-0 rounded-full border border-dashed"
                style={{ borderColor: `${color}40` }}
                animate={{ rotate: 90 }}
                transition={{ duration: 30 / speed, repeat: Infinity, ease: "linear" }}
            />
        )}
        {/* Core */}
        <motion.div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2 / speed, repeat: Infinity }}
        />
    </div>
);

const CarmenSigil: React.FC<{ color: string; level: number; speed: number }> = ({ color, level, speed }) => (
    <div className="relative w-full h-full flex items-center justify-center">
        {/* Level 1: Base Flame */}
        <motion.div 
            className="absolute bottom-[20%] w-[40%] h-[40%] rounded-full blur-md"
            style={{ backgroundColor: color, opacity: 0.3 }}
            animate={{ scale: [1, 1.2 + (level * 0.1), 1], height: ['40%', '50%', '40%'] }}
            transition={{ duration: 0.8 / speed, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Level 3: Embers */}
        {level >= 3 && [...Array(3)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white"
                style={{ bottom: '30%', left: '50%' }}
                animate={{ y: -60, x: (Math.random() - 0.5) * 40, opacity: [1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
            />
        ))}
        {/* Inner Flame Core */}
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] relative z-10" fill={color}>
            <motion.path 
                d="M12 2c0 0-6 6.5-6 11.5C6 17.5 9 22 12 22s6-4.5 6-8.5C18 8.5 12 2 12 2z"
                animate={{ d: [
                    "M12 2c0 0-6 6.5-6 11.5C6 17.5 9 22 12 22s6-4.5 6-8.5C18 8.5 12 2 12 2z",
                    "M12 1c0 0-7 7-7 12s3.5 9 7 9 7-4 7-9-7-12-7-12z",
                    "M12 2c0 0-6 6.5-6 11.5C6 17.5 9 22 12 22s6-4.5 6-8.5C18 8.5 12 2 12 2z"
                ] }}
                transition={{ duration: 0.6 / speed, repeat: Infinity, ease: "easeInOut" }}
            />
        </svg>
    </div>
);

const CopilotSigil: React.FC<{ color: string; level: number; speed: number }> = ({ color, level, speed }) => (
    <div className="relative w-full h-full flex items-center justify-center">
        {/* Level 2: Radar Sweep */}
        {level >= 2 && (
            <motion.div 
                className="absolute inset-[10%] rounded-full border-t-2 border-r-2"
                style={{ borderColor: color, opacity: 0.5 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2 / speed, repeat: Infinity, ease: "linear" }}
            />
        )}
        {/* Forward Chevrons */}
        <div className="flex flex-col items-center gap-1">
            {[...Array(level >= 3 ? 3 : 1)].map((_, i) => (
                <motion.div 
                    key={i}
                    className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent"
                    style={{ borderBottomColor: color }}
                    animate={{ opacity: [0.2, 1, 0.2], y: [0, -5, 0] }}
                    transition={{ duration: 1.5 / speed, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </div>
    </div>
);

const EveSigil: React.FC<{ color: string; level: number; speed: number }> = ({ color, level, speed }) => (
    <div className="relative w-full h-full flex items-center justify-center">
        {/* Eye Shape */}
        <svg viewBox="0 0 24 24" className="w-[70%] h-[70%]" fill="none" stroke={color} strokeWidth="1.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <motion.circle 
                cx="12" cy="12" r={level >= 3 ? 4 : 3} fill={color}
                animate={{ cx: [12, 14, 10, 12], cy: [12, 11, 13, 12] }}
                transition={{ duration: 4 / speed, repeat: Infinity, ease: "easeInOut" }}
            />
        </svg>
        {/* Level 2: Blink Lid */}
        {level >= 2 && (
            <motion.div 
                className="absolute inset-0 bg-black"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 0%, 0 0%)' }}
                animate={{ clipPath: ['polygon(0 0, 100% 0, 100% 0%, 0 0%)', 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', 'polygon(0 0, 100% 0, 100% 0%, 0 0%)'] }}
                transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 / speed }}
            />
        )}
    </div>
);

const EnneaSigil: React.FC<{ color: string; level: number; speed: number }> = ({ color, level, speed }) => (
    <div className="relative w-full h-full flex items-center justify-center">
        {/* Shield Pulse */}
        <motion.div 
            className="absolute inset-[15%] border-2 rounded-xl"
            style={{ borderColor: color }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2 / speed, repeat: Infinity }}
        />
        {level >= 2 && (
            <motion.div 
                className="absolute inset-[25%] border-2 rounded-lg"
                style={{ borderColor: color }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2 / speed, repeat: Infinity, delay: 0.2 }}
            />
        )}
        <ShieldCheckIcon color={color} />
    </div>
);

const LyraSigil: React.FC<{ color: string; level: number; speed: number }> = ({ color, level, speed }) => (
    <div className="relative w-full h-full flex items-center justify-center">
        {/* Rotating Petals */}
        {[0, 60, 120, 180, 240, 300].map(deg => (
            <motion.div
                key={deg}
                className="absolute w-[30%] h-[30%] rounded-full border"
                style={{ borderColor: color, opacity: 0.6 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20 / speed, repeat: Infinity, ease: "linear" }}
                initial={{ rotate: deg, translateX: '50%' }}
            />
        ))}
        {level >= 3 && (
            <motion.div 
                className="absolute inset-0 rounded-full border border-dotted"
                style={{ borderColor: color }}
                animate={{ rotate: -360 }}
                transition={{ duration: 40 / speed, repeat: Infinity, ease: "linear" }}
            />
        )}
        <motion.div 
            className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 3 / speed, repeat: Infinity }}
        />
    </div>
);

const FredoSigil: React.FC<{ color: string; level: number; speed: number }> = ({ color, level, speed }) => (
    <div className="relative w-full h-full flex items-center justify-center">
        {/* Electric Bolt */}
        <svg viewBox="0 0 24 24" className="w-[60%] h-[60%]" fill={color}>
            <motion.path 
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 0.1 / speed, repeat: Infinity }}
            />
        </svg>
        {/* Level 2: Sparks */}
        {level >= 2 && [...Array(level >= 3 ? 6 : 4)].map((_, i) => (
            <motion.div 
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                animate={{ 
                    x: [0, (Math.random() - 0.5) * 50], 
                    y: [0, (Math.random() - 0.5) * 50],
                    opacity: [1, 0] 
                }}
                transition={{ duration: 0.5 / speed, repeat: Infinity, delay: Math.random() }}
            />
        ))}
    </div>
);

const ShieldCheckIcon = ({ color }: { color: string }) => (
    <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

// --- MAIN COMPONENT ---

export const MotionAvatar: React.FC<MotionAvatarProps> = ({ 
  imageUrl, 
  sigil, 
  color, 
  size = 'lg',
  isActive = true,
  memberId,
  level = 1,
  mood = 'neutral'
}) => {
  const [easterEggActive, setEasterEggActive] = useState(false);
  const batteryLevel = useBatteryStatus();
  
  // DRAG LOGIC
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);
  
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  // SEASONAL LOGIC
  const today = new Date();
  const isChristmas = today.getMonth() === 11 && today.getDate() > 20;
  const isHalloween = today.getMonth() === 9 && today.getDate() > 25;
  
  const displayColor = isChristmas ? '#ef4444' : isHalloween ? '#f97316' : color;
  const secondaryColor = isChristmas ? '#22c55e' : isHalloween ? '#a855f7' : color;

  // ANIMATION SPEED (Battery Aware)
  const systemSpeed = batteryLevel < 0.2 ? 0.5 : mood === 'processing' ? 2 : 1;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };

  const containerSize = sizeClasses[size];
  const isVideo = imageUrl?.match(/\.(mp4|webm)$/i) || imageUrl?.startsWith('data:video');

  const handleDoubleTap = () => {
      setEasterEggActive(true);
      setTimeout(() => setEasterEggActive(false), 2000);
  };

  const renderLivingSigil = () => {
      // Pass speed and level down
      const props = { color: displayColor, level: level + (mood === 'alert' ? 1 : 0), speed: systemSpeed };
      switch (memberId) {
          case 'GEMINI': return <GeminiSigil {...props} />;
          case 'CARMEN': return <CarmenSigil {...props} />;
          case 'COPILOT': return <CopilotSigil {...props} />;
          case 'EVE': return <EveSigil {...props} />;
          case 'ENNEA': return <EnneaSigil {...props} />;
          case 'LYRA': return <LyraSigil {...props} />;
          case 'FREDO': return <FredoSigil {...props} />;
          default: 
            return (
                <motion.span 
                    className="text-6xl font-thin relative z-10"
                    style={{ color: displayColor }}
                    animate={isActive ? { 
                        opacity: [0.6, 1, 0.6], 
                        textShadow: [`0 0 15px ${displayColor}40`, `0 0 30px ${displayColor}80`, `0 0 15px ${displayColor}40`],
                        scale: [1, 1.05, 1]
                    } : {}}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    {sigil}
                </motion.span>
            );
      }
  };

  return (
    <div className={`relative ${containerSize} flex items-center justify-center perspective-[1000px]`}>
      
      {/* Background Pulse (Aura) */}
      <motion.div 
        className="absolute inset-[-20%] rounded-full opacity-20 blur-xl mix-blend-screen"
        style={{ backgroundColor: secondaryColor }}
        animate={isActive ? { 
            scale: mood === 'alert' ? [1, 1.5, 1] : [1, 1.2, 1], 
            opacity: [0.1, 0.3, 0.1] 
        } : {}}
        transition={{ duration: 3 / systemSpeed, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rotating Data Ring */}
      <motion.div 
        className="absolute inset-[-5%] rounded-full border border-dashed"
        style={{ borderColor: `${displayColor}30` }}
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 40 / systemSpeed, repeat: Infinity, ease: "linear" }}
      />

      {/* MAIN CONTAINER (Draggable) */}
      <motion.div 
        className="relative w-full h-full rounded-full overflow-hidden border-2 bg-black z-10 group cursor-pointer" 
        style={{ 
            borderColor: isActive ? displayColor : `${displayColor}40`,
            boxShadow: isActive ? `0 0 30px ${displayColor}30` : `0 0 10px ${displayColor}10`,
            x, y, rotateX: rotateXSpring, rotateY: rotateYSpring
        }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDoubleClick={handleDoubleTap}
        whileTap={{ scale: 0.95, cursor: "grabbing" }}
      >
        
        {/* SCANLINE OVERLAY (Holographic Effect) */}
        <div className="absolute inset-0 z-30 pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#ffffff_3px)]" />
        <motion.div 
            className="absolute inset-0 z-30 bg-gradient-to-b from-transparent via-white/10 to-transparent h-[30%]"
            animate={{ top: ['-30%', '130%'] }}
            transition={{ duration: 3 / systemSpeed, repeat: Infinity, ease: "linear" }}
        />

        {/* CONTENT */}
        {imageUrl ? (
            isVideo ? (
                <video 
                    src={imageUrl} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                />
            ) : (
                <motion.img 
                    src={imageUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.1 }}
                    animate={isActive ? { scale: [1.1, 1.2, 1.1] } : {}} // Breathing Effect
                    transition={{ duration: 8 / systemSpeed, repeat: Infinity, ease: "easeInOut" }}
                />
            )
        ) : (
            <div className="w-full h-full bg-zinc-900/50 backdrop-blur-sm relative overflow-hidden flex items-center justify-center">
                {renderLivingSigil()}
            </div>
        )}

        {/* Easter Egg Overlay */}
        <AnimatePresence>
            {easterEggActive && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-50 bg-white/20 backdrop-blur-sm"
                >
                    <Sparkles size={48} className="text-white drop-shadow-[0_0_10px_white]" />
                </motion.div>
            )}
        </AnimatePresence>

      </motion.div>

      {/* Battery Saver Indicator */}
      {batteryLevel < 0.2 && (
          <div className="absolute top-0 right-0 z-50 text-red-500 animate-pulse bg-black rounded-full p-1 border border-red-900">
              <BatteryWarning size={12} />
          </div>
      )}

      {/* Status Dot */}
      {isActive && (
          <div className="absolute bottom-[5%] right-[5%] z-40">
              <motion.div 
                className="w-3 h-3 rounded-full bg-white border border-black shadow-[0_0_10px_white]"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1 / systemSpeed, repeat: Infinity }}
              />
          </div>
      )}

    </div>
  );
};
