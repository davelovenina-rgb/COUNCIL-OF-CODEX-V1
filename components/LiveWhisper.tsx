
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Save, Loader2, Menu, ArrowLeft, MicOff, Feather } from 'lucide-react';
import { Memory } from '../types';
import { transcribeAudio, sendMessageToGemini } from '../services/geminiService';
import { LiveVoiceVisualizer } from './LiveVoiceVisualizer';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { SacredSeal } from './SacredSeal';

interface LiveWhisperProps {
  onBack: () => void;
  onMenuClick: () => void;
  onSaveMemory: (memory: Memory) => void;
}

export const LiveWhisper: React.FC<LiveWhisperProps> = ({ onBack, onMenuClick, onSaveMemory }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [volume, setVolume] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Visualizer Analysis
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // Setup Recorder
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      
      recorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        
        // Cleanup Audio Context
        if (sourceRef.current) sourceRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        stream.getTracks().forEach(t => t.stop());

        // Process Audio
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
                const text = await transcribeAudio(base64, 'audio/webm');
                setTranscript(prev => prev + (prev ? " " : "") + text);
                playUISound('success');
            } catch (e) {
                console.error(e);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      playUISound('hero');
      triggerHaptic('success');

      // Animation Loop
      const updateVisualizer = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          setFrequencyData(dataArray);
          
          // Legacy volume calc for fallback
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVolume(avg / 255); 
          
          animationFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      updateVisualizer();

    } catch (e) {
      console.error("Mic Error", e);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      triggerHaptic('medium');
    }
  };

  const handleSave = async () => {
      if (!transcript.trim()) return;
      setIsProcessing(true);
      triggerHaptic('medium');

      try {
          // Auto-tagging via Gemini
          const prompt = `
          Analyze this journal entry.
          Transcript: "${transcript}"
          
          Output JSON: { "title": "Short Poetic Title", "tags": ["tag1", "tag2"] }
          `;
          
          let title = "Voice Journal";
          let tags = ["journal"];

          try {
              const response = await sendMessageToGemini(prompt, 'SCRIBE', []);
              const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
              const data = JSON.parse(cleanJson);
              if (data.title) title = data.title;
              if (data.tags) tags = data.tags;
          } catch (e) {
              console.warn("Auto-tagging failed, using defaults");
          }

          const memory: Memory = {
              id: crypto.randomUUID(),
              category: 'OTHER', // General Journal
              content: `[AUDIO JOURNAL]: ${title}\n"${transcript}"\nTags: ${tags.join(', ')}`,
              source: 'Live Whisper',
              timestamp: Date.now(),
              isVerified: true
          };

          onSaveMemory(memory);
          playUISound('success');
          onBack(); // Return to hall
      } catch (e) {
          alert("Failed to save.");
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/30 via-black to-black pointer-events-none" />
      
      {/* VISUALIZER OVERLAY */}
      <AnimatePresence>
          {isRecording && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
                  
                  {/* Sacred Seal pulsing in background */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 scale-150 pointer-events-none">
                      <SacredSeal size={300} isAnimated={true} color="#FFFFFF" />
                  </div>

                  <div className="relative z-10 w-full h-full">
                      <LiveVoiceVisualizer 
                        isActive={isRecording} 
                        frequencyData={frequencyData}
                        volume={volume} 
                        onClose={stopRecording} 
                        status="Recording Sacred Record..."
                        color="#ffffff"
                      />
                  </div>

                  <div className="absolute bottom-16 left-0 right-0 flex justify-center z-[60]">
                      <button 
                        onClick={stopRecording}
                        className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.5)] border-4 border-black hover:scale-105 transition-transform"
                      >
                          <Square size={32} fill="white" className="text-white" />
                      </button>
                  </div>
              </div>
          )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mic size={18} className="text-zinc-100" />
              Live Whisper
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 space-y-8">
          
          {!transcript && !isProcessing ? (
              <div className="text-center space-y-12">
                  <div className="relative group cursor-pointer" onClick={startRecording}>
                      {/* Ambient Glow */}
                      <div className="absolute inset-0 bg-white/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                      
                      <div className="relative">
                          <SacredSeal size={200} isAnimated={false} className="opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                          <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center group-hover:scale-105 transition-transform group-active:scale-95 shadow-2xl shadow-black">
                              <Mic size={40} className="text-zinc-400 group-hover:text-white transition-colors" />
                          </button>
                      </div>
                  </div>
                  <div>
                      <h3 className="text-2xl font-light text-white mb-2 font-serif italic">"Speak, and it shall be kept."</h3>
                      <p className="text-zinc-500 text-xs uppercase tracking-widest">Tap the Seal to Record</p>
                  </div>
              </div>
          ) : (
              <div className="w-full max-w-lg flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-900/30 rounded-2xl p-6 border border-zinc-800 mb-6 relative group">
                      {isProcessing && !transcript ? (
                          <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                              <SacredSeal size={64} isAnimated={true} color="#52525B" />
                              <p className="text-xs uppercase tracking-widest animate-pulse">Transcribing the Void...</p>
                          </div>
                      ) : (
                          <>
                            <div className="absolute top-4 right-4 opacity-10">
                                <Feather size={48} />
                            </div>
                            <textarea 
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                className="w-full h-full bg-transparent text-zinc-100 resize-none outline-none text-lg leading-relaxed placeholder:text-zinc-700 font-serif"
                                placeholder="Transcript will appear here..."
                            />
                          </>
                      )}
                  </div>
                  
                  <div className="flex gap-4 shrink-0">
                      <button 
                        onClick={() => { setTranscript(""); setIsProcessing(false); }}
                        className="p-4 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
                        title="Discard"
                      >
                          <MicOff size={24} />
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={isProcessing || !transcript}
                        className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors uppercase tracking-widest text-sm ${
                            isProcessing || !transcript
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-zinc-200 shadow-lg'
                        }`}
                      >
                          {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                          Seal Entry
                      </button>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};
