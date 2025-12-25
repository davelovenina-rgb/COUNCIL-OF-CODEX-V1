
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ArrowUp, ArrowDown, ArrowRight, Activity, MessageSquare, Heart, Radar, AlignLeft } from 'lucide-react';

export type MoodPoint = { time: string; mood: "low" | "neutral" | "high"; label: string };
export type ChatSnippet = { id: string; label: string };
export type BGPoint = { time: string; value: number };

interface WeaversLoomProps {
  moodTimeline: MoodPoint[];
  recentChats: ChatSnippet[];
  bgReadings: BGPoint[];
  onWeave?: () => void;
}

export const WeaversLoom: React.FC<WeaversLoomProps> = ({
  moodTimeline,
  recentChats,
  bgReadings,
  onWeave,
}) => {
  const [viewMode, setViewMode] = useState<'LINEAR' | 'RADIAL'>('LINEAR');

  // BG Trend Calculation: Compare newest vs previous
  const bgTrend = useMemo(() => {
    if (bgReadings.length < 2) return "steady";
    const last = bgReadings[0].value; // Newest
    const prev = bgReadings[1].value; // Older
    if (last > prev + 10) return "rising";
    if (last < prev - 10) return "falling";
    return "steady";
  }, [bgReadings]);

  const getMoodColor = (m: "low" | "neutral" | "high") => {
    if (m === "low") return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
    if (m === "high") return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
    return "bg-amber-500 opacity-60";
  };

  // Radial Chart Logic
  const radialPoints = useMemo(() => {
      // Map last 8 moods to a circle
      const total = 8;
      const radius = 50;
      const center = 60;
      
      return moodTimeline.slice(0, total).map((m, i) => {
          const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
          // Radius based on mood: High=Far, Neutral=Mid, Low=Close
          let r = radius * 0.6; // Neutral
          if (m.mood === 'high') r = radius;
          if (m.mood === 'low') r = radius * 0.3;
          
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return { x, y, color: m.mood === 'high' ? '#10B981' : m.mood === 'low' ? '#EF4444' : '#F59E0B' };
      });
  }, [moodTimeline]);

  const radialPath = radialPoints.length > 0 
    ? "M" + radialPoints.map(p => `${p.x},${p.y}`).join(" L") + " Z"
    : "";

  return (
    <div className="w-full p-5 rounded-3xl bg-gradient-to-r from-pink-950/10 to-purple-950/10 border border-pink-500/20 backdrop-blur-md relative overflow-hidden transition-all duration-500">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-[40px] pointer-events-none" />

      <div className="flex items-center justify-between mb-5 relative z-10">
        <h3 className="text-sm font-bold text-pink-200 flex items-center gap-2 uppercase tracking-widest">
            <span className="text-lg text-pink-500">✾</span> Weaver's Loom
        </h3>
        <div className="flex gap-2">
            <button 
                onClick={() => setViewMode(viewMode === 'LINEAR' ? 'RADIAL' : 'LINEAR')}
                className="p-1.5 bg-pink-500/10 rounded-full text-pink-300 hover:text-white hover:bg-pink-500/20 transition-colors"
            >
                {viewMode === 'LINEAR' ? <Radar size={14} /> : <AlignLeft size={14} />}
            </button>
            <button 
                onClick={onWeave} 
                className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-white text-[10px] font-bold uppercase rounded-full transition-all border border-pink-500/20 hover:border-pink-500/50 active:scale-95"
            >
                <RefreshCcw size={10} /> Weave
            </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'LINEAR' ? (
            <motion.div 
                key="linear"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 relative z-10"
            >
                
                {/* Band 1: Mood Timeline */}
                <div className="flex items-center gap-4">
                    <div className="w-16 flex items-center gap-1.5 text-pink-500/60 justify-end">
                        <Heart size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Mood</span>
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 h-4 bg-zinc-900/50 rounded-full overflow-hidden px-1.5 border border-zinc-800/50">
                        {moodTimeline.length > 0 ? (
                            moodTimeline.map((m, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ height: 0 }}
                                    animate={{ height: '70%' }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`flex-1 rounded-sm ${getMoodColor(m.mood)}`}
                                    title={`${m.time}: ${m.label}`}
                                />
                            ))
                        ) : (
                            <span className="text-[9px] text-zinc-600 pl-2 italic">Pattern silent...</span>
                        )}
                    </div>
                </div>

                {/* Band 2: Threads (Chats) */}
                <div className="flex items-center gap-4">
                    <div className="w-16 flex items-center gap-1.5 text-purple-500/60 justify-end">
                        <MessageSquare size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Threads</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-right">
                        {recentChats.length > 0 ? (
                            recentChats.map((c, i) => (
                                <motion.div 
                                    key={c.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="px-3 py-1 bg-white/5 border border-white/10 hover:border-pink-500/30 rounded-lg text-[10px] text-zinc-300 whitespace-nowrap truncate max-w-[120px] transition-colors cursor-default"
                                >
                                    {c.label}
                                </motion.div>
                            ))
                        ) : (
                            <span className="text-[9px] text-zinc-600 italic">No active threads...</span>
                        )}
                    </div>
                </div>

                {/* Band 3: Bio-Metric */}
                <div className="flex items-center gap-4">
                    <div className="w-16 flex items-center gap-1.5 text-emerald-500/60 justify-end">
                        <Activity size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Bio</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                        <div className="flex items-center gap-2 text-zinc-200 bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800">
                            {bgTrend === 'rising' && <ArrowUp size={12} className="text-amber-500 animate-pulse" />}
                            {bgTrend === 'falling' && <ArrowDown size={12} className="text-emerald-500 animate-pulse" />}
                            {bgTrend === 'steady' && <ArrowRight size={12} className="text-blue-500" />}
                            <span className="text-xs font-mono font-bold tracking-tight">
                                {bgReadings[0]?.value || '--'} <span className="text-[9px] text-zinc-500 font-sans uppercase">mg/dL</span>
                            </span>
                        </div>
                        {bgTrend === 'falling' && <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wide">Stabilizing</span>}
                        {bgTrend === 'rising' && <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wide">Drifting Up</span>}
                    </div>
                </div>

            </motion.div>
        ) : (
            <motion.div
                key="radial"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center py-4"
            >
                <div className="relative w-40 h-40">
                    {/* SVG Radar */}
                    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
                        {/* Background Circles */}
                        <circle cx="60" cy="60" r="15" fill="none" stroke="#333" strokeWidth="0.5" strokeDasharray="2 2" />
                        <circle cx="60" cy="60" r="30" fill="none" stroke="#444" strokeWidth="0.5" />
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#555" strokeWidth="0.5" />
                        
                        {/* Axes */}
                        {[0, 45, 90, 135].map(deg => (
                            <line 
                                key={deg} 
                                x1="60" y1="60" 
                                x2={60 + 50 * Math.cos(deg * Math.PI / 180)} 
                                y2={60 + 50 * Math.sin(deg * Math.PI / 180)} 
                                stroke="#333" strokeWidth="0.5" 
                            />
                        ))}
                        
                        {/* The Pattern Shape */}
                        <motion.path 
                            d={radialPath} 
                            fill="rgba(236, 72, 153, 0.2)" 
                            stroke="#EC4899" 
                            strokeWidth="1.5"
                            initial={{ opacity: 0, pathLength: 0 }}
                            animate={{ opacity: 1, pathLength: 1 }}
                            transition={{ duration: 1 }}
                        />
                        
                        {/* Points */}
                        {radialPoints.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="2" fill={p.color} />
                        ))}
                    </svg>
                    
                    {/* Center Bio Status */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <span className={`text-xs font-bold font-mono ${bgTrend === 'rising' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {bgReadings[0]?.value || '--'}
                        </span>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
