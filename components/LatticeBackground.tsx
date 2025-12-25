
import React from 'react';
import { motion } from 'framer-motion';

export const LatticeBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 bg-black pointer-events-none overflow-hidden" style={{ willChange: 'transform' }}>
        
        {/* 1. Base Grain */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* 2. Deep Lux Nebulas (Reduced Complexity) */}
        <motion.div 
            className="absolute top-[-30%] left-[-10%] w-[80%] h-[80%] bg-amber-900/10 rounded-full blur-[150px]"
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* 3. The Golden Dust (Reduced Particle Count) */}
        <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-[2px] h-[2px] bg-lux-gold rounded-full opacity-20"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 5
                    }}
                />
            ))}
        </div>

        {/* 4. Sacred Grid Overlay (Static) */}
        <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ 
                backgroundImage: 'linear-gradient(rgba(212, 175, 55, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212, 175, 55, 0.1) 1px, transparent 1px)',
                backgroundSize: '80px 80px'
            }}
        />
        
        {/* 5. Central Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
};
