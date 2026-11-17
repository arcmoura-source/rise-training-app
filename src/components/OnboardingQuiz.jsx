import React, { useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  Home,
  ChevronRight,
  ArrowLeft,
  Check,
  Flame,
  Target,
  Clock,
  Heart,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEFAULT_PROFILE } from '../data/defaultData';
import { requestGoogleLogin, downloadLatestBackupFromGoogleDrive } from '../services/googleAuth';
import { importBackupData } from '../services/storage';

export default function OnboardingQuiz({ onComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [nome, setNome] = useState('');
  const [ondeTreina, setOndeTreina] = useState('both'); // 'gym' | 'home' | 'both'
  const [objetivo, setObjetivo] = useState('Força, Condicionamento Geral & Resistência');
  const [objetivoCustom, setObjetivoCustom] = useState('');
  const [diasSemanaAlvo, setDiasSemanaAlvo] = useState(4);
  const [nivel, setNivel] = useState('Intermédio');
  const [peso, setPeso] = useState(60);
  const [altura, setAltura] = useState(1.65);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState(null);

  const handleGoogleRestoreOrLogin = async () => {
    setIsGoogleLoading(true);
    setRestoreStatus({
      type: 'info',
      message: 'A abrir a janela oficial da Google...',
    });

    try {
      const res = await requestGoogleLogin();
      if (!res.success || !res.user) {
        setRestoreStatus(null);
        setIsGoogleLoading(false);
        return;
      }

      setRestoreStatus({
        type: 'info',
        message: `Sessão iniciada como ${res.user.name}. A verificar cópia no Google Drive...`,
      });

      // Tenta descarregar a cópia mais recente do Google Drive
      const driveRes = await downloadLatestBackupFromGoogleDrive(res.user.token).catch(() => ({ found: false }));

      if (driveRes.found && driveRes.backupData) {
        importBackupData(driveRes.backupData);
        localStorage.setItem('fit_app_onboarding_completed', 'true');
        setRestoreStatus({
          type: 'success',
          message: 'Cópia de segurança encontrada e restaurada com sucesso! A carregar os teus treinos...',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
        return;
      }

      // Se não encontrou cópia de segurança, preenche o nome e permite continuar o quiz normalmente
      const firstName = (res.user.name || '').split(' ')[0] || res.user.name;
      if (firstName) setNome(firstName);

      setRestoreStatus({
        type: 'info',
        message: `Bem-vinda, ${firstName}! Não foi encontrada nenhuma cópia anterior no Drive. Podes continuar a criar o teu perfil abaixo (já associado à tua conta Google)!`,
      });
    } catch (err) {
      console.warn('Erro ao restaurar da Google:', err);
      setRestoreStatus({
        type: 'error',
        message: err.message || 'Não foi possível concluir a ligação com a Google.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const popularObjectives = [
    { id: 'perda', title: 'Perda de Gordura & Tonificação', desc: 'Queima calórica, definição e tônus geral', icon: '⚡' },
    { id: 'forca', title: 'Força & Condicionamento', desc: 'Cargas progressivas e resistência muscular', icon: '💪' },
    { id: 'pilates', title: 'Pilates, Postura & Core', desc: 'Músculos profundos, flexibilidade e postura', icon: '🧘‍♀️' },
    { id: 'tonificacao', title: 'Tonificação & Definição', desc: 'Corpo firme, definido e postura atlética', icon: '✨' },
  ];

  const handleNext = () => {
    if (step === 1 && !nome.trim()) return;
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishQuiz();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const finishQuiz = () => {
    setIsFinishing(true);

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#CE8FA5', '#E6B8B8', '#FAF7F2', '#4A403A', '#FBBF24'],
    });

    const finalObjective = objetivoCustom.trim() || objetivo;

    const newProfile = {
      id: 'perfil-' + Date.now(),
      nome: nome.trim() || 'Atleta',
      peso: parseFloat(peso) || 60,
      massaMuscular: parseFloat((peso * 0.68).toFixed(1)),
      altura: parseFloat(altura) || 1.65,
      objetivo: finalObjective,
      ondeTreina,
      diasSemanaAlvo: parseInt(diasSemanaAlvo) || 4,
      nivel,
    };

    setTimeout(() => {
      onComplete(newProfile);
    }, 1200);
  };

  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-cream-100 flex flex-col justify-between overflow-y-auto p-5 animate-fade-in select-none">
      {/* Top Header & Progress */}
      <div className="max-w-md w-full mx-auto pt-3 space-y-3">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="p-2 rounded-2xl bg-white border border-sand-200 text-sand-500 hover:bg-cream-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-roseGold-400 to-[#CF6E8E] p-1.5 flex items-center justify-center shadow-md shadow-roseGold-200">
              <img src="/logo-white.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-sand-500 font-sans">
              Rise
            </span>
          </div>

          <span className="text-xs font-bold text-roseGold-600 bg-roseGold-50 px-2.5 py-1 rounded-full border border-roseGold-200 font-mono">
            {step}/{totalSteps}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-cream-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-roseGold-400 to-[#CF6E8E] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Step Content */}
      <div className="max-w-md w-full mx-auto my-auto py-6 space-y-5">
        {/* ── PASSO 1: NOME & LOGIN NUVEM ── */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-roseGold-500">
                Bem-vinda ao Rise ✨
              </span>
              <h2 className="text-2xl font-black text-sand-500 tracking-tight">
                Como te chamas?
              </h2>
              <p className="text-xs text-sand-400">
                O teu AI Coach e os teus planos serão personalizados para ti.
              </p>
            </div>

            {/* Opção para quem a app crashou / mudou de telemóvel recuperar a conta */}
            <div className="p-3.5 rounded-2xl bg-white border border-sand-200 shadow-soft space-y-2.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-base">☁️</span>
                <div>
                  <h3 className="text-xs font-bold text-sand-500 uppercase tracking-wider">
                    Já tens conta ou reinstalaste a app?
                  </h3>
                  <p className="text-[11px] text-sand-400 leading-tight">
                    Recupera o teu perfil, pesos e treinos guardados na nuvem.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleRestoreOrLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl border border-sand-300 bg-cream-50 hover:bg-cream-100 text-sand-500 font-bold text-xs transition active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isGoogleLoading ? 'A ligar à Google...' : 'Entrar com a Google / Restaurar Dados'}</span>
              </button>

              {restoreStatus && (
                <div className={`p-2 rounded-xl text-[11px] font-medium text-center ${
                  restoreStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  restoreStatus.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {restoreStatus.message}
                </div>
              )}
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-sand-200"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-sand-400">
                ou cria o teu perfil (a Google é opcional)
              </span>
              <div className="flex-grow border-t border-sand-200"></div>
            </div>

            <div className="pt-1">
              <input
                type="text"
                autoFocus
                placeholder="Escreve o teu nome ou alcunha..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nome.trim()) handleNext();
                }}
                className="w-full px-5 py-4 rounded-2xl bg-white border-2 border-sand-200 text-base font-bold text-sand-500 placeholder-sand-300 focus:outline-none focus:border-roseGold-400 shadow-soft text-center"
              />
            </div>
          </div>
        )}

        {/* ── PASSO 2: ONDE TREINAS? ── */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-roseGold-500">
                Personalização das Abas
              </span>
              <h2 className="text-2xl font-black text-sand-500 tracking-tight">
                Onde preferes treinar?
              </h2>
              <p className="text-xs text-sand-400">
                A aplicação adapta automaticamente os menus e treinos à tua resposta.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                {
                  id: 'gym',
                  title: 'Apenas no Ginásio (Gym)',
                  desc: 'Foco em rotinas com máquinas, aparelhos e cargas progressivas.',
                  icon: Dumbbell,
                },
                {
                  id: 'home',
                  title: 'Apenas em Casa (Home)',
                  desc: 'Aulas completas em vídeo com halteres, Pilates e treinos no tapete.',
                  icon: Home,
                },
                {
                  id: 'both',
                  title: 'Ambos (Home & Ginásio)',
                  desc: 'Alterno entre casa e ginásio. Quero acesso total a vídeos e aparelhos!',
                  icon: Sparkles,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSel = ondeTreina === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setOndeTreina(opt.id)}
                    className={`w-full p-4 rounded-3xl border-2 text-left flex items-start gap-3.5 transition-all duration-200 active:scale-[0.99] ${
                      isSel
                        ? 'bg-white border-roseGold-400 shadow-soft scale-[1.01]'
                        : 'bg-white/70 border-sand-200 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition ${
                        isSel
                          ? 'bg-gradient-to-tr from-roseGold-400 to-[#CF6E8E] text-white shadow-md shadow-roseGold-200'
                          : 'bg-cream-100 text-sand-400'
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-sand-500">{opt.title}</span>
                        {isSel && (
                          <div className="w-5 h-5 rounded-full bg-roseGold-400 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-sand-400 mt-0.5 leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PASSO 3: QUAL É O TEU OBJETIVO? ── */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-roseGold-500">
                Foco & Resultados
              </span>
              <h2 className="text-2xl font-black text-sand-500 tracking-tight">
                Qual o teu objetivo principal?
              </h2>
              <p className="text-xs text-sand-400">
                Usado pelo algoritmo para recomendar os treinos e vídeos ideais.
              </p>
            </div>

            <div className="space-y-2 pt-1 max-h-[46vh] overflow-y-auto pr-1">
              {popularObjectives.map((obj) => {
                const isSel = objetivo === obj.title;
                return (
                  <button
                    key={obj.id}
                    onClick={() => {
                      setObjetivo(obj.title);
                      setObjetivoCustom('');
                    }}
                    className={`w-full p-3.5 rounded-2xl border-2 text-left flex items-center gap-3 transition-all ${
                      isSel
                        ? 'bg-white border-roseGold-400 shadow-soft'
                        : 'bg-white/70 border-sand-200 hover:bg-white'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{obj.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-sand-500 block">{obj.title}</span>
                      <span className="text-[11px] text-sand-400 block truncate">{obj.desc}</span>
                    </div>
                    {isSel && (
                      <div className="w-5 h-5 rounded-full bg-roseGold-400 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}

              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Ou escreve o teu objetivo personalizado..."
                  value={objetivoCustom}
                  onChange={(e) => setObjetivoCustom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-sand-200 text-xs text-sand-500 placeholder-sand-300 focus:outline-none focus:border-roseGold-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── PASSO 4: DIAS POR SEMANA & NÍVEL ── */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-roseGold-500">
                Rotina & Nível
              </span>
              <h2 className="text-2xl font-black text-sand-500 tracking-tight">
                Quantos dias queres treinar?
              </h2>
              <p className="text-xs text-sand-400">
                Definiremos a tua meta semanal com base nisto.
              </p>
            </div>

            {/* Days Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-sand-400 uppercase tracking-wider block text-center">
                Meta de Treinos por Semana
              </label>
              <div className="flex items-center justify-center gap-2">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDiasSemanaAlvo(num)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-extrabold transition-all ${
                      diasSemanaAlvo === num
                        ? 'bg-roseGold-400 text-white shadow-md shadow-roseGold-200 scale-105'
                        : 'bg-white text-sand-500 border border-sand-200 hover:bg-cream-100'
                    }`}
                  >
                    {num}
                    <span className="block text-[9px] font-medium opacity-80">dias</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-sand-400 uppercase tracking-wider block text-center">
                Qual o teu nível de experiência?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Iniciante', label: 'Iniciante', sub: 'A começar' },
                  { id: 'Intermédio', label: 'Intermédio', sub: 'Treino regular' },
                  { id: 'Avançado', label: 'Avançado', sub: 'Cargas altas' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNivel(item.id)}
                    className={`p-3 rounded-2xl border text-center transition ${
                      nivel === item.id
                        ? 'bg-roseGold-50 border-roseGold-400 text-roseGold-600 font-bold'
                        : 'bg-white border-sand-200 text-sand-500 hover:bg-cream-50'
                    }`}
                  >
                    <span className="text-xs font-bold block">{item.label}</span>
                    <span className="text-[10px] text-sand-400 block mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PASSO 5: BIOMETRIA (OPCIONAL) ── */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-roseGold-500">
                Último Passo (Opcional)
              </span>
              <h2 className="text-2xl font-black text-sand-500 tracking-tight">
                As tuas medidas
              </h2>
              <p className="text-xs text-sand-400">
                Servem para calcular o teu IMC e calibrar as sugestões de peso do AI Coach.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white p-4 rounded-3xl border border-sand-200 space-y-1 text-center shadow-soft">
                <label className="text-[10px] font-bold text-sand-400 uppercase tracking-wider block">
                  Peso Atual (kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="w-full text-center text-xl font-black text-sand-500 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-sand-400 block">quilogramas</span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-sand-200 space-y-1 text-center shadow-soft">
                <label className="text-[10px] font-bold text-sand-400 uppercase tracking-wider block">
                  Altura (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  className="w-full text-center text-xl font-black text-sand-500 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-sand-400 block">metros</span>
              </div>
            </div>

            <p className="text-[11px] text-sand-400 text-center italic pt-2">
              Podes editar qualquer uma destas respostas a qualquer altura no teu Perfil!
            </p>
          </div>
        )}
      </div>

      {/* Bottom Button */}
      <div className="max-w-md w-full mx-auto pb-4 pt-2">
        <button
          onClick={handleNext}
          disabled={isFinishing || (step === 1 && !nome.trim())}
          className={`w-full py-4 rounded-2xl text-white text-sm font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 ${
            step === 1 && !nome.trim()
              ? 'bg-sand-300 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-roseGold-400 to-[#CF6E8E] hover:from-roseGold-500 hover:to-[#BD5C7E] shadow-roseGold-300'
          }`}
        >
          {isFinishing ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" /> A Criar o Teu Plano...
            </span>
          ) : step === totalSteps ? (
            <>
              <span>Criar o Meu Plano Personalizado</span>
              <Sparkles className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Continuar</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
