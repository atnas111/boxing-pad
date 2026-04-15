'use client';

import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { playArcadePunch } from '@/utils/audio';

interface HitCombo {
  id: number;
  earned: number;
  isLeft: boolean;
  power: number;
  rankTitle: string;
}

const getFighterTitle = (power: number): string => {
  if (power >= 0.95) return "TYSON HOOK! 🥊";
  if (power >= 0.8) return "KHABIB SMASH! 🦅";
  if (power >= 0.6) return "HEAVYWEIGHT! 🏋️‍♂️";
  if (power >= 0.4) return "PRO STRIKE! ⚡";
  return "AMATEUR 🐣";
};

export default function BoxingTarget() {
  const controls = useAnimation();
  const [flash, setFlash] = useState(false);
  const [hits, setHits] = useState<HitCombo[]>([]);

  useEffect(() => {
    const handlePunch = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { power, isLeft, earned } = customEvent.detail;
      
      const directionX = isLeft ? 50 : -50; 
      const swingRot = isLeft ? -15 : 15;
      
      // Играем звук аркадного удара
      playArcadePunch(power);

      // Добавляем очки за удар для рендера pop-up текста
      const hitId = Date.now();
      const rankTitle = getFighterTitle(power);

      setHits(prev => [...prev, { id: hitId, earned, isLeft, power, rankTitle }]);

      // Вспышка на экране
      setFlash(true);
      setTimeout(() => setFlash(false), 120);

      // Анимация удара: груша как бы подвешена сверху, поэтому она крутится и отклоняется
      await controls.start({
        x: directionX,
        rotateZ: swingRot,
        scaleY: 0.95 + (power * 0.05), // Легкое сжатие
        transition: { type: 'spring', stiffness: 500, damping: 10, mass: 2 }
      });
      
      // Возврат
      controls.start({
        x: 0,
        rotateZ: 0,
        scaleY: 1,
        transition: { type: 'spring', stiffness: 200, damping: 15, mass: 1 }
      });
    };

    window.addEventListener('on-punch-hit', handlePunch);
    return () => window.removeEventListener('on-punch-hit', handlePunch);
  }, [controls]);

  return (
    <div className="relative flex flex-col items-center w-full h-[60vh] pointer-events-none mt-[-10vh]">
      
      {/* Рендеринг вылетающих очков и титулов */}
      <AnimatePresence>
        {hits.map(hit => (
          <motion.div
            key={hit.id}
            initial={{ opacity: 1, y: 0, x: hit.isLeft ? -80 : 80, scale: 0.5, rotate: hit.isLeft ? -10 : 10 }}
            animate={{ opacity: 0, y: -200, x: hit.isLeft ? -180 : 180, scale: 1.2 + hit.power, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            onAnimationComplete={() => setHits(prev => prev.filter(h => h.id !== hit.id))}
            className="absolute z-50 flex flex-col items-center pointer-events-none top-[30%]"
          >
            <span className="text-xl md:text-3xl font-black italic tracking-widest text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] uppercase">
              {hit.rankTitle}
            </span>
            <span className="text-6xl md:text-8xl font-black italic tracking-tighter text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
              +{hit.earned}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Target object - 3D Realistic Speed Bag suspended from top */}
      <motion.div
        animate={controls}
        initial={{ rotateZ: 0 }}
        style={{ transformOrigin: 'top center' }}
        whileInView={{
          rotateZ: [-2, 2, -2],
          transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
        }}
        viewport={{ once: false }}
        className="relative z-20 flex flex-col items-center mt-[-5rem]"
      >
        {/* Цепь / крепление */}
        <div className="w-6 h-24 bg-gradient-to-b from-gray-900 via-gray-700 to-black border-x border-gray-600 shadow-[inset_0_0_10px_rgba(0,0,0,1)] rounded-b-md z-0" />
        
        {/* Груша (Teardrop shape / Speed bag / Heavy bag) */}
        <div 
          className="relative w-48 h-72 md:w-64 md:h-96 -mt-4 shadow-[0_30px_60px_-15px_rgba(0,0,0,1),inset_0_0_60px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden z-10"
          style={{ 
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', // Форма классической груши
            background: 'radial-gradient(ellipse at 30% 30%, #a31111 0%, #6e0000 40%, #1a0000 100%)', // 3D кожаная текстура
            boxShadow: 'inset -20px -20px 40px rgba(0,0,0,0.9), inset 10px 10px 30px rgba(255,100,100,0.4), 0 15px 40px rgba(0,0,0,0.8)'
          }}
        >
          {/* Блики и текстура кожи */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] mix-blend-multiply opacity-50" />
          
          <div className="absolute top-[15%] left-[20%] w-1/3 h-1/4 bg-white/20 rounded-full blur-xl rotate-[-20deg]" />

          {/* Центральный индикатор удара / логотип */}
          <div className="relative w-16 h-16 rounded-full border-4 border-red-500/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center justify-center">
             <div className="w-6 h-6 rounded-full bg-red-500 shadow-[0_0_20px_rgba(220,38,38,1)]" />
          </div>
          
          {/* Вспышка урона внутри груши */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: flash ? 1 : 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg-red-400/40 mix-blend-screen rounded-[inherit]"
          />
        </div>
      </motion.div>

      {/* Screen hit flash - Subtle deep red flash */}
      {flash && (
        <div className="fixed inset-0 z-10 bg-red-900/15 pointer-events-none mix-blend-screen transition-opacity duration-300" />
      )}
    </div>
  );
}
