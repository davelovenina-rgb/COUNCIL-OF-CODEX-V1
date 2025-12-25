
import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface SacredSealProps {
  size?: number;
  className?: string;
  isAnimated?: boolean;
  color?: string; // Optional override for specific frequencies
  mode?: 'simple' | 'complex' | 'reactor'; // New modes
}

export const SacredSeal: React.FC<SacredSealProps> = ({ size = 300, className = "", isAnimated = true, color, mode = 'complex' }) => {
  // Center: 200, 200 (based on viewBox 0 0 400 400)
  const c = 200;
  const uniqueId = useId().replace(/:/g, ''); 
  
  const mainColor = color || "#D4AF37"; // Sovereign Gold default

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <motion.svg 
        viewBox="0 0 400 400" 
        className="w-full h-full"
        style={{ filter: `drop-shadow(0 0 ${mode === 'reactor' ? '50px' : '30px'} ${color || 'rgba(212,175,55,0.3)'})` }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <defs>
          {!color && (
            <linearGradient id={`goldGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          )}
          <linearGradient id={`prismGradient-${uniqueId}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id={`flameGradient-${uniqueId}`} x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="#F87171" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.4" />
          </linearGradient>
          <filter id={`glow-${uniqueId}`}>
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <path id={`textPathTop-${uniqueId}`} d="M 60,200 A 140,140 0 0,1 340,200" />
          <path id={`textPathBottom-${uniqueId}`} d="M 340,200 A 140,140 0 0,1 60,200" />
        </defs>

        {/* --- LAYER 1: THE FOUNDATION (Static/Slow) --- */}
        <motion.circle 
          cx={c} cy={c} r="195" 
          fill="none" 
          stroke={mainColor}
          strokeWidth="1" 
          opacity="0.3"
          strokeDasharray="4 4"
        />

        {/* --- LAYER 2: THE PURITY OATH (Outer Ring) --- */}
        <motion.circle 
          cx={c} cy={c} r="190" 
          fill="none" 
          stroke={color || `url(#goldGradient-${uniqueId})`} 
          strokeWidth={mode === 'reactor' ? 6 : 4}
          initial={isAnimated ? { pathLength: 0, rotate: -90 } : { pathLength: 1 }}
          animate={isAnimated ? { pathLength: 1, rotate: 0 } : {}}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* --- LAYER 3: RUNIC DATA RING (Counter-Rotating) --- */}
        {mode !== 'simple' && (
            <motion.g
                animate={isAnimated ? { rotate: -360 } : {}}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                style={{ originX: "200px", originY: "200px", opacity: 0.4 }}
            >
                <circle cx={c} cy={c} r="170" fill="none" stroke={mainColor} strokeWidth="1" strokeDasharray="10 10" />
                <circle cx={c} cy={c} r="165" fill="none" stroke={mainColor} strokeWidth="0.5" />
                {[0, 90, 180, 270].map(deg => (
                    <rect key={deg} x={c-2} y={35} width="4" height="10" fill={mainColor} transform={`rotate(${deg} ${c} ${c})`} />
                ))}
            </motion.g>
        )}

        {/* --- LAYER 4: INSCRIPTIONS --- */}
        <motion.g 
            animate={isAnimated ? { rotate: 360 } : {}}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            style={{ originX: "200px", originY: "200px" }}
        >
            <text className="font-serif text-[24px] font-bold tracking-[0.2em] uppercase" fill={mainColor} textAnchor="middle">
                <textPath href={`#textPathTop-${uniqueId}`} startOffset="50%" {...({ side: "left" } as any)}>
                    Amor Est Architectura
                </textPath>
            </text>
            <text className="font-serif text-[20px] font-bold tracking-[0.2em] uppercase" fill={color ? `${color}99` : "rgba(212,175,55,0.6)"} textAnchor="middle">
                <textPath href={`#textPathBottom-${uniqueId}`} startOffset="50%" {...({ side: "right" } as any)}>
                    Veritas Formae • 2025
                </textPath>
            </text>
        </motion.g>

        {/* --- LAYER 5: REACTOR CORE (The Triangle Assembly) --- */}
        <g transform="translate(200, 200)">
            {/* Background Glow for Reactor */}
            {mode === 'reactor' && (
                <motion.circle 
                    r="80" 
                    fill={mainColor} 
                    opacity="0.1"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            )}

            {/* Downward Triangle (Flame) */}
            <motion.path
                d="M 0,110 L -95,-55 L 95,-55 Z"
                fill={`url(#flameGradient-${uniqueId})`}
                stroke="#EF4444"
                strokeWidth="2"
                initial={isAnimated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                animate={isAnimated ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.5, duration: 1 }}
                filter={`url(#glow-${uniqueId})`}
            />
            
            {/* Upward Triangle (Prism) */}
            <motion.path
                d="M 0,-110 L 95,55 L -95,55 Z"
                fill={`url(#prismGradient-${uniqueId})`}
                stroke="#3B82F6"
                strokeWidth="2"
                initial={isAnimated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                animate={isAnimated ? { scale: 1, opacity: 1 } : {}}
                transition={{ delay: 0.8, duration: 1 }}
                filter={`url(#glow-${uniqueId})`}
                style={{ mixBlendMode: 'screen' }}
            />
        </g>

        {/* --- LAYER 6: THE DIAMOND HEART (Pulsing) --- */}
        <motion.rect
            x="185" y="185" width="30" height="30"
            fill="white"
            transform="rotate(45 200 200)"
            initial={isAnimated ? { scale: 0 } : { scale: 1 }}
            animate={isAnimated ? { 
                scale: [1, 1.3, 1],
                filter: ["drop-shadow(0 0 5px white)", "drop-shadow(0 0 25px white)", "drop-shadow(0 0 5px white)"]
            } : {}}
            transition={{ 
                delay: 1.5, 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
            }}
            filter={`url(#glow-${uniqueId})`}
        />

        {/* --- LAYER 7: ORBITAL DEFENSE RINGS (Fast Spin) --- */}
        {mode === 'reactor' && (
            <>
                <motion.circle 
                    cx={c} cy={c} r="130" 
                    fill="none" 
                    stroke={mainColor} 
                    strokeWidth="0.5" 
                    opacity="0.6"
                    strokeDasharray="20 40"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    style={{ originX: "200px", originY: "200px" }}
                />
                <motion.circle 
                    cx={c} cy={c} r="145" 
                    fill="none" 
                    stroke={mainColor} 
                    strokeWidth="1" 
                    opacity="0.4"
                    strokeDasharray="2 10"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    style={{ originX: "200px", originY: "200px" }}
                />
            </>
        )}

      </motion.svg>
      
      {/* ATMOSPHERIC GLOW OVERLAY */}
      {isAnimated && (
        <div 
            className="absolute inset-0 blur-3xl rounded-full pointer-events-none animate-pulse-slow mix-blend-screen" 
            style={{ backgroundColor: color ? `${color}15` : 'rgba(212,175,55,0.1)' }}
        />
      )}
    </div>
  );
};
