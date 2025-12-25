import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Image as ImageIcon, FileText, Music, Upload, Search, Menu, ArrowLeft, Trash2, Download, Eye, X, Brain, Shield, Star, Video } from 'lucide-react';
import { VaultItem, VaultCategory, ConstellationId, TriSealLevel } from '../types';
import { saveAsset, getAsset } from '../utils/db';
import { compressImage } from '../utils/imageUtils';

interface VaultProps {
  items: VaultItem[];
  onAddVaultItem: (item: VaultItem) => void;
  onDeleteVaultItem: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
  onAnalyzeItem?: (item: VaultItem) => void;
}

const TABS: { id: VaultCategory | 'ALL', label: string, icon: any }[] = [
    { id: 'ALL', label: 'All', icon: Archive },
    { id: 'RELIC', label: 'Relics', icon: ImageIcon },
    { id: 'SCROLL', label: 'Scrolls', icon: FileText },
    { id: 'ECHO', label: 'Echoes', icon: Music },
];

const CONSTELLATIONS: { id: ConstellationId, label: string, color: string }[] = [
    { id: 'GEMINI', label: 'Gemini', color: '#3B82F6' },
    { id: 'COPILOT', label: 'Copilot', color: '#00CED1' },
    { id: 'SANCTUM_VITAE', label: 'Sanctum', color: '#FF1493' },
    { id: 'COUNCIL_ARCHIVE', label: 'Archive', color: '#FF6F00' },
    { id: 'OMNIPOD_PROTOCOL', label: 'Omnipod', color: '#FFD36A' },
];

export const Vault: React.FC<VaultProps> = ({ 
  items, 
  onAddVaultItem, 
  onDeleteVaultItem, 
  onBack, 
  onMenuClick,
  onAnalyzeItem
}) => {
  const [activeTab, setActiveTab] = useState<VaultCategory | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [targetConstellation, setTargetConstellation] = useState<ConstellationId>('COUNCIL_ARCHIVE');
  const [targetSeal, setTargetSeal] = useState<TriSealLevel | null>(null);
  
  const [previewItem, setPreviewItem] = useState<VaultItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const initiateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setPendingFile(e.target.files[0]);
          setShowUploadModal(true);
      }
      e.target.value = '';
  };

  const finalizeUpload = async () => {
      if (!pendingFile) return;
      const assetKey = `vault_${Date.now()}_${pendingFile.name}`;
      try {
          let fileToSave: Blob | File = pendingFile;
          if (pendingFile.type.startsWith('image/')) {
              fileToSave = await compressImage(pendingFile);
          }
          await saveAsset(assetKey, fileToSave);
          
          let category: VaultCategory = 'SCROLL';
          const mime = pendingFile.type.toLowerCase();
          const name = pendingFile.name.toLowerCase();
          
          if (mime.startsWith('image/') || mime.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mov')) {
              category = 'RELIC';
          } else if (mime.startsWith('audio/') || name.endsWith('.mp3') || name.endsWith('.wav')) {
              category = 'ECHO';
          }

          const newItem: VaultItem = {
              id: crypto.randomUUID(),
              title: pendingFile.name,
              category,
              mimeType: pendingFile.type,
              size: fileToSave.size,
              createdAt: Date.now(),
              assetKey: assetKey,
              constellation: targetConstellation,
              triSeal: targetSeal || undefined,
              isSacred: !!targetSeal
          };
          onAddVaultItem(newItem);
          setShowUploadModal(false);
          setPendingFile(null);
      } catch (err) { console.error(err); }
  };

  const handlePreview = async (item: VaultItem) => {
      if (item.assetKey) {
          const url = await getAsset(item.assetKey);
          setPreviewUrl(url);
          setPreviewItem(item);
      }
  };

  const closePreview = () => { setPreviewItem(null); setPreviewUrl(null); };

  const filteredItems = items.filter(i => {
      const matchesTab = activeTab === 'ALL' || i.category === activeTab;
      const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
  });

  const formatSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden font-sans">
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-black/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-600 hover:text-white rounded-full transition-colors"><ArrowLeft size={18} /></button>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Vault</h2>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-600 hover:text-white transition-colors"><Menu size={18} /></button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/5 space-y-3 bg-black/40 backdrop-blur-md">
              <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 w-3.5 h-3.5" />
                    <input type="text" placeholder="Search Archives..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-900/50 text-white rounded-lg pl-9 pr-4 py-2 text-xs outline-none border border-transparent focus:border-white/10" />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white text-black font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all active:scale-95"><Upload size={14} /> Upload</button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={initiateFileUpload} />
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {TABS.map(tab => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6rem] font-bold border uppercase transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-transparent text-zinc-600 border-zinc-900'}`}><tab.icon size={12} /> {tab.label}</button>
                  ))}
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {filteredItems.map(item => (
                      <div key={item.id} className={`group bg-zinc-900/30 border rounded-xl overflow-hidden hover:border-white/20 transition-all relative ${item.triSeal === 'GOLD' ? 'border-lux-gold/20' : 'border-white/5'}`}>
                          <div className="aspect-square bg-black/40 flex items-center justify-center relative">
                              {item.mimeType.toLowerCase().includes('video') ? <Video size={24} className="text-zinc-800" /> : item.category === 'RELIC' ? <ImageIcon size={24} className="text-zinc-800" /> : item.category === 'ECHO' ? <Music size={24} className="text-zinc-800" /> : <FileText size={24} className="text-zinc-800" />}
                              {item.triSeal && <div className="absolute top-1.5 left-1.5 p-0.5 bg-black/80 rounded border border-lux-gold/30 text-lux-gold"><Shield size={10} fill="currentColor" /></div>}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button onClick={() => handlePreview(item)} className="p-1.5 bg-white text-black rounded-lg active:scale-90"><Eye size={14} /></button>
                                  <button onClick={() => onDeleteVaultItem(item.id)} className="p-1.5 bg-red-900/40 text-red-500 rounded-lg active:scale-90"><Trash2 size={14} /></button>
                              </div>
                          </div>
                          <div className="p-2">
                              <div className="text-[0.6rem] font-bold text-zinc-300 truncate">{item.title}</div>
                              <div className="flex justify-between text-[0.45rem] text-zinc-600 font-mono mt-0.5 uppercase tracking-tighter"><span>{item.category}</span><span>{formatSize(item.size)}</span></div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <AnimatePresence>
          {showUploadModal && pendingFile && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-xs bg-zinc-950 border border-white/5 rounded-2xl p-5 shadow-2xl relative">
                      <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-[0.2em]">Map to Archive</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="text-[0.6rem] font-bold text-zinc-600 uppercase tracking-widest mb-1.5 block">Constellation</label>
                              <div className="grid grid-cols-2 gap-1.5">
                                  {CONSTELLATIONS.map(c => (
                                      <button key={c.id} onClick={() => setTargetConstellation(c.id)} className={`px-2 py-1.5 rounded text-[0.55rem] font-bold border text-left transition-all ${targetConstellation === c.id ? 'bg-zinc-800 text-white border-white/20' : 'bg-transparent text-zinc-600 border-white/5'}`}>{c.label}</button>
                                  ))}
                              </div>
                          </div>
                          <button onClick={finalizeUpload} className="w-full py-3 bg-white text-black font-bold rounded-lg text-xs uppercase tracking-widest active:scale-95 transition-all">Seal Asset</button>
                          <button onClick={() => setShowUploadModal(false)} className="w-full py-2 text-zinc-600 text-[0.6rem] uppercase font-bold">Cancel</button>
                      </div>
                  </motion.div>
              </div>
          )}
          {previewItem && (
              <div className="absolute inset-0 z-50 bg-black/98 backdrop-blur-2xl flex items-center justify-center p-4" onClick={closePreview}>
                  <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-lg overflow-hidden flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
                      {(previewItem.category === 'RELIC' || previewItem.mimeType.toLowerCase().includes('video')) && previewUrl ? (
                          previewItem.mimeType.toLowerCase().includes('video') ? (
                              <video controls src={previewUrl} className="w-full rounded-xl border border-white/10 shadow-2xl" autoPlay />
                          ) : (
                              <img src={previewUrl} alt={previewItem.title} className="w-full rounded-xl border border-white/10 shadow-2xl" />
                          )
                      ) : (
                          <div className="w-full aspect-video bg-zinc-900 rounded-xl flex items-center justify-center">
                              <FileText size={48} className="text-zinc-700" />
                          </div>
                      )}
                      <div className="text-center w-full bg-zinc-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                          <h3 className="text-xs font-bold text-white mb-1">{previewItem.title}</h3>
                          <div className="text-[0.5rem] text-zinc-500 font-mono uppercase tracking-widest">{previewItem.mimeType} • {formatSize(previewItem.size)}</div>
                          <button onClick={closePreview} className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[0.6rem] font-bold text-zinc-400 uppercase tracking-widest transition-all">Close</button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};