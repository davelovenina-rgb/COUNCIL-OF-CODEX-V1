
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToToasts } from '../utils/events';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return subscribeToToasts(({ message, type }) => {
      const id = crypto.randomUUID();
      setToasts(prev => [...prev, { id, message, type }]);
      
      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    });
  }, []);

  return (
    <div className="fixed top-safe-top left-0 right-0 z-[100] pointer-events-none flex flex-col items-center gap-2 pt-4 px-4">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[200px] max-w-sm pointer-events-auto"
          >
            {toast.type === 'success' && <CheckCircle size={16} className="text-emerald-500" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-red-500" />}
            {toast.type === 'info' && <Info size={16} className="text-blue-500" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
