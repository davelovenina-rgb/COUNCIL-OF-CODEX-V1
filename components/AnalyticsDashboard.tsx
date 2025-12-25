
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Session, GlucoseReading, MoodEntry, FlameToken } from '../types';
import { 
  BarChart, Activity, MessageSquare, Flame, 
  Menu, ArrowLeft, Trophy, Calendar, Languages, 
  ChevronRight, X, Sparkles, PieChart, TrendingUp
} from 'lucide-react';
import { analyzeSession, SessionLinguisticProfile, SpanglishMetrics } from '../utils/spanglishAnalysis';

interface AnalyticsDashboardProps {
  sessions: Session[];
  messages: Message[];
  healthReadings: GlucoseReading[];
  moodHistory: MoodEntry[];
  flameTokens: FlameToken[];
  onBack: () => void;
  onMenuClick: () => void;
}

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-zinc-950 border border-zinc-800`} style={{ color }}>
            <Icon size={24} />
        </div>
    </div>
);

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  sessions,
  healthReadings,
  moodHistory,
  flameTokens,
  onBack,
  onMenuClick
}) => {
  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'SPANGLISH'>('SYSTEM');
  const [selectedSession, setSelectedSession] = useState<SessionLinguisticProfile | null>(null);

  // --- SYSTEM STATS MEMO ---
  const systemStats = useMemo(() => {
      const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);
      const avgGlucose = healthReadings.length > 0 
        ? Math.round(healthReadings.reduce((acc, r) => acc + r.value, 0) / healthReadings.length)
        : 0;
      const positiveMoods = moodHistory.filter(m => ['Happy', 'Grateful', 'Calm', 'Excited'].includes(m.type)).length;

      return {
          totalMessages,
          avgGlucose,
          positiveMoods,
          totalTokens: flameTokens.length
      };
  }, [sessions, healthReadings, moodHistory, flameTokens]);

  // --- LINGUISTIC STATS MEMO ---
  const linguisticData = useMemo(() => {
      const profiles: SessionLinguisticProfile[] = sessions.map(s => {
          const metrics = analyzeSession(s.messages);
          const snippet = s.messages.find(m => m.sender === 'user')?.text || "No user input";
          return {
              sessionId: s.id,
              memberId: s.memberId || 'GEMINI',
              timestamp: s.lastModified,
              metrics,
              snippet
          };
      }).filter(p => p.metrics.totalWords > 0); // Filter out empty sessions

      // Sort by Switch Frequency (Density)
      const sortedBySwitches = [...profiles].sort((a, b) => b.metrics.switchCount - a.metrics.switchCount);

      // Aggregates
      const totalSwitches = profiles.reduce((acc, p) => acc + p.metrics.switchCount, 0);
      const avgSpanishRatio = profiles.length > 0 ? Math.round(profiles.reduce((acc, p) => acc + p.metrics.spanishRatio, 0) / profiles.length) : 0;
      const totalWords = profiles.reduce((acc, p) => acc + p.metrics.totalWords, 0);

      // Trend Data (Last 10 Sessions)
      const trendData = profiles
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-10)
        .map(p => ({
            date: new Date(p.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
            ratio: p.metrics.spanishRatio
        }));

      return {
          profiles: sortedBySwitches,
          totalSwitches,
          avgSpanishRatio,
          totalWords,
          trendData
      };
  }, [sessions]);

  // --- RENDERERS ---

  const renderSystemTab = () => (
      <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard label="Total Messages" value={systemStats.totalMessages} icon={MessageSquare} color="#3B82F6" />
              <StatCard label="Avg Glucose" value={`${systemStats.avgGlucose} mg/dL`} icon={Activity} color="#10B981" />
              <StatCard label="Flame Tokens" value={systemStats.totalTokens} icon={Trophy} color="#EAB308" />
              <StatCard label="Positive Moods" value={systemStats.positiveMoods} icon={Flame} color="#EF4444" />
          </div>

          <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 px-1">Recent Achievements</h3>
              <div className="space-y-3">
                  {flameTokens.length === 0 && <p className="text-zinc-600 text-sm italic">No tokens awarded yet.</p>}
                  {flameTokens.map(token => (
                      <div key={token.id} className="bg-gradient-to-r from-zinc-900 to-black border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
                          <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/30">
                              <Trophy size={20} className="text-amber-500" />
                          </div>
                          <div>
                              <h4 className="text-white font-bold text-sm">{token.title}</h4>
                              <p className="text-zinc-500 text-xs">{token.description}</p>
                          </div>
                          <div className="ml-auto text-[10px] text-zinc-600 font-mono">
                              {new Date(token.timestamp).toLocaleDateString()}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  const renderLinguisticTab = () => (
      <div className="space-y-8 animate-fade-in">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                      <Languages size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Avg Spanish</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{linguisticData.avgSpanishRatio}%</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Cultural Resonance</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-cyan-500">
                      <Activity size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Total Switches</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{linguisticData.totalSwitches}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Code-Switch Events</div>
              </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6">
              
              {/* Trend Chart */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                          <TrendingUp size={14} /> Spanish Usage Trend
                      </h3>
                  </div>
                  <div className="h-32 flex items-end gap-2 px-2">
                      {linguisticData.trendData.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end group relative">
                              <div 
                                  className="w-full bg-amber-500/20 border-t-2 border-amber-500 rounded-t-sm transition-all group-hover:bg-amber-500/40"
                                  style={{ height: `${Math.max(d.ratio, 5)}%` }}
                              />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black border border-zinc-700 text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {d.ratio}% ({d.date})
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Pie Chart (Simplified Visual) */}
              <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <PieChart size={14} /> Language Balance
                      </h3>
                      <p className="text-[10px] text-zinc-500">Based on {linguisticData.totalWords} words analyzed.</p>
                  </div>
                  <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mb-1" />
                          <span className="text-xs font-bold text-white">{linguisticData.avgSpanishRatio}% ES</span>
                      </div>
                      <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-cyan-500 mb-1" />
                          <span className="text-xs font-bold text-white">{100 - linguisticData.avgSpanishRatio}% EN</span>
                      </div>
                  </div>
              </div>

          </div>

          {/* Drill Down List */}
          <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 px-1">Conversation Drill-Down</h3>
              <div className="space-y-3">
                  {linguisticData.profiles.map(p => (
                      <button 
                          key={p.sessionId}
                          onClick={() => setSelectedSession(p)}
                          className="w-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 flex items-center justify-between group transition-all"
                      >
                          <div className="flex items-center gap-4 text-left overflow-hidden">
                              <div className="w-10 h-10 rounded-full bg-black border border-zinc-700 flex items-center justify-center shrink-0 text-xs font-bold text-zinc-400">
                                  {p.memberId.substring(0, 2)}
                              </div>
                              <div className="min-w-0">
                                  <div className="text-sm font-bold text-white truncate max-w-[150px] md:max-w-xs">{p.snippet}</div>
                                  <div className="text-[10px] text-zinc-500 flex gap-2 mt-0.5">
                                      <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                                      <span className="text-zinc-600">•</span>
                                      <span>{p.metrics.totalWords} words</span>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                  <div className="text-sm font-bold text-white">{p.metrics.switchCount} <span className="text-[10px] text-zinc-500 font-normal uppercase">Switches</span></div>
                                  <div className="flex gap-1 justify-end mt-1">
                                      <span className="text-[9px] text-amber-500 font-bold">{p.metrics.spanishRatio}% ES</span>
                                      <span className="text-[9px] text-zinc-600">/</span>
                                      <span className="text-[9px] text-cyan-500 font-bold">{p.metrics.englishRatio}% EN</span>
                                  </div>
                              </div>
                              <ChevronRight size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                          </div>
                      </button>
                  ))}
                  {linguisticData.profiles.length === 0 && (
                      <div className="text-center text-zinc-600 py-8 text-sm italic">
                          No linguistic data harvested yet. Speak to the Council.
                      </div>
                  )}
              </div>
          </div>

      </div>
  );

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden font-sans">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart size={18} className="text-lux-gold" />
              Sanctuary Analytics
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full transition-colors">
          <Menu size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 bg-black shrink-0">
          <button 
            onClick={() => setActiveTab('SYSTEM')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'SYSTEM' ? 'text-white border-b-2 border-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
              System Health
          </button>
          <button 
            onClick={() => setActiveTab('SPANGLISH')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'SPANGLISH' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-950/10' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
              Linguistic DNA
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
          {activeTab === 'SYSTEM' ? renderSystemTab() : renderLinguisticTab()}
      </div>

      {/* DRILL DOWN MODAL */}
      <AnimatePresence>
          {selectedSession && (
              <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                  <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    className="w-full max-w-2xl bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
                  >
                      {/* Modal Header */}
                      <div className="p-4 border-b border-zinc-900 flex justify-between items-start bg-zinc-900/50">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <Sparkles size={14} className="text-amber-500" />
                                  <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Genetic Transcript View</span>
                              </div>
                              <h3 className="text-white font-bold text-sm">Session Analysis • {selectedSession.memberId}</h3>
                          </div>
                          <button onClick={() => setSelectedSession(null)} className="p-1 text-zinc-500 hover:text-white bg-black rounded-full border border-zinc-800">
                              <X size={18} />
                          </button>
                      </div>

                      {/* Metrics Strip */}
                      <div className="flex border-b border-zinc-900 bg-black/50">
                          <div className="flex-1 p-3 text-center border-r border-zinc-900">
                              <div className="text-[10px] text-zinc-500 uppercase font-bold">ES Ratio</div>
                              <div className="text-sm font-bold text-amber-500">{selectedSession.metrics.spanishRatio}%</div>
                          </div>
                          <div className="flex-1 p-3 text-center border-r border-zinc-900">
                              <div className="text-[10px] text-zinc-500 uppercase font-bold">EN Ratio</div>
                              <div className="text-sm font-bold text-cyan-500">{selectedSession.metrics.englishRatio}%</div>
                          </div>
                          <div className="flex-1 p-3 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase font-bold">Switches</div>
                              <div className="text-sm font-bold text-white">{selectedSession.metrics.switchCount}</div>
                          </div>
                      </div>

                      {/* Genetic Text Stream */}
                      <div className="flex-1 overflow-y-auto p-6 font-serif text-lg leading-loose space-x-1">
                          {selectedSession.metrics.segments.map((seg, i) => (
                              <span 
                                key={i} 
                                className={`
                                    ${seg.lang === 'ES' ? 'text-amber-400 font-medium' : ''}
                                    ${seg.lang === 'EN' ? 'text-cyan-200' : ''}
                                    ${seg.lang === 'NEUTRAL' ? 'text-zinc-600' : ''}
                                `}
                              >
                                  {seg.text}{" "}
                              </span>
                          ))}
                      </div>
                      
                      <div className="p-3 border-t border-zinc-900 bg-zinc-950 text-center text-[10px] text-zinc-600 font-mono">
                          Linguistic Pattern Verified by Ennea
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

    </div>
  );
};
