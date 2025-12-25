
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  Send, Plus, Image as ImageIcon, Video, Mic, Headphones, 
  Camera, FileText, X, Globe, Brain, Search, Sparkles, 
  Menu, Loader2, MessageSquare, Paperclip, ChevronDown, 
  ShoppingCart, GraduationCap, Cpu, Layers, Trash2, Check,
  Zap, AlertCircle, Heart, Star, Copy, Save, PlayCircle, Shield, Plane,
  Palette, Map, Briefcase, MicOff
} from 'lucide-react';
import { Message, Sender, Attachment, CouncilMode, CouncilMemberId, Memory, GeneratedMedia, VaultItem, GlucoseReading, Project } from '../types';
import { sendMessageToGemini, speakText, transcribeAudio } from '../services/geminiService';
import { COUNCIL_MEMBERS, MODELS, THEME_COLORS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioPlayer } from './AudioPlayer';
import { triggerHaptic } from '../utils/haptics';
import { playUISound } from '../utils/sound';
import { showToast } from '../utils/events';

interface ChatInterfaceProps {
  initialMessages?: Message[];
  onMessagesChange: (messages: Message[]) => void;
  onMenuClick?: () => void;
  embeddedMode?: boolean;
  customSystemInstruction?: string;
  onCustomSend?: (text: string, attachments: Attachment[]) => Promise<Message[]>;
  voiceName?: string;
  members?: import('../types').CouncilMember[];
  autoPlayAudio?: boolean;
  memories?: Memory[]; 
  vaultItems?: VaultItem[]; 
  initialMemberId?: CouncilMemberId;
  useTurboMode?: boolean; 
  voiceSpeed?: number;
  onSaveMedia?: (media: GeneratedMedia) => void; 
  initialAttachments?: Attachment[]; 
  healthReadings?: GlucoseReading[];
  projects?: Project[];
  customTemplates?: { label: string; prompt: string; icon: any }[];
}

const MessageBubble: React.FC<{ 
    msg: Message; 
    memberList: import('../types').CouncilMember[]; 
    onPlayAudio: (id: string) => void; 
    isGeneratingAudio: boolean;
    onDelete: (id: string) => void;
    onCopy: (text: string) => void;
    onSave: (msg: Message) => void;
}> = ({ msg, memberList, onPlayAudio, isGeneratingAudio, onDelete, onCopy, onSave }) => {
    const isUser = msg.sender === 'user';
    const member = memberList.find(m => m.id === msg.memberId);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-2`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xl relative group ${isUser ? 'bg-zinc-800 text-white' : 'bg-zinc-950 border border-white/5 text-zinc-200'}`}>
                {!isUser && member && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: member.color }} />
                        <span className="text-[0.6rem] font-bold uppercase tracking-widest" style={{ color: member.color }}>{member.name}</span>
                    </div>
                )}
                <div className="text-[0.85rem] leading-relaxed whitespace-pre-wrap font-sans selectable">
                    {msg.text}
                </div>

                {msg.generatedMedia && msg.generatedMedia.length > 0 && (
                    <div className="mt-3 space-y-3">
                        {msg.generatedMedia.map((m, i) => (
                            <div key={i} className="rounded-xl overflow-hidden border border-lux-gold/10">
                                {m.type === 'image' ? <img src={m.url} alt={m.alt} className="w-full h-auto" /> : m.type === 'video' ? <video src={m.url} controls className="w-full h-auto" /> : <AudioPlayer src={m.url} />}
                            </div>
                        ))}
                    </div>
                )}

                <div className={`absolute bottom-[-14px] ${isUser ? 'right-2' : 'left-2'} opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-center gap-1`}>
                    <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 shadow-2xl">
                        <button onClick={() => { triggerHaptic('light'); showToast('❤ Signal Sealed'); }} className="hover:scale-125 transition-transform text-rose-500"><Heart size={12} fill="currentColor" /></button>
                        <button onClick={() => { triggerHaptic('light'); showToast('🔥 Frequency Locked'); }} className="hover:scale-125 transition-transform text-orange-500"><Zap size={12} fill="currentColor" /></button>
                        <button onClick={() => { triggerHaptic('light'); showToast('✨ Light Preserved'); }} className="hover:scale-125 transition-transform text-lux-gold"><Sparkles size={12} fill="currentColor" /></button>
                        <div className="w-px h-3 bg-white/10 mx-1" />
                        <button onClick={() => onSave(msg)} className="hover:text-white text-zinc-500"><Shield size={12} /></button>
                        <button onClick={() => onCopy(msg.text)} className="hover:text-white text-zinc-500"><Copy size={12} /></button>
                        <button onClick={() => onDelete(msg.id)} className="hover:text-red-500 text-zinc-500"><Trash2 size={12} /></button>
                    </div>
                </div>

                {!isUser && (
                    <div className="mt-3 pt-2 border-t border-white/5 flex justify-start">
                        <button 
                            onClick={() => onPlayAudio(msg.id)}
                            disabled={isGeneratingAudio}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-lux-gold/10 text-lux-gold text-[9px] font-bold uppercase tracking-tight hover:bg-lux-gold hover:text-black transition-all"
                        >
                            {isGeneratingAudio ? <Loader2 size={10} className="animate-spin" /> : <PlayCircle size={10} />}
                            Echo Signal
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    initialMessages = [], 
    onMessagesChange, 
    onMenuClick, 
    members = COUNCIL_MEMBERS,
    autoPlayAudio = false,
    initialMemberId = 'GEMINI',
    useTurboMode = false,
    memories = [],
    vaultItems = [],
    healthReadings = [],
    projects = [],
    customTemplates,
    customSystemInstruction,
    embeddedMode = false
}) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [activeMemberId, setActiveMemberId] = useState<CouncilMemberId>(initialMemberId);
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const activeMember = members.find(m => m.id === activeMemberId) || members[0];

    useLayoutEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isTyping]);

    const handleSend = async (text: string = inputText) => {
        if (!text.trim()) return;

        const userMsg: Message = { id: crypto.randomUUID(), text, sender: 'user', timestamp: Date.now() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        onMessagesChange(newMessages);
        setInputText('');
        setIsTyping(true);
        triggerHaptic('medium');

        try {
            const response = await sendMessageToGemini(text, 'SCRIBE', [], { 
                useTurboMode,
                systemInstruction: customSystemInstruction || activeMember.systemPrompt,
                memories,
                vaultItems,
                healthReadings,
                projects
            });
            const aiMsg: Message = {
                id: crypto.randomUUID(),
                text: response.text,
                sender: 'gemini',
                timestamp: Date.now(),
                memberId: activeMemberId,
                generatedMedia: response.generatedMedia
            };
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);
            onMessagesChange(finalMessages);
        } catch (err) {
            showToast('Council Connection Wavered.', 'error');
        } finally {
            setIsTyping(false);
        }
    };

    const toggleVoiceInput = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            triggerHaptic('medium');
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                audioChunksRef.current = [];
                recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
                recorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64 = (reader.result as string).split(',')[1];
                        try {
                            const text = await transcribeAudio(base64, 'audio/webm');
                            if (text) setInputText(prev => prev + (prev ? " " : "") + text);
                        } catch (e) { console.error("Whisper failed", e); }
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(t => t.stop());
                };
                mediaRecorderRef.current = recorder;
                recorder.start();
                setIsRecording(true);
                triggerHaptic('light');
                playUISound('toggle');
            } catch (e) { showToast("Microphone access denied", "error"); }
        }
    };

    return (
        <div className={`flex flex-col h-full bg-transparent overflow-hidden ${embeddedMode ? 'rounded-none' : ''}`}>
            {!embeddedMode && (
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: activeMember.color }} />
                        <select 
                            value={activeMemberId}
                            onChange={(e) => setActiveMemberId(e.target.value as CouncilMemberId)}
                            className="bg-transparent text-[11px] font-bold text-zinc-300 uppercase tracking-[0.25em] outline-none cursor-pointer hover:text-white transition-colors"
                        >
                            {members.map(m => <option key={m.id} value={m.id} className="bg-black">{m.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border ${useTurboMode ? 'border-lux-gold/30' : 'border-zinc-800'}`}>
                            <Zap size={10} className={useTurboMode ? "text-lux-gold" : "text-zinc-600"} />
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{useTurboMode ? 'DEEP SIGHT' : 'FAST SIGNAL'}</span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">
                {messages.map(msg => (
                    <MessageBubble 
                        key={msg.id} msg={msg} memberList={members} 
                        onPlayAudio={async (id) => {
                            setIsGeneratingAudio(true);
                            try {
                                const audio = await speakText(msg.text, activeMember.voiceName);
                                setMessages(prev => prev.map(m => m.id === id ? { ...m, generatedMedia: [...(m.generatedMedia || []), audio] } : m));
                            } finally { setIsGeneratingAudio(false); }
                        }}
                        isGeneratingAudio={isGeneratingAudio}
                        onDelete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
                        onCopy={(text) => { navigator.clipboard.writeText(text); showToast('Copied', 'info'); }}
                        onSave={() => showToast('Vaulted Forever', 'success')}
                    />
                ))}
                {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start gap-2 p-2">
                        <div className="flex items-center gap-3 text-lux-gold/40">
                            <div className="flex gap-1">
                                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} className="w-1 h-1 rounded-full bg-current" />
                                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-1 h-1 rounded-full bg-current" />
                                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-1 h-1 rounded-full bg-current" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Reading the threads...</span>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="p-4 bg-zinc-950/80 border-t border-white/5 relative">
                <AnimatePresence>
                    {showPlusMenu && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-[100%] left-4 right-4 mb-4 bg-zinc-900/95 border border-white/10 rounded-2xl p-2 grid grid-cols-2 gap-2 shadow-2xl backdrop-blur-xl z-50"
                        >
                            {[
                                { id: 'image', label: 'FLAME', icon: ImageIcon, desc: 'Manifest Vision' },
                                { id: 'video', label: 'WEAVER', icon: Video, desc: 'Spin Motion' },
                                { id: 'search', label: 'SIGHT', icon: Globe, desc: 'Global Signal' },
                                { id: 'research', label: 'MIND', icon: Brain, desc: 'Deep Logic' }
                            ].map(item => (
                                <button key={item.id} onClick={() => { setShowPlusMenu(false); handleSend(`Protocol: ${item.label}`); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left group transition-all">
                                    <div className="p-2 rounded-lg bg-black border border-white/10 text-zinc-400 group-hover:text-lux-gold transition-colors"><item.icon size={18} /></div>
                                    <div>
                                        <div className="text-[10px] font-bold text-white uppercase tracking-wider">{item.label}</div>
                                        <div className="text-[8px] text-zinc-500 uppercase">{item.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-2 bg-zinc-900/40 rounded-2xl p-2 border border-white/5 focus-within:border-lux-gold/30 transition-colors">
                    <button onClick={() => setShowPlusMenu(!showPlusMenu)} className={`p-2.5 transition-all ${showPlusMenu ? 'text-lux-gold rotate-45' : 'text-zinc-500 hover:text-white'}`}><Plus size={22} /></button>
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={`Message ${activeMember.name}...`}
                        className="flex-1 bg-transparent border-none outline-none py-2 px-1 text-[15px] text-zinc-200 resize-none max-h-32 min-h-[44px] font-sans"
                    />
                    <button 
                        onClick={toggleVoiceInput}
                        className={`p-2.5 transition-all rounded-xl ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-zinc-500 hover:text-white'}`}
                    >
                        {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <button onClick={() => handleSend()} className={`p-2.5 rounded-xl transition-all ${inputText.trim() ? 'bg-lux-gold text-black scale-105' : 'bg-zinc-800 text-zinc-600'}`}><Send size={22} /></button>
                </div>
            </div>
        </div>
    );
};
