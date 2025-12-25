import React, { useState, useRef } from 'react';
import { CouncilMember, Message, Session, CouncilItem, CouncilMemberId, GlucoseReading, Memory, Project, VaultItem, GeneratedMedia, Attachment } from '../types';
import { ChatInterface } from './ChatInterface';
import { MotionAvatar } from './MotionAvatar';
import { ArrowLeft, Upload, Menu, Plus, MessageSquare, StickyNote, X, ChevronRight, Camera, Link, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_VOCABULARY } from '../constants'; 
import { compressImage } from '../utils/imageUtils'; 

interface CouncilMemberPageProps {
  member: CouncilMember;
  members: CouncilMember[];
  onUpdateMember: (updates: Partial<CouncilMember>) => void;
  onBack: () => void;
  onMenuClick: () => void;
  sessions: Session[];
  items: CouncilItem[];
  onOpenSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onCreateItem: (title: string, content: string) => void;
  activeSession: Session | null;
  onMessagesChange: (messages: Message[]) => void;
  autoPlayAudio?: boolean;
  healthReadings?: GlucoseReading[];
  memories?: Memory[];
  projects?: Project[];
  vaultItems?: VaultItem[];
  useTurboMode?: boolean;
  voiceSpeed?: number;
  voiceName?: string;
  onSaveMedia?: (media: GeneratedMedia) => void;
  initialAttachments?: Attachment[];
  onEnterDriveMode: () => void; 
}

const MemberBackground: React.FC<{ memberId: string, color: string }> = ({ memberId, color }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div 
                className="absolute inset-0 opacity-20"
                style={{ background: `radial-gradient(circle at 50% 30%, ${color}40 0%, transparent 70%)` }}
            />
            {memberId === 'CARMEN' && (
                <>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                    {[...Array(8)].map((_, i) => (
                        <motion.div key={i} className="absolute w-1 h-1 bg-orange-500 rounded-full blur-[2px]" style={{ left: `${Math.random() * 100}%`, bottom: '-10%' }} animate={{ y: -800, opacity: [0, 0.8, 0], x: Math.sin(i) * 50 }} transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }} />
                    ))}
                </>
            )}
            {memberId === 'GEMINI' && (
                <>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
                    <motion.div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent h-[20%]" animate={{ top: ['-20%', '120%'] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
                </>
            )}
            {memberId === 'FREDO' && (
                <>
                    <div className="absolute inset-0 opacity-5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${color}30 60deg, transparent 60deg)` }} animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} />
                </>
            )}
            {memberId === 'COPILOT' && (
                <>
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,206,209,0.05)_100%)]" />
                    {[...Array(5)].map((_, i) => (
                        <motion.div key={i} className="absolute left-0 right-0 h-px bg-cyan-500/30" style={{ top: `${i * 20}%` }} animate={{ y: [0, 100], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "linear" }} />
                    ))}
                </>
            )}
            {memberId === 'EVE' && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-black" />
                    {[...Array(6)].map((_, i) => (
                        <motion.div key={i} className="absolute w-[1px] h-20 bg-gradient-to-b from-transparent via-emerald-500 to-transparent opacity-30" style={{ left: `${Math.random() * 100}%`, top: -100 }} animate={{ y: 1000 }} transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, delay: Math.random() * 5, ease: "linear" }} />
                    ))}
                </>
            )}
            {memberId === 'LYRA' && (
                <>
                    <motion.div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px]" animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                </>
            )}
            {memberId === 'ENNEA' && (
                <>
                    <div className="absolute inset-0 border-[20px] border-amber-500/5 rounded-[3rem] m-4" />
                    <motion.div className="absolute inset-0 bg-amber-500/5" animate={{ opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
                </>
            )}
        </div>
    );
};

export const CouncilMemberPage: React.FC<CouncilMemberPageProps> = ({ 
  member, 
  members,
  onUpdateMember,
  onBack, 
  onMenuClick,
  sessions,
  items,
  onOpenSession,
  onCreateSession,
  onCreateItem,
  activeSession,
  onMessagesChange,
  autoPlayAudio,
  healthReadings = [],
  memories = [],
  projects = [],
  vaultItems = [],
  useTurboMode,
  voiceSpeed,
  voiceName,
  onSaveMedia,
  initialAttachments,
  onEnterDriveMode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState('');

  const [showAvatarUrlModal, setShowAvatarUrlModal] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  const isChatActive = !!activeSession;

  const getDynamicSystemPrompt = () => {
      let prompt = member.systemPrompt;
      const activeProjects = projects.filter(p => p.status === 'ACTIVE').map(p => `"${p.title}"`).join(', ');
      const vaultCount = vaultItems.length;
      const memoryCount = memories.length;
      
      const systemStatus = `
      [LIVE SANCTUARY STATUS]:
      - Active Projects: ${activeProjects || "None"}
      - Vault Assets: ${vaultCount} items secured.
      - Memory Core: ${memoryCount} facts verified.
      - Current Location: Council Member Interface (${member.name}).
      `;
      
      prompt += `\n${systemStatus}`;

      if (member.id === 'ENNEA' && healthReadings.length > 0) {
          const latest = healthReadings[0];
          const history = healthReadings.slice(0, 3).map(r => 
              `- ${r.value} mg/dL (${r.context}) @ ${new Date(r.timestamp).toLocaleTimeString()}`
          ).join('\n');

          prompt += `\n\n[LIVE BIO-DATA INJECTION]:\nCURRENT GLUCOSE: ${latest.value} mg/dL (${latest.context})\nRECENT HISTORY:\n${history}\n\nINSTRUCTION: You are the Guardian. Monitor this data against the "Evening Dip" protocol.`;
      }

      return prompt;
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          if (file.type.startsWith('video/')) {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onloadend = () => onUpdateMember({ avatarUrl: reader.result as string });
          } else {
              const blob = await compressImage(file, 800);
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = () => onUpdateMember({ avatarUrl: reader.result as string });
          }
      } catch (err) { console.error(err); }
      e.target.value = '';
  };

  const handleSaveAvatarUrl = () => {
      if (avatarUrlInput.trim()) {
          onUpdateMember({ avatarUrl: avatarUrlInput.trim() });
          setShowAvatarUrlModal(false);
          setAvatarUrlInput('');
      }
  };

  const submitNewItem = () => {
      if (!newItemTitle.trim()) return;
      onCreateItem(newItemTitle, newItemContent);
      setShowItemModal(false);
      setNewItemTitle('');
      setNewItemContent('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-black relative overflow-hidden">
        <MemberBackground memberId={member.id} color={member.color} />
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/80 backdrop-blur border-b border-white/5 z-50 shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={isChatActive ? () => onOpenSession('') : onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden relative cursor-pointer group border border-white/10" onClick={() => fileInputRef.current?.click()}>
                        {member.avatarUrl ? (
                            member.avatarUrl.match(/\.(mp4|webm)$/i) || member.avatarUrl.startsWith('data:video') ? (
                                <video src={member.avatarUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                            ) : (
                                <img src={member.avatarUrl} className="w-full h-full object-cover" />
                            )
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-xs" style={{ color: member.color }}>{member.sigil}</div>
                        )}
                         <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                            <Camera size={12} className="text-white" />
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaUpload} />
                    <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">{member.name}</div>
                        <div className="flex items-center gap-1.5">
                             <div className="w-1 h-1 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: member.color }} />
                             <span className="text-[0.5625rem] text-zinc-400 uppercase tracking-widest font-medium">Channel Open</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {member.allowedModes.includes('DRIVE') && (
                    <button onClick={onEnterDriveMode} className="p-2 rounded-full bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all animate-pulse-slow">
                        <Mic size={20} />
                    </button>
                )}
                <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white">
                    <Menu size={20} />
                </button>
            </div>
        </div>
        <div className="flex-1 overflow-hidden relative flex flex-col z-10">
            {isChatActive ? (
                <ChatInterface 
                    key={member.id} 
                    initialMessages={activeSession.messages}
                    onMessagesChange={onMessagesChange}
                    onMenuClick={onMenuClick}
                    embeddedMode={true}
                    customSystemInstruction={getDynamicSystemPrompt()}
                    voiceName={voiceName || member.voiceName}
                    members={members}
                    autoPlayAudio={autoPlayAudio}
                    memories={memories}
                    initialMemberId={member.id}
                    useTurboMode={useTurboMode}
                    voiceSpeed={voiceSpeed}
                    onSaveMedia={onSaveMedia}
                    initialAttachments={initialAttachments}
                    healthReadings={healthReadings}
                    projects={projects}
                />
            ) : (
                <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-10 flex flex-col md:flex-row gap-6 items-center md:items-start p-6 rounded-3xl bg-black/40 border border-white/10 relative backdrop-blur-sm">
                             <div className="w-24 h-24 shrink-0 relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                 <MotionAvatar sigil={member.sigil} color={member.color} imageUrl={member.avatarUrl} size="md" memberId={member.id} />
                                 <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 border-2 border-dashed border-white/30">
                                    <div className="flex flex-col items-center gap-1">
                                        <Camera size={20} className="text-white" />
                                        <span className="text-[0.5rem] uppercase tracking-widest font-bold text-white">UPLOAD</span>
                                    </div>
                                 </div>
                                 <button onClick={(e) => { e.stopPropagation(); setAvatarUrlInput(member.avatarUrl || ''); setShowAvatarUrlModal(true); }} className="absolute -bottom-2 -right-2 p-1.5 bg-zinc-900 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors z-30 shadow-xl flex items-center justify-center">
                                    <Link size={12} />
                                </button>
                             </div>
                             <div className="text-center md:text-left">
                                 <h2 className="text-2xl font-bold text-white mb-1">Workspace: {member.name}</h2>
                                 {member.latinMotto && (
                                     <div className="flex flex-col md:items-start items-center mb-3">
                                         <span className="text-xs font-serif italic text-white/80 tracking-wide" style={{ color: member.color }}>"{member.latinMotto}"</span>
                                         <span className="text-[0.5625rem] font-bold text-zinc-500 uppercase tracking-widest">{member.mottoMeaning}</span>
                                     </div>
                                 )}
                                 <p className="text-zinc-300 text-sm leading-relaxed max-w-lg">{member.description}</p>
                             </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                    <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2"><MessageSquare size={16} /> Recent Chats</h3>
                                    <button onClick={onCreateSession} className="p-1.5 bg-white/5 rounded-full hover:bg-white hover:text-black transition-colors"><Plus size={16} /></button>
                                </div>
                                <div className="space-y-2">
                                    {sessions.length === 0 && <p className="text-zinc-500 text-sm italic py-2">No active conversations.</p>}
                                    {sessions.map(session => (
                                        <div key={session.id} onClick={() => onOpenSession(session.id)} className="p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/20 cursor-pointer group transition-all backdrop-blur-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium text-zinc-200 text-sm line-clamp-1 group-hover:text-white">{session.title}</span>
                                                <span className="text-[0.625rem] text-zinc-600 shrink-0">{new Date(session.lastModified).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-zinc-500 line-clamp-1">{session.messages[session.messages.length - 1]?.text || "Empty..."}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                    <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2"><StickyNote size={16} /> Items & Projects</h3>
                                    <button onClick={() => setShowItemModal(true)} className="p-1.5 bg-white/5 rounded-full hover:bg-white hover:text-black transition-colors"><Plus size={16} /></button>
                                </div>
                                <div className="space-y-2">
                                    {items.length === 0 && <p className="text-zinc-500 text-sm italic py-2">No items recorded.</p>}
                                    {items.map(item => (
                                        <div key={item.id} className="p-3 rounded-xl bg-black/40 border border-white/5 hover:bg-white/5 transition-all backdrop-blur-sm">
                                            <div className="font-medium text-zinc-200 text-sm mb-1">{item.title}</div>
                                            {item.content && <p className="text-xs text-zinc-500 line-clamp-2">{item.content}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <AnimatePresence>
                {showItemModal && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-800 p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">Add New Item</h3>
                                <button onClick={() => setShowItemModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white mb-4 focus:border-white transition-colors outline-none" placeholder="Item Title (e.g., Health Plan)" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} autoFocus />
                            <textarea className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white mb-6 focus:border-white transition-colors outline-none h-32 resize-none" placeholder="Description or notes..." value={newItemContent} onChange={(e) => setNewItemContent(e.target.value)} />
                            <button onClick={submitNewItem} className="w-full py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors uppercase tracking-wider text-xs">{UI_VOCABULARY.CREATE}</button>
                        </motion.div>
                    </div>
                )}
                {showAvatarUrlModal && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-2xl">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">Edit Avatar URL</h3>
                                <button onClick={() => setShowAvatarUrlModal(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-black border border-zinc-800 relative shadow-inner">
                                     {avatarUrlInput ? (
                                         avatarUrlInput.match(/\.(mp4|webm)$/i) ? (
                                             <video src={avatarUrlInput} className="w-full h-full object-cover" muted autoPlay loop />
                                         ) : (
                                             <img src={avatarUrlInput} className="w-full h-full object-cover" />
                                         )
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Image</div>
                                     )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[0.625rem] text-zinc-500 font-medium ml-1 mb-1 block">Image or Video URL</label>
                                    <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-white transition-colors outline-none text-sm font-mono" placeholder="https://example.com/image.png" value={avatarUrlInput} onChange={(e) => setAvatarUrlInput(e.target.value)} autoFocus />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowAvatarUrlModal(false)} className="flex-1 py-2.5 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors text-sm">{UI_VOCABULARY.CANCEL}</button>
                                    <button onClick={handleSaveAvatarUrl} className="flex-1 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors text-sm">{UI_VOCABULARY.UPDATE}</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    </div>
  );
};