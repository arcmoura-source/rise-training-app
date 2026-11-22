import React, { useState } from 'react';
import { Star, Heart, CheckCircle2, X, MessageSquare, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function VideoFeedbackModal({ video, isOpen, onClose, onSubmitFeedback }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isFavorite, setIsFavorite] = useState(true);

  if (!isOpen || !video) return null;

  const quickTags = [
    '🔥 Muito Puxado',
    '🥵 Muito Desgastante',
    '🍑 Senti os Glúteos',
    '⚡ Ritmo Acelerado',
    '✨ Adorei a Aula',
    '😴 Cansaço / Pesado',
    '🩹 Desconforto / Dor',
  ];

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const ratingLabels = {
    1: 'Muito leve / Não gostei',
    2: 'Razoável, ritmo baixo',
    3: 'Bom treino, ritmo médio',
    4: 'Muito bom! 🔥 Excelente intensidade',
    5: 'Incrível! 🔥🔥 Puxado e desafiante!',
  };

  const handleSave = () => {
    confetti({
      particleCount: 85,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#CE8FA5', '#E6B8B8', '#FAF7F2', '#FBBF24'],
    });

    onSubmitFeedback({
      video,
      rating,
      feedback: feedbackText.trim(),
      tags: selectedTags,
      isFavorite,
    });
  };

  const currentDisplayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sand-600/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-sand-200 space-y-3 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sand-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-xl bg-amber-100 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
            </span>
            <h3 className="text-sm font-bold text-sand-500">Avaliação do Treino</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-sand-400 hover:text-sand-600 hover:bg-cream-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Card Brief */}
        <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-cream-50 border border-sand-200">
          <img
            src={video.thumbnail}
            alt={video.titulo}
            className="w-12 h-12 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-roseGold-500 uppercase tracking-wider block">
              {video.canal} • {video.duracao}
            </span>
            <h4 className="text-xs font-bold text-sand-500 truncate mt-0.5">{video.titulo}</h4>
            <span className="text-[10px] text-sand-400 block truncate">{video.foco}</span>
          </div>
        </div>

        {/* 5 Stars Selection */}
        <div className="text-center space-y-1 py-0.5">
          <label className="text-[11px] font-bold text-sand-400 uppercase tracking-wider block">
            Como avalias a intensidade e ritmo?
          </label>

          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((starNum) => {
              const filled = starNum <= currentDisplayRating;
              return (
                <button
                  key={starNum}
                  type="button"
                  onMouseEnter={() => setHoverRating(starNum)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(starNum)}
                  className="p-1 transition-transform hover:scale-125 active:scale-95"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      filled
                        ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                        : 'text-sand-200 hover:text-amber-200'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <span className="text-xs font-extrabold text-roseGold-600 block min-h-[1.25rem]">
            {ratingLabels[currentDisplayRating]}
          </span>
        </div>

        {/* Quick Sensations / Tags */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-sand-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-roseGold-500" />
            Como sentiste o corpo? (Toque rápido)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-0.5 rounded-xl text-[10.5px] font-medium border transition-all ${
                    active
                      ? 'bg-roseGold-400 text-white border-roseGold-400 shadow-sm'
                      : 'bg-cream-50 text-sand-500 border-sand-200 hover:bg-cream-100'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Textbox */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-sand-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-roseGold-500" />
            Notas & Sensação Muscular (Opcional)
          </label>
          <textarea
            rows={2}
            placeholder="Ex: Senti muito os glúteos! As cargas com halteres de 6kg foram no ponto..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="w-full px-3 py-1.5 rounded-2xl bg-cream-50 border border-sand-200 text-xs text-sand-500 placeholder-sand-300 focus:outline-none focus:border-roseGold-400 resize-none leading-relaxed"
          />
        </div>

        {/* Favorite Checkbox */}
        <button
          type="button"
          onClick={() => setIsFavorite(!isFavorite)}
          className={`w-full p-2 rounded-2xl border text-xs font-semibold flex items-center justify-between transition ${
            isFavorite
              ? 'bg-roseGold-50 border-roseGold-300 text-roseGold-600'
              : 'bg-cream-50 border-sand-200 text-sand-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-roseGold-500 text-roseGold-500' : ''}`} />
            <span>Guardar nos meus Vídeos Favoritos ❤️</span>
          </div>
          <div
            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
              isFavorite ? 'bg-roseGold-400 border-roseGold-400 text-white' : 'border-sand-300'
            }`}
          >
            {isFavorite && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
          </div>
        </button>

        {/* Action Button */}
        <div className="pt-1">
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-2xl bg-roseGold-400 hover:bg-roseGold-500 text-white text-xs font-bold shadow-md shadow-roseGold-200 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            Guardar Avaliação & Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
