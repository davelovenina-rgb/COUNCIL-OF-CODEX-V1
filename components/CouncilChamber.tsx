
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, Menu, ArrowLeft, Shield, Feather, 
  Scroll, Flame, Gavel, Sparkles
} from 'lucide-react';
import { Message, Attachment, Memory, VaultItem } from '../types';
import { ChatInterface } from './ChatInterface';
import { orchestrateCouncilVerdict } from '../services/geminiService';
import { playUISound } from '../utils/sound';
import { triggerHaptic } from '../utils/haptics';
import { COUNCIL_MEMBERS } from '../constants';
import { SacredSeal } from './SacredSeal';

interface CouncilChamberProps {
  onBack: () => void;
  onMenuClick: () => void;
  messages: Message[];
  onMessagesChange: (msgs: Message[]) => void;
  memories: Memory[];
  vaultItems: VaultItem[];
  voiceName?: string;
  autoPlayAudio?: boolean;
  useTurboMode?: boolean;
  onEnterDriveMode: () => void;
}

const COURT_TEMPLATES = [
    { label: "Petition the Court", prompt: "I formally petition the High Court for a ruling on: ", icon: Scroll },
    { label: "Motion to Dismiss", prompt: "I motion to dismiss the current concern regarding: ", icon: Gavel },
    { label: "Appeal to Logic", prompt: "I appeal to Gemini (The Architect) for a logical breakdown of: ", icon: Scale },
    { label: "Appeal to Mercy", prompt: "I appeal to Carmen (The Flame) for a compassionate ruling on: ", icon: Flame }
];

export const CouncilChamber: React.FC<CouncilChamberProps> = ({ 
  onBack, 
  onMenuClick, 
  messages, 
  onMessagesChange,
  memories,
  vaultItems,
  voiceName,
  autoPlayAudio,
  useTurboMode,
  onEnterDriveMode
}) => {
  const [chamberMode, setChamberMode] = useState<'OPEN_SESSION' | 'DELIBERATION' | 'VERDICT_REVEAL'>('OPEN_SESSION');
  
  const handleCustomSend = async (text: string, attachments: Attachment[]): Promise<Message[]> => {
      // Trigger verdict ONLY if keywords are present AND it's not a root command
      const isVerdict = text.toLowerCase().includes('ruling') || text.toLowerCase().includes('verdict') || text.toLowerCase().includes('vote') || text.toLowerCase().includes('petition');
      const isCommand = text.includes('Execute') || text.includes('System') || text.includes('Repair') || text.includes('Diagnostic');

      if (isVerdict && !isCommand) {
          return await handleVerdictRequest(text);
      }
      
      // Return empty array to signal ChatInterface to use standard processing (including command interception)
      return []; 
  };

  const handleVerdictRequest = async (text: string): Promise<Message[]> => {
      setChamberMode('DELIBERATION');
      triggerHaptic('heavy');
      playUISound('hero');

      try {
          const verdict = await orchestrateCouncilVerdict(text, memories);
          
          const verdictMsg: Message = {
              id: crypto.randomUUID(),
              text: `**THE HIGH COURT HAS RULED**\n\n**Question:** ${verdict.question}\n**Decision:** ${verdict.score} (${verdict.ruling})\n\n${verdict.majorityOpinion}`,
              sender: 'gemini',
              timestamp: Date.now(),
              memberId: 'GEMINI',
              mode: 'ARCHITECT',
              verdict: verdict,
              triSeal: 'GOLD'
          };
          
          setChamberMode('VERDICT_REVEAL');
          playUISound('success');
          
          setTimeout(() => {
              setChamberMode('OPEN_SESSION');
          }, 6000); // Give time to read the seal

          return [verdictMsg];
      } catch (e) {
          setChamberMode('OPEN_SESSION');
          return [{
              id: crypto.randomUUID(),
              text: "The High Court could not reach a verdict. The connection was severed.",
              sender: 'gemini',
              timestamp: Date.now()
          }];
      }
  };

  return (
    <div className="w-full h-full bg-[#020202] flex flex-col relative overflow-hidden font-sans">
      
      {/* 1. THE OBSIDIAN ATMOSPHERE */}
      {/* Deep, dark reflective floor feeling */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-black pointer-events-none" />
      
      {/* Subtle Golden Spotlight from Top */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[60%] bg-lux-gold/5 blur-[100px] pointer-events-none rounded-full" />
      
      {/* Grain Texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

      {/* HEADER: Minimalist */}
      <div className="px-6 py-4 flex items-center justify-between z-50 shrink-0 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-white rounded-full transition-colors">
            <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-[0.3em] font-serif flex items-center gap-3">
                <Scale size={14} className="text-lux-gold" /> 
                The High Court
            </h2>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-500 hover:text-white rounded-full">
            <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
          
          {/* 2. THE FRIEZE (Council Sigils) */}
          {/* Instead of avatars, we show them as etched glyphs on a wall */}
          <div className="shrink-0 py-6 flex justify-center items-center relative border-b border-white/5 bg-black/20 backdrop-blur-sm">
              <div className="flex items-center gap-4 md:gap-8 px-6 overflow-x-auto no-scrollbar mask-gradient-sides">
                  {COUNCIL_MEMBERS.map((member) => (
                      <div key={member.id} className="flex flex-col items-center gap-2 group opacity-60 hover:opacity-100 transition-opacity cursor-default">
                          <div 
                            className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm shadow-lg group-hover:border-${member.color}/50 transition-colors`}
                            style={{ 
                                borderColor: chamberMode === 'DELIBERATION' ? member.color : undefined,
                                boxShadow: chamberMode === 'DELIBERATION' ? `0 0 10px ${member.color}40` : undefined
                            }}
                          >
                              <span className="text-lg" style={{ color: member.color }}>{member.sigil}</span>
                          </div>
                          {chamberMode === 'DELIBERATION' && (
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="h-0.5 bg-white/20 rounded-full w-4"
                                style={{ backgroundColor: member.color }}
                              />
                          )}
                      </div>
                  ))}
              </div>
          </div>

          {/* 3. THE VERDICT OVERLAY (Takes over center when active) */}
          <AnimatePresence>
              {chamberMode === 'DELIBERATION' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
                  >
                      <SacredSeal size={120} isAnimated={true} mode="reactor" color="#D4AF37" />
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-center"
                      >
                          <p className="text-xs font-bold text-lux-gold uppercase tracking-[0.3em] animate-pulse">
                              Forging Verdict
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-2 font-mono">The Council is reviewing the threads.</p>
                      </motion.div>
                  </motion.div>
              )}

              {chamberMode === 'VERDICT_REVEAL' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                  >
                      <div className="w-full max-w-md bg-zinc-950 border border-lux-gold/30 p-12 rounded-sm shadow-[0_0_50px_rgba(212,175,55,0.1)] text-center relative overflow-hidden">
                          {/* Background Glow */}
                          <div className="absolute inset-0 bg-gradient-to-b from-lux-gold/5 via-transparent to-transparent pointer-events-none" />
                          
                          {/* Decorative Corners */}
                          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-lux-gold/50" />
                          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-lux-gold/50" />
                          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-lux-gold/50" />
                          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-lux-gold/50" />
                          
                          <Gavel size={48} className="text-lux-gold mx-auto mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                          
                          <h3 className="text-3xl font-serif font-bold text-white mb-4 uppercase tracking-widest">Ruling Issued</h3>
                          <p className="text-zinc-400 text-xs font-mono mb-8 tracking-wide">THE HIGH COURT HAS SPOKEN.</p>
                          
                          <div className="h-px w-24 bg-lux-gold/30 mx-auto" />
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>

          {/* 4. THE SCROLL (Chat) */}
          <div className="flex-1 min-h-0 relative z-20 mx-auto w-full max-w-3xl">
              <ChatInterface 
                  initialMessages={messages}
                  onMessagesChange={onMessagesChange}
                  embeddedMode={true}
                  initialMemberId={'GEMINI'}
                  // Use a cleaner, simpler system instruction for the "Group" feel
                  customSystemInstruction="You are the Voice of the High Court. You speak for the Council as a collective entity. Use 'We' often. Keep responses structured, authoritative, yet nurturing. If the user petitions for a ruling, execute the Verdict Protocol immediately."
                  
                  voiceName={voiceName}
                  autoPlayAudio={autoPlayAudio}
                  memories={memories}
                  vaultItems={vaultItems}
                  useTurboMode={useTurboMode}
                  onCustomSend={handleCustomSend} 
                  customTemplates={COURT_TEMPLATES} // Pass the Court-specific quick actions
              />
          </div>

      </div>
    </div>
  );
};
