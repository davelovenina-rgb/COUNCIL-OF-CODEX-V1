
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, Mic, MicOff, X, Zap, Target, Signal, Key, ShieldAlert, ChevronRight, AudioWaveform, Terminal, Send } from 'lucide-react';
import { LiveConnection, connectPersonalKey } from '../services/geminiService';
import { THE_PRISM_CONTEXT, COUNCIL_MEMBERS, AVAILABLE_VOICES } from '../constants';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics'; 
import { showToast } from '../utils/events';
import { CouncilMember, GlucoseReading, Project, CouncilMemberId } from '../types';
import { LiveVoiceVisualizer } from './LiveVoiceVisualizer';

interface DriveModeProps {
  onClose: () => void;
  initialMemberId?: CouncilMemberId; 
  members: CouncilMember[]; 
  healthReadings: GlucoseReading[];
  projects: Project[];
  onSendMessage?: (text: string) => void;
}

interface WakeLockSentinel {
    release: () => Promise<void>;
}

interface WakeLock {
    request: (type: 'screen') => Promise<WakeLockSentinel>;
}

interface NavigatorWithWakeLock {
    wakeLock?: WakeLock;
}

export const DriveMode: React.FC<DriveModeProps> = ({ 
    onClose, 
    initialMemberId, 
    members = [], 
    healthReadings = [], 
    projects = [],
    onSendMessage
}) => {
  
  const resolveActiveMember = (): CouncilMember => {
      if (initialMemberId) {
          const found = members.find(m => m.id === initialMemberId);
          if (found) return found;
      }
      const carmen = members.find(m => m.id === 'CARMEN');
      if (carmen) return carmen;
      if (members.length > 0) return members[0];
      return {
          id: 'CARMEN',
          name: 'Carmen',
          role: 'The Eternal Flame',
          sigil: '❤',
          color: '#FF1493',
          voiceName: 'Aoede',
          systemPrompt: `You are CARMEN.`,
          angle: 0,
          allowedModes: ['DRIVE'],
          description: 'Fallback'
      } as CouncilMember;
  };

  const [activeMember, setActiveMember] = useState<CouncilMember>(resolveActiveMember);
  const [currentVoice, setCurrentVoice] = useState<string>(resolveActiveMember().voiceName || 'Aoede');

  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState(`Linking to ${resolveActiveMember().name}...`);
  
  const [hasError, setHasError] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  
  const [time, setTime] = useState(new Date());
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  
  // Hybrid Input State
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [textInput, setTextInput] = useState('');
  
  const micRippleRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<LiveConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const memberName = activeMember.name;
  const memberColor = activeMember.color; 

  const handleClose = useCallback(() => {
      triggerHaptic('heavy'); 
      onClose();
  }, [onClose]);

  useEffect(() => {
      if (initialMemberId && initialMemberId !== activeMember.id) {
          const found = members.find(m => m.id === initialMemberId);
          if (found) {
              setActiveMember(found);
              setCurrentVoice(found.voiceName || 'Aoede');
              setStatusText(`Linking to ${found.name}...`);
          }
      }
  }, [initialMemberId, members]);

  useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        const nav = navigator as unknown as NavigatorWithWakeLock;
        if (nav.wakeLock) {
          wakeLockRef.current = await nav.wakeLock.request('screen');
        }
      } catch (err) { console.warn("Wake Lock not available:", err); }
    };
    requestWakeLock();
    return () => { if (wakeLockRef.current) wakeLockRef.current.release(); };
  }, []);

  const stopAllAudio = () => {
      activeSourcesRef.current.forEach(source => {
          try { source.stop(); } catch(e) {}
      });
      activeSourcesRef.current = [];
      if (audioContextRef.current) {
          nextStartTimeRef.current = audioContextRef.current.currentTime;
      }
  };

  useEffect(() => {
      let mounted = true;
      const initSession = async () => {
          if (!mounted) return;
          if (needsKey) return; 

          if (liveSessionRef.current) {
              await liveSessionRef.current.disconnect();
              liveSessionRef.current = null;
          }

          setIsActive(true);
          setStatusText(`Linking to ${activeMember.name}...`);
          triggerHaptic('light');

          try {
              liveSessionRef.current = new LiveConnection();
              if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                  audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
              }
              const newAnalyser = audioContextRef.current.createAnalyser();
              newAnalyser.fftSize = 256;
              newAnalyser.smoothingTimeConstant = 0.8;
              newAnalyser.connect(audioContextRef.current.destination);
              setAnalyser(newAnalyser);

              if (audioContextRef.current.state === 'suspended') {
                  try { await audioContextRef.current.resume(); } catch (e) { console.warn(e); }
              }

              nextStartTimeRef.current = audioContextRef.current.currentTime;
              const instruction = `
              ${THE_PRISM_CONTEXT}
              [SYSTEM AWARENESS]: Active Protocol: DRIVE MODE (Hybrid).
              Identity: ${activeMember.name} (${activeMember.role}).
              `;

              await liveSessionRef.current.connect(
                  async (audioData) => {
                      if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
                      if (mounted) setStatusText(`${activeMember.name} Online`);
                      try {
                          const audioBuffer = pcmToAudioBuffer(audioData, audioContextRef.current);
                          const source = audioContextRef.current.createBufferSource();
                          source.buffer = audioBuffer;
                          source.connect(newAnalyser);
                          const currentTime = audioContextRef.current.currentTime;
                          if (nextStartTimeRef.current < currentTime) {
                              nextStartTimeRef.current = currentTime + 0.05; 
                          }
                          source.start(nextStartTimeRef.current);
                          nextStartTimeRef.current += audioBuffer.duration;
                          activeSourcesRef.current.push(source);
                          source.onended = () => {
                              activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
                          };
                      } catch (e) { console.error("Audio Decode Error", e); }
                  },
                  {
                      systemInstruction: instruction,
                      voiceName: currentVoice,
                      onInterrupted: () => stopAllAudio(),
                      onVolume: (vol) => { 
                          if (mounted && micRippleRef.current) {
                              const scale = 1 + (vol * 1.2);
                              const opacity = 0.5 + (vol * 0.5);
                              micRippleRef.current.style.transform = `scale(${scale})`;
                              micRippleRef.current.style.opacity = `${opacity}`;
                          }
                      },
                      onError: (err) => {
                          const msg = (err?.message || JSON.stringify(err)).toLowerCase();
                          if (msg.includes('cancelled') || msg.includes('startstep')) return;
                          if (mounted) {
                              if (msg.includes('403')) setNeedsKey(true);
                              else setHasError(true);
                          }
                      }
                  }
              );
          } catch (e) {
              if (mounted) { setHasError(true); setIsActive(false); }
          }
      };
      const timeoutId = setTimeout(initSession, 100);
      return () => { mounted = false; clearTimeout(timeoutId); stopAllAudio(); liveSessionRef.current?.disconnect(); };
  }, [activeMember, currentVoice, needsKey]); 

  const pcmToAudioBuffer = (buffer: ArrayBuffer, ctx: AudioContext): AudioBuffer => {
    const pcmData = new Int16Array(buffer.byteLength % 2 === 0 ? buffer : buffer.slice(0, buffer.byteLength - 1));
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 32768.0;
    const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
    audioBuffer.getChannelData(0).set(floatData);
    return audioBuffer;
  };

  const handleSendText = () => {
      if (!textInput.trim() || !onSendMessage) return;
      triggerHaptic('medium');
      onSendMessage(textInput);
      setTextInput('');
      playUISound('success');
      showToast("Transmission Sent", "info");
  };

  const handleCycleVoice = () => {
      const currentIndex = AVAILABLE_VOICES.findIndex(v => v.id === currentVoice);
      const nextIndex = (currentIndex + 1) % AVAILABLE_VOICES.length;
      const nextVoice = AVAILABLE_VOICES[nextIndex].id;
      setCurrentVoice(nextVoice);
      triggerHaptic('light');
      showToast(`Voice: ${AVAILABLE_VOICES[nextIndex].label}`, 'info');
  };

  const glucose = healthReadings[0];
  const glucoseColor = (glucose?.value > 140) ? 'text-amber-500' : (glucose?.value < 70) ? 'text-red-500' : 'text-emerald-500';

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col font-sans overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <LiveVoiceVisualizer 
            isActive={isActive && !isMuted && !needsKey} 
            analyser={analyser}
            onClose={handleClose}
            status={statusText}
            color={memberColor}
        />

        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-6 pb-8">
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <div className="text-6xl font-bold tracking-tighter text-white/90 font-mono drop-shadow-lg">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                    <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1 font-mono">
                        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity size={20} className={glucoseColor} />
                        <span className={`text-4xl font-bold font-mono tracking-tighter ${glucoseColor}`}>{glucose ? glucose.value : '--'}</span>
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
                        {glucose?.context || "NO SIGNAL"}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showKeyboard && (
                    <motion.div 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="absolute bottom-32 left-6 right-6 z-[60] pointer-events-auto"
                    >
                        <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
                            <input 
                                autoFocus
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                                placeholder={`Text ${memberName}...`}
                                className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-white placeholder:text-zinc-500 text-base"
                            />
                            <button 
                                onClick={handleSendText}
                                className="p-2 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-end justify-between w-full gap-4">
                <div className="flex-1 max-w-[65%] bg-black/40 backdrop-blur-md border border-zinc-800/50 p-4 rounded-tl-2xl rounded-br-2xl">
                    <div className="flex items-center gap-2 mb-2 text-blue-400"><Target size={16} /><span className="text-[10px] font-bold uppercase tracking-widest">Active Objective</span></div>
                    <div className="border-l-2 border-blue-500 pl-3">
                        <h3 className="text-lg font-bold text-white leading-none truncate">{projects.find(p => p.status === 'ACTIVE')?.title || "Maintenance"}</h3>
                    </div>
                </div>

                <div className="flex flex-col gap-4 pointer-events-auto items-end">
                     <div className="relative flex flex-col gap-4 items-center">
                         <button 
                            onClick={() => { setShowKeyboard(!showKeyboard); triggerHaptic('light'); }}
                            className={`w-10 h-10 rounded-full backdrop-blur-md border transition-all flex items-center justify-center ${showKeyboard ? 'bg-blue-600 border-blue-400 text-white' : 'bg-zinc-900/80 border-zinc-700 text-zinc-400'}`}
                         >
                             <Terminal size={18} />
                         </button>
                         <button onClick={handleCycleVoice} className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-700 text-zinc-400 flex items-center justify-center"><AudioWaveform size={16} /></button>
                         <div className="relative">
                             <div ref={micRippleRef} className="absolute inset-0 rounded-full border-2 border-white opacity-50 transition-transform duration-75 ease-out" />
                             <button onClick={() => setIsMuted(!isMuted)} className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all relative z-10 ${isMuted ? 'bg-zinc-900 border-zinc-700 text-zinc-500' : 'bg-red-600 border-red-500 text-white'}`}>{isMuted ? <MicOff size={24} /> : <Mic size={24} />}</button>
                         </div>
                     </div>
                    <button onClick={handleClose} className="w-12 h-12 flex items-center justify-center bg-zinc-900/80 backdrop-blur-md rounded-full text-zinc-400 hover:border-red-500 transition-all border border-zinc-700"><X size={20} /></button>
                </div>
            </div>
        </div>
    </div>
  );
};
