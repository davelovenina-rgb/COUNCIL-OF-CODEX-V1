
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Archive, AlertTriangle } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="absolute top-0 left-0 right-0 z-[60] flex justify-center pt-safe-top pointer-events-none"
        >
          <div className="mx-auto mt-2 bg-zinc-900/90 backdrop-blur-md border border-amber-900/50 text-amber-500 px-4 py-2 rounded-full flex items-center gap-3 shadow-lg shadow-black/50 pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <WifiOff size={12} /> Sanctuary Offline
            </span>
            <div className="w-px h-3 bg-amber-900/50" />
            <span className="text-[10px] text-zinc-400 flex items-center gap-1.5">
              <Archive size={12} /> Archives Accessible
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
