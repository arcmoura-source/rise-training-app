import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, CheckCircle2, Clock, Flame, Info, Sparkles, Timer, Eye, EyeOff, Video } from 'lucide-react';
import confetti from 'canvas-confetti';
import FeedbackModal from './FeedbackModal';

export default function WorkoutDetailView({
  workout,
  onBack,
  onFinishWorkout,
  onOpenTimer,
}) {
  const [activeWorkout, setActiveWorkout] = useState(() => JSON.parse(JSON.stringify(workout)));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showTips, setShowTips] = useState({});
  const [showGifs, setShowGifs] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleSet = (exIdx, sIdx) => {
    const updated = { ...activeWorkout };
    const currentStatus = updated.exercicios[exIdx].series[sIdx].concluida;
    updated.exercicios[exIdx].series[sIdx].concluida = !currentStatus;
    setActiveWorkout(updated);

    // If just completed, prompt rest timer
    if (!currentStatus) {
      onOpenTimer();
    }
  };

  const updateSetField = (exIdx, sIdx, field, value) => {
    const updated = { ...activeWorkout };
    updated.exercicios[exIdx].series[sIdx][field] = Number(value) || 0;
    setActiveWorkout(updated);
  };

  const adjustValue = (exIdx, sIdx, field, delta) => {
    const updated = { ...activeWorkout };
    const current = updated.exercicios[exIdx].series[sIdx][field] || 0;
    updated.exercicios[exIdx].series[sIdx][field] = Math.max(0, current + delta);
    setActiveWorkout(updated);
  };

  const toggleTip = (exId) => {
    setShowTips((prev) => ({ ...prev, [exId]: !prev[exId] }));
  };

  const toggleGif = (exId) => {
    setShowGifs((prev) => ({ ...prev, [exId]: !prev[exId] }));
  };

  // Count progress
  let totalSets = 0;
  let completedSets = 0;

  activeWorkout.exercicios.forEach((ex) => {
    ex.series.forEach((s) => {
      totalSets++;
      if (s.concluida) {
        completedSets++;
      }
    });
  });

  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const handleFinish = () => {
    setShowFeedbackModal(true);
  };

  const completeWorkout = (feedbackData) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#CE8FA5', '#E6B8B8', '#FAF7F2', '#4A403A']
    });

    const summary = {
      id: 'hist-' + Date.now(),
      data: new Date().toISOString(),
      treinoId: activeWorkout.id,
      treinoTitulo: activeWorkout.titulo,
      duracaoMinutos: Math.max(1, Math.round(elapsedSeconds / 60)),
      seriesConcluidas: completedSets,
      exercicios: activeWorkout.exercicios,
      tipo: 'Ginásio',
      rating: feedbackData?.rating || 5,
      feedback: feedbackData?.comment || '',
    };

    setShowFeedbackModal(false);
    onFinishWorkout(summary, activeWorkout);
  };

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      {/* Sticky Top Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-white border border-sand-200 flex items-center justify-center text-sand-500 hover:bg-cream-200 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-cream-200 text-sand-500 text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-roseGold-500 animate-pulse" />
          {formatTimer(elapsedSeconds)}
        </div>

        <button
          onClick={handleFinish}
          className="px-4 py-2 rounded-2xl bg-roseGold-400 hover:bg-roseGold-500 text-white text-xs font-bold shadow-md shadow-roseGold-200 transition active:scale-95 flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          Concluir
        </button>
      </div>

      {/* Workout Info & Progress Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-sand-100">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-roseGold-500">
              Sessão em Curso
            </span>
            <h1 className="text-xl font-extrabold text-sand-500 mt-0.5">
              {activeWorkout.titulo}
            </h1>
            <p className="text-xs text-sand-400 mt-0.5">{activeWorkout.foco}</p>
          </div>
          <button
            onClick={onOpenTimer}
            className="w-10 h-10 rounded-2xl bg-roseGold-100 text-roseGold-500 flex items-center justify-center hover:bg-roseGold-200 transition"
            title="Cronómetro de Descanso"
          >
            <Timer className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-sand-400 font-medium mb-1.5">
            <span>Progresso ({completedSets}/{totalSets} séries)</span>
            <span className="font-bold text-roseGold-500">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-cream-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-roseGold-400 to-roseGold-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {activeWorkout.exercicios.map((ex, exIdx) => {
          const exKey = ex.id || exIdx;
          const isGifOpen = showGifs[exKey];

          return (
            <div
              key={exKey}
              className="bg-white rounded-3xl p-4 shadow-soft border border-sand-100 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-sand-400 uppercase tracking-wider">
                      Exercício {exIdx + 1}
                    </span>
                    {ex.categoria && (
                      <span className="text-[9px] font-semibold text-roseGold-500 bg-roseGold-50 px-2 py-0.2 rounded-full">
                        {ex.categoria}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-sand-500 mt-0.5">{ex.nome}</h3>
                </div>

                <div className="flex items-center gap-1">
                  {/* Button to toggle GIF Animation */}
                  {ex.gifUrl && (
                    <button
                      onClick={() => toggleGif(exKey)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                        isGifOpen
                          ? 'bg-roseGold-400 text-white shadow-sm'
                          : 'bg-cream-100 text-roseGold-600 hover:bg-cream-200'
                      }`}
                      title="Ver animação da execução"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{isGifOpen ? 'Ocultar GIF' : 'Ver GIF'}</span>
                    </button>
                  )}

                  {ex.dica && (
                    <button
                      onClick={() => toggleTip(exKey)}
                      className={`p-1.5 rounded-xl transition ${
                        showTips[exKey]
                          ? 'bg-roseGold-100 text-roseGold-500'
                          : 'text-sand-400 hover:text-sand-600'
                      }`}
                      title="Dica de postura"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Exercise GIF Animation Display */}
              {isGifOpen && ex.gifUrl && (
                <div className="overflow-hidden rounded-2xl bg-cream-50 border border-sand-200 animate-fade-in p-2 flex flex-col items-center">
                  <div className="relative w-full max-h-56 min-h-[140px] rounded-xl overflow-hidden bg-white flex items-center justify-center">
                    <img
                      src={ex.gifUrl}
                      alt={ex.nome}
                      className="w-full h-auto max-h-56 object-contain rounded-xl"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fb = e.target.parentElement.querySelector('.gif-error-fallback');
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                    <div className="gif-error-fallback hidden flex-col items-center justify-center p-4 text-center bg-cream-50 w-full h-36">
                      <div className="w-10 h-10 rounded-2xl bg-roseGold-100 text-roseGold-500 flex items-center justify-center mb-1.5 shadow-xs">
                        <Dumbbell className="w-5 h-5 animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-sand-500">{ex.nome}</span>
                      <span className="text-xs text-sand-400 mt-0.5">Execução focada e técnica controlada</span>
                    </div>
                  </div>
                  <div className="w-full text-center mt-2">
                    <span className="text-xs font-bold text-sand-400 uppercase tracking-wider block">
                      Demonstração de Execução
                    </span>
                    {ex.dica && (
                      <p className="text-xs text-sand-500 mt-0.5 px-2 font-medium">
                        💡 {ex.dica}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Posture Tip Collapsible */}
              {showTips[exKey] && ex.dica && !isGifOpen && (
                <div className="bg-cream-100 text-sand-500 p-3 rounded-2xl text-xs border border-cream-200 animate-fade-in flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-roseGold-500 shrink-0 mt-0.5" />
                  <span>{ex.dica}</span>
                </div>
              )}

              {/* Table of Sets */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-12 text-xs font-bold uppercase tracking-wider text-sand-400 px-2">
                  <span className="col-span-2 text-center">Série</span>
                  <span className="col-span-4 text-center">Carga (kg)</span>
                  <span className="col-span-4 text-center">Reps</span>
                  <span className="col-span-2 text-center">Feito</span>
                </div>

                {ex.series.map((s, sIdx) => {
                  const isDone = s.concluida;
                  return (
                    <div
                      key={sIdx}
                      className={`grid grid-cols-12 items-center gap-1.5 p-2 rounded-2xl transition-colors ${
                        isDone
                          ? 'bg-roseGold-50/80 border border-roseGold-200/60'
                          : 'bg-cream-50 border border-cream-200'
                      }`}
                    >
                      {/* Set Number */}
                      <div className="col-span-2 text-center text-xs font-bold text-sand-500">
                        #{s.serie || sIdx + 1}
                      </div>

                      {/* Weight Input with +/- */}
                      <div className="col-span-4 flex items-center justify-center gap-1 bg-white rounded-xl py-1 px-1.5 border border-sand-200">
                        <button
                          onClick={() => adjustValue(exIdx, sIdx, 'peso', -2.5)}
                          className="text-sand-400 hover:text-sand-600 font-bold px-1 text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          value={s.peso}
                          onChange={(e) => updateSetField(exIdx, sIdx, 'peso', e.target.value)}
                          className="w-10 text-center font-bold text-sand-500 text-xs bg-transparent focus:outline-none"
                        />
                        <button
                          onClick={() => adjustValue(exIdx, sIdx, 'peso', 2.5)}
                          className="text-sand-400 hover:text-sand-600 font-bold px-1 text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Reps Input with +/- */}
                      <div className="col-span-4 flex items-center justify-center gap-1 bg-white rounded-xl py-1 px-1.5 border border-sand-200">
                        <button
                          onClick={() => adjustValue(exIdx, sIdx, 'reps', -1)}
                          className="text-sand-400 hover:text-sand-600 font-bold px-1 text-xs"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={s.reps}
                          onChange={(e) => updateSetField(exIdx, sIdx, 'reps', e.target.value)}
                          className="w-8 text-center font-bold text-sand-500 text-xs bg-transparent focus:outline-none"
                        />
                        <button
                          onClick={() => adjustValue(exIdx, sIdx, 'reps', 1)}
                          className="text-sand-400 hover:text-sand-600 font-bold px-1 text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Checkbox button */}
                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => toggleSet(exIdx, sIdx)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isDone
                              ? 'bg-roseGold-400 text-white shadow-sm shadow-roseGold-200'
                              : 'bg-white border border-sand-300 text-transparent hover:border-roseGold-300'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5-Star Rating & Feedback Modal for Gym workout */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => completeWorkout(null)}
        onSubmit={(data) => completeWorkout(data)}
        workoutTitle={activeWorkout.titulo}
        workoutType="gym"
      />
    </div>
  );
}
