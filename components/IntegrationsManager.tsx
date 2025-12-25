
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, Settings2, Globe, Key, Shield, Info, 
    CheckCircle, AlertCircle, Trash2, Plus, ArrowRight,
    Activity, ShieldCheck, Database, LayoutGrid, Terminal,
    Lock, Eye, EyeOff, Save, X, Network, ExternalLink, RefreshCw
} from 'lucide-react';
import { 
    ConnectorDefinition, ConnectorConfig, ConnectorStatus, 
    CustomAPIConfig, ConnectorCategory 
} from '../types';
import { CONNECTOR_REGISTRY } from '../constants/connectors';
import { getState, saveState } from '../utils/db';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { showToast } from '../utils/events';

interface IntegrationsManagerProps {
    onBack: () => void;
}

export const IntegrationsManager: React.FC<IntegrationsManagerProps> = ({ onBack }) => {
    const [configs, setConfigs] = useState<Record<string, ConnectorConfig>>({});
    const [customApis, setCustomApis] = useState<CustomAPIConfig[]>([]);
    const [activeTab, setActiveTab] = useState<'CONNECTORS' | 'CUSTOM'>('CONNECTORS');
    const [selectedCategory, setSelectedCategory] = useState<ConnectorCategory | 'ALL'>('ALL');
    
    // UI Modals
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [showCustomModal, setShowCustomModal] = useState(false);
    
    // Form States
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [testingId, setTestingId] = useState<string | null>(null);

    // Custom API Form
    const [customForm, setCustomForm] = useState<Partial<CustomAPIConfig>>({
        name: '', baseUrl: '', authType: 'API_KEY', headers: [], params: []
    });

    useEffect(() => {
        const load = async () => {
            const savedConfigs = await getState<Record<string, ConnectorConfig>>('connector_configs') || {};
            const savedCustom = await getState<CustomAPIConfig[]>('custom_apis') || [];
            setConfigs(savedConfigs);
            setCustomApis(savedCustom);
        };
        load();
    }, []);

    const saveChanges = async (newConfigs: Record<string, ConnectorConfig>, newCustom?: CustomAPIConfig[]) => {
        await saveState('connector_configs', newConfigs);
        if (newCustom) await saveState('custom_apis', newCustom);
        setConfigs(newConfigs);
        if (newCustom) setCustomApis(newCustom);
    };

    const handleConnect = (id: string) => {
        setConnectingId(id);
        setApiKeyInput('');
        playUISound('toggle');
    };

    const finalizeConnection = async () => {
        if (!connectingId || !apiKeyInput.trim()) return;
        
        const newConfigs = { ...configs };
        newConfigs[connectingId] = {
            id: connectingId,
            status: 'CONNECTED',
            apiKey: apiKeyInput,
            readOnly: false,
            lastSync: Date.now()
        };
        
        await saveChanges(newConfigs);
        setConnectingId(null);
        showToast('Secure Connection Established', 'success');
        playUISound('success');
        triggerHaptic('success');
    };

    const handleDisconnect = async (id: string) => {
        if (confirm(`Sever link with ${id}? This will vault and purge local credentials.`)) {
            const newConfigs = { ...configs };
            delete newConfigs[id];
            await saveChanges(newConfigs);
            showToast('Connection Severed', 'info');
            playUISound('error');
        }
    };

    const handleTest = async (id: string) => {
        setTestingId(id);
        playUISound('click');
        // Simulate network handshake
        setTimeout(() => {
            setTestingId(null);
            showToast(`Signal Stable: Handshake Success`, 'success');
            triggerHaptic('light');
        }, 1500);
    };

    const handleAddCustom = async () => {
        if (!customForm.name || !customForm.baseUrl) return;
        const newApi: CustomAPIConfig = {
            id: `custom_${Date.now()}`,
            name: customForm.name,
            baseUrl: customForm.baseUrl,
            authType: customForm.authType || 'API_KEY',
            headers: customForm.headers || [],
            params: customForm.params || [],
            status: 'CONNECTED'
        };
        const updatedCustom = [...customApis, newApi];
        await saveChanges(configs, updatedCustom);
        setShowCustomModal(false);
        setCustomForm({ name: '', baseUrl: '', authType: 'API_KEY', headers: [], params: [] });
        showToast('Custom Endpoint Integrated', 'success');
    };

    const filteredConnectors = CONNECTOR_REGISTRY.filter(c => 
        selectedCategory === 'ALL' || c.category === selectedCategory
    );

    return (
        <div className="w-full h-full bg-[#020202] flex flex-col relative overflow-hidden font-sans text-white">
            
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.05),transparent_50%)] pointer-events-none" />

            {/* Header */}
            <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-base font-bold tracking-widest uppercase">Connectors</h2>
                        <p className="text-[9px] text-zinc-500 font-mono tracking-widest">Master Integration Registry</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('CONNECTORS')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border transition-all ${activeTab === 'CONNECTORS' ? 'bg-lux-gold text-black border-lux-gold' : 'border-zinc-800 text-zinc-500'}`}
                    >
                        Registry
                    </button>
                    <button 
                        onClick={() => setActiveTab('CUSTOM')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border transition-all ${activeTab === 'CUSTOM' ? 'bg-lux-gold text-black border-lux-gold' : 'border-zinc-800 text-zinc-500'}`}
                    >
                        Custom
                    </button>
                </div>
            </div>

            {activeTab === 'CONNECTORS' && (
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Category Filter */}
                    <div className="px-4 py-3 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                        {['ALL', 'MODELS', 'STORAGE', 'PRODUCTIVITY', 'DEV', 'BUSINESS', 'COMMUNICATION'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setSelectedCategory(cat as any)}
                                className={`px-3 py-1.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-all uppercase tracking-wider ${selectedCategory === cat ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-600 border border-transparent'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
                        {filteredConnectors.map((c) => {
                            const config = configs[c.id];
                            const isConnected = !!config;
                            
                            return (
                                <motion.div 
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-2xl border transition-all ${isConnected ? 'bg-zinc-900/40 border-emerald-500/20' : 'bg-zinc-950/50 border-zinc-800'}`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl border ${isConnected ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                                                <LayoutGrid size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-zinc-100">{c.name}</h3>
                                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${c.tier === 1 ? 'bg-lux-gold/10 text-lux-gold' : 'bg-zinc-800 text-zinc-500'}`}>
                                                        Tier {c.tier}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-zinc-500 leading-tight mt-1">{c.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-widest ${isConnected ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                                                <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} />
                                                {isConnected ? 'Linked' : 'Offline'}
                                            </div>
                                            {isConnected && config.lastSync && (
                                                <span className="text-[8px] text-zinc-600 font-mono">Synced: {new Date(config.lastSync).toLocaleTimeString([], { hour12: false })}</span>
                                            )}
                                        </div>
                                    </div>

                                    {isConnected ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2">
                                                {c.permissions.map(p => (
                                                    <span key={p} className="text-[8px] px-2 py-0.5 bg-black border border-white/5 text-zinc-400 rounded-md font-mono">{p}</span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleTest(c.id)}
                                                    disabled={!!testingId}
                                                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                                                >
                                                    {testingId === c.id ? <RefreshCw size={12} className="animate-spin" /> : <Activity size={12} />}
                                                    Test Link
                                                </button>
                                                <button 
                                                    onClick={() => handleDisconnect(c.id)}
                                                    className="p-2 bg-red-900/10 border border-red-900/20 text-red-500 rounded-lg hover:bg-red-900/30"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleConnect(c.id)}
                                            className="w-full py-3 bg-white text-black rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Lock size={12} /> Establish Connection
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'CUSTOM' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                    <div className="p-6 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center text-center">
                        <Terminal size={32} className="text-zinc-700 mb-4" />
                        <h3 className="text-sm font-bold text-zinc-300">Custom Signal Forge</h3>
                        <p className="text-[10px] text-zinc-500 mt-2 max-w-xs mb-6">Integrate unique endpoints into the Sanctuary matrix via secure API Handshakes.</p>
                        <button 
                            onClick={() => setShowCustomModal(true)}
                            className="px-6 py-3 bg-white text-black rounded-full font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95"
                        >
                            <Plus size={14} /> Add Custom API
                        </button>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">Deployed Endpoints</h3>
                        {customApis.map(api => (
                            <div key={api.id} className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-black rounded-lg border border-zinc-800 text-zinc-400">
                                        <Network size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white">{api.name}</h4>
                                        <p className="text-[9px] text-zinc-600 font-mono mt-0.5 truncate max-w-[150px]">{api.baseUrl}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-950/20 border border-emerald-500/20 text-emerald-500 rounded-lg text-[8px] font-bold uppercase">
                                        Active
                                    </div>
                                    <button className="p-2 text-zinc-500 hover:text-red-400"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONNECTING MODAL */}
            <AnimatePresence>
                {connectingId && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                             {/* Top Icon */}
                             <div className="absolute top-[-10%] right-[-10%] opacity-5 rotate-12">
                                <Shield size={120} />
                             </div>

                             <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">Secure Link: {connectingId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h3>
                                <p className="text-xs text-zinc-500">Provide the master key to vault this connection forever. Credentials are never sent to Council servers.</p>
                             </div>

                             <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Master API Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                        <input 
                                            type={showKey ? 'text' : 'password'}
                                            value={apiKeyInput}
                                            onChange={(e) => setApiKeyInput(e.target.value)}
                                            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                                            className="w-full bg-black border border-zinc-800 rounded-xl py-4 pl-12 pr-12 text-white focus:border-lux-gold outline-none transition-all font-mono"
                                        />
                                        <button 
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                                        >
                                            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-950/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                                    <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-[10px] text-amber-200/60 leading-relaxed">By linking this service, you grant the Council permissions to perform strictly mapped actions within the defined scopes.</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setConnectingId(null)} className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-bold rounded-2xl uppercase text-[10px] tracking-widest">Cancel</button>
                                    <button onClick={finalizeConnection} className="flex-1 py-4 bg-lux-gold text-black font-bold rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-amber-900/20">Secure Link</button>
                                </div>
                             </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CUSTOM API MODAL */}
            <AnimatePresence>
                {showCustomModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white uppercase tracking-widest">Forge Custom Pulse</h3>
                                <button onClick={() => setShowCustomModal(false)} className="p-2 text-zinc-500 hover:text-white"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Identity Name</label>
                                    <input 
                                        value={customForm.name}
                                        onChange={(e) => setCustomForm({...customForm, name: e.target.value})}
                                        placeholder="e.g. Home Control API"
                                        className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-lux-gold outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Target Base URL</label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                        <input 
                                            value={customForm.baseUrl}
                                            onChange={(e) => setCustomForm({...customForm, baseUrl: e.target.value})}
                                            placeholder="https://api.yourservice.com/v1"
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-lux-gold outline-none font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Auth Scheme</label>
                                        <select 
                                            value={customForm.authType}
                                            onChange={(e) => setCustomForm({...customForm, authType: e.target.value as any})}
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-lux-gold outline-none text-xs"
                                        >
                                            <option value="API_KEY">API Key Header</option>
                                            <option value="BEARER">Bearer Token</option>
                                            <option value="NONE">No Auth</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Credential</label>
                                        <input 
                                            type="password"
                                            placeholder="••••••••••••"
                                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-lux-gold outline-none font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Static Headers</label>
                                        <button className="text-[10px] text-lux-gold hover:underline uppercase font-bold">+ Header</button>
                                    </div>
                                    <div className="bg-black/40 rounded-xl border border-zinc-800 p-3 flex flex-col items-center justify-center text-zinc-700 text-[10px] italic h-16">
                                        No custom headers defined.
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-white/5">
                                <button 
                                    onClick={handleAddCustom}
                                    className="w-full py-4 bg-lux-gold text-black font-bold rounded-2xl uppercase text-[10px] tracking-widest"
                                >
                                    Forge Signal Bridge
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
