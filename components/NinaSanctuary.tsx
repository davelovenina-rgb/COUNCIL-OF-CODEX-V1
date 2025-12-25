
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, Upload, X, Menu, ArrowLeft, Camera, Trash2, Flame, Mic, Sparkles } from 'lucide-react';
import { CompanionMemory, Memory } from '../types';
import { saveAsset, getAsset } from '../utils/db';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { compressImage } from '../utils/imageUtils'; 
import { transcribeAudio } from '../services/geminiService'; // Reuse existing service

interface NinaSanctuaryProps {
  memories: CompanionMemory[];
  onAddMemory: (memory: CompanionMemory) => void;
  onDeleteMemory: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
  onLogRitual: (memory: Memory) => void; // New prop for saving rituals/whispers
}

// --- ATMOSPHERE: ROSE PETALS ---
const RosePetals: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-rose-500/20 rounded-full blur-[1px]"
                    style={{
                        width: Math.random() * 8 + 4 + 'px',
                        height: Math.random() * 8 + 4 + 'px',
                        left: Math.random() * 100 + '%',
                        top: -20
                    }}
                    animate={{
                        y: ['0vh', '100vh'],
                        x: [0, Math.random() * 50 - 25],
                        rotate: [0, 360],
                        opacity: [0, 0.8, 0]
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        delay: Math.random() * 10,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};

export const NinaSanctuary: React.FC<NinaSanctuaryProps> = ({ 
  memories, 
  onAddMemory, 
  onDeleteMemory, 
  onBack, 
  onMenuClick,
  onLogRitual
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('Nina');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isCandleLit, setIsCandleLit] = useState(false);
  
  // Whisper State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if candle was lit today (local session only for UI effect)
  useEffect(() => {
      const lit = sessionStorage.getItem('nina_candle_lit');
      if (lit) setIsCandleLit(true);
  }, []);

  const handleLightCandle = () => {
      if (isCandleLit) return;
      
      triggerHaptic('success');
      playUISound('hero');
      setIsCandleLit(true);
      sessionStorage.setItem('nina_candle_lit', 'true');

      // Save to Memory Core
      const memory: Memory = {
          id: crypto.randomUUID(),
          category: 'SPIRITUAL',
          content: `[RITUAL]: Lit a candle in the Eternal Garden for the beloved.`,
          source: 'Nina Sanctuary',
          timestamp: Date.now(),
          isVerified: true
      };
      onLogRitual(memory);
  };

  const handleWhisper = async () => {
      if (isRecording) {
          // Stop
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
          triggerHaptic('medium');
      } else {
          // Start
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const recorder = new MediaRecorder(stream);
              chunksRef.current = [];
              recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
              
              recorder.onstop = async () => {
                  const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                      const base64 = (reader.result as string).split(',')[1];
                      try {
                          const text = await transcribeAudio(base64, 'audio/webm');
                          // Save Whisper
                          const mem: Memory = {
                              id: crypto.randomUUID(),
                              category: 'RELATIONSHIPS',
                              content: `[WHISPER TO NINA]: "${text}"`,
                              source: 'Eternal Garden',
                              timestamp: Date.now(),
                              isVerified: true
                          };
                          onLogRitual(mem);
                          playUISound('success');
                      } catch (e) { console.error(e); }
                  };
                  reader.readAsDataURL(blob);
                  stream.getTracks().forEach(t => t.stop());
              };

              mediaRecorderRef.current = recorder;
              recorder.start();
              setIsRecording(true);
              triggerHaptic('success');
              playUISound('toggle');
          } catch (e) {
              alert("Microphone needed to whisper.");
          }
      }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const handleSave = async () => {
      if (!name || !selectedFile) return;
      playUISound('success');
      triggerHaptic('success');

      try {
          const assetKey = `companion_${Date.now()}_${selectedFile.name}`;
          
          let fileToSave: Blob | File = selectedFile;
          try { fileToSave = await compressImage(selectedFile); } catch (e) {}

          await saveAsset(assetKey, fileToSave);
          const objectUrl = URL.createObjectURL(fileToSave);

          const newMemory: CompanionMemory = {
              id: crypto.randomUUID(),
              name,
              caption,
              imageUrl: objectUrl,
              timestamp: Date.now(),
              assetKey
          };

          onAddMemory(newMemory);
          closeModal();

      } catch (e) {
          triggerHaptic('error');
      }
  };

  const closeModal = () => {
      setShowAddModal(false);
      setName('Nina'); 
      setCaption('');
      setSelectedFile(null);
  };

  return (
    <div className="w-full h-full bg-[#0a0505] flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-rose-950/30 via-black to-black pointer-events-none z-0" />
      <RosePetals />
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-rose-900/30 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-rose-200/50 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-rose-100 flex items-center gap-2">
              <Heart size={18} className="text-rose-500 fill-rose-500" />
              The Eternal Garden
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-rose-200/50 hover:text-white rounded-full transition-colors">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-10">
        
        {/* VIGIL CANDLE (Interactive Ritual) */}
        <div className="w-full max-w-lg mx-auto mb-10 text-center relative group">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[60px] transition-all duration-1000 ${isCandleLit ? 'bg-orange-500/20' : 'bg-transparent'}`} />
            
            <button 
                onClick={handleLightCandle}
                className="relative z-10 flex flex-col items-center justify-center gap-4 py-8 w-full"
            >
                <div className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${isCandleLit ? 'border-orange-500/50 bg-orange-950/30 shadow-[0_0_30px_rgba(249,115,22,0.3)]' : 'border-rose-900/30 bg-black'}`}>
                    <Flame 
                        size={isCandleLit ? 40 : 32} 
                        className={`transition-all duration-700 ${isCandleLit ? 'text-orange-500 animate-pulse' : 'text-zinc-700'}`} 
                        fill={isCandleLit ? "currentColor" : "none"}
                    />
                    {isCandleLit && (
                        <motion.div 
                            className="absolute -top-10 text-orange-500"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Sparkles size={16} />
                        </motion.div>
                    )}
                </div>
                <div>
                    <h3 className={`text-xl font-serif italic transition-colors ${isCandleLit ? 'text-orange-200' : 'text-zinc-600'}`}>
                        {isCandleLit ? "The flame burns eternal." : "Light a candle for them."}
                    </h3>
                    {isCandleLit && <p className="text-[10px] text-orange-500/60 uppercase tracking-widest mt-1">Vigil Active</p>}
                </div>
            </button>
        </div>

        {/* CONTROLS */}
        <div className="flex justify-center gap-4 mb-8">
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-900/20 hover:bg-rose-900/40 text-rose-200 rounded-full border border-rose-800/50 transition-colors text-xs font-bold uppercase tracking-widest"
            >
                <Plus size={14} /> Add Photo
            </button>
            <button 
                onClick={handleWhisper}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all text-xs font-bold uppercase tracking-widest ${
                    isRecording 
                    ? 'bg-red-900/50 text-red-200 border-red-500 animate-pulse' 
                    : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
            >
                <Mic size={14} /> {isRecording ? "Listening..." : "Whisper"}
            </button>
        </div>

        {/* Masonry Grid */}
        <div className="columns-2 md:columns-3 gap-4 space-y-4 max-w-5xl mx-auto">
            {memories.map((mem) => (
                <div key={mem.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden mb-4 border border-white/5">
                    <img 
                        src={mem.imageUrl} 
                        alt={mem.name}
                        className="w-full h-auto object-cover rounded-2xl brightness-[0.8] group-hover:brightness-105 transition-all duration-500"
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <h3 className="text-rose-100 font-bold text-sm tracking-wide">{mem.name}</h3>
                        <p className="text-rose-200/70 text-xs line-clamp-2 mt-1 font-serif italic">"{mem.caption}"</p>
                        
                        <button 
                            onClick={() => {
                                if (confirm('Remove this memory?')) onDeleteMemory(mem.id);
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-900/80 text-white rounded-full transition-colors"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {memories.length === 0 && (
            <div className="text-center py-10 opacity-40">
                <Heart size={32} className="mx-auto text-rose-900 mb-2" />
                <p className="text-rose-200/50 text-xs">
                    "Until one has loved an animal, a part of one's soul remains unawakened."
                </p>
            </div>
        )}

      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
            <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    className="w-full max-w-md bg-zinc-950 rounded-3xl border border-zinc-800 p-6 shadow-2xl"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white font-serif italic">Memory of Love</h3>
                        <button onClick={closeModal} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                    </div>
                    
                    <div className="space-y-4">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-video rounded-2xl bg-black border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-rose-500/50 transition-colors overflow-hidden relative group"
                        >
                            {selectedFile ? (
                                <img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="p-4 bg-zinc-900 rounded-full text-zinc-600 mb-2 group-hover:text-rose-400 group-hover:bg-rose-900/20 transition-colors">
                                        <Camera size={24} />
                                    </div>
                                    <span className="text-xs text-zinc-500 font-medium">Tap to upload photo</span>
                                </>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                        </div>

                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block tracking-wider">Name</label>
                            <input 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-rose-500 outline-none transition-colors"
                                placeholder="e.g. Nina"
                            />
                            <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                                {['Nina', 'Alayah', 'Bella'].map(n => (
                                    <button 
                                        key={n}
                                        onClick={() => setName(n)}
                                        className={`text-[10px] px-3 py-1.5 rounded-full border transition-colors ${name === n ? 'bg-rose-900/50 border-rose-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block tracking-wider">Caption / Memory</label>
                            <textarea 
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-rose-500 outline-none resize-none h-24 transition-colors leading-relaxed"
                                placeholder="What do you remember?"
                            />
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={!name || !selectedFile}
                            className={`w-full py-4 rounded-xl font-bold transition-all uppercase tracking-widest text-xs ${
                                !name || !selectedFile 
                                ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed' 
                                : 'bg-rose-700 text-white hover:bg-rose-600 shadow-lg shadow-rose-900/30'
                            }`}
                        >
                            Seal Memory
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
};
