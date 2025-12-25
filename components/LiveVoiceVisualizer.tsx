
import React, { useRef, useEffect, memo } from 'react';
import { Mic, X, Activity } from 'lucide-react';
import { SacredSeal } from './SacredSeal';

interface LiveVoiceVisualizerProps {
  isActive: boolean;
  frequencyData?: Uint8Array; 
  analyser?: AnalyserNode | null;
  volume?: number; // Kept in interface but mostly ignored by internal loop
  onClose: () => void;
  status?: string;
  color?: string; 
}

const LiveVoiceVisualizerComponent: React.FC<LiveVoiceVisualizerProps> = ({ 
  isActive, 
  analyser,
  onClose,
  status = "Listening",
  color = "#6366F1"
}) => {
  
  // Refs for Direct DOM Manipulation (Bypassing React Render Cycle)
  const outerRingRef = useRef<HTMLDivElement>(null);
  const middleRingRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const statusTextRef = useRef<HTMLDivElement>(null);
  
  const animationRef = useRef<number | null>(null);
  
  // --- ZERO-OVERHEAD ANIMATION LOOP ---
  useEffect(() => {
      const loop = () => {
          if (!isActive) return;

          let currentSignal = 0;

          // 1. Get Audio Data Directly
          if (analyser) {
              const data = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(data);
              
              // Calculate Bass/Energy (Focus on lower frequencies for pulse)
              const bassRange = Math.floor(data.length * 0.15); 
              let bSum = 0;
              for(let i = 0; i < bassRange; i++) bSum += data[i];
              const aiBass = (bSum / bassRange) / 255;
              
              if (aiBass > 0.05) currentSignal = aiBass;
          }

          // 2. Direct DOM Updates (No State Triggers)
          // We modify styles directly to avoid React Re-renders
          
          const scale = 1 + (currentSignal * 0.6);
          const opacity = 0.3 + (currentSignal * 0.7);
          
          if (outerRingRef.current) {
              outerRingRef.current.style.transform = `scale(${1 + currentSignal * 0.5})`;
              outerRingRef.current.style.opacity = `${currentSignal < 0.05 ? 0.2 : 0.5}`;
          }

          if (middleRingRef.current) {
              // Read current rotation from data-attribute to maintain state without React
              const currentRotate = parseFloat(middleRingRef.current.getAttribute('data-rotate') || '0');
              const newRotate = currentRotate + (currentSignal * 5) + 0.2; // Base spin + signal spin
              middleRingRef.current.style.transform = `rotate(${newRotate}deg)`;
              middleRingRef.current.setAttribute('data-rotate', newRotate.toString());
          }

          if (glowRef.current) {
              glowRef.current.style.transform = `scale(${scale})`;
              glowRef.current.style.opacity = `${opacity}`;
          }

          if (sealRef.current) {
              sealRef.current.style.transform = `scale(${scale})`;
          }
          
          if (statusTextRef.current) {
              // Breathing effect for text
              const breathing = 0.5 + (Math.sin(Date.now() / 800) * 0.3);
              statusTextRef.current.style.opacity = `${breathing}`;
          }

          animationRef.current = requestAnimationFrame(loop);
      };

      if (isActive) {
          loop();
      }

      return () => {
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
  }, [isActive, analyser]);

  return (
    <div 
      className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Ambience */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ 
            background: `radial-gradient(circle at center, ${color} 0%, transparent 70%)` 
        }} 
      />
      
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50">
        <div 
            className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10"
            style={{ borderColor: `${color}30` }}
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-xs font-medium tracking-widest uppercase" style={{ color: color }}>Live Connection</span>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-all border border-zinc-800"
        >
          <X size={24} />
        </button>
      </div>

      {/* THE SACRED SEAL CORE - DOM REFS ATTACHED HERE */}
      <div className="relative w-80 h-80 flex items-center justify-center" style={{ willChange: 'transform' }}>
        
        {/* 1. Outer Pulse Ring */}
        <div 
          ref={outerRingRef}
          className="absolute inset-0 rounded-full border transition-transform duration-75 ease-linear"
          style={{ borderColor: `${color}30`, transform: 'scale(1)', opacity: 0.2 }}
        />
        
        {/* 2. Middle Ring (Rotating) */}
        <div 
          ref={middleRingRef}
          className="absolute inset-8 rounded-full border border-dashed transition-transform duration-75 ease-linear"
          style={{ borderColor: `${color}50` }}
        />

        {/* 3. The Reactive Glow Halo */}
        <div 
          ref={glowRef}
          className="absolute inset-16 rounded-full blur-3xl transition-transform duration-75 ease-linear"
          style={{ opacity: 0.2, backgroundColor: color, transform: 'scale(1)' }}
        />

        {/* 4. THE SACRED SEAL (Center) */}
        <div
            ref={sealRef}
            className="relative z-10 transition-transform duration-75 ease-linear"
            style={{ transform: 'scale(1)' }}
        >
            <SacredSeal size={200} isAnimated={true} color={color} />
        </div>

      </div>

      {/* Status Text */}
      <div className="absolute bottom-20 text-center space-y-2">
         <div 
            ref={statusTextRef}
            className="text-2xl font-light text-white tracking-widest uppercase font-mono"
         >
           {status}
         </div>
         <div className="flex items-center justify-center gap-2 text-xs" style={{ color: `${color}80` }}>
            <Activity size={12} />
            <span>Channel Open</span>
         </div>
      </div>

    </div>
  );
};

export const LiveVoiceVisualizer = memo(LiveVoiceVisualizerComponent);
