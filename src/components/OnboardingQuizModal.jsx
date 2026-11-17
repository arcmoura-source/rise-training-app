import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Dumbbell,
  Home,
  Target,
  Flame,
  Award,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OnboardingQuizModal({ isOpen, onComplete, initialProfile }) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const [quizData, setQuizData] = useState({
    nome: initialProfile?.nome || '',
    ondeTreina: initialProfile?.ondeTreina || 'both',
    objetivo: initialProfile?.objetivo || 'Hipertrofia & Força (Quadríceps e Glúteos)',
    diasSemanaAlvo: initialProfile?.diasSemanaAlvo || 4,
    nivel: initialProfile?.nivel || 'Intermédio',
    peso: initialProfile?.peso || 58.0,
    massaMuscular: initialProfile?.massaMuscular || 40.4,
    altura: initialProfile?.altura || 1.60,
  });

  if (!isOpen) return null;

  const popularObjectives = [
    { label: '⚡ Perda de Gordura & Definição', text: 'Perda de Gordura & Tonificação Muscular', desc: 'Metabolismo acelerado, ritmo e queima calórica' },
    { label: '💪 Força & Condição Geral', text: 'Força, Condicionamento Geral & Resistência', desc: 'Ficar mais forte e resistente em todo o corpo' },
    { label: '🧘‍♀️ Pilates, Postura & Core', text: 'Pilates, Postura, Mobilidade & Core', desc: 'Ativação do core profundo, cintura fina e postura ereta' },
    { label: '✨ Tonificação & Definição', text: 'Tonificação & Definição Muscular', desc: 'Corpo firme, definido e atlético' },
  ];

  const handleNext = () => {
    if (step === 1 && !quizData.nome.trim()) {
      alert('Por favor diz-nos o teu nome para personalizarmos a app!');
      return;
    }
    if (step < totalSteps) {
      setStep((s) => s + 1);
    } else {
      // Finished
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#CE8FA5', '#E6B8B8', '#FAF7F2', '#34D399'],
      });
      onComplete(quizData);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-600/60 backdrop-blur-md animate-fade-in">
      <div className="bg-cream-50 rounded-[32px] p-6 max-w-sm w-full shadow-2xl border border-sand-200 relative overflow-hidden flex flex-col justify-between min-h-[520px]">
        {/* Background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-roseGold-200/40 rounded-full blur-2xl pointer-events-none" />

        {/* Header Progress */}
        <div>
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-roseGold-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-roseGold-600">
                Questionário Inicial • Passo {step} de {totalSteps}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-sand-400">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-roseGold-400 transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* ── STEP 1: NOME ── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-center">
            <div className="text-center space-y-1">
              <span className="text-3xl">✨</span>
              <h2 className="text-xl font-extrabold text-sand-500 tracking-tight">
                Bem-vindo(a) ao Rise!
              </h2>
              <p className="text-xs text-sand-400 leading-relaxed px-4">
                Vamos personalizar os teus treinos, vídeos e o AI Coach. Como te chamas?
              </p>
            </div>

            <div className="pt-2">
              <label className="text-[10px] font-bold text-sand-400 uppercase tracking-wider block mb-1">
                O Teu Nome ou Alcunha *
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ex: Ana, Sofia, Inês..."
                value={quizData.nome}
                onChange={(e) => setQuizData({ ...quizData, nome: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-sand-200 text-sm font-bold text-sand-500 placeholder-sand-300 focus:outline-none focus:border-roseGold-400 shadow-soft"
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: ONDE TREINAS? ── */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-center">
            <div className="text-center space-y-1">
              <span className="text-3xl">📍</span>
              <h2 className="text-lg font-extrabold text-sand-500 tracking-tight">
                Onde costumas treinar?
              </h2>
              <p className="text-xs text-sand-400 leading-relaxed">
                Isto define as abas que aparecem na tua aplicação:
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                {
                  id: 'both',
                  title: '✨ Ambos (Home & Gym)',
                  desc: 'Alterno entre casa e ginásio (mostra todas as abas)',
                  icon: Sparkles,
                },
                {
                  id: 'gym',
                  title: '🏋️‍♀️ Apenas no Ginásio (Gym)',
                  desc: 'Treinos de máquinas, cargas e halteres no ginásio',
                  icon: Dumbbell,
                },
                {
                  id: 'home',
                  title: '🏠 Apenas em Casa (Home)',
                  desc: 'Vídeos do YouTube, tapete e halteres em casa',
                  icon: Home,
                },
              ].map((item) => {
                const isSel = quizData.ondeTreina === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setQuizData({ ...quizData, ondeTreina: item.id })}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSel
                        ? 'bg-roseGold-50 border-roseGold-400 shadow-sm'
                        : 'bg-white border-sand-200 hover:bg-cream-100'
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-bold block ${isSel ? 'text-roseGold-600' : 'text-sand-500'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-sand-400 mt-0.5 block leading-tight">
                        {item.desc}
                      </span>
                    </div>
                    {isSel && <Check className="w-4 h-4 text-roseGold-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: QUAL O TEU OBJETIVO? ── */}
        {step === 3 && (
          <div className="space-y-3 animate-fade-in flex-1 flex flex-col justify-center">
            <div className="text-center space-y-1">
              <span className="text-3xl">🎯</span>
              <h2 className="text-lg font-extrabold text-sand-500 tracking-tight">
                Qual o teu objetivo principal?
              </h2>
              <p className="text-xs text-sand-400 leading-relaxed">
                As recomendações de treino e o AI Coach vão focar-se nisto:
              </p>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {popularObjectives.map((obj, i) => {
                const isSel = quizData.objetivo === obj.text;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setQuizData({ ...quizData, objetivo: obj.text })}
                    className={`w-full p-2.5 rounded-2xl border text-left transition ${
                      isSel
                        ? 'bg-roseGold-50 border-roseGold-400 text-roseGold-600 shadow-sm'
                        : 'bg-white border-sand-200 text-sand-500 hover:bg-cream-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{obj.label}</span>
                      {isSel && <Check className="w-3.5 h-3.5 text-roseGold-500" />}
                    </div>
                    <span className="text-[10px] text-sand-400 block mt-0.5 leading-tight">
                      {obj.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="Ou escreve o teu objetivo personalizado..."
              value={quizData.objetivo}
              onChange={(e) => setQuizData({ ...quizData, objetivo: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-sand-200 text-xs text-sand-500 focus:outline-none focus:border-roseGold-400"
            />
          </div>
        )}

        {/* ── STEP 4: QUANTOS DIAS POR SEMANA? ── */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-center">
            <div className="text-center space-y-1">
              <span className="text-3xl">📅</span>
              <h2 className="text-lg font-extrabold text-sand-500 tracking-tight">
                Quantos dias pretendes treinar?
              </h2>
              <p className="text-xs text-sand-400 leading-relaxed px-4">
                A tua meta semanal de consistência na página inicial:
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-2">
              {[2, 3, 4, 5, 6].map((num) => {
                const isSel = quizData.diasSemanaAlvo === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuizData({ ...quizData, diasSemanaAlvo: num })}
                    className={`py-3.5 rounded-2xl border flex flex-col items-center justify-center transition active:scale-95 ${
                      isSel
                        ? 'bg-roseGold-400 text-white font-bold border-roseGold-400 shadow-md shadow-roseGold-200 scale-105'
                        : 'bg-white text-sand-500 border-sand-200 hover:bg-cream-100'
                    }`}
                  >
                    <span className="text-lg font-extrabold font-mono">{num}</span>
                    <span className="text-[9px] uppercase tracking-wider mt-0.5">dias</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-white rounded-2xl border border-sand-200 text-center">
              <span className="text-xs text-sand-400 font-medium">
                {quizData.diasSemanaAlvo <= 3
                  ? 'Perfeito para manter consistência sem pressões.'
                  : quizData.diasSemanaAlvo === 4
                  ? 'Ritmo ideal de hipertrofia com dias de descanso para recuperação.'
                  : 'Rotina avançada de alta frequência muscular!'}
              </span>
            </div>
          </div>
        )}

        {/* ── STEP 5: NÍVEL DE EXPERIÊNCIA ── */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-center">
            <div className="text-center space-y-1">
              <span className="text-3xl">⚡</span>
              <h2 className="text-lg font-extrabold text-sand-500 tracking-tight">
                Qual o teu nível de experiência?
              </h2>
              <p className="text-xs text-sand-400 leading-relaxed px-4">
                Para adaptarmos a complexidade dos exercícios e vídeos sugeridos:
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                {
                  id: 'Iniciante',
                  title: '🌱 Iniciante',
                  desc: 'A começar agora ou a regressar após uma pausa longa',
                },
                {
                  id: 'Intermédio',
                  title: '🔥 Intermédio',
                  desc: 'Já treino regularmente há alguns meses com boa postura',
                },
                {
                  id: 'Avançado',
                  title: '⚡ Avançado',
                  desc: 'Treino consistente há anos, domino cargas pesadas e técnica',
                },
              ].map((item) => {
                const isSel = quizData.nivel === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setQuizData({ ...quizData, nivel: item.id })}
                    className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSel
                        ? 'bg-roseGold-50 border-roseGold-400 shadow-sm'
                        : 'bg-white border-sand-200 hover:bg-cream-100'
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-bold block ${isSel ? 'text-roseGold-600' : 'text-sand-500'}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-sand-400 mt-0.5 block leading-tight">
                        {item.desc}
                      </span>
                    </div>
                    {isSel && <Check className="w-4 h-4 text-roseGold-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 6: DADOS BIOMÉTRICOS ── */}
        {step === 6 && (
          <div className="space-y-4 animate-fade-in flex-1 flex flex-col justify-center">
            <div className="text-center space-y-1">
              <span className="text-3xl">📊</span>
              <h2 className="text-lg font-extrabold text-sand-500 tracking-tight">
                Os teus dados biométricos
              </h2>
              <p className="text-xs text-sand-400 leading-relaxed">
                Utilizados para calcular o teu IMC e recomendações de carga:
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="bg-white p-3 rounded-2xl border border-sand-200 text-center">
                <label className="text-[10px] font-bold text-sand-400 uppercase block mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={quizData.peso}
                  onChange={(e) => setQuizData({ ...quizData, peso: e.target.value })}
                  className="w-full text-center text-sm font-bold text-sand-500 bg-cream-50 py-1.5 rounded-xl border border-sand-200 focus:outline-none"
                />
              </div>

              <div className="bg-white p-3 rounded-2xl border border-sand-200 text-center">
                <label className="text-[10px] font-bold text-sand-400 uppercase block mb-1">
                  Altura (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quizData.altura}
                  onChange={(e) => setQuizData({ ...quizData, altura: e.target.value })}
                  className="w-full text-center text-sm font-bold text-sand-500 bg-cream-50 py-1.5 rounded-xl border border-sand-200 focus:outline-none"
                />
              </div>

              <div className="bg-white p-3 rounded-2xl border border-sand-200 text-center">
                <label className="text-[10px] font-bold text-sand-400 uppercase block mb-1">
                  Massa Musc.
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={quizData.massaMuscular}
                  onChange={(e) => setQuizData({ ...quizData, massaMuscular: e.target.value })}
                  className="w-full text-center text-sm font-bold text-sand-500 bg-cream-50 py-1.5 rounded-xl border border-sand-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-roseGold-50 rounded-2xl border border-roseGold-200/60 text-center">
              <span className="text-[11px] text-roseGold-600 font-bold block">
                Tudo pronto para começares! ✨
              </span>
              <span className="text-[10px] text-sand-400 block mt-0.5">
                Podes rever ou alterar estas respostas a qualquer momento no teu Perfil.
              </span>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-sand-100">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-3.5 rounded-2xl bg-cream-200 hover:bg-cream-300 text-sand-500 text-xs font-bold transition flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 rounded-2xl bg-roseGold-400 hover:bg-roseGold-500 text-white text-xs font-bold transition shadow-md shadow-roseGold-200 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>{step === totalSteps ? 'Começar a Treinar! 🚀' : 'Continuar'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
