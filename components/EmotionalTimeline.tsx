
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Smile, Frown, Meh, Activity, Calendar, Clock, 
  Menu, ArrowLeft, Heart, Zap, Coffee, CloudRain
} from 'lucide-react';
import { MoodEntry, MoodType } from '../types';

interface EmotionalTimelineProps {
  moodHistory: MoodEntry[];
  onAddMood: (mood: MoodEntry) => void;
  onBack: () => void;
  onMenuClick: () => void;
}

const MOODS: { type: MoodType; icon: any; color: string }[] = [
  { type: 'Happy', icon: Smile, color: '#F59E0B' },
  { type: 'Calm', icon: Coffee, color: '#10B981' },
  { type: 'Excited', icon: Zap, color: '#8B5CF6' },
  { type: 'Neutral', icon: Meh, color: '#94A3B8' },
  { type: 'Anxious', icon: Activity, color: '#F97316' },
  { type: 'Sad', icon: Frown, color: '#3B82F6' },
  { type: 'Stressed', icon: CloudRain, color: '#EF4444' },
  { type: 'Tired', icon:  CloudRain, color: '#64748B' }, // Reusing icon for simplicity or add Sleep icon
  { type: 'Grateful', icon: Heart, color: '#EC4899' },
];

export const EmotionalTimeline: React.FC<EmotionalTimelineProps> = ({ 
  moodHistory, 
  onAddMood, 
  onBack, 
  onMenuClick 
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');

  const handleLog = () => {
    if (!selectedMood) return;
    
    const entry: MoodEntry = {
      id: crypto.randomUUID(),
      type: selectedMood,
      intensity,
      note,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      timestamp: Date.now()
    };
    
    onAddMood(entry);
    
    // Reset form
    setSelectedMood(null);
    setIntensity(3);
    setNote('');
    setTags('');
  };

  // Simple aggregation for chart
  const last7Days = moodHistory.slice(0, 7).reverse();

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
              <Heart size={18} className="text-lux-gold" />
              Emotional Timeline
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar space-y-8">
        
        {/* LOGGING SECTION */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-4">Log Your Mood</h3>
          
          <div className="space-y-6">
            {/* Mood Grid */}
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">How are you feeling?</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {MOODS.map(m => (
                  <button
                    key={m.type}
                    onClick={() => setSelectedMood(m.type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      selectedMood === m.type 
                        ? 'bg-zinc-800 border-white text-white' 
                        : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <m.icon size={24} style={{ color: selectedMood === m.type ? undefined : m.color }} />
                    <span className="text-[10px] mt-2 font-medium">{m.type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs text-zinc-500 font-bold uppercase">Intensity: {intensity}/5</label>
              </div>
              <input 
                type="range" min="1" max="5" 
                value={intensity} 
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-lux-gold [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            {/* Note & Tags */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Note (optional)</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-lux-gold outline-none resize-none h-20"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Tags (optional, comma-separated)</label>
                <input 
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="work, family, health"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-lux-gold outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleLog}
              disabled={!selectedMood}
              className={`w-full py-3 rounded-xl font-bold transition-colors ${
                selectedMood 
                  ? 'bg-lux-gold text-black hover:bg-white' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Log Mood
            </button>
          </div>
        </div>

        {/* HISTORY SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Recent Entries</h3>
             <div className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-1 rounded">Total: {moodHistory.length}</div>
          </div>

          <div className="space-y-3">
            {moodHistory.length === 0 && <p className="text-center text-zinc-600 py-4 text-sm">No mood logs yet.</p>}
            {moodHistory.map(entry => {
              const moodConfig = MOODS.find(m => m.type === entry.type);
              return (
                <div key={entry.id} className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800 flex gap-4 items-start">
                  <div className="p-3 bg-black rounded-full border border-zinc-800 shrink-0">
                    {moodConfig?.icon && <moodConfig.icon size={20} style={{ color: moodConfig.color }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-white">{entry.type} <span className="text-zinc-500 text-xs font-normal">({entry.intensity}/5)</span></h4>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                    {entry.note && <p className="text-xs text-zinc-400 leading-relaxed mb-2">{entry.note}</p>}
                    {entry.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {entry.tags.map((tag, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
