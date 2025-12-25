
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare, Brain, Archive, Folder, ChevronRight, Hash } from 'lucide-react';
import { Session, Memory, VaultItem, Project, ViewState } from '../types';

interface OmniSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewState, id?: string) => void;
  sessions: Session[];
  memories: Memory[];
  vaultItems: VaultItem[];
  projects: Project[];
}

export const OmniSearch: React.FC<OmniSearchProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate,
  sessions,
  memories,
  vaultItems,
  projects
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
      if (isOpen) {
          setQuery('');
          setSelectedIndex(0);
      }
  }, [isOpen]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!isOpen) return;
          if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
      if (!query.trim()) return [];
      
      const lowerQuery = query.toLowerCase();
      const allResults: { type: string, id: string, label: string, detail?: string, icon: any, view: ViewState }[] = [];

      // 1. Projects
      projects.filter(p => p.title.toLowerCase().includes(lowerQuery)).forEach(p => {
          allResults.push({ type: 'PROJECT', id: p.id, label: p.title, detail: p.status, icon: Folder, view: ViewState.Projects });
      });

      // 2. Sessions (Chats)
      sessions.filter(s => s.title.toLowerCase().includes(lowerQuery)).forEach(s => {
          allResults.push({ type: 'CHAT', id: s.id, label: s.title, detail: new Date(s.lastModified).toLocaleDateString(), icon: MessageSquare, view: ViewState.CouncilMember });
      });

      // 3. Vault Items
      vaultItems.filter(v => v.title.toLowerCase().includes(lowerQuery)).forEach(v => {
          allResults.push({ type: 'VAULT', id: v.id, label: v.title, detail: v.category, icon: Archive, view: ViewState.Vault });
      });

      // 4. Memories
      memories.filter(m => m.content.toLowerCase().includes(lowerQuery)).forEach(m => {
          allResults.push({ type: 'MEMORY', id: m.id, label: m.content.substring(0, 50) + '...', detail: m.category, icon: Brain, view: ViewState.MemorySystem });
      });

      return allResults.slice(0, 10);
  }, [query, sessions, memories, vaultItems, projects]);

  const handleSelect = (result: typeof results[0]) => {
      onNavigate(result.view, result.id);
      onClose();
  };

  return (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[15vh] px-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[60vh]"
                >
                    <div className="flex items-center px-4 border-b border-zinc-800 bg-zinc-900/50">
                        <Search className="text-zinc-500 w-5 h-5 mr-3" />
                        <input 
                            autoFocus
                            placeholder="Search the Sanctuary..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    setSelectedIndex(i => Math.min(i + 1, results.length - 1));
                                }
                                if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    setSelectedIndex(i => Math.max(i - 1, 0));
                                }
                                if (e.key === 'Enter' && results[selectedIndex]) {
                                    e.preventDefault();
                                    handleSelect(results[selectedIndex]);
                                }
                            }}
                            className="flex-1 bg-transparent py-4 text-lg text-white outline-none placeholder:text-zinc-600 font-sans"
                        />
                        <div className="flex items-center gap-2">
                            <span className="hidden md:inline-block px-2 py-1 bg-zinc-900 rounded text-[10px] text-zinc-500 font-mono border border-zinc-800">ESC</span>
                            <button onClick={onClose}><X className="text-zinc-500 hover:text-white w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                        {results.length === 0 && query && (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                No signals found in the matrix.
                            </div>
                        )}
                        
                        {results.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => handleSelect(item)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left group transition-colors ${idx === selectedIndex ? 'bg-zinc-900' : 'hover:bg-zinc-900/50'}`}
                                onMouseEnter={() => setSelectedIndex(idx)}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 group-hover:text-lux-gold group-hover:border-lux-gold/30 transition-colors`}>
                                        <item.icon size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-zinc-200 truncate group-hover:text-white">{item.label}</div>
                                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                                            <span className="uppercase tracking-wider">{item.type}</span>
                                            {item.detail && <span className="opacity-50">• {item.detail}</span>}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-zinc-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                            </button>
                        ))}
                    </div>
                    
                    {results.length > 0 && (
                        <div className="bg-zinc-900/50 px-4 py-2 text-[10px] text-zinc-500 flex justify-between items-center border-t border-zinc-900">
                            <span>{results.length} matches found</span>
                            <span className="flex gap-2">
                                <span className="flex items-center gap-1"><Hash size={10} /> Navigate</span>
                                <span className="flex items-center gap-1"><ChevronRight size={10} /> Select</span>
                            </span>
                        </div>
                    )}
                </motion.div>
            </div>
        )}
    </AnimatePresence>
  );
};
