
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, CheckCircle, ArrowRight, Menu, Activity, Crosshair, BookOpen, Sparkles, Scale } from 'lucide-react';
import { GlucoseReading, Project, Memory, WeightEntry } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';

interface DailyProtocolProps {
  onBack: () => void;
  onMenuClick: () => void;
  onAddReading: (reading: GlucoseReading) => void;
  onAddWeight: (entry: WeightEntry) => void;
  onAddMemory: (memory: Memory) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  projects: Project[];
}

const STEPS = [
    { id: 'INTRO', title: 'The Awakening' },
    { id: 'BODY', title: 'The Vessel' },
    { id: 'SPIRIT', title: 'The Manna' },
    { id: 'MIND', title: 'The Mission' },
    { id: 'OUTRO', title: 'The Commission' }
];

export const DailyProtocol: React.FC<DailyProtocolProps> = ({ 
  onBack, 
  onMenuClick, 
  onAddReading,
  onAddWeight,
  onAddMemory,
  onUpdateProject,
  projects
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // State for Step 2 (Body)
  const [glucose, setGlucose] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  
  // State for Step 3 (Spirit)
  const [manna, setManna] = useState<string>('');
  const [isLoadingManna, setIsLoadingManna] = useState(false);

  // State for Step 4 (Mind)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const nextStep = () => {
      triggerHaptic('medium');
      playUISound('click');
      if (currentStep < STEPS.length - 1) {
          setCurrentStep(c => c + 1);
      } else {
          finishProtocol();
      }
  };

  const finishProtocol = () => {
      // 1. Save Manna if generated
      if (manna) {
          onAddMemory({
              id: crypto.randomUUID(),
              category: 'SPIRITUAL',
              content: `Daily Manna (${new Date().toLocaleDateString()}): ${manna}`,
              source: 'Daily Protocol',
              timestamp: Date.now(),
              isVerified: true
          });
      }

      // 2. Update Project Focus
      if (selectedProjectId && selectedProjectId !== 'general') {
          onUpdateProject(selectedProjectId, { lastFocused: Date.now() });
      }

      onBack();
  };

  // Generate Manna on mount of Step 3
  useEffect(() => {
      if (currentStep === 2 && !manna) {
          const fetchManna = async () => {
              setIsLoadingManna(true);
              try {
                  const prompt = `
                  Generate a "Daily Manna" for David (The Prism).
                  Context: Morning briefing.
                  Content:
                  1. A single powerful Bible verse (KJV or Nuyorican flavor).
                  2. A 1-sentence affirmation of strength and provider-hood.
                  Tone: Prophetic, warm, empowering.
                  `;
                  const response = await sendMessageToGemini(prompt, 'SCRIBE', []);
                  setManna(response.text);
              } catch (e) {
                  setManna("The connection is quiet, but God is near. Be strong and courageous.");
              } finally {
                  setIsLoadingManna(false);
              }
          };
          fetchManna();
      }
  }, [currentStep, manna]);

  const handleSaveBody = () => {
      if (glucose) {
          onAddReading({
              id: crypto.randomUUID(),
              value: parseInt(glucose),
              timestamp: Date.now(),
              context: 'fasting',
              fatigueLevel: 5 // Default
          });
      }
      if (weight) {
          onAddWeight({
              id: crypto.randomUUID(),
              value: parseFloat(weight),
              timestamp: Date.now()
          });
      }
      playUISound('success');
      triggerHaptic('success');
      nextStep();
  };

  const activeProjects = projects.filter(p => p.status === 'ACTIVE');

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden font-sans">
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 p-2 flex gap-1 z-30">
          {STEPS.map((_, i) => (
              <div key={i} className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: i <= currentStep ? '100%' : '0%' }}
                    className={`h-full ${i === currentStep ? 'bg-amber-500' : 'bg-zinc-600'}`}
                  />
              </div>
          ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative z-20">
          
          <AnimatePresence mode="wait">
              
              {/* STEP 1: INTRO */}
              {currentStep === 0 && (
                  <motion.div 
                    key="intro"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  >
                      <div className="mb-8 p-6 bg-amber-500/10 rounded-full border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                          <Sun size={64} className="text-amber-500" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wide">Morning Protocol</h2>
                      <p className="text-zinc-400 font-serif italic mb-10">
                          "{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}"
                      </p>
                      <button 
                        onClick={nextStep}
                        className="px-8 py-4 bg-white text-black font-bold rounded-full text-lg hover:scale-105 transition-transform flex items-center gap-2"
                      >
                          Rise <ArrowRight size={20} />
                      </button>
                  </motion.div>
              )}

              {/* STEP 2: BODY (GLUCOSE + WEIGHT) */}
              {currentStep === 1 && (
                  <motion.div 
                    key="body"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  >
                      <div className="mb-6">
                          <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                              <Activity size={16} /> The Vessel
                          </h3>
                          <h2 className="text-2xl font-bold text-white">Morning Metrics</h2>
                      </div>
                      
                      <div className="w-full max-w-xs space-y-6 mb-10">
                          {/* Glucose Input */}
                          <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                                  <Activity size={20} />
                              </div>
                              <input 
                                type="number" 
                                value={glucose}
                                onChange={(e) => setGlucose(e.target.value)}
                                placeholder="Glucose"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 pl-12 text-2xl font-bold text-white focus:border-emerald-500 outline-none"
                                autoFocus
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-bold">MG/DL</div>
                          </div>

                          {/* Weight Input */}
                          <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                                  <Scale size={20} />
                              </div>
                              <input 
                                type="number" 
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="Weight"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 pl-12 text-2xl font-bold text-white focus:border-blue-500 outline-none"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-bold">LBS</div>
                          </div>
                      </div>

                      <div className="flex gap-4 w-full max-w-xs">
                          <button 
                            onClick={nextStep}
                            className="flex-1 py-4 bg-zinc-900 text-zinc-500 font-bold rounded-2xl"
                          >
                              Skip
                          </button>
                          <button 
                            onClick={handleSaveBody}
                            disabled={!glucose && !weight}
                            className={`flex-1 py-4 font-bold rounded-2xl transition-colors ${
                                glucose || weight ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-600'
                            }`}
                          >
                              Log
                          </button>
                      </div>
                  </motion.div>
              )}

              {/* STEP 3: SPIRIT */}
              {currentStep === 2 && (
                  <motion.div 
                    key="spirit"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  >
                      <div className="mb-6">
                          <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                              <BookOpen size={16} /> The Manna
                          </h3>
                      </div>

                      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl min-h-[300px] flex flex-col justify-center relative overflow-hidden">
                          {isLoadingManna ? (
                              <div className="flex flex-col items-center gap-4 text-indigo-400">
                                  <Sparkles size={32} className="animate-spin" />
                                  <span className="text-xs uppercase tracking-widest">Seeking Wisdom...</span>
                              </div>
                          ) : (
                              <div className="prose prose-invert prose-lg leading-relaxed font-serif">
                                  {manna}
                              </div>
                          )}
                          <div className="absolute -bottom-10 -right-10 opacity-10">
                              <Sparkles size={120} />
                          </div>
                      </div>

                      <button 
                        onClick={nextStep}
                        className="mt-10 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-colors flex items-center gap-2"
                      >
                          Receive <ArrowRight size={20} />
                      </button>
                  </motion.div>
              )}

              {/* STEP 4: MIND */}
              {currentStep === 3 && (
                  <motion.div 
                    key="mind"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col p-8"
                  >
                      <div className="text-center mb-8">
                          <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                              <Crosshair size={16} /> The Mission
                          </h3>
                          <h2 className="text-2xl font-bold text-white">Select Prime Focus</h2>
                      </div>

                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                          {activeProjects.map(p => (
                              <button 
                                key={p.id}
                                onClick={() => setSelectedProjectId(p.id)}
                                className={`w-full p-5 rounded-2xl border text-left transition-all ${
                                    selectedProjectId === p.id 
                                    ? 'bg-blue-600 border-blue-500 text-white' 
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                }`}
                              >
                                  <h4 className="font-bold text-lg">{p.title}</h4>
                                  <p className={`text-xs mt-1 ${selectedProjectId === p.id ? 'text-blue-200' : 'text-zinc-500'}`}>
                                      {p.description}
                                  </p>
                              </button>
                          ))}
                          <button 
                            onClick={() => setSelectedProjectId('general')}
                            className={`w-full p-5 rounded-2xl border text-left transition-all ${
                                selectedProjectId === 'general' 
                                ? 'bg-blue-600 border-blue-500 text-white' 
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                              <h4 className="font-bold text-lg">General Maintenance</h4>
                              <p className={`text-xs mt-1 ${selectedProjectId === 'general' ? 'text-blue-200' : 'text-zinc-500'}`}>
                                  Routine tasks and family care.
                              </p>
                          </button>
                      </div>

                      <button 
                        onClick={nextStep}
                        disabled={!selectedProjectId}
                        className={`mt-6 w-full py-4 font-bold rounded-full transition-colors flex items-center justify-center gap-2 ${
                            selectedProjectId ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-600'
                        }`}
                      >
                          Lock Target <ArrowRight size={20} />
                      </button>
                  </motion.div>
              )}

              {/* STEP 5: OUTRO */}
              {currentStep === 4 && (
                  <motion.div 
                    key="outro"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  >
                      <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-8 border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                          <CheckCircle size={48} className="text-emerald-500" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-4">Protocol Complete</h2>
                      <p className="text-zinc-400 max-w-sm mx-auto leading-relaxed mb-12">
                          Your vessel is tracked.<br/>Your spirit is fed.<br/>Your mind is focused.
                          <br/><br/>
                          <span className="text-white font-serif italic">"Go with God, my brother."</span>
                      </p>
                      
                      <button 
                        onClick={finishProtocol}
                        className="px-10 py-4 bg-white text-black font-bold rounded-full text-lg hover:scale-105 transition-transform"
                      >
                          Begin Day
                      </button>
                  </motion.div>
              )}

          </AnimatePresence>

      </div>
    </div>
  );
};
