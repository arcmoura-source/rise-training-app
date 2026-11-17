import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, Plus, Minus, Bell } from 'lucide-react';
import { playTimerBeep, playCompletionChime } from '../utils/audio';

export default function RestTimerModal({ isOpen, onClose, initialSeconds = 90 }) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setTotalSeconds(initialSeconds);
      setSecondsLeft(initialSeconds);
      setIsRunning(true);
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    let interval = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 4 && prev > 1) {
            playTimerBeep(600, 0.1);
          } else if (prev === 1) {
            playCompletionChime();
          }
          return prev - 1;
        });
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  if (!isOpen) return null;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  const handleAdjust = (delta) => {
    setSecondsLeft((prev) => Math.max(5, prev + delta));
    setTotalSeconds((prev) => Math.max(5, prev + delta));
  };

  const setPreset = (secs) => {
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setIsRunning(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-600/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xs bg-cream-50 rounded-3xl p-6 shadow-2xl border border-sand-200 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-sand-400 hover:text-sand-600 rounded-full hover:bg-cream-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-roseGold-500 font-medium text-xs tracking-wider uppercase">
          <Bell className="w-3.5 h-3.5" />
          Descanso Entre Séries
        </div>

        <h3 className="text-sand-500 font-bold text-lg mb-4">Recupera o Fôlego</h3>

        {/* Circular Progress & Time Display */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-5">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="#F4ECE1"
              strokeWidth="6"
            />
            {/* Animated Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="#CE8FA5"
              strokeWidth="6"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-sand-500 tracking-tight font-mono">
              {formatTime(secondsLeft)}
            </span>
            <span className="text-xs text-sand-400 mt-1">
              {secondsLeft === 0 ? "Tempo Esgotado! Próxima série!" : isRunning ? "A cronometrar..." : "Em pausa"}
            </span>
          </div>
        </div>

        {/* Controls: Play/Pause/Reset & Adjustments */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => handleAdjust(-15)}
            className="w-10 h-10 rounded-full bg-cream-200 text-sand-500 hover:bg-cream-300 flex items-center justify-center text-xs font-semibold transition active:scale-95"
            title="-15s"
          >
            -15s
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-14 h-14 rounded-full bg-roseGold-400 hover:bg-roseGold-500 text-white shadow-lg shadow-roseGold-200 flex items-center justify-center transition active:scale-95"
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </button>

          <button
            onClick={() => handleAdjust(15)}
            className="w-10 h-10 rounded-full bg-cream-200 text-sand-500 hover:bg-cream-300 flex items-center justify-center text-xs font-semibold transition active:scale-95"
            title="+15s"
          >
            +15s
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 w-full justify-center">
          {[45, 60, 90, 120].map((secs) => (
            <button
              key={secs}
              onClick={() => setPreset(secs)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                totalSeconds === secs
                  ? 'bg-sand-500 text-cream-50 font-bold'
                  : 'bg-white text-sand-400 border border-sand-200 hover:border-sand-300'
              }`}
            >
              {secs}s
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-2xl bg-cream-200 hover:bg-cream-300 text-sand-500 text-xs font-semibold transition"
        >
          Minimizar e Voltar ao Treino
        </button>
      </div>
    </div>
  );
}
