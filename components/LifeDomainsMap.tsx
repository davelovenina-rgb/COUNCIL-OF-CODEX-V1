
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Briefcase, Heart, Zap, Coffee, BookOpen, User, DollarSign, Edit2, X } from 'lucide-react';
import { ViewState, LifeDomainState } from '../types';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';

interface LifeDomainsMapProps {
    onNavigate: (view: ViewState) => void;
    domains: LifeDomainState[];
    onUpdateDomain: (id: string, updates: Partial<LifeDomainState>) => void;
}

const DOMAIN_ICONS: Record<string, any> = {
    'health': Activity,
    'spirit': Heart,
    'career': Briefcase,
    'finance': DollarSign,
    'growth': BookOpen,
    'relationships': User,
    'creativity': Zap,
    'rest': Coffee
};

export const LifeDomainsMap: React.FC<LifeDomainsMapProps> = ({ onNavigate, domains, onUpdateDomain }) => {
    const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState(50);
    const [editNote, setEditNote] = useState('');

    const openCalibration = (id: string) => {
        const d = domains.find(x => x.id === id);
        if (d) {
            setSelectedDomainId(id);
            setEditValue(d.value);
            setEditNote(d.note);
            playUISound('toggle');
            triggerHaptic('medium');
        }
    };

    const handleSave = () => {
        if (selectedDomainId) {
            onUpdateDomain(selectedDomainId, {
                value: editValue,
                note: editNote,
                lastUpdated: Date.now()
            });
            playUISound('success');
            triggerHaptic('success');
            setSelectedDomainId(null);
        }
    };

    // Calculate Polygon Points
    const numPoints = domains.length;
    const radius = 120;
    const center = 150;
    
    const getPoint = (index: number, value: number) => {
        const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2;
        const r = (value / 100) * radius;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
    };

    const polyPoints = domains.map((d, i) => getPoint(i, d.value)).join(" ");
    const bgPoints = domains.map((d, i) => getPoint(i, 100)).join(" ");
    const midPoints = domains.map((d, i) => getPoint(i, 50)).join(" ");

    const selectedDomain = domains.find(d => d.id === selectedDomainId);

    return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            
            {/* Background Grid Ambience */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                     backgroundSize: '40px 40px'
                 }} 
            />

            <div className="relative z-10 max-w-lg w-full flex-1 flex flex-col justify-center">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Life Compass</h2>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Tap a node to Calibrate</p>
                </div>

                <div className="relative aspect-square w-full max-w-[360px] mx-auto">
                    <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl">
                        {/* Background Webs */}
                        <polygon points={bgPoints} fill="none" stroke="#333" strokeWidth="1" />
                        <polygon points={midPoints} fill="none" stroke="#222" strokeWidth="1" strokeDasharray="4 4" />
                        
                        {/* Connectors to center */}
                        {domains.map((d, i) => {
                            const end = getPoint(i, 100);
                            return <line key={`line-${i}`} x1={center} y1={center} x2={end.split(',')[0]} y2={end.split(',')[1]} stroke="#222" strokeWidth="1" />;
                        })}

                        {/* The Data Shape */}
                        <motion.polygon 
                            points={polyPoints} 
                            fill="rgba(59, 130, 246, 0.2)" 
                            stroke="#3B82F6" 
                            strokeWidth="2"
                            initial={{ scale: 0, opacity: 0, transformOrigin: 'center' }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1, type: 'spring' }}
                        />
                        
                        {/* Domain Icons/Points */}
                        {domains.map((d, i) => {
                            const pos = getPoint(i, 115); // Push out slightly for icon
                            const [x, y] = pos.split(',').map(Number);
                            const Icon = DOMAIN_ICONS[d.id] || Activity;
                            
                            return (
                                <g key={d.id} onClick={() => openCalibration(d.id)} className="cursor-pointer group">
                                    <foreignObject x={x - 16} y={y - 16} width="32" height="32">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-zinc-800 bg-zinc-900 group-hover:scale-110 transition-transform shadow-lg`} style={{ borderColor: d.color }}>
                                            <Icon size={14} color={d.color} />
                                        </div>
                                    </foreignObject>
                                    <foreignObject x={x - 40} y={y + 18} width="80" height="20">
                                        <div className="text-[9px] text-center text-zinc-500 font-bold uppercase">{d.label} {d.value}%</div>
                                    </foreignObject>
                                </g>
                            );
                        })}
                    </svg>

                    {/* Central Pulsing Core */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[2px] animate-pulse pointer-events-none" />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 w-full max-w-lg">
                <button 
                    onClick={() => onNavigate(ViewState.Health)}
                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-3 hover:bg-zinc-900 transition-colors"
                >
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Activity size={20} /></div>
                    <div className="text-left">
                        <div className="text-sm font-bold text-white">Body</div>
                        <div className="text-xs text-zinc-500">View Health Data</div>
                    </div>
                </button>
                 <button 
                    onClick={() => onNavigate(ViewState.CouncilHall)} 
                    className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-3 hover:bg-zinc-900 transition-colors"
                >
                    <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><Heart size={20} /></div>
                    <div className="text-left">
                        <div className="text-sm font-bold text-white">Soul</div>
                        <div className="text-xs text-zinc-500">Sanctuary</div>
                    </div>
                </button>
            </div>

            {/* CALIBRATION MODAL */}
            <AnimatePresence>
                {selectedDomain && (
                    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-800 p-6 shadow-2xl pb-10"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Edit2 size={16} style={{ color: selectedDomain.color }} />
                                    Calibrate {selectedDomain.label}
                                </h3>
                                <button onClick={() => setSelectedDomainId(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs text-zinc-500 font-bold uppercase">Current Level</label>
                                        <span className="text-sm font-bold text-white">{editValue}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="100" 
                                        value={editValue} 
                                        onChange={(e) => setEditValue(parseInt(e.target.value))}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider-thumb-custom"
                                        style={{ accentColor: selectedDomain.color }}
                                    />
                                    <div className="flex justify-between text-[9px] text-zinc-600 mt-1 uppercase font-medium">
                                        <span>Neglected</span>
                                        <span>Maintained</span>
                                        <span>Thriving</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">Focus Note</label>
                                    <textarea 
                                        value={editNote}
                                        onChange={(e) => setEditNote(e.target.value)}
                                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-white outline-none resize-none h-20"
                                        placeholder={`What is your focus for ${selectedDomain.label.toLowerCase()}?`}
                                    />
                                </div>

                                <button 
                                    onClick={handleSave}
                                    className="w-full py-3.5 font-bold rounded-xl text-black hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: selectedDomain.color }}
                                >
                                    Confirm Balance
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};
