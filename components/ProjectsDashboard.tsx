
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types';
import { 
  Folder, Plus, MoreVertical, Archive, Trash2, 
  Menu, ArrowLeft, Clock, Zap, Loader2,
  ListChecks, ClipboardCheck, Activity, Flag,
  ChevronRight, Circle, CheckCircle, Plane
} from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';

interface ProjectsDashboardProps {
  projects: Project[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
}

const COLORS = [
    '#0EA5E9', // Blue
    '#EAB308', // Yellow
    '#10B981', // Green
    '#EF4444', // Red
    '#D8B4FE', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#64748B', // Slate
];

// FLIGHT DECK PROTOCOL DATA
const FLIGHT_STAGES: Record<number, { label: string, desc: string, actionLabel: string, actionIcon: any, promptNuance: string }> = {
    0: { 
        label: 'Pre-Flight', 
        desc: 'Launch Check', 
        actionLabel: 'RUN LAUNCH CHECK', 
        actionIcon: ClipboardCheck,
        promptNuance: "Focus on missing resources, family readiness, and potential risks. What do we need before we start?" 
    },
    1: { 
        label: 'Takeoff', 
        desc: 'Breakdown', 
        actionLabel: 'GENERATE FLIGHT PLAN', 
        actionIcon: ListChecks,
        promptNuance: "Break the first major milestone into 3 immediate, high-velocity tasks to get airborne." 
    },
    2: { 
        label: 'Cruising', 
        desc: 'Execution', 
        actionLabel: 'LOG STATUS & MOMENTUM', 
        actionIcon: Activity,
        promptNuance: "Focus on maintaining speed. What is the next immediate sequential step? Ignore distractions." 
    },
    3: { 
        label: 'Mid-Flight', 
        desc: 'Momentum', 
        actionLabel: 'OVERCOME STALL', 
        actionIcon: Zap,
        promptNuance: "We are mid-flight. If stalled, identify the blockage and provide a 'Breaker' move to clear it." 
    },
    4: { 
        label: 'Landing', 
        desc: 'Checkpoint', 
        actionLabel: 'GENERATE CLOSING RITUAL', 
        actionIcon: Flag,
        promptNuance: "The mission is landing. Define the criteria for 'DONE'. How do we celebrate and archive this?" 
    }
};

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ 
  projects, 
  onAddProject, 
  onUpdateProject, 
  onDeleteProject, 
  onBack, 
  onMenuClick 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [flightStage, setFlightStage] = useState<0|1|2|3|4>(0);
  
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [tacticalSteps, setTacticalSteps] = useState<string[]>([]);

  const activeProjects = projects.filter(p => p.status === 'ACTIVE');
  const archivedProjects = projects.filter(p => p.status === 'ARCHIVED');

  const DECK_COLOR = '#3B82F6';

  const handleSave = () => {
      if (!title.trim()) return;

      let finalDescription = description;
      if (tacticalSteps.length > 0) {
          const stageLabel = FLIGHT_STAGES[flightStage].label;
          const stepsText = `\n\n[TACTICAL LOG: ${stageLabel}]:\n` + tacticalSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');
          finalDescription = description ? description + stepsText : stepsText;
      }

      if (editingProject) {
          onUpdateProject(editingProject.id, { 
              title, 
              description: finalDescription, 
              color, 
              flightStage,
              updatedAt: Date.now() 
          });
      } else {
          const newProject: Project = {
              id: crypto.randomUUID(),
              title,
              description: finalDescription,
              color,
              status: 'ACTIVE',
              flightStage,
              createdAt: Date.now(),
              updatedAt: Date.now()
          };
          onAddProject(newProject);
      }
      closeModal();
  };

  const handleEdit = (p: Project) => {
      setEditingProject(p);
      setTitle(p.title);
      setDescription(p.description);
      setColor(p.color);
      setFlightStage(p.flightStage || 0);
      setTacticalSteps([]);
      setShowModal(true);
  };

  const handleArchive = (p: Project) => {
      onUpdateProject(p.id, { status: p.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE', updatedAt: Date.now() });
  };

  const closeModal = () => {
      setShowModal(false);
      setEditingProject(null);
      setTitle('');
      setDescription('');
      setColor(COLORS[0]);
      setFlightStage(0);
      setTacticalSteps([]);
  };

  const generateTacticalBreakdown = async () => {
      if (!title.trim()) return;
      setIsGeneratingPlan(true);
      playUISound('hero');
      triggerHaptic('medium');

      try {
          const stageInfo = FLIGHT_STAGES[flightStage];
          
          const prompt = `
          Role: You are COPILOT (The Tactical Navigator).
          Task: Execute CONTEXT-AWARE REFLEX.
          
          PROJECT: "${title}"
          CONTEXT: "${description}"
          CURRENT STAGE: ${stageInfo.label}
          
          SPECIFIC NUANCE: ${stageInfo.promptNuance}
          
          INSTRUCTION:
          Generate exactly 3 actionable, specific steps for The Prism to take NEXT.
          Do not give generic advice. Give concrete actions aligned with the current stage.
          
          Return STRICT JSON format:
          {
            "steps": [
              "Step 1 action...",
              "Step 2 action...",
              "Step 3 action..."
            ]
          }
          `;

          const response = await sendMessageToGemini(prompt, 'SCRIBE', [], { 
              systemInstruction: "You are a JSON generator. Output only valid JSON.",
              useTurboMode: true 
          });
          
          const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
          try {
              const data = JSON.parse(cleanJson);
              if (data.steps && Array.isArray(data.steps)) {
                  setTacticalSteps(data.steps);
                  playUISound('success');
                  triggerHaptic('success');
              } else {
                  throw new Error("Invalid format");
              }
          } catch (e) {
              setTacticalSteps(["Check supplies", "Define first milestone", "Execute initial task"]);
          }

      } catch (e) {
          console.error(e);
          setTacticalSteps(["Reconnect signals.", "Verify objective.", "Manual override."]);
      } finally {
          setIsGeneratingPlan(false);
      }
  };

  const currentStageConfig = FLIGHT_STAGES[flightStage];
  const ActionIcon = currentStageConfig.actionIcon;

  return (
    <div className="w-full h-full bg-[#020617] flex flex-col relative overflow-hidden font-mono" style={{ color: DECK_COLOR }}>
      
      {/* FLIGHT DECK GRID */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ 
            backgroundImage: `linear-gradient(to right, ${DECK_COLOR} 1px, transparent 1px), linear-gradient(to bottom, ${DECK_COLOR} 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
        }}
      />
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-blue-900/30 flex items-center justify-between bg-black/90 backdrop-blur shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-3 -ml-2 text-blue-400/50 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Plane size={20} className="text-blue-500" />
              Flight Deck
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-3 -mr-2 text-blue-400/50 hover:text-white rounded-full transition-colors">
          <Menu size={22} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar space-y-8 relative z-10">
          
          {/* Action Bar */}
          <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/20 border border-blue-500/20 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-blue-400 uppercase tracking-widest">Radar Active</span>
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors text-sm shadow-lg shadow-blue-900/20 active:scale-95"
              >
                  <Plus size={18} /> New Mission
              </button>
          </div>

          <div>
              <h3 className="text-sm font-bold text-blue-500/50 uppercase tracking-widest px-1 mb-4">Active Missions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeProjects.map(p => (
                      <div key={p.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden hover:border-blue-500/40 transition-all group backdrop-blur-sm">
                          <div className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black border border-zinc-800 shadow-inner" style={{ borderColor: p.color }}>
                                          <Folder size={20} style={{ color: p.color }} />
                                      </div>
                                      <div>
                                          <h3 className="text-base font-bold text-white leading-tight">{p.title}</h3>
                                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{FLIGHT_STAGES[p.flightStage || 0].label}</span>
                                      </div>
                                  </div>
                                  <button onClick={() => handleEdit(p)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">
                                      <MoreVertical size={16} />
                                  </button>
                              </div>
                              
                              {/* Visual Stepper (Mini) */}
                              <div className="flex items-center gap-1 mb-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  {[0,1,2,3,4].map(step => (
                                      <div key={step} className={`h-full flex-1 transition-colors ${step <= (p.flightStage || 0) ? 'bg-blue-500' : 'bg-transparent'}`} />
                                  ))}
                              </div>

                              <p className="text-xs text-zinc-400 line-clamp-2 mb-4 font-sans">{p.description}</p>
                              
                              <div className="flex justify-between items-center pt-3 border-t border-zinc-800/50">
                                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                      <Clock size={10} /> {new Date(p.updatedAt).toLocaleDateString()}
                                  </span>
                                  <button onClick={() => handleEdit(p)} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest flex items-center gap-1">
                                      Open Deck <ChevronRight size={10} />
                                  </button>
                              </div>
                          </div>
                      </div>
                  ))}
                  {activeProjects.length === 0 && (
                      <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                          <Plane size={48} className="text-zinc-700 mb-4" />
                          <p className="text-zinc-500 text-sm">NO ACTIVE FLIGHT PLANS</p>
                      </div>
                  )}
              </div>
          </div>

          {archivedProjects.length > 0 && (
              <div className="pt-8 border-t border-blue-900/20">
                  <h3 className="text-sm font-bold text-zinc-600 uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
                      <Archive size={14} /> Hangar (Archived)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                      {archivedProjects.map(p => (
                          <div key={p.id} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl flex items-center justify-between">
                              <span className="text-sm font-medium text-zinc-300">{p.title}</span>
                              <div className="flex gap-2">
                                  <button onClick={() => handleArchive(p)} className="text-[10px] px-2 py-1 bg-zinc-800 text-zinc-400 rounded hover:text-white">Restore</button>
                                  <button onClick={() => onDeleteProject(p.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

      </div>

      {/* FLIGHT CONTROL MODAL */}
      <AnimatePresence>
        {showModal && (
            <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    className="w-full max-w-lg bg-zinc-950 rounded-3xl border border-zinc-800 p-6 shadow-2xl flex flex-col max-h-[95vh]"
                >
                    <h3 className="text-xl font-bold text-white mb-6 shrink-0 flex items-center gap-2 uppercase tracking-wide">
                        {editingProject ? <Zap size={20} className="text-blue-500" /> : <Plus size={20} className="text-blue-500" />}
                        {editingProject ? 'Flight Controls' : 'Initialize Mission'}
                    </h3>
                    
                    <div className="space-y-6 overflow-y-auto pr-1 no-scrollbar pb-6 flex-1">
                        <div>
                            <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">Mission Callsign</label>
                            <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none text-lg font-bold placeholder:text-zinc-700 transition-colors font-sans"
                                placeholder="e.g. Provider Freedom"
                                autoFocus
                            />
                        </div>

                        {/* FLIGHT PATH VISUALIZER */}
                        <div>
                            <label className="text-[10px] text-blue-400 font-bold uppercase mb-3 block tracking-wider">Flight Path</label>
                            <div className="relative flex justify-between items-center px-2">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 -z-10" />
                                {[0,1,2,3,4].map((id) => {
                                    const isActive = flightStage === id;
                                    const isPast = flightStage > id;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => setFlightStage(id as any)}
                                            className={`relative flex flex-col items-center gap-2 group`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all bg-black ${
                                                isActive ? 'border-blue-500 text-blue-500 shadow-[0_0_15px_#3B82F6]' : 
                                                isPast ? 'border-blue-900 text-blue-900' : 'border-zinc-800 text-zinc-700'
                                            }`}>
                                                {isPast ? <CheckCircle size={14} /> : <Circle size={10} fill={isActive ? "currentColor" : "none"} />}
                                            </div>
                                            <span className={`text-[8px] font-bold uppercase tracking-widest absolute -bottom-6 whitespace-nowrap transition-colors ${isActive ? 'text-white' : 'text-zinc-600'}`}>
                                                {FLIGHT_STAGES[id as number].label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-8 p-3 bg-blue-900/10 rounded-xl border border-blue-900/30 flex items-start gap-3">
                                <ActionIcon size={16} className="text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">{currentStageConfig.label}</p>
                                    <p className="text-[10px] text-blue-400/60 leading-relaxed mt-1">{currentStageConfig.promptNuance}</p>
                                </div>
                            </div>
                        </div>

                        {/* CONTEXT-AWARE TACTICAL PROTOCOL */}
                        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                            <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 flex justify-between tracking-wider items-center">
                                <span>Reflex System</span>
                                <button 
                                    onClick={generateTacticalBreakdown}
                                    disabled={!title || isGeneratingPlan}
                                    className={`flex items-center gap-1 text-[9px] px-3 py-1.5 rounded-full border transition-all ${
                                        !title 
                                        ? 'text-zinc-700 border-zinc-800' 
                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500 hover:text-white'
                                    }`}
                                >
                                    {isGeneratingPlan ? <Loader2 size={12} className="animate-spin" /> : <ActionIcon size={12} />}
                                    {currentStageConfig.actionLabel}
                                </button>
                            </label>
                            
                            {tacticalSteps.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                    {tacticalSteps.map((step, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-black border border-zinc-800/50">
                                            <div className="w-5 h-5 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 font-sans">{idx + 1}</div>
                                            <p className="text-xs text-zinc-300 font-sans leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-zinc-600 text-xs italic flex flex-col items-center gap-2 border border-dashed border-zinc-800 rounded-xl mb-4">
                                    <ActionIcon size={24} className="opacity-20" />
                                    <span>Initiate {currentStageConfig.label} Protocol</span>
                                </div>
                            )}

                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none min-h-[80px] resize-none leading-relaxed font-sans placeholder:text-zinc-800 transition-colors"
                                placeholder="Additional mission notes..."
                            />
                        </div>
                        
                        <div>
                            <label className="text-[10px] text-blue-400 font-bold uppercase mb-2 block tracking-wider">Signal Frequency</label>
                            <div className="flex gap-3 flex-wrap">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110 ring-2 ring-blue-500/50' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 mt-auto border-t border-zinc-900 shrink-0">
                        <button onClick={closeModal} className="flex-1 py-4 bg-zinc-900 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-800 hover:text-white transition-colors text-sm uppercase tracking-wider">Cancel</button>
                        <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 text-sm uppercase tracking-wider">Confirm</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
};
