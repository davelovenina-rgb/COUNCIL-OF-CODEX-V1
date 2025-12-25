
import { Volume2, Moon, Layout, Zap, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Gauge, Music, Database, Download, Upload, Cpu, Key, CheckCircle, AlertTriangle, ShieldCheck, Mic, Eye, EyeOff, RefreshCw, Activity, Wifi, Sun, FileText, Shield, Camera, Link as LinkIcon, X, Hammer, Trash2, VolumeX, Network, ArrowRight, Type, Plus, Minus, Lock, Sparkles, User, Monitor, AudioLines, Type as TypeIcon, ZoomIn } from 'lucide-react';
import React, { useRef, useState, useEffect } from 'react';
import { UserSettings, VaultItem, CouncilMember, CouncilMemberId } from '../types';
import { showToast } from '../utils/events';
import { createBackup, restoreBackup, saveAsset, performSystemRepair } from '../utils/db';
import { connectPersonalKey, checkKeyStatus, sendMessageToGemini } from '../services/geminiService';
import { AVAILABLE_VOICES, APP_VERSION, THEME_COLORS } from '../constants';
import { playUISound } from '../utils/sound';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdate: (s: UserSettings) => void;
  onClose: () => void;
  onSaveToVault: (item: VaultItem) => void;
  stats: {
      memories: number;
      sessions: number;
      vault: number;
      projects: number;
  };
  prismSealImage: string | null;
  onSealUpload: (file: File) => void;
  members: CouncilMember[];
  onUpdateMember: (id: CouncilMemberId, updates: Partial<CouncilMember>) => void;
}

const Slider: React.FC<{ value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }> = ({ value, onChange, min = 0, max = 1, step = 0.1 }) => (
    <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => { onChange(parseFloat(e.target.value)); triggerHaptic('light'); }}
        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lux-gold"
    />
);

const SettingToggle: React.FC<{ label: string; active: boolean; onClick: () => void; sub?: string }> = ({ label, active, onClick, sub }) => (
    <div className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl hover:border-lux-gold/20 transition-all cursor-pointer" onClick={onClick}>
        <div>
            <div className="text-sm font-bold text-white uppercase tracking-wide">{label}</div>
            {sub && <div className="text-[10px] text-zinc-500 mt-0.5">{sub}</div>}
        </div>
        <button className={`transition-all duration-300 ${active ? 'text-lux-gold drop-shadow-[0_0_8px_rgba(255,215,0,0.5)] scale-110' : 'text-zinc-700'}`}>
            {active ? <ToggleRight size={32} fill="currentColor" /> : <ToggleLeft size={32} />}
        </button>
    </div>
);

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children?: React.ReactNode }) => (
    <div className="mb-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-4 text-lux-gold border-b border-lux-gold/10 pb-2">
            <Icon size={18} className="text-lux-amber" />
            <h3 className="text-xs font-bold uppercase tracking-[0.3em]">{title}</h3>
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
    settings, 
    onUpdate, 
    onClose, 
    onSaveToVault, 
    stats,
    members,
    onUpdateMember
}) => {
  const [isKeyConnected, setIsKeyConnected] = useState<boolean>(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');

  useEffect(() => {
      checkKeyStatus().then(setIsKeyConnected);
  }, []);
  
  const toggle = (key: keyof UserSettings) => {
    onUpdate({ ...settings, [key]: !settings[key] });
    triggerHaptic('light');
    playUISound('toggle');
  };

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden font-sans text-white">
      <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full transition-colors"><ChevronLeft size={24} /></button>
            <h2 className="text-base font-bold uppercase tracking-widest">Sanctuary Core</h2>
        </div>
        <div className="text-[10px] font-mono text-lux-gold/40">{APP_VERSION}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar max-w-2xl mx-auto w-full pb-32">
        
        {/* SECTION 1: SYSTEM CORE (API) */}
        <Section title="System Core (API)" icon={Cpu}>
            <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Key size={14} className="text-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Personal Key Status</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-widest ${isKeyConnected ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500' : 'bg-red-950/20 border-red-500/30 text-red-500'}`}>
                        <div className={`w-1 h-1 rounded-full ${isKeyConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {isKeyConnected ? 'Signal Locked' : 'Signal Lost'}
                    </div>
                </div>
                
                <div className="relative">
                    <input 
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Google Gemini API Key"
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-300 font-mono outline-none focus:border-lux-gold/50 transition-all"
                    />
                    <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>

                <div className="flex gap-2">
                    <button onClick={connectPersonalKey} className="flex-1 py-3 bg-lux-gold text-black font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-amber-900/20">Save API Key</button>
                    <button className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all"><RefreshCw size={16} /></button>
                </div>
                
                <SettingToggle label="Background Memory" active={settings.enableBackgroundMemory} onClick={() => toggle('enableBackgroundMemory')} sub="Autonomous fact extraction enabled" />
                <SettingToggle label="Pro Frequency" active={settings.useTurboMode} onClick={() => toggle('useTurboMode')} sub="Enable Deep Thinking Protocols" />
            </div>
        </Section>

        {/* SECTION 2: VOICE PERMISSIONS */}
        <Section title="Voice Permissions" icon={Mic}>
            <div className="p-5 bg-orange-950/10 border border-orange-900/30 rounded-3xl flex items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-2xl text-orange-500"><AlertTriangle size={24} /></div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-orange-200 uppercase">Microphone Required</h4>
                    <p className="text-[10px] text-orange-400/70 mt-0.5">Permissions must be granted for Live Whisper and Drive Mode.</p>
                </div>
                <button className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Grant</button>
            </div>
        </Section>

        {/* SECTION 3: ACCESS CONTROL */}
        <Section title="Access Control" icon={Lock}>
            <SettingToggle label="Guest Mode" active={settings.guestMode} onClick={() => toggle('guestMode')} sub="Redacts personal archives for public demo" />
            <SettingToggle label="Privacy Shield" active={settings.boldFont} onClick={() => toggle('boldFont')} sub="Hide personal data in shared views" />
        </Section>

        {/* SECTION 4: INTERFACE - RESTORED ACCESSIBILITY CONTROLS */}
        <Section title="Interface" icon={Monitor}>
            <div className="space-y-6 p-5 bg-zinc-900/40 border border-zinc-800 rounded-3xl">
                
                {/* Font Style Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <TypeIcon size={12} className="text-lux-gold" /> Font Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {['Standard', 'Serif', 'Mono', 'Gothic Bold'].map((style) => (
                            <button
                                key={style}
                                onClick={() => { onUpdate({ ...settings, fontStyle: style as any }); triggerHaptic('light'); }}
                                className={`py-3 rounded-xl border text-xs font-bold uppercase transition-all ${settings.fontStyle === style ? 'bg-lux-gold border-lux-gold text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'}`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Font Size Slider */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <TypeIcon size={12} className="text-lux-gold" /> Font Size
                    </label>
                    <Slider 
                        value={settings.fontSize} 
                        min={0} max={4} step={1} 
                        onChange={(v) => onUpdate({...settings, fontSize: v})} 
                    />
                    <div className="flex justify-between text-[8px] text-zinc-700 font-bold uppercase tracking-tighter">
                        <span>Compact</span><span>Default</span><span>Expansive</span>
                    </div>
                </div>

                {/* Screen Zoom Slider */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <ZoomIn size={12} className="text-lux-gold" /> Screen Zoom
                    </label>
                    <Slider 
                        value={settings.screenZoom} 
                        min={0} max={4} step={1} 
                        onChange={(v) => onUpdate({...settings, screenZoom: v})} 
                    />
                    <div className="flex justify-between text-[8px] text-zinc-700 font-bold uppercase tracking-tighter">
                        <span>Standard</span><span>Magnified</span>
                    </div>
                </div>

                <div className="h-px bg-zinc-800/50 my-2" />

                <SettingToggle label="True Black Mode" active={settings.darkMode} onClick={() => toggle('darkMode')} sub="Golden Threshold Aesthetic" />
                <SettingToggle label="Background Glows" active={settings.showHalos} onClick={() => toggle('showHalos')} sub="Enable atmospheric council frequencies" />
                
                <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Animation Fluidity</label>
                    <Slider value={settings.animationSpeed} min={0.5} max={2} step={0.25} onChange={(v) => onUpdate({...settings, animationSpeed: v})} />
                    <div className="flex justify-between text-[8px] text-zinc-700 font-bold uppercase tracking-tighter"><span>Measured</span><span>Fluid</span><span>Ethereal</span></div>
                </div>
            </div>
        </Section>

        {/* SECTION 5: VOICE & AUDIO */}
        <Section title="Voice & Audio" icon={AudioLines}>
            <div className="space-y-4 p-5 bg-zinc-900/40 border border-zinc-800 rounded-3xl">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Voice Frequencies</label>
                <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_VOICES.map(v => (
                        <button 
                            key={v.id} 
                            onClick={() => onUpdate({...settings, voiceName: v.id})}
                            className={`p-2 rounded-xl border text-[9px] font-bold uppercase transition-all ${settings.voiceName === v.id ? 'bg-lux-gold border-lux-gold text-black' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'}`}
                        >
                            {v.label.split(' ')[0]}
                        </button>
                    ))}
                </div>
                <button className="w-full py-2 bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all">Use Persona Defaults</button>
                <SettingToggle label="Voice Replies" active={settings.voiceReplies} onClick={() => toggle('voiceReplies')} />
                <SettingToggle label="Auto-play Audio" active={settings.autoPlayAudio} onClick={() => toggle('autoPlayAudio')} />
                <SettingToggle label="Sound Effects" active={settings.soundEffects} onClick={() => toggle('soundEffects')} />
                <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Voice Velocity</label>
                    <Slider value={settings.voiceSpeed} min={0.5} max={2} onChange={(v) => onUpdate({...settings, voiceSpeed: v})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Master Amplitude</label>
                    <Slider value={settings.volume} onChange={(v) => onUpdate({...settings, volume: v})} />
                </div>
            </div>
        </Section>

        {/* SECTION 6: SANCTUARY MODULES */}
        <Section title="Sanctuary Modules" icon={ShieldCheck}>
            <div className="space-y-3">
                <SettingToggle label="Emotional Timeline" active={settings.showTimeline} onClick={() => toggle('showTimeline')} />
                <SettingToggle label="Life Events" active={settings.showLifeEvents} onClick={() => toggle('showLifeEvents')} />
                <SettingToggle label="Dream Oracle" active={settings.showDreamOracle} onClick={() => toggle('showDreamOracle')} />
                <SettingToggle label="Life Domains Map" active={settings.showLifeDomains} onClick={() => toggle('showLifeDomains')} />
                <SettingToggle label="The Vault" active={settings.showVault} onClick={() => toggle('showVault')} />
                <SettingToggle label="Nina Sanctuary" active={settings.showNina} onClick={() => toggle('showNina')} />
                <SettingToggle label="Health Dashboard" active={settings.showHealth} onClick={() => toggle('showHealth')} />
            </div>
        </Section>

        {/* SECTION 7: MODES (Expansion) */}
        <Section title="Modes" icon={Zap}>
            <div className="p-6 border border-dashed border-zinc-800 rounded-3xl text-center">
                <Sparkles size={24} className="mx-auto text-zinc-800 mb-2" />
                <p className="text-[10px] text-zinc-600 uppercase font-bold">Future Frequency Expansion Slotted</p>
            </div>
        </Section>

        <div className="mt-12 text-center pb-12">
            <button 
                onClick={() => { triggerHaptic('heavy'); performSystemRepair('LEVEL_3'); }}
                className="px-6 py-2 bg-red-950/20 text-red-500 border border-red-900/30 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
                Factory Seal Device
            </button>
        </div>
      </div>
    </div>
  );
};
