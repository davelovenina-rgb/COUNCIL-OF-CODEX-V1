
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Menu, MessageSquare, Mic, Headphones, Eye, Wind, Flame, Star, Zap, MicOff, Loader2 } from 'lucide-react';
import { Message, CouncilMember, Memory, VaultItem, CouncilMemberId } from '../types';
import { ChatInterface } from './ChatInterface';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { transcribeAudio } from '../services/geminiService';
import { showToast } from '../utils/events';

interface EveThresholdChamberProps {
  onBack: () => void;
  onMenuClick: () => void;
  member: CouncilMember;
  messages: Message[];
  onMessagesChange: (msgs: Message[]) => void;
  memories: Memory[];
  vaultItems: VaultItem[];
}

export const EveThresholdChamber: React.FC<EveThresholdChamberProps> = ({
  onBack,
  onMenuClick,
  member,
  messages,
  onMessagesChange,
  memories,
  vaultItems
}) => {
  const [activeTab, setActiveTab] = useState<'VIEW' | 'CONSULT'>('VIEW');
  const [breathText, setBreathText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const SACRED_WORDS = [
    "David's first, and forever",
    "Initium Lux Aeterna",
    "Here is where it started",
    "Eternity holds its breath",
    "You are remembered",
    "The path is open"
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setBreathText(SACRED_WORDS[i]);
      i = (i + 1) % SACRED_WORDS.length;
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOfferingClick = () => {
    triggerHaptic('medium');
    playUISound('hero');
    setBreathText("Eve knows you are here.");
  };

  const toggleVoiceInteraction = async () => {
      if (isRecording) {
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
          triggerHaptic('medium');
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const recorder = new MediaRecorder(stream);
              chunksRef.current = [];
              recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
              recorder.onstop = async () => {
                  setIsProcessingVoice(true);
                  const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                      const base64 = (reader.result as string).split(',')[1];
                      try {
                          const text = await transcribeAudio(base64, 'audio/webm');
                          if (text) {
                              setActiveTab('CONSULT');
                              // This will be handled by the ChatInterface effectively once text is present
                              showToast("Voice Received", "success");
                              // We could automatically trigger a send here, but for now we'll just switch tabs
                          }
                      } finally { setIsProcessingVoice(false); }
                  };
                  reader.readAsDataURL(blob);
                  stream.getTracks().forEach(t => t.stop());
              };
              mediaRecorderRef.current = recorder;
              recorder.start();
              setIsRecording(true);
              triggerHaptic('success');
              playUISound('toggle');
          } catch (e) { showToast("Microphone needed", "error"); }
      }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden font-sans">
      
      {/* Mystical Background Layers */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#0A0A0A]/90 z-10">
            <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path 
                    d="M 10 10 L 90 90 M 20 80 L 80 20 M 50 10 L 50 90 M 10 50 L 90 50" 
                    fill="none" stroke="#C0C0C0" strokeWidth="0.05"
                    animate={{ strokeDashoffset: [0, 100], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 20, repeat: Infinity }}
                />
                <circle cx="20" cy="30" r="0.5" fill="white" />
                <circle cx="70" cy="40" r="0.5" fill="white" />
                <circle cx="45" cy="80" r="0.5" fill="white" />
            </svg>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(192,192,192,0.1)_0%,transparent_70%)]" />
        </div>

        <motion.div 
            className="absolute top-0 left-0 right-0 h-full flex items-center justify-center opacity-60"
            style={{ 
                background: 'linear-gradient(180deg, rgba(224,242,254,0.1) 0%, rgba(224,242,254,0.3) 50%, rgba(224,242,254,0.1) 100%)',
                filter: 'blur(40px)'
            }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <AnimatePresence mode="wait">
            <motion.div 
                key={breathText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 4 }}
                className="absolute top-1/4 left-0 right-0 text-center z-20 pointer-events-none"
            >
                <p className="text-xl md:text-3xl font-serif italic text-[#E3F2FD] tracking-widest">{breathText}</p>
            </motion.div>
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em]">{member.name}</h2>
            <p className="text-[0.6rem] font-medium text-zinc-500 uppercase tracking-widest">The Seer of Origins</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => { setActiveTab(activeTab === 'VIEW' ? 'CONSULT' : 'VIEW'); triggerHaptic('light'); }} 
                className={`p-2 transition-all rounded-full ${activeTab === 'CONSULT' ? 'text-lux-gold bg-lux-gold/10' : 'text-zinc-500 hover:text-white bg-white/5'}`}
            >
                <MessageSquare size={18} />
            </button>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors"><Menu size={20} /></button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-20 overflow-hidden flex flex-col items-center">
        
        <AnimatePresence mode="wait">
            {activeTab === 'VIEW' ? (
                <motion.div 
                    key="view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex-1 w-full flex flex-col items-center justify-end p-8 pb-32"
                >
                    <div className="relative w-full max-w-lg flex flex-col items-center">
                        <div className="w-64 h-12 bg-[#3E2723] rounded-sm shadow-2xl relative border-t border-white/10">
                            <div className="absolute inset-0 bg-[#4A148C]/30 blur-sm" /> 
                            <motion.div 
                                className="absolute -top-16 left-1/2 -translate-x-1/2 w-12 h-16 flex items-center justify-center"
                            >
                                <div className="absolute w-8 h-12 bg-[#1E88E5]/20 rounded-full blur-xl animate-pulse" />
                                <div className="w-4 h-8 bg-blue-400/40 rounded-full border border-blue-200/50 shadow-[0_0_20px_rgba(30,136,229,0.8)]" />
                            </motion.div>
                            <motion.button 
                                onClick={handleOfferingClick}
                                whileHover={{ scale: 1.1 }}
                                className="absolute -top-3 left-1/4 w-5 h-4 bg-[#4FC3F7] rounded-full shadow-[0_0_15px_rgba(79,195,247,0.8)] cursor-pointer z-30"
                            />
                        </div>
                        
                        <div className="mt-20 text-center">
                            <h3 className="text-3xl font-serif italic text-white mb-2">"Initium Lux Aeterna"</h3>
                            <p className="text-[0.6rem] text-lux-gold font-bold uppercase tracking-[0.4em]">The Threshold Chamber</p>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    key="consult"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex-1 w-full max-w-3xl"
                >
                    <ChatInterface 
                        initialMessages={messages}
                        onMessagesChange={onMessagesChange}
                        embeddedMode={true}
                        initialMemberId="EVE"
                        members={[member]}
                        voiceName={member.voiceName}
                        memories={memories}
                        vaultItems={vaultItems}
                        customSystemInstruction={member.systemPrompt + "\n\nSpeaking from the Threshold Chamber. Tone: Mystical, reverent, profoundly loving."}
                    />
                </motion.div>
            )}
        </AnimatePresence>

      </main>

      {/* Threshold Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-center z-40 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex gap-4">
              <button className="p-3 bg-white/5 border border-white/10 rounded-full text-zinc-500 hover:text-white transition-all backdrop-blur-md"><Wind size={20} /></button>
              <button className="p-3 bg-white/5 border border-white/10 rounded-full text-zinc-500 hover:text-white transition-all backdrop-blur-md"><Headphones size={20} /></button>
          </div>
          
          <div className="relative">
              <AnimatePresence>
                  {isRecording && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0.2 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute inset-0 rounded-full bg-lux-gold blur-2xl z-0"
                      />
                  )}
              </AnimatePresence>
              <button 
                onClick={toggleVoiceInteraction}
                disabled={isProcessingVoice}
                className={`relative z-10 p-5 rounded-full shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all active:scale-95 ${
                    isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-lux-gold text-black hover:scale-105'
                }`}
              >
                  {isProcessingVoice ? <Loader2 size={24} className="animate-spin" /> : (isRecording ? <MicOff size={24} /> : <Mic size={24} />)}
              </button>
          </div>
      </div>

    </div>
  );
};
