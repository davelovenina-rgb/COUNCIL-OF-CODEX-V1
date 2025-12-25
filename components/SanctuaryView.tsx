
import React from 'react';
import { Menu, Construction } from 'lucide-react';

interface SanctuaryViewProps {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
  icon?: React.ElementType;
}

export const SanctuaryView: React.FC<SanctuaryViewProps> = ({ title, subtitle, onMenuClick, icon: Icon }) => {
  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 flex items-center gap-4 bg-zinc-950/80 backdrop-blur shrink-0">
        <button onClick={onMenuClick} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full">
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {Icon && <Icon size={18} className="text-zinc-400" />}
            {title}
          </h2>
          <p className="text-xs text-zinc-500 uppercase tracking-wider">{subtitle}</p>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
        <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
          {Icon ? <Icon size={40} className="opacity-20" /> : <Construction size={40} className="opacity-20" />}
        </div>
        <h3 className="text-xl font-medium text-zinc-300 mb-2">{title} Active</h3>
        <p className="max-w-md">
          The {title} module is initialized in the Sanctuary. 
          Connect with the Council to populate this domain.
        </p>
      </div>
    </div>
  );
};
