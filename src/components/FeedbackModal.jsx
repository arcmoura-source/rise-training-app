import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, X, Flame, Sparkles, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  workoutTitle,
  workoutChannel,
  workoutType = 'video', // 'video' | 'gym'
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [targetDateType, setTargetDateType] = useState('today'); // 'today' | 'yesterday'

  if (!isOpen) return null;

  const quickTags = [
    '🔥 Muito Puxado',
    '🥵 Muito Desgastante',
    '💪 Cargas Perfeitas',
    '🍑 Senti os Glúteos',
    '⚡ Ritmo Acelerado',
    '✨ Adorei o Treino',
    '🧘‍♀️ Boa Postura',
    '😴 Cansaço / Pesado',
    '🩹 Desconforto / Dor',
  ];

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#CE8FA5', '#E6B8B8', '#FAF7F2', '#4A403A'],
    });

    let dataISO = new Date().toISOString();
    if (targetDateType === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(18, 30, 0, 0);
      dataISO = yesterday.toISOString();
    }

    onSubmit({
      rating,
      comment: comment.trim(),
      tags: selectedTags,
      data: dataISO,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sand-600/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-sand-200 space-y-3.5 my-auto">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-roseGold-400 to-[#CF6E8E] text-white flex items-center justify-center mx-auto shadow-md shadow-roseGold-200">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-roseGold-500 block pt-1">
            Treino Concluído com Sucesso! 🎉
          </span>
          <h3 className="text-base font-extrabold text-sand-500 line-clamp-1">
            {workoutTitle}
          </h3>
          {workoutChannel && (
            <p className="text-xs text-sand-400 font-medium">{workoutChannel}</p>
          )}

          {/* Seletor Hoje vs Ontem */}
          <div className="pt-2 flex items-center justify-center gap-2">
            <span className="text-[10px] text-sand-400 font-bold uppercase tracking-wider">Feito em:</span>
            <button
              type="button"
              onClick={() => setTargetDateType('today')}
              className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                targetDateType === 'today'
                  ? 'bg-roseGold-400 text-white shadow-xs'
                  : 'bg-cream-100 text-sand-500 hover:bg-cream-200'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setTargetDateType('yesterday')}
              className={`px-3 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                targetDateType === 'yesterday'
                  ? 'bg-roseGold-400 text-white shadow-xs'
                  : 'bg-cream-100 text-sand-500 hover:bg-cream-200'
              }`}
            >
              Ontem
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 5-Star Rating Selector */}
          <div className="text-center space-y-1.5">
            <label className="text-[11px] font-bold text-sand-500 uppercase tracking-wider block">
              Como avalias este treino?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform active:scale-90 hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        active
                          ? 'fill-amber-400 text-amber-400 filter drop-shadow-sm'
                          : 'text-sand-200'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-roseGold-600 block">
              {rating === 5 && '⭐⭐⭐⭐⭐ Incrível, adorei!'}
              {rating === 4 && '⭐⭐⭐⭐ Muito bom, puxado!'}
              {rating === 3 && '⭐⭐⭐ Razoável, no ponto'}
              {rating === 2 && '⭐⭐ Difícil / Não gostei tanto'}
              {rating === 1 && '⭐ Demasiado fácil ou desconfortável'}
            </span>
          </div>

          {/* Quick Tags */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-sand-400 uppercase tracking-wider block">
              Sensações do Treino
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickTags.map((tag) => {
                const isSel = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition ${
                      isSel
                        ? 'bg-roseGold-400 text-white font-bold shadow-xs'
                        : 'bg-cream-100 text-sand-500 border border-sand-200 hover:bg-cream-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Text Area */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-sand-400 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-roseGold-500" />
              O que achaste deste treino?
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Treino muito puxado, queimei bastante e o ritmo foi excelente..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl bg-cream-50 border border-sand-200 text-xs text-sand-500 placeholder-sand-300 focus:outline-none focus:border-roseGold-400 resize-none leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-cream-200 text-sand-500 text-xs font-semibold hover:bg-cream-300 transition"
            >
              Saltar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-roseGold-400 hover:bg-roseGold-500 text-white text-xs font-bold shadow-md shadow-roseGold-200 transition active:scale-95"
            >
              Guardar Avaliação & Concluir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
