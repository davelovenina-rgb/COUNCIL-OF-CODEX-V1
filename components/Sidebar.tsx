
import React, { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, MessageSquare, Settings, LayoutDashboard, 
  Sun, Sparkles, Mic, BookOpen, Brain, Folder, Archive, 
  Clock, Calendar, CloudMoon, BarChart, Heart, FileText,
  Activity, Zap, User, Search, Lock, Unlock, Cpu, ShieldCheck, Scale, Landmark, Hammer, Book
} from 'lucide-react';
import { ViewState, Session, CouncilMember, UserSettings, Memory, VaultItem, CouncilMemberId } from '../types';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { SacredSeal } from './SacredSeal';
import { THEME_COLORS } from '../constants';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  settings: UserSettings;
  members: CouncilMember[];
  onSelectMember: (id: CouncilMemberId) => void;
  onMemberAvatarUpload: (id: string, file: File) => void;
  memories: Memory[];
  vaultItems: VaultItem[];
  onToggleGuestMode: () => void;
}

const SidebarComponent: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  isOpen, 
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  settings,
  members,
  onSelectMember,
  onMemberAvatarUpload,
  memories,
  vaultItems,
  onToggleGuestMode
}) => {
  const [synapseLoad, setSynapseLoad] = useState(20);

  useEffect(() => {
      const interval = setInterval(() => {
          setSynapseLoad(Math.floor(Math.random() * 20) + 10);
      }, 3000);
      return () => clearInterval(interval);
  }, []);

  const getSealColor = () => THEME_COLORS.GOLD_PRIMARY;

  const sanctuaryItems = [
    { id: ViewState.CouncilHall, label: 'The Grand Hall', icon: Landmark, show: true }, 
    { id: ViewState.CouncilChamber, label: 'The Sovereign Court', icon: Scale, show: true }, 
    { id: ViewState.EnneaSanctum, label: 'System Core', icon: ShieldCheck, show: true },
    { id: ViewState.AtelierVisionis, label: 'Atelier Visionis', icon: Sparkles, show: true },
    { id: ViewState.NinaSanctuary, label: 'Nina Sanctuary', icon: Heart, show: settings.showNina },
    { id: ViewState.DailyProtocol, label: 'Morning Rise', icon: Sun, show: !settings.guestMode },
    { id: ViewState.LiveWhisper, label: 'Live Whisper', icon: Mic, show: !settings.guestMode },
    { id: ViewState.MemorySystem, label: 'Memory Core', icon: Brain, show: !settings.guestMode },
    { id: ViewState.Projects, label: 'Flight Deck', icon: Folder, show: !settings.guestMode },
    { id: ViewState.Vault, label: 'Vault', icon: Archive, show: settings.showVault && !settings.guestMode },
  ].filter(item => item.show);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-40"
          />
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: "spring", stiffness: 300, damping: 35 }}
        className="fixed top-0 left-0 bottom-0 w-80 bg-black border-r border-lux-gold/20 z-50 flex flex-col shadow-2xl"
      >
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black">
            <div className="flex items-center gap-3">
                <SacredSeal 
                    size={36} 
                    isAnimated={true} 
                    color={getSealColor()} 
                />
                <div>
                    <h2 className="text-sm font-bold text-lux-gold tracking-widest uppercase font-serif italic leading-none">
                        Council of Codex
                    </h2>
                    <p className="text-[0.5rem] text-zinc-500 uppercase tracking-widest mt-1 font-mono">Golden Threshold</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 text-zinc-600 hover:text-lux-gold transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar bg-black/40">
            <div>
                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">Navigation</h3>
                <div className="space-y-1">
                    {sanctuaryItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { onViewChange(item.id); triggerHaptic('light'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                currentView === item.id 
                                ? 'bg-lux-gold/10 text-lux-gold border border-lux-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.05)]' 
                                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
                            }`}
                        >
                            <item.icon size={18} className={currentView === item.id ? 'text-lux-gold' : 'text-zinc-600'} />
                            <span className="text-[0.8rem] font-bold tracking-wide uppercase">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-4 px-2">The Council</h3>
                <div className="space-y-1">
                    {members.map(member => (
                        <button
                            key={member.id}
                            onClick={() => { onSelectMember(member.id); triggerHaptic('light'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full border border-white/5 bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-lg group-hover:border-lux-gold/30">
                                {member.avatarUrl ? (
                                    <img src={member.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <span style={{ color: member.color }} className="text-[0.6rem] font-bold">{member.sigil}</span>
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-sm font-bold text-zinc-300 group-hover:text-lux-gold transition-colors">{member.name}</div>
                                <div className="text-[0.5rem] text-zinc-600 uppercase tracking-widest">{member.role}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-5 border-t border-white/5 bg-black">
            <div className="flex items-center gap-3 text-zinc-500 text-[0.625rem] font-mono mb-3">
                <Cpu size={12} className="text-lux-gold animate-pulse" />
                <span className="tracking-widest uppercase">Bio-Metric Signal</span>
                <span className="ml-auto text-lux-gold font-bold">{synapseLoad}%</span>
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-lux-gold" 
                    animate={{ width: `${synapseLoad}%` }}
                />
            </div>
            <div className="flex justify-between items-center mt-3">
                <button onClick={() => onViewChange(ViewState.Settings)} className="p-2 text-zinc-600 hover:text-white"><Settings size={18} /></button>
                <span className="flex items-center gap-1.5 text-[0.55rem] text-emerald-500 font-bold tracking-widest uppercase">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Channel Secure
                </span>
            </div>
        </div>
      </motion.div>
    </>
  );
};

export const Sidebar = memo(SidebarComponent);
