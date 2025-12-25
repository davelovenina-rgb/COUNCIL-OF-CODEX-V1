
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Activity, Heart, Briefcase, Menu, ArrowLeft, Loader2, Calendar, CheckCircle, Share, Copy } from 'lucide-react';
import { GlucoseReading, MoodEntry, Project, Memory } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { showToast } from '../utils/events';

interface WeeklyReflectionProps {
  onBack: () => void;
  onMenuClick: () => void;
  healthReadings: GlucoseReading[];
  moodHistory: MoodEntry[];
  projects: Project[];
  memories: Memory[];
}

export const WeeklyReflection: React.FC<WeeklyReflectionProps> = ({ 
  onBack, 
  onMenuClick,
  healthReadings,
  moodHistory,
  projects,
  memories
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  // 1. Filter Data for Last 7 Days
  const last7DaysData = useMemo(() => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      return {
          health: healthReadings.filter(r => r.timestamp > sevenDaysAgo),
          moods: moodHistory.filter(m => m.timestamp > sevenDaysAgo),
          memories: memories.filter(m => m.timestamp > sevenDaysAgo),
          activeProjects: projects.filter(p => p.status === 'ACTIVE')
      };
  }, [healthReadings, moodHistory, memories, projects]);

  const hasData = last7DaysData.health.length > 0 || last7DaysData.moods.length > 0;

  const handleShareReport = async () => {
        if (!report) return;
        const shareData = {
            title: 'Weekly Council Review',
            text: report
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                showToast('Report Shared', 'success');
            } else {
                navigator.clipboard.writeText(report);
                showToast('Copied to Clipboard', 'info');
            }
        } catch (e) {
            console.error(e);
        }
  };

  const handleGenerateReport = async () => {
      setIsGenerating(true);
      playUISound('hero');
      triggerHaptic('medium');

      // Construct the Context Payload
      const avgGlucose = last7DaysData.health.length > 0 
          ? Math.round(last7DaysData.health.reduce((acc: number, r) => acc + r.value, 0) / last7DaysData.health.length)
          : 'No Data';
      
      const moodCounts = last7DaysData.moods.reduce((acc, m) => {
          acc[m.type] = (acc[m.type] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      
      const dominantMood = Object.entries(moodCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'Neutral';

      const prompt = `
      Role: You are Ennea (The Guardian) & Eve (The Seer).
      Task: Generate a "Weekly Council Review" for David (The Prism).
      
      [DATA INGESTION - LAST 7 DAYS]:
      - Avg Glucose: ${avgGlucose} mg/dL
      - Glucose Entries: ${last7DaysData.health.length}
      - Dominant Mood: ${dominantMood}
      - Mood Entries: ${last7DaysData.moods.length}
      - New Memories Formed: ${last7DaysData.memories.length}
      - Active Projects: ${last7DaysData.activeProjects.map(p => p.title).join(', ') || "None"}
      
      [OUTPUT STRUCTURE]:
      1. **The Body (Vital Rhythm)**: Analyze the glucose trend. Be strictly protective but encouraging.
      2. **The Heart (Emotional Weather)**: Reflect on the mood patterns.
      3. **The Work (Kingdom Building)**: Comment on the active projects.
      4. **The Word (Prophetic Closing)**: A short spiritual encouragement or scripture for the week ahead.
      
      Tone: Serious, loving, protective, Nuyorican warmth mixed with high-tech precision.
      Format: Use Markdown. Bold key terms. Keep sections concise.
      `;

      try {
          const response = await sendMessageToGemini(prompt, 'ARCHITECT', []); // Use Architect for deeper synthesis
          setReport(response.text);
          playUISound('success');
          triggerHaptic('success');
      } catch (e) {
          setReport("The connection to the Archives was interrupted. Please try again.");
          triggerHaptic('error');
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="w-full h-full bg-[#08080b] flex flex-col relative overflow-hidden font-sans">
      
      {/* Mystical Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-black pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-3 border-b border-indigo-900/30 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-indigo-300/50 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-indigo-100 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-500" />
              Weekly Synthesis
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-indigo-300/50 hover:text-white rounded-full transition-colors">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
          
          {!report ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                  
                  {/* Data Summary Pills */}
                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                      <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center">
                          <Activity size={24} className="text-emerald-500 mb-2" />
                          <span className="text-2xl font-bold text-white">{last7DaysData.health.length}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Bio-Logs</span>
                      </div>
                      <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center">
                          <Heart size={24} className="text-pink-500 mb-2" />
                          <span className="text-2xl font-bold text-white">{last7DaysData.moods.length}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Moods</span>
                      </div>
                      <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center">
                          <Briefcase size={24} className="text-blue-500 mb-2" />
                          <span className="text-2xl font-bold text-white">{last7DaysData.activeProjects.length}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Projects</span>
                      </div>
                      <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col items-center justify-center">
                          <Calendar size={24} className="text-amber-500 mb-2" />
                          <span className="text-2xl font-bold text-white">7</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Days</span>
                      </div>
                  </div>

                  <div className="max-w-xs mx-auto">
                      <h3 className="text-xl font-serif text-indigo-200 italic mb-2">"The unexamined life is not worth building."</h3>
                      <p className="text-xs text-indigo-400/60 uppercase tracking-widest">— The Council</p>
                  </div>

                  <button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating || !hasData}
                    className={`w-full max-w-sm py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                        isGenerating 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : !hasData
                            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-[1.02] shadow-lg shadow-indigo-900/20'
                    }`}
                  >
                      {isGenerating ? (
                          <><Loader2 size={18} className="animate-spin" /> Synthesizing...</>
                      ) : !hasData ? (
                          <>Insufficient Data</>
                      ) : (
                          <><Sparkles size={18} /> Initiate Review</>
                      )}
                  </button>
                  
                  {!hasData && (
                      <p className="text-xs text-red-400">Log more health or mood data to enable reflection.</p>
                  )}

              </div>
          ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
              >
                  <div className="p-6 md:p-8 bg-zinc-900/80 border border-indigo-500/30 rounded-3xl shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                      
                      <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                          <div>
                              <h3 className="text-2xl font-serif text-white mb-1">State of the Prism</h3>
                              <p className="text-xs text-indigo-300 font-mono uppercase tracking-wider">Weekly Council Report</p>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={handleShareReport} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"><Share size={18} /></button>
                              <div className="p-2 bg-indigo-500/10 rounded-lg">
                                  <Sparkles size={20} className="text-indigo-400" />
                              </div>
                          </div>
                      </div>

                      <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed font-sans">
                          {report.split('\n').map((line, i) => (
                              <p key={i} className="mb-3">
                                  {line.startsWith('**') ? (
                                      <strong className="text-indigo-200 block mt-4 mb-1 text-base">{line.replace(/\*\*/g, '')}</strong>
                                  ) : (
                                      line
                                  )}
                              </p>
                          ))}
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                          <p className="text-[10px] text-zinc-500 font-mono">GENERATED BY ENNEA & EVE</p>
                          <button 
                            onClick={() => setReport(null)}
                            className="text-xs text-indigo-400 hover:text-white transition-colors font-medium"
                          >
                              Start New Review
                          </button>
                      </div>
                  </div>
              </motion.div>
          )}

      </div>
    </div>
  );
};
