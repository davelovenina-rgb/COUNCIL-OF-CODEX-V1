import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory, MemoryCategory } from '../types';
import { 
  Brain, Search, Plus, Edit2, Trash2, CheckCircle, 
  User, Heart, Activity, Target, Briefcase, Users, FileText,
  Menu, ArrowLeft, Sparkles, LayoutGrid, Network
} from 'lucide-react';

interface MemorySystemProps {
  memories: Memory[];
  onAddMemory: (memory: Memory) => void;
  onUpdateMemory: (id: string, updates: Partial<Memory>) => void;
  onDeleteMemory: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
}

const CATEGORIES: { id: MemoryCategory | 'ALL', label: string, icon: any, color: string }[] = [
  { id: 'ALL', label: 'All Facts', icon: Brain, color: '#FFFFFF' },
  { id: 'IDENTITY', label: 'Identity', icon: User, color: '#3B82F6' }, // Blue
  { id: 'PREFERENCES', label: 'Habits', icon: Heart, color: '#EC4899' }, // Pink
  { id: 'HEALTH', label: 'Health', icon: Activity, color: '#10B981' }, // Emerald
  { id: 'GOALS', label: 'Goals', icon: Target, color: '#F59E0B' }, // Amber
  { id: 'RELATIONSHIPS', label: 'People', icon: Users, color: '#8B5CF6' }, // Purple
  { id: 'WORK', label: 'Career', icon: Briefcase, color: '#0EA5E9' }, // Sky
  { id: 'SPIRITUAL', label: 'Spirit', icon: Sparkles, color: '#D8B4FE' }, // Lavender
  { id: 'OTHER', label: 'Misc', icon: FileText, color: '#64748B' }, // Slate
];

// Sub-component for the Star Node
const StarNode: React.FC<{ 
    color: string; 
    memory: Memory; 
    onClick: (m: Memory) => void; 
}> = ({ color, memory, onClick }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div 
            className="absolute flex items-center justify-center cursor-pointer group z-10"
            style={{ transform: 'translate(-50%, -50%)' }} // Center anchor
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onClick(memory)}
        >
            {/* The Star */}
            <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: hovered ? 1.5 : 1, boxShadow: hovered ? `0 0 20px ${color}` : `0 0 5px ${color}` }}
                className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white transition-shadow"
                style={{ backgroundColor: color }}
            >
                <div className="absolute inset-0 bg-white opacity-50 rounded-full animate-pulse" />
            </motion.div>

            {/* Tooltip Card */}
            <AnimatePresence>
                {hovered && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 p-3 rounded-xl shadow-2xl z-50 pointer-events-none"
                    >
                        <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>{memory.category}</div>
                        <div className="text-xs text-white line-clamp-3 leading-snug font-medium">{memory.content}</div>
                        <div className="text-[9px] text-zinc-500 mt-2 text-right">{new Date(memory.timestamp).toLocaleDateString()}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const MemorySystem: React.FC<MemorySystemProps> = ({ 
  memories, 
  onAddMemory, 
  onUpdateMemory, 
  onDeleteMemory, 
  onBack, 
  onMenuClick 
}) => {
  const [activeCategory, setActiveCategory] = useState<MemoryCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'LIST' | 'CONSTELLATION'>('LIST');
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('IDENTITY');

  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      const matchesCategory = activeCategory === 'ALL' || m.category === activeCategory;
      const matchesSearch = m.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [memories, activeCategory, searchTerm]);

  // Constellation Logic
  const constellationData = useMemo(() => {
      if (viewMode !== 'CONSTELLATION') return { nodes: [], lines: [] };
      
      const centerX = 50; // Percent
      const centerY = 50; // Percent

      const validCategories = CATEGORIES.filter(c => c.id !== 'ALL');
      const sectorSize = (2 * Math.PI) / validCategories.length;

      // Define Node type explicitly to avoid inference issues in reduce
      type Node = {
          id: string;
          x: number;
          y: number;
          color: string;
          memory: Memory;
      };

      const nodes: Node[] = filteredMemories.map((m) => {
          const catIndex = validCategories.findIndex(c => c.id === m.category);
          const catConfig = validCategories[catIndex] || validCategories[0];
          
          const seed = m.content.length;
          const baseAngle = catIndex * sectorSize;
          const jitterAngle = ((seed % 100) / 100 - 0.5) * sectorSize * 0.8; 
          const angle = baseAngle + sectorSize / 2 + jitterAngle;

          const radius = 15 + ((seed * 13) % 35); // 15% - 50% radius

          return {
              id: m.id,
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle),
              color: catConfig.color,
              memory: m
          };
      });

      // Generate lines between nodes of same category
      const lines: { x1: number, y1: number, x2: number, y2: number, color: string }[] = [];
      
      // Simple connection strategy: Connect nodes in sequence within category
      const grouped = nodes.reduce((acc, node) => {
          const cat = node.memory.category;
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(node);
          return acc;
      }, {} as Record<string, Node[]>);

      Object.values(grouped).forEach(group => {
          for (let i = 0; i < group.length - 1; i++) {
              lines.push({
                  x1: group[i].x,
                  y1: group[i].y,
                  x2: group[i+1].x,
                  y2: group[i+1].y,
                  color: group[i].color
              });
          }
      });

      return { nodes, lines };
  }, [filteredMemories, viewMode]);

  const handleSave = () => {
    if (!newContent.trim()) return;

    if (editingMemory) {
      onUpdateMemory(editingMemory.id, { 
        content: newContent,
        category: newCategory,
        timestamp: Date.now()
      });
    } else {
      const newMem: Memory = {
        id: crypto.randomUUID(),
        content: newContent,
        category: newCategory,
        source: 'User',
        timestamp: Date.now(),
        isVerified: true
      };
      onAddMemory(newMem);
    }
    closeModal();
  };

  const openAddModal = () => {
    setEditingMemory(null);
    setNewContent('');
    setNewCategory(activeCategory === 'ALL' ? 'IDENTITY' : activeCategory);
    setShowEditModal(true);
  };

  const openEditModal = (m: Memory) => {
    setEditingMemory(m);
    setNewContent(m.content);
    setNewCategory(m.category);
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowEditModal(false);
    setEditingMemory(null);
    setNewContent('');
  };

  return (
    <div className="w-full h-full bg-[#050505] flex flex-col relative overflow-hidden font-sans">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Brain size={18} className="text-lux-gold" />
              Memory Core
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button 
                    onClick={() => setViewMode('LIST')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'LIST' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <LayoutGrid size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('CONSTELLATION')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'CONSTELLATION' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Network size={16} />
                </button>
            </div>
            <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full">
                <Menu size={20} />
            </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Controls */}
        <div className="p-4 border-b border-zinc-900 shrink-0 space-y-4 relative z-20 bg-black/50 backdrop-blur-sm">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search the neural network..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/50 text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none border border-transparent focus:border-zinc-800 transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                  activeCategory === cat.id 
                    ? 'bg-zinc-800 text-white border-zinc-700' 
                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <cat.icon size={14} style={{ color: activeCategory === cat.id ? cat.color : undefined }} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
            
            {/* VIEW: CONSTELLATION */}
            {viewMode === 'CONSTELLATION' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 overflow-hidden"
                >
                    {/* Deep Space BG */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#111_0%,#000_100%)]" />
                    
                    {/* The Prism (Center) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white blur-[60px] opacity-10 animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_30px_white]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full" />

                    {/* SVG Lines Layer */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {constellationData.lines.map((line, i) => (
                            <motion.line
                                key={i}
                                x1={`${line.x1}%`}
                                y1={`${line.y1}%`}
                                x2={`${line.x2}%`}
                                y2={`${line.y2}%`}
                                stroke={line.color}
                                strokeWidth="0.5"
                                strokeOpacity="0.3"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                            />
                        ))}
                    </svg>

                    {/* Render Nodes */}
                    <div className="absolute inset-0 w-full h-full">
                        {constellationData.nodes.map(node => (
                            <div key={node.id} style={{ position: 'absolute', left: `${node.x}%`, top: `${node.y}%` }}> 
                                <StarNode 
                                    color={node.color} 
                                    memory={node.memory} 
                                    onClick={openEditModal}
                                />
                            </div>
                        ))}
                    </div>

                    {constellationData.nodes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-zinc-600 text-sm font-mono tracking-widest">SECTOR EMPTY</p>
                        </div>
                    )}
                    
                    <div className="absolute bottom-4 right-4 text-[10px] text-zinc-700 font-mono">
                        NODES: {constellationData.nodes.length}
                    </div>
                </motion.div>
            )}

            {/* VIEW: LIST */}
            {viewMode === 'LIST' && (
                <div className="absolute inset-0 overflow-y-auto p-4 no-scrollbar z-20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                        {activeCategory === 'ALL' ? 'All Memories' : CATEGORIES.find(c => c.id === activeCategory)?.label} ({filteredMemories.length})
                        </h3>
                        <button 
                        onClick={openAddModal}
                        className="text-xs flex items-center gap-1 text-lux-gold hover:text-white transition-colors font-medium px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800"
                        >
                        <Plus size={14} /> Add Fact
                        </button>
                    </div>

                    {filteredMemories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        <Brain size={48} className="text-zinc-800 mb-4" />
                        <p className="text-zinc-500 text-sm">No memories found in this sector.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                        {filteredMemories.map(memory => {
                            const cat = CATEGORIES.find(c => c.id === memory.category);
                            return (
                            <div key={memory.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 group hover:border-zinc-700 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-zinc-200 text-sm leading-relaxed mb-2 font-medium">{memory.content}</p>
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                    {cat && (
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                                        <cat.icon size={10} style={{ color: cat.color }} />
                                        {cat.label}
                                        </span>
                                    )}
                                    <span>Src: <span className="text-zinc-400">{memory.source}</span></span>
                                    <span>{new Date(memory.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(memory)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded">
                                    <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => onDeleteMemory(memory.id)} className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded">
                                    <Trash2 size={14} />
                                    </button>
                                </div>
                                </div>
                            </div>
                            );
                        })}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Edit/Add Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 rounded-2xl border border-zinc-800 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-4">{editingMemory ? 'Edit Memory' : 'Add New Fact'}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Fact / Memory</label>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-lux-gold outline-none min-h-[100px] resize-none"
                    placeholder="E.g. I prefer meetings before 2pm..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter(c => c.id !== 'ALL').map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setNewCategory(cat.id as MemoryCategory)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          newCategory === cat.id
                            ? 'bg-zinc-800 text-white border-zinc-600'
                            : 'bg-black text-zinc-500 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={closeModal} className="flex-1 py-3 bg-zinc-900 text-zinc-400 font-medium rounded-xl hover:bg-zinc-800 border border-zinc-800">Cancel</button>
                  <button onClick={handleSave} className="flex-1 py-3 bg-lux-gold text-black font-bold rounded-xl hover:bg-white transition-colors">Save Memory</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};