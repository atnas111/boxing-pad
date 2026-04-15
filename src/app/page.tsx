'use client';

import { useRef, useState } from 'react';
import { useBoxingStore } from '@/store/useBoxingStore';
import { usePunchDetection } from '@/features/punch-detection/usePunchDetection';
import BoxingTarget from '@/components/boxing/BoxingTarget';
import { Camera, Activity, Frame } from 'lucide-react';

export default function BoxingApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { status, score, combo } = useBoxingStore();
  const [streamAccess, setStreamAccess] = useState(false);

  usePunchDetection(videoRef);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamAccess(true);
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-slate-50 font-sans selection:bg-red-500/30">
      
      {/* Видео-фон (зеркалировано) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-20 mix-blend-luminosity grayscale transition-opacity duration-1000 ${
          streamAccess ? 'opacity-20' : 'opacity-0'
        }`}
      />

      {/* Темный градиент - Premium Apple-like Feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-red-950/30 pointer-events-none" />
      
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* UI Слои */}
      <div className="relative z-30 h-full flex flex-col justify-between">
        
        {/* Header / Stats HUD */}
        <header className="p-6 md:p-10 flex justify-between items-start">
          <div className="flex flex-col">
            <h3 className="text-xs uppercase tracking-[0.3em] text-red-500/80 mb-2 font-semibold">Total Impact</h3>
            <div className="px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center gap-3 shadow-2xl">
              <Activity className="w-5 h-5 text-red-500" />
              <span className="font-sans text-2xl font-light tracking-tight">{score.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <h3 className="text-xs uppercase tracking-[0.3em] text-red-500/80 mb-2 font-semibold">Multiplier</h3>
            <div className="px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center shadow-2xl gap-2">
               <span className="text-red-500 text-sm font-bold">x</span>
               <span className="font-sans text-2xl font-light tracking-tight">{combo}</span>
            </div>
          </div>
        </header>

        {/* Основная зона */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          
          {/* Onboarding - Стеклянная Apple Карточка */}
          {!streamAccess && (
            <div className="pointer-events-auto relative z-40 max-w-sm w-full p-10 rounded-[2.5rem] bg-black/40 border border-white/10 text-center shadow-[0_30px_100px_-15px_rgba(0,0,0,1),0_0_40px_rgba(220,40,40,0.15)] backdrop-blur-3xl">
              <div className="w-20 h-20 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Frame className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-4xl font-semibold tracking-tighter mb-4 text-white">Aerobag</h1>
              <p className="text-white/50 mb-10 text-sm leading-relaxed font-light">
                Secure local processing. Real-time kinematic tracking. 
                <br/>Enable your camera to begin the session.
              </p>
              <button 
                onClick={startCamera}
                className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm tracking-wide transition-all active:scale-95 shadow-[0_10px_40px_-10px_rgba(220,38,38,0.8)]"
              >
                Enable Camera
              </button>
            </div>
          )}

          {/* Игровая зона */}
          {streamAccess && status === 'ready' && (
            <BoxingTarget />
          )}

          {/* Loading State - Premium Spinner */}
          {status === 'loading_model' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-6">
                <div className="w-12 h-12 rounded-full border-[3px] border-white/10 border-t-red-500 animate-spin" />
                <span className="text-white/60 font-sans tracking-[0.2em] text-xs uppercase">
                  Initializing Neural Engine
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Area - Minimalist Logo */}
        <div className="absolute bottom-10 w-full text-center">
           <span className="text-white/20 text-xs tracking-[0.4em] uppercase font-light pointer-events-none">Zero Latency Mode</span>
        </div>
      </div>
    </main>
  );
}
