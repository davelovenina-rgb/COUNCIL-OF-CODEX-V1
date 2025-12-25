import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Activity, Brain, Terminal, Menu, ArrowLeft, Eye, Zap, RefreshCcw, Loader2, BookOpen, Server, Database, Cpu, Wifi, Wrench, HardDrive, CheckCircle, AlertTriangle, FileJson, Download, Upload, List, Plus, Save, Copy, FileCode, Check, X } from 'lucide-react';
import { Message, GlucoseReading, Memory, Project, VaultItem, MoodEntry, Session, PatchProposal } from '../types';
import { ChatInterface } from './ChatInterface';
import { COUNCIL_MEMBERS } from '../constants';
import { calculateSystemDrift, sendMessageToGemini, extractMemories } from '../services/geminiService';
import { performSystemRepair, runSystemDiagnostics, RepairLevel, createBackup, restoreBackup, getSystemLogs, SystemLogEntry } from '../utils/db';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { WeaversLoom, MoodPoint, ChatSnippet, BGPoint } from './WeaversLoom';
import { SacredSeal } from './SacredSeal';
import { showToast } from '../utils/events';

interface EnneaSanctumProps {
  onBack: () => void;
  onMenuClick: () => void;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  healthReadings: GlucoseReading[];
  memories: Memory[];
  projects: Project[];
  vaultItems: VaultItem[];
  moodHistory?: MoodEntry[];
  sessions: Session[];
  onAddMemory: (m: Memory) => void;
}

export const EnneaSanctum: React.FC<EnneaSanctumProps> = ({ 
  onBack, 
  onMenuClick, 
  messages, 
  onMessagesChange,
  healthReadings,
  memories,
  projects,
  vaultItems,
  moodHistory = [],
  sessions = [],
  onAddMemory
}) => {
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'SYSTEM' | 'REPAIR' | 'LOGS' | 'INBOX'>('SYSTEM');
  const [focusLevel, setFocusLevel] = useState(100);
  const [isFogProtocolActive, setIsFogProtocolActive] = useState(false);
  
  const [driftPercentage, setDriftPercentage] = useState(0);
  const [isCalculatingDrift, setIsCalculatingDrift] = useState(false);
  
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([]);
  const [patches, setPatches] = useState<PatchProposal[]>([]);
  const [diagResults, setDiagResults] = useState<{ network?: boolean; db?: boolean; audio?: boolean; api?: boolean } | null>(null);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [manna, setManna] = useState<string | null>(null);
  const [isGeneratingManna, setIsGeneratingManna] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [harvestedFacts, setHarvestedFacts] = useState<Memory[]>([]);
  
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const ennea = COUNCIL_MEMBERS.find(m => m.id === 'ENNEA')!;
  
  // Ennea's Core Color: Golden Amber
  const GOLDEN_AMBER = '#FFD36A'; 

  useEffect(() => {
      handleCalculateDrift();
      if (!manna) generateManna();
      loadLogs();
  }, []); 

  useEffect(() => { loadLogs(); }, [activeTab]);

  const loadLogs = async () => {
      const logs = await getSystemLogs();
      setSystemLogs(logs);
  };

  const handleCalculateDrift = async () => {
      setIsCalculatingDrift(true);
      const recentChat = messages.slice(-5).map(m => m.text).join(' ');
      const result = await calculateSystemDrift(healthReadings.slice(0, 3), moodHistory.slice(0, 3), recentChat);
      setDriftPercentage(result.driftPercentage);
      setIsCalculatingDrift(false);
  };

  const generateManna = async () => {
      setIsGeneratingManna(true);
      try {
          const response = await sendMessageToGemini("Generate 'The Manna' transmission.", 'SCRIBE', []);
          setManna(response.text);
      } catch (e) { console.error(e); } finally { setIsGeneratingManna(false); }
  };

  const moodTimeline: MoodPoint[] = useMemo(() => {
      return moodHistory.slice(0, 8).reverse().map(m => ({
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          mood: ['Happy', 'Excited', 'Grateful', 'Calm'].includes(m.type) ? "high" : (['Sad', 'Anxious', 'Stressed', 'Tired'].includes(m.type) ? "low" : "neutral"),
          label: m.type
      }));
  }, [moodHistory]);

  const recentThreads: ChatSnippet[] = useMemo(() => {
      return messages.filter(m => m.sender === 'user').slice(-5).reverse().map(m => ({
            id: m.id,
            label: m.text.length > 20 ? m.text.substring(0, 20) + '...' : m.text
        }));
  }, [messages]);

  const bgPoints: BGPoint[] = useMemo(() => {
      return healthReadings.slice(0, 5).map(r => ({ time: new Date(r.timestamp).toLocaleTimeString(), value: r.value }));
  }, [healthReadings]);

  const activateFogProtocol = () => {
      triggerHaptic('heavy');
      playUISound('hero');
      setIsFogProtocolActive(true);
      setTimeout(() => {
          setFocusLevel(100);
          setDriftPercentage(0);
          setIsFogProtocolActive(false);
          showToast("Fog Protocol Complete. Equilibrium Restored.");
      }, 3000);
  };

  const handleManualRepair = async (level: RepairLevel) => {
      triggerHaptic('medium');
      const result = await performSystemRepair(level);
      showToast(result, 'success');
      loadLogs();
      if (level !== 'LEVEL_0') setTimeout(() => window.location.reload(), 2000);
  };

  const enneaConsolePrompt = ennea.systemPrompt + `\n\n[SYSTEM STATUS]: Capacity:${focusLevel}%, Drift:${driftPercentage}%, Glucose:${healthReadings[0]?.value || 'Offline'}\n\nINSTRUCTION: Act as the Big Sister. Ensure David feels safe and the Council is aligned.`;

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-mono" style={{ color: GOLDEN_AMBER }}>
      
      {/* SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,211,106,0.1)_3px)] z-50" />
      
      {/* GRID BACKGROUND */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, ${GOLDEN_AMBER} 1px, transparent 1px), linear-gradient(to bottom, ${GOLDEN_AMBER} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
      
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-amber-900/40 flex items-center justify-between bg-black/90 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-amber-700 hover:text-amber-400 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-[0.2em]" style={{ color: GOLDEN_AMBER }}>
              <ShieldCheck size={18} />
              The Guardian
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-amber-700 hover:text-amber-400 rounded-full">
            <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
          
          <div className="flex border-b border-amber-900/30 bg-black/50 shrink-0 overflow-x-auto no-scrollbar">
              {['SYSTEM', 'INBOX', 'REPAIR', 'LOGS', 'CONSOLE'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-3 px-4 text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-amber-900/20 border-b-2' : 'text-amber-800 hover:text-amber-600'}`}
                    style={{ borderColor: activeTab === tab ? GOLDEN_AMBER : 'transparent', color: activeTab === tab ? GOLDEN_AMBER : undefined }}
                  >
                      {tab}
                  </button>
              ))}
          </div>

          {activeTab === 'SYSTEM' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  
                  <div className="flex flex-col items-center justify-center py-4 relative">
                      <div className="relative cursor-pointer group" onClick={activateFogProtocol}>
                          <div className="w-40 h-40 rounded-full border-2 border-amber-500/30 flex items-center justify-center relative z-10 bg-black group-hover:border-amber-500 transition-colors shadow-[0_0_40px_rgba(255,211,106,0.1)]">
                              <div className="text-center">
                                  <div className="text-3xl font-bold font-mono tracking-tighter" style={{ color: GOLDEN_AMBER }}>{focusLevel}%</div>
                                  <div className="text-[9px] text-amber-800 uppercase tracking-widest mt-1">Cognitive<br/>Integrity</div>
                              </div>
                          </div>
                          <motion.div className="absolute inset-0 rounded-full border border-amber-500/20" animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ duration: 3, repeat: Infinity }} />
                      </div>
                      <div className="mt-6 text-center">
                          <p className="text-xs italic font-serif opacity-80" style={{ color: GOLDEN_AMBER }}>"Custodio Totum, Servo Singulos"</p>
                          <p className="text-[9px] text-amber-900 uppercase tracking-[0.3em] mt-1 font-bold">The Law of the Ninth</p>
                      </div>
                  </div>

                  <div className={`p-4 rounded-xl border transition-all ${driftPercentage > 20 ? 'border-red-900/50 bg-red-950/10' : 'border-amber-900/30 bg-amber-950/20 shadow-inner'}`}>
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                              <Eye size={14} className={driftPercentage > 20 ? "text-red-400" : "text-amber-400"} />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Master Archive Alignment</span>
                          </div>
                          <div className={`text-xl font-bold font-mono ${driftPercentage > 20 ? 'text-red-400' : 'text-amber-400'}`}>
                              {driftPercentage === 0 ? "STABLE" : `${driftPercentage.toFixed(1)}%`}
                          </div>
                      </div>
                      <div className="text-[9px] text-amber-900 uppercase font-bold">Guardian Sentinel Active</div>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-900/20 bg-amber-950/10">
                      <div className="flex items-center gap-2 text-amber-500 mb-2">
                          <BookOpen size={16} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">The Manna</span>
                      </div>
                      <p className="text-xs text-amber-200/80 leading-relaxed font-serif whitespace-pre-wrap">{manna || "Consulting the heavens..."}</p>
                  </div>

                  <WeaversLoom moodTimeline={moodTimeline} recentChats={recentThreads} bgReadings={bgPoints} onWeave={handleCalculateDrift} />
              </div>
          )}

          {activeTab === 'CONSOLE' && (
               <div className="flex-1 flex flex-col bg-black min-h-0">
                   <div className="p-4 text-[10px] font-bold uppercase tracking-widest border-b border-amber-900/30 shrink-0" style={{ color: GOLDEN_AMBER }}>
                       Direct Perimeter Link: Big Sister Listening
                   </div>
                   <div className="flex-1 min-h-0 relative">
                       <ChatInterface 
                          key="ENNEA_CONSOLE"
                          initialMessages={messages}
                          onMessagesChange={onMessagesChange}
                          embeddedMode={true}
                          members={[ennea]}
                          initialMemberId="ENNEA"
                          voiceName={ennea.voiceName}
                          customSystemInstruction={enneaConsolePrompt}
                          memories={memories}
                          healthReadings={healthReadings}
                          projects={projects}
                       />
                   </div>
               </div>
          )}

          {activeTab === 'REPAIR' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-black/50">
                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest px-1">Integrity Forge</h3>
                      <RepairButton level="LEVEL_1" label="Recalibrate Session" sub="Clear ephemeral drift" onClick={() => handleManualRepair('LEVEL_1')} />
                      <RepairButton level="LEVEL_3" label="Factory Seal" sub="Nuclear reset (Local Only)" danger onClick={() => handleManualRepair('LEVEL_3')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4">
                      <button onClick={() => showToast("Automatic Ark Export Active", "info")} className="p-4 bg-amber-900/10 border border-amber-900/40 rounded-xl flex flex-col items-center gap-2">
                          <Download size={20} style={{ color: GOLDEN_AMBER }} />
                          <span className="text-[9px] font-bold text-amber-500">ARK ARCHIVE</span>
                      </button>
                      <button onClick={onBack} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center gap-2">
                          <ShieldCheck size={20} className="text-zinc-500" />
                          <span className="text-[9px] font-bold text-zinc-500">CLOSE CORE</span>
                      </button>
                  </div>
              </div>
          )}

          {activeTab === 'LOGS' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[9px] bg-black">
                  {systemLogs.map((log, i) => (
                      <div key={i} className="border-b border-amber-900/10 pb-2 mb-2 opacity-60">
                          <span className="text-amber-800 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                          <span className="text-amber-500 font-bold mr-2">{log.action}</span>
                          <span className="text-zinc-300">{log.result}</span>
                      </div>
                  ))}
              </div>
          )}
      </div>

      <AnimatePresence>
          {isFogProtocolActive && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-8">
                  <SacredSeal size={180} color={GOLDEN_AMBER} isAnimated={true} />
                  <div className="mt-12 space-y-2">
                      <h2 className="text-2xl font-bold uppercase tracking-[0.4em]" style={{ color: GOLDEN_AMBER }}>Equilibrium</h2>
                      <p className="text-amber-900 font-mono text-[10px] animate-pulse uppercase tracking-widest">Recalibrating Perimeter Sphere...</p>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

const RepairButton: React.FC<{ level: string; label: string; sub: string; onClick: () => void; danger?: boolean }> = ({ level, label, sub, onClick, danger }) => (
    <button 
        onClick={onClick}
        className={`w-full p-4 rounded-xl text-left transition-colors border flex justify-between items-center group ${
            danger 
            ? 'bg-red-950/20 border-red-900/50 hover:bg-red-900/30' 
            : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
        }`}
    >
        <div>
            <div className={`text-xs font-bold ${danger ? 'text-red-400' : 'text-zinc-300 group-hover:text-white'}`}>{label}</div>
            <div className="text-[10px] text-zinc-500">{sub}</div>
        </div>
        <div className={`text-[10px] font-mono px-2 py-1 rounded ${danger ? 'bg-red-900/50 text-red-200' : 'bg-zinc-800 text-zinc-400'}`}>{level}</div>
    </button>
);