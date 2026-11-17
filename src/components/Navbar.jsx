import React from 'react';
import { Home, Dumbbell, PlaySquare, Sparkles, User } from 'lucide-react';

export default function Navbar({ currentTab, setTab, isWorkoutActive, ondeTreina = 'both' }) {
  const tabs = [
    { id: 'home', label: 'Início', icon: Home },
    ...(ondeTreina !== 'home'
      ? [{ id: 'workouts', label: 'Ginásio', icon: Dumbbell, hasBadge: isWorkoutActive }]
      : []),
    ...(ondeTreina !== 'gym'
      ? [{ id: 'videos', label: 'Vídeos', icon: PlaySquare }]
      : []),
    { id: 'coach', label: 'AI Coach', icon: Sparkles },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-t border-sand-200/80 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-roseGold-500 font-semibold'
                  : 'text-sand-400 hover:text-sand-500'
              }`}
            >
              {/* Active pill background */}
              {isActive && (
                <span className="absolute -top-1 w-7 h-1 rounded-full bg-roseGold-400 animate-pulse" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.3px]' : 'scale-100 stroke-[1.8px]'
                  }`}
                />
                {tab.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-roseGold-500 rounded-full ring-2 ring-white animate-ping" />
                )}
              </div>

              <span className={`text-xs mt-1 tracking-tight ${isActive ? 'font-bold text-roseGold-600' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
