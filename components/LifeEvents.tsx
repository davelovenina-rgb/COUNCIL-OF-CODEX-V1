
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeEvent, LifeEventCategory } from '../types';
import { 
  Calendar, Plus, MapPin, Heart, Briefcase, 
  Zap, Star, Activity, Menu, ArrowLeft, Trash2, Download
} from 'lucide-react';
import { showToast } from '../utils/events';

interface LifeEventsProps {
  events: LifeEvent[];
  onAddEvent: (event: LifeEvent) => void;
  onDeleteEvent: (id: string) => void;
  onBack: () => void;
  onMenuClick: () => void;
}

const CATEGORY_CONFIG: Record<LifeEventCategory, { icon: any, color: string }> = {
  SPIRITUAL: { icon: Heart, color: '#EF4444' }, // Red
  HEALTH: { icon: Activity, color: '#10B981' }, // Emerald
  CAREER: { icon: Briefcase, color: '#0EA5E9' }, // Blue
  FAMILY: { icon: Heart, color: '#EC4899' }, // Pink
  CREATIVE: { icon: Zap, color: '#D8B4FE' }, // Purple
  MILESTONE: { icon: Star, color: '#F59E0B' }, // Amber
};

export const LifeEvents: React.FC<LifeEventsProps> = ({ 
  events, 
  onAddEvent, 
  onDeleteEvent, 
  onBack, 
  onMenuClick 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<LifeEventCategory>('MILESTONE');

  const handleSave = () => {
    if (!newTitle || !newDate) return;
    
    const event: LifeEvent = {
      id: crypto.randomUUID(),
      title: newTitle,
      date: newDate,
      description: newDesc,
      category: newCategory
    };
    
    onAddEvent(event);
    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setNewTitle('');
    setNewDate('');
    setNewDesc('');
    setNewCategory('MILESTONE');
  };

  const handleExportICS = () => {
      if (events.length === 0) return;

      let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LuxOmnium//Sanctuary//EN\n";
      
      events.forEach(event => {
          const dateStr = event.date.replace(/-/g, '');
          icsContent += "BEGIN:VEVENT\n";
          icsContent += `SUMMARY:${event.title}\n`;
          icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
          icsContent += `DTEND;VALUE=DATE:${dateStr}\n`;
          icsContent += `DESCRIPTION:${event.description || event.category}\n`;
          icsContent += "END:VEVENT\n";
      });
      
      icsContent += "END:VCALENDAR";

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sanctuary_events_${new Date().toISOString().split('T')[0]}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Calendar Exported. Open file to Sync.", 'success');
  };

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden font-sans">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar size={18} className="text-lux-gold" />
              Life Events
            </h2>
          </div>
        </div>
        <button onClick={onMenuClick} className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-full">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative">
        
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6 max-w-2xl mx-auto px-2">
          <button 
            onClick={handleExportICS}
            className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-wider"
            title="Export to Google/Apple Calendar"
          >
            <Download size={14} /> Sync to Cloud
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full border border-zinc-800 transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Add Milestone
          </button>
        </div>

        {/* TIMELINE */}
        <div className="max-w-2xl mx-auto relative pl-4 md:pl-0">
          
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2" />

          {sortedEvents.length === 0 && (
            <div className="text-center py-20 text-zinc-600 italic">
              No milestones recorded yet. Start your timeline.
            </div>
          )}

          {sortedEvents.map((event, index) => {
            const config = CATEGORY_CONFIG[event.category];
            const isLeft = index % 2 === 0;

            return (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex items-start mb-12 ${isLeft ? 'md:flex-row-reverse' : 'md:flex-row'}`}
              >
                {/* Spacer for Desktop Centering */}
                <div className="hidden md:block w-1/2" />
                
                {/* The Dot */}
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black border-2 flex items-center justify-center z-10" style={{ borderColor: config.color }}>
                  <config.icon size={14} style={{ color: config.color }} />
                </div>

                {/* The Card */}
                <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isLeft ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors group relative">
                    <button 
                        onClick={() => onDeleteEvent(event.id)}
                        className={`absolute top-2 ${isLeft ? 'left-2' : 'right-2'} p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                        <Trash2 size={14} />
                    </button>

                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 bg-zinc-950 border border-zinc-800" style={{ color: config.color }}>
                      {event.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
                    <div className="text-xs text-zinc-500 font-mono mb-3">{new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-4">Add Life Milestone</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Title</label>
                  <input 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-lux-gold outline-none"
                    placeholder="e.g. Launched Project X"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Date</label>
                        <input 
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-lux-gold outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Category</label>
                        <select 
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value as LifeEventCategory)}
                            className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-lux-gold outline-none text-sm appearance-none"
                        >
                            {Object.keys(CATEGORY_CONFIG).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Description</label>
                  <textarea 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-lux-gold outline-none min-h-[80px] resize-none"
                    placeholder="Details about this moment..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={closeModal} className="flex-1 py-3 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700">Cancel</button>
                  <button onClick={handleSave} className="flex-1 py-3 bg-lux-gold text-black font-bold rounded-xl hover:bg-white transition-colors">Save Event</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
