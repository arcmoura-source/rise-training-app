import React, { useState, useEffect } from 'react';
import { Dumbbell, Sparkles } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade-out after 1.8 seconds
    const timer1 = setTimeout(() => {
      setFading(true);
    }, 1800);

    // Complete and unmount after fade transition (700ms)
    const timer2 = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  const handleDismiss = () => {
    setFading(true);
    setTimeout(() => {
      onFinish();
    }, 400);
  };

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 w-screen h-screen z-50 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-700 ease-in-out ${
        fading
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      } bg-gradient-to-b from-[#ECA1B8] via-[#DF86A3] to-[#CF6E8E]`}
    >
      {/* Subtle decorative background circles */}
      <div className="absolute w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none animate-pulse" />
      <div className="absolute w-44 h-44 rounded-full border border-white/20 pointer-events-none animate-ping" style={{ animationDuration: '3s' }} />

      {/* Main Logo in pure crisp white */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Heart + Dumbbell Logo in pure crisp white */}
        <div className="relative flex items-center justify-center w-36 h-36 mb-4 transition-transform duration-500 hover:scale-105">
          <img
            src="/logo-white.png"
            alt="Logo Rise"
            className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(189,111,140,0.5)]"
          />
        </div>

        {/* App Title */}
        <h1 className="text-3xl font-black text-white tracking-[0.25em] uppercase drop-shadow-sm font-sans">
          Rise
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-6 h-[1.5px] bg-white/50" />
          <span className="text-[11px] font-bold text-white/90 tracking-[0.3em] uppercase">
            AI Coach
          </span>
          <span className="w-6 h-[1.5px] bg-white/50" />
        </div>
      </div>

      {/* Bottom loading / pulse dots */}
      <div className="absolute bottom-10 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
