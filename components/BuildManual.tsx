
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Menu, Hammer, Download, Terminal, Smartphone, CheckCircle, Copy } from 'lucide-react';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { showToast } from '../utils/events';
import { SacredSeal } from './SacredSeal';

interface BuildManualProps {
  onBack: () => void;
  onMenuClick: () => void;
}

const STEPS = [
    {
        title: "1. The Foundation",
        desc: "Prepare your local machine.",
        content: `You need a computer (Mac/PC) to forge the shell.
1. Install **Node.js** (v18+).
2. Install **Android Studio** (for APK generation).
3. Open your project folder in a terminal.`
    },
    {
        title: "2. The Engine (Capacitor)",
        desc: "Install the bridge between Web and Native.",
        code: `npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android`
    },
    {
        title: "3. The Blueprint (Config)",
        desc: "Initialize the project identity.",
        content: "I have prepared the configuration file for you. Download it below and place it in your project root folder.",
        action: "DOWNLOAD_CONFIG"
    },
    {
        title: "4. The Compilation",
        desc: "Build the web assets.",
        code: `npm run build`
    },
    {
        title: "5. The Synchronization",
        desc: "Copy web assets to the native layer.",
        code: `npx cap add android
npx cap sync`
    },
    {
        title: "6. The Final Forge",
        desc: "Open Android Studio to build the APK.",
        code: `npx cap open android`,
        content: `Inside Android Studio:
1. Wait for Gradle sync to finish.
2. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Locate the APK and transfer to your phone.`
    }
];

export const BuildManual: React.FC<BuildManualProps> = ({ onBack, onMenuClick }) => {
    const [activeStep, setActiveStep] = useState(0);

    const handleDownloadConfig = () => {
        const config = {
            appId: "com.councilofcodex.sanctuary",
            appName: "Council of Codex",
            webDir: "dist", 
            bundledWebRuntime: false,
            plugins: {
                SplashScreen: {
                    launchShowDuration: 2000,
                    backgroundColor: "#000000"
                }
            }
        };

        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "capacitor.config.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        playUISound('success');
        triggerHaptic('success');
        showToast('Config Downloaded', 'success');
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        showToast('Command Copied', 'info');
        playUISound('click');
    };

    return (
        <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 to-black pointer-events-none" />
            <div 
                className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{ 
                    backgroundImage: 'linear-gradient(to right, #1e3a8a 1px, transparent 1px), linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} 
            />

            <div className="px-4 py-3 border-b border-blue-900/30 flex items-center justify-between bg-black/90 backdrop-blur shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-blue-400/50 hover:text-white rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-blue-100 flex items-center gap-2 uppercase tracking-wide">
                            <Hammer size={18} className="text-blue-500" />
                            The Forge
                        </h2>
                    </div>
                </div>
                <button onClick={onMenuClick} className="p-2 -mr-2 text-blue-400/50 hover:text-white rounded-full transition-colors">
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar relative z-10">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="flex justify-center mb-4">
                            <SacredSeal size={100} color="#3B82F6" isAnimated={true} mode="reactor" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Native Shell Construction</h1>
                        <p className="text-sm text-blue-400/70 max-w-md mx-auto">
                            Protocol for wrapping Council of Codex into an installable Android APK using Capacitor.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {STEPS.map((step, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative pl-8 border-l-2 ${index <= activeStep ? 'border-blue-500' : 'border-zinc-800'}`}
                                onMouseEnter={() => setActiveStep(index)}
                            >
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-black flex items-center justify-center transition-colors ${index <= activeStep ? 'border-blue-500 text-blue-500' : 'border-zinc-800 text-zinc-800'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${index <= activeStep ? 'bg-blue-500' : 'bg-transparent'}`} />
                                </div>
                                <div className="mb-2">
                                    <h3 className={`text-lg font-bold ${index <= activeStep ? 'text-white' : 'text-zinc-500'}`}>{step.title}</h3>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest">{step.desc}</p>
                                </div>
                                <div className={`p-4 rounded-xl border transition-all ${index === activeStep ? 'bg-blue-950/10 border-blue-500/30' : 'bg-zinc-900/20 border-zinc-800'}`}>
                                    {step.content && (
                                        <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans mb-4">
                                            {step.content}
                                        </div>
                                    )}
                                    {step.code && (
                                        <div className="relative group">
                                            <pre className="bg-black/80 p-4 rounded-lg text-xs font-mono text-blue-300 overflow-x-auto border border-zinc-800">
                                                {step.code}
                                            </pre>
                                            <button 
                                                onClick={() => copyCode(step.code!)}
                                                className="absolute top-2 right-2 p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    )}
                                    {step.action === 'DOWNLOAD_CONFIG' && (
                                        <button 
                                            onClick={handleDownloadConfig}
                                            className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                                        >
                                            <Download size={16} /> Download capacitor.config.json
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
