import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Calendar as CalendarIcon,
  Home as HomeIcon,
  Dumbbell,
  Clock,
  ArrowRight,
  Flame,
  Heart,
  CheckCircle2,
  Check,
  TrendingUp,
  Award,
  X,
  Plus,
} from 'lucide-react';
import { YOUTUBE_VIDEOS, CANAIS_FAVORITOS } from '../data/videoData';
import AddActivityModal from './AddActivityModal';
import { analyzeRecentFeedback, getFeedbackAdaptedStrategy } from '../services/feedbackAdvisor';
import { getMuscleIcon } from '../utils/muscleIcons';

const STORAGE_LIKED = 'rise_liked_videos';
function getLiked() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_LIKED) || '[]');
  } catch {
    return [];
  }
}

export default function HomeView({
  profile,
  workouts,
  onStartWorkout,
  setTab,
  history = [],
  onLogActivity,
}) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const userPref = profile?.ondeTreina || 'both';
  const [workoutMode, setWorkoutMode] = useState(() => (userPref === 'gym' ? 'gym' : 'home'));
  const [likedIds] = useState(() => getLiked());
  const [showTipModal, setShowTipModal] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalTargetDate, setModalTargetDate] = useState(() => new Date());
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [monthSelectedDate, setMonthSelectedDate] = useState(() => new Date());

  const handleOpenAddModal = (date) => {
    setModalTargetDate(date || selectedDate || new Date());
    setIsAddModalOpen(true);
  };

  const handleOpenMonthModal = () => {
    setMonthCursor(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    setMonthSelectedDate(selectedDate);
    setIsMonthModalOpen(true);
  };

  // ── Monthly Calendar Grid Data ───────────────────────────────────────────
  const monthGridDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDayWeekday = new Date(year, month, 1).getDay(); // 0=Dom ... 6=Sáb
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const now = new Date();

    const cells = [];
    for (let i = 0; i < firstDayWeekday; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dayWorkouts = (history || []).filter((h) => {
        if (!h.data) return false;
        const hd = new Date(h.data);
        return (
          hd.getDate() === day &&
          hd.getMonth() === month &&
          hd.getFullYear() === year
        );
      });
      const isToday =
        day === now.getDate() &&
        month === now.getMonth() &&
        year === now.getFullYear();

      cells.push({
        date: d,
        dayNum: day,
        isToday,
        workouts: dayWorkouts,
        hasWorkout: dayWorkouts.length > 0,
      });
    }

    return cells;
  }, [monthCursor, history]);

  const monthSelectedDayWorkouts = useMemo(() => {
    return (history || []).filter((h) => {
      if (!h.data) return false;
      const hd = new Date(h.data);
      return (
        hd.getDate() === monthSelectedDate.getDate() &&
        hd.getMonth() === monthSelectedDate.getMonth() &&
        hd.getFullYear() === monthSelectedDate.getFullYear()
      );
    });
  }, [history, monthSelectedDate]);

  React.useEffect(() => {
    if (userPref === 'gym') setWorkoutMode('gym');
    else if (userPref === 'home') setWorkoutMode('home');
  }, [userPref]);

  // ── Calculate Current Week Days (Domingo a Sábado) ─────────────────────────
  const weekDays = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - currentDay);

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const fullDayNames = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado'
    ];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);

      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      // All workouts logged on this specific calendar day
      const dayWorkouts = history.filter((h) => {
        if (!h.data) return false;
        const hd = new Date(h.data);
        return (
          hd.getDate() === d.getDate() &&
          hd.getMonth() === d.getMonth() &&
          hd.getFullYear() === d.getFullYear()
        );
      });

      return {
        date: d,
        dayName: dayNames[i],
        fullDayName: fullDayNames[i],
        dayNum: d.getDate(),
        isToday,
        workouts: dayWorkouts,
        hasWorkout: dayWorkouts.length > 0,
      };
    });
  }, [history]);

  // Selected day helper
  const selectedDayData = useMemo(() => {
    return weekDays.find(
      (d) =>
        d.date.getDate() === selectedDate.getDate() &&
        d.date.getMonth() === selectedDate.getMonth() &&
        d.date.getFullYear() === selectedDate.getFullYear()
    ) || weekDays[0];
  }, [weekDays, selectedDate]);

  const isTodaySelected = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  }, [selectedDate]);

  // Workouts completed TODAY
  const todayWorkouts = useMemo(() => {
    return weekDays.find((d) => d.isToday)?.workouts || [];
  }, [weekDays]);

  const hasTrainedToday = todayWorkouts.length > 0;

  // All workouts completed this week
  const thisWeekWorkouts = useMemo(() => {
    return weekDays.flatMap((d) => d.workouts);
  }, [weekDays]);

  const completedThisWeek = weekDays.filter((d) => d.hasWorkout).length;
  const weeklyGoal = profile.diasSemanaAlvo || 4;

  // ── Body Balance Analysis (Treinar o Corpo Todo) ───────────────────────────
  const bodyBalance = useMemo(() => {
    let quads = 0;
    let glutes = 0;
    let upper = 0;
    let fullCore = 0;

    thisWeekWorkouts.forEach((w) => {
      const title = (w.treinoTitulo || '').toLowerCase();
      const id = (w.treinoId || '').toLowerCase();

      // Check gym workouts
      if (id === 'treino-1' || title.includes('quadríceps') || title.includes('leg day')) {
        quads += 1;
      } else if (id === 'treino-2' || title.includes('glúteo') || title.includes('booty')) {
        glutes += 1;
      } else if (id === 'treino-3' || title.includes('costas') || title.includes('ombros') || title.includes('superior') || title.includes('upper')) {
        upper += 1;
      } else {
        // Find in video database to classify
        const videoMatch = YOUTUBE_VIDEOS.find((v) => v.id === id);
        if (videoMatch) {
          if (videoMatch.targetArea === 'quads') quads += 1;
          else if (videoMatch.targetArea === 'glutes') glutes += 1;
          else if (videoMatch.targetArea === 'upper') upper += 1;
          else fullCore += 1;
        } else {
          if (title.includes('perna') || title.includes('quad')) quads += 1;
          else if (title.includes('glúteo') || title.includes('booty')) glutes += 1;
          else if (title.includes('superior') || title.includes('arm') || title.includes('costas')) upper += 1;
          else fullCore += 1;
        }
      }
    });

    return { quads, glutes, upper, fullCore };
  }, [thisWeekWorkouts]);

  // ── Smart Recommendation Strategy to Train the Whole Body ──────────────────
  const recommendationStrategy = useMemo(() => {
    const { quads, glutes, upper, fullCore } = bodyBalance;
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const isWeekStart = currentDay === 0 || currentDay === 1; // Domingo ou Segunda
    const isWeekEnd = currentDay === 5 || currentDay === 6; // Sexta ou Sábado
    const todayTitles = todayWorkouts.map((w) => w.treinoTitulo).join(', ') || 'Treino';

    const isAllWorkoutsDone =
      (quads >= 1 && glutes >= 1 && upper >= 1) ||
      completedThisWeek >= weeklyGoal;

    // Rule 1: No lower body yet -> prioritize Quads & Legs
    if (quads === 0 && glutes === 0) {
      return {
        focusArea: 'quads',
        targetLabel: hasTrainedToday ? 'Próxima Sessão: Quadríceps & Pernas' : 'Quadríceps & Pernas',
        motivo: hasTrainedToday
          ? `Treino de hoje já registado com sucesso! 🎉 O teu estímulo diário está concluído. Para a tua próxima sessão (amanhã), a recomendação do plano será Quadríceps & Pernas.`
          : isWeekStart
          ? 'Nova semana, novo foco! Começa a semana em grande com o teu estímulo principal em Quadríceps & Pernas.'
          : 'Estímulo prioritário da semana nas pernas e grandes grupos musculares com foco em hipertrofia.',
        gymId: 'treino-1',
      };
    }

    // Rule 2: Done quads, but glutes pending -> prioritize Glúteos & Posterior
    if (quads > 0 && glutes === 0) {
      return {
        focusArea: 'glutes',
        targetLabel: hasTrainedToday ? 'Próxima Sessão: Glúteos & Posterior' : 'Glúteos & Posterior',
        motivo: hasTrainedToday
          ? `Treino de hoje já registado com sucesso! 🎉 Para a tua próxima sessão (amanhã), o foco ideal será Glúteos & Posterior (Hip Thrust, RDL e Back Extension) para descansares os quadríceps.`
          : 'Já deste estímulo em Quadríceps esta semana! O foco ideal agora é Glúteos & Posterior (Hip Thrust, RDL e Back Extension) para descansares os quadríceps.',
        gymId: 'treino-2',
      };
    }

    // Rule 2B: Done glutes first, but quads pending -> prioritize Quadríceps & Pernas
    if (glutes > 0 && quads === 0) {
      return {
        focusArea: 'quads',
        targetLabel: hasTrainedToday ? 'Próxima Sessão: Quadríceps & Pernas' : 'Quadríceps & Pernas',
        motivo: hasTrainedToday
          ? `Treino de hoje já registado com sucesso! 🎉 Para a tua próxima sessão (amanhã), o foco ideal será Quadríceps & Pernas (Leg Press e agachamento) para descansares a cadeia posterior.`
          : 'Já deste um excelente estímulo em Glúteos & Core esta semana! O foco ideal agora é Quadríceps & Pernas (Leg Press, agachamento e pernas) para descansares a cadeia posterior e equilibrares os membros inferiores.',
        gymId: 'treino-1',
      };
    }

    // Rule 3: Done both lower sessions, but upper body pending -> prioritize Superior / Costas / Braços
    if (quads > 0 && glutes > 0 && upper === 0) {
      return {
        focusArea: 'upper',
        targetLabel: hasTrainedToday ? 'Próxima Sessão: Superiores & Tronco' : 'Superiores (Costas, Ombros & Braços)',
        motivo: hasTrainedToday
          ? `Treino de hoje concluído com sucesso! 🎉 Pernas e glúteos já foram trabalhados. Para a tua próxima sessão (amanhã), o foco será na parte superior (Costas, Ombros & Braços).`
          : 'Excelente! Pernas e glúteos já foram trabalhados. Para equilibrar o corpo todo e evitar sobrecarga nos membros inferiores, o foco de hoje é na parte superior.',
        gymId: 'treino-3',
      };
    }

    // Rule 4: If upper body was done, but glutes or quads missing
    if (upper > 0 && glutes > 0 && quads === 0) {
      return {
        focusArea: 'quads',
        targetLabel: hasTrainedToday ? 'Próxima Sessão: Quadríceps & Pernas' : 'Quadríceps & Pernas',
        motivo: hasTrainedToday
          ? `Treino de hoje concluído com sucesso! 🎉 Para a tua próxima sessão (amanhã), o foco recomendado será Quadríceps & Pernas.`
          : 'Já treinaste Superiores e Glúteos! Para equilibrares o corpo todo e manteres o plano em dia, o treino recomendado para hoje é Quadríceps & Pernas.',
        gymId: 'treino-1',
      };
    }
    if (upper > 0 && glutes === 0) {
      return {
        focusArea: 'glutes',
        targetLabel: hasTrainedToday ? 'Próxima Sessão: Glúteos & Posterior' : 'Glúteos & Posterior',
        motivo: hasTrainedToday
          ? `Treino de hoje concluído com sucesso! 🎉 Para a tua próxima sessão (amanhã), o foco ideal para os teus objetivos será a cadeia posterior e glúteos.`
          : 'Superiores já foram trabalhados. O foco ideal agora para os teus objetivos é a cadeia posterior e glúteos.',
        gymId: 'treino-2',
      };
    }
    if (upper > 0 && quads === 0) {
      return {
        focusArea: 'quads',
        targetLabel: hasTrainedToday ? 'Próxima Sessão: Quadríceps & Pernas' : 'Quadríceps & Pernas',
        motivo: hasTrainedToday
          ? `Treino de hoje concluído com sucesso! 🎉 Para a tua próxima sessão (amanhã), o estímulo será em Quadríceps & Pernas com Leg Press e agachamento.`
          : 'Equilíbrio da semana: ativação potente de quadríceps com Leg Press e agachamento.',
        gymId: 'treino-1',
      };
    }

    // Rule 5: All main categories covered or weekly target reached
    if (isAllWorkoutsDone || (quads >= 1 && glutes >= 1 && upper >= 1 && fullCore >= 1)) {
      return {
        focusArea: 'mobility',
        targetLabel: 'Meta Semanal 100% Concluída! 🏆',
        motivo: hasTrainedToday
          ? `Meta da semana 100% cumprida! 🏆 Parabéns! Já cobriste todos os grupos musculares da semana. Todo o trabalho de hipertrofia por esta semana está concluído com distinção — agora o foco absoluto é descanso merecido, hidratação e sono reparador. Cargas pesadas só na próxima semana!`
          : 'Meta semanal concluída com chave de ouro! Cobriste o corpo todo a 100%. A sugestão agora é descanso merecido ou uma sessão relaxante de mobilidade e alongamento.',
        gymId: null,
        isAllWorkoutsDone: true,
      };
    }

    // Rule 6: Covered the 3 main splits
    return {
      focusArea: 'fullbody',
      targetLabel: hasTrainedToday ? 'Próxima Sessão: Full Body & Core' : 'Full Body & Core (ou 2º Foco em Glúteos)',
      motivo: hasTrainedToday
        ? `Treino de hoje concluído com sucesso! 🎉 Já cobriste os pilares principais da semana. Para o resto do dia de hoje, a prioridade é o descanso e boa nutrição. Para a tua próxima sessão (amanhã), a sugestão será um Full Body ou um segundo foco em Glúteos.`
        : isWeekEnd
        ? 'Incrível! Já cobriste os pilares da semana. O treino ideal para fechar a semana é um Full Body com halteres ou Core/Pilates — ou um segundo estímulo focado em Glúteos!'
        : 'Excelente ritmo! Já trabalhaste os pilares principais. Podes complementar com um Full Body com halteres, uma sessão dinâmica de Core/Pilates ou um segundo foco em Glúteos.',
      gymId: 'treino-2',
    };
  }, [bodyBalance, hasTrainedToday, todayWorkouts, completedThisWeek, weeklyGoal]);

  // ── Análise Inteligente do Feedback Recente ──────────────────────────────
  const feedbackAnalysis = useMemo(() => {
    return analyzeRecentFeedback(history);
  }, [history]);

  // ── Estratégia Adaptada (Equilíbrio Semanal + Impacto do Feedback + Treino de Hoje) ──────
  const activeStrategy = useMemo(() => {
    return getFeedbackAdaptedStrategy(
      recommendationStrategy,
      feedbackAnalysis,
      hasTrainedToday,
      todayWorkouts
    );
  }, [recommendationStrategy, feedbackAnalysis, hasTrainedToday, todayWorkouts]);

  // ── Recommended Gym Workout ───────────────────────────────────────────────
  const recommendedGymWorkout = useMemo(() => {
    const match = workouts.find((w) => w.id === activeStrategy.gymId);
    return match || workouts[0];
  }, [workouts, activeStrategy]);

  // ── Recommended Home Video (Smart matching level, favorites, targetArea & feedback) ──
  const recommendedHomeVideo = useMemo(() => {
    const target = activeStrategy.focusArea;
    const favChannelNames = CANAIS_FAVORITOS.map((c) => c.nome.toLowerCase());
    const nivelLower = (profile?.nivel || 'Intermédio').toLowerCase();
    const isBeginner = nivelLower.includes('inici');
    const isAdvanced = nivelLower.includes('avan');
    const isIntermediate = !isBeginner && !isAdvanced;

    // Excluir vídeos com avaliação baixa (<= 2 estrelas) no histórico do utilizador
    const lowRatedIds = (history || [])
      .filter((h) => (h.tipo === 'video' || h.treinoId) && Number(h.rating) <= 2)
      .map((h) => h.treinoId);

    // Se o utilizador reportou dor ou fadiga muscular, priorizar mobilidade / pilates ou zona de recuperação
    const areaPool = YOUTUBE_VIDEOS.filter((v) => {
      if (lowRatedIds.includes(v.id)) return false;
      if (feedbackAnalysis?.hasPainOrDiscomfort) {
        return v.categoria === 'Mobilidade' || v.categoria === 'Pilates' || v.targetArea === target;
      }
      return v.targetArea === target;
    });

    const pool = areaPool.length > 0 ? areaPool : YOUTUBE_VIDEOS.filter((v) => !lowRatedIds.includes(v.id));

    // 1. First choice: Liked video matching targetArea and appropriate level
    const likedMatch = pool.find((v) => {
      if (!likedIds.includes(v.id)) return false;
      if (isBeginner) return (v.intensidade || 0) <= 3;
      if (isAdvanced) return (v.intensidade || 0) >= 4;
      return (v.intensidade || 0) >= 3 && (v.intensidade || 0) <= 4;
    });
    if (likedMatch) return likedMatch;

    // 2. Level-specific curated match inside the target area
    if (isBeginner) {
      const beginnerMatch = pool.find((v) => (v.intensidade || 0) <= 3);
      if (beginnerMatch) return beginnerMatch;
    } else if (isIntermediate) {
      // Para Intermédio: Intensidade 3 a 4 (NUNCA nível 5 / Hyrox!)
      const intermediateMatch = pool.find(
        (v) => (v.intensidade || 0) >= 3 && (v.intensidade || 0) <= 4
      );
      if (intermediateMatch) return intermediateMatch;
    } else if (isAdvanced) {
      const advancedMatch = pool.find((v) => (v.intensidade || 0) >= 4);
      if (advancedMatch) return advancedMatch;
    }

    // 3. Favorite channels match with level filter
    const favMatch = pool.find((v) => {
      if (!favChannelNames.includes(v.canal.toLowerCase())) return false;
      if (isBeginner) return (v.intensidade || 0) <= 3;
      if (isIntermediate) return (v.intensidade || 0) <= 4;
      return true;
    });
    if (favMatch) return favMatch;

    // 4. Safe fallback guaranteeing level compatibility
    if (isBeginner) {
      return pool.find((v) => (v.intensidade || 0) <= 3) || YOUTUBE_VIDEOS[1];
    }
    if (isIntermediate) {
      return (
        pool.find((v) => (v.intensidade || 0) === 4 && v.categoria !== 'Alta Intensidade') ||
        pool.find((v) => (v.intensidade || 0) === 4) ||
        YOUTUBE_VIDEOS[1]
      );
    }
    return pool[0] || YOUTUBE_VIDEOS[0];
  }, [activeStrategy, likedIds, profile?.nivel, history, feedbackAnalysis]);

  // ── Dica Dinâmica do AI Coach (Adaptada ao Vídeo Sugerido, Pesos e Feedback) ───
  const currentAiTip = useMemo(() => {
    if (hasTrainedToday) {
      const todayNames = todayWorkouts.map((w) => w.treinoTitulo).join(', ') || 'Treino';
      return `Missão cumprida por hoje com ${todayNames}! 🎉 O teu estímulo muscular já está garantido. Para hoje, o segredo é beber água, alimentar bem os músculos com boa proteína e dormir 7 a 8 horas. É no descanso que a hipertrofia realmente acontece!`;
    }

    // Prefixo dinâmico se houver feedback recente
    let feedbackPrefix = '';
    if (feedbackAnalysis && (feedbackAnalysis.rawFeedback || feedbackAnalysis.tags.length > 0)) {
      if (feedbackAnalysis.hasPainOrDiscomfort) {
        feedbackPrefix = `💡 Adaptado ao teu registo em ${feedbackAnalysis.treinoTitulo}: Hoje preservamos as tuas articulações com movimento seguro e regenerativo. `;
      } else if (feedbackAnalysis.isFatigueOrHeavy) {
        feedbackPrefix = `💡 Tendo em conta o esforço elevado em ${feedbackAnalysis.treinoTitulo}: Garante descanso entre séries e boa hidratação. `;
      } else if (feedbackAnalysis.isHighEnergy) {
        feedbackPrefix = `💡 Embalada pelo ótimo treino em ${feedbackAnalysis.treinoTitulo}: Mantém a consistência no ponto! `;
      }
    }

    if (workoutMode === 'home') {
      if (!recommendedHomeVideo) {
        return feedbackPrefix + 'Para hipertrofia e definição em casa, foca-te em controlar a fase excêntrica (3 segundos a descer). O tempo sob tensão ativa as fibras musculares com o dobro da eficácia!';
      }

      const titleLower = (recommendedHomeVideo.titulo || '').toLowerCase();
      const descLower = (recommendedHomeVideo.descricao || '').toLowerCase();
      const hasWeights =
        titleLower.includes('weight') ||
        titleLower.includes('dumbbell') ||
        titleLower.includes('haltere') ||
        titleLower.includes('db ') ||
        titleLower.includes('com pesos') ||
        descLower.includes('haltere') ||
        descLower.includes('pesos') ||
        descLower.includes('dumbbells');

      const isHighIntensity =
        recommendedHomeVideo.categoria === 'Alta Intensidade' ||
        titleLower.includes('hyrox') ||
        titleLower.includes('hiit') ||
        titleLower.includes('tabata') ||
        titleLower.includes('cardio');

      const isGlutes =
        recommendedHomeVideo.categoria === 'Glúteos' ||
        titleLower.includes('glute') ||
        titleLower.includes('booty') ||
        titleLower.includes('bunda');

      const isPilates =
        recommendedHomeVideo.categoria === 'Pilates' ||
        titleLower.includes('pilates');

      const isMobility =
        recommendedHomeVideo.categoria === 'Mobilidade' ||
        titleLower.includes('stretch') ||
        titleLower.includes('mobility') ||
        titleLower.includes('alongamento');

      // 1. Treino com pesos / halteres em casa
      if (hasWeights) {
        if (isGlutes) {
          return feedbackPrefix + 'Para hipertrofia e definição dos glúteos com pesos, foca-te em controlar a fase excêntrica (3 segundos a descer). O tempo sob tensão ativa as fibras musculares profundas com o dobro da eficácia!';
        }
        return feedbackPrefix + 'Para hipertrofia e definição em casa com halteres, foca-te em controlar a fase excêntrica (3 segundos a descer o haltere). O tempo sob tensão ativa as fibras musculares profundas com o dobro da eficácia!';
      }

      // 2. Alta Intensidade / Cardio / Hyrox (sem pesos ou peso corporal)
      if (isHighIntensity) {
        return feedbackPrefix + 'Sessão de alta intensidade e ritmo cardíaco elevado! O segredo é gerir a energia: mantém uma respiração constante pelo nariz nos blocos intensos e bebe pequenos goles de água nos intervalos.';
      }

      // 3. Glúteos sem pesos (peso corporal / bandas)
      if (isGlutes) {
        return feedbackPrefix + 'Treino de glúteos focado em ativação profunda e tempo sob tensão! Pensa na ligação mente-músculo: aperta bem o glúteo no pico do movimento sem balançar o tronco.';
      }

      // 4. Pilates / Core
      if (isPilates) {
        return feedbackPrefix + 'Nesta sessão de Pilates, o foco é a estabilidade profunda do core e o controlo respiratório. Expira ao fazer o maior esforço e mantém os ombros relaxados para evitar tensão no pescoço.';
      }

      // 5. Mobilidade e Recuperação
      if (isMobility) {
        return feedbackPrefix + 'Momento de regeneração ativa! Respira profundamente e nunca forces até à dor. Libertar as tensões nas ancas e pernas vai aumentar a tua força e amplitude nos próximos treinos.';
      }

      return feedbackPrefix + 'Controla o ritmo de cada movimento e mantém o core ligeiramente ativo. A técnica e a consistência trazem resultados visíveis com total segurança!';
    }

    // ── Dicas para Treinos de Ginásio (Gym Mode) ──
    const gymId = recommendedGymWorkout?.id;
    if (gymId === 'treino-1') {
      return feedbackPrefix + 'Foco em Quadríceps e Adutores! No Leg Press e no Seated Hip Adductor, empurra e aperta com controlo total da descida. Lembra-te de apontar as cargas de hoje para acompanhar a tua evolução!';
    }
    if (gymId === 'treino-2') {
      return feedbackPrefix + 'Dia de Glúteos & Posterior! No Hip Thrust, Romanian Deadlift (RDL) e Back Extension, foca-te na extensão completa da anca sem arquear a lombar. Ajustar as cargas série a série garante o estímulo ideal.';
    }
    if (gymId === 'treino-3') {
      return feedbackPrefix + 'Foco em Superiores e Postura! Nas remadas e puxadas, pensa em "puxar com os cotovelos" para sentires as costas e os dorsais. Mantém o peito aberto e os ombros afastados das orelhas!';
    }
    if (gymId === 'treino-4') {
      return feedbackPrefix + 'Foco em Core e Definição Abdominal! No Ab Crunch no Banco Inclinado com peso (5 kg / 10 kg) e no Rollout, não uses o balanço do corpo. Concentra a força no abdómen profundo e controla a respiração a cada repetição!';
    }

    return feedbackPrefix + 'No ginásio, a consistência de cargas e o registo de cada série fazem toda a magia. Mantém a técnica impecável e desafia-te!';
  }, [workoutMode, recommendedHomeVideo, recommendedGymWorkout, feedbackAnalysis, hasTrainedToday, todayWorkouts]);

  return (
    <div className="space-y-5 pb-24">
      {/* Header Greeting */}
      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#ECA1B8] via-[#DF86A3] to-[#CF6E8E] p-2 flex items-center justify-center shadow-md shadow-roseGold-500/20 flex-shrink-0">
            <img
              src="/logo-white.png"
              alt="Rise Logo"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-roseGold-500 block">
              Rise • AI Coach
            </span>
            <h1 className="text-xl font-extrabold text-sand-500 tracking-tight leading-tight">
              Olá, {profile.nome} ✨
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenMonthModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white hover:bg-cream-100 border border-sand-200 text-xs shadow-soft flex-shrink-0 transition active:scale-95"
          title="Ver Calendário do Mês"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-roseGold-500" />
          <span className="font-bold text-sand-500">
            {selectedDate.toLocaleDateString('pt-PT', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </button>
      </div>

      {/* ── META SEMANAL & CALENDÁRIO COM HISTÓRICO ── */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-sand-100 space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-roseGold-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-sand-500">
              Meta Semanal
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-cream-200 text-roseGold-600 border border-cream-300">
              {completedThisWeek}/{weeklyGoal} treinos
            </span>
            <button
              type="button"
              onClick={handleOpenMonthModal}
              className="p-1.5 rounded-xl bg-cream-100 hover:bg-roseGold-50 text-sand-500 hover:text-roseGold-600 border border-sand-200 transition active:scale-95"
              title="Abrir Calendário Mensal"
              aria-label="Abrir Calendário Mensal"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 7 Days Strip in Warm Beige & Rose Gold */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, idx) => {
            const isSel =
              d.date.getDate() === selectedDate.getDate() &&
              d.date.getMonth() === selectedDate.getMonth() &&
              d.date.getFullYear() === selectedDate.getFullYear();

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(d.date)}
                className={`relative flex flex-col items-center justify-center py-2.5 rounded-2xl transition-all duration-200 ${
                  isSel
                    ? 'bg-roseGold-400 text-white shadow-md shadow-roseGold-200 scale-105 font-bold'
                    : 'bg-cream-50 text-sand-400 hover:bg-cream-200 border border-sand-100'
                }`}
              >
                <span className={`text-xs tracking-tight uppercase ${isSel ? 'text-white' : 'text-sand-400'}`}>
                  {d.dayName}
                </span>
                <span className="text-sm font-extrabold mt-0.5 font-mono">
                  {d.dayNum}
                </span>

                {/* Status Dot / Check / Add indicator */}
                <div className="mt-1 flex items-center justify-center h-2">
                  {d.hasWorkout ? (
                    <div className={`w-2 h-2 rounded-full ${isSel ? 'bg-white' : 'bg-emerald-500'}`} />
                  ) : isSel ? (
                    <span className="text-[10px] font-extrabold text-white leading-none">+</span>
                  ) : d.isToday ? (
                    <span className={`w-1.5 h-1.5 rounded-full animate-ping bg-roseGold-400`} />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Workouts Completed on Selected Date */}
        <div className="pt-2 border-t border-sand-100">
          <div className="px-1 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-sand-400 block">
              {selectedDayData.isToday
                ? `Treinos de Hoje (${selectedDayData.fullDayName})`
                : `Treinos de ${selectedDayData.fullDayName} (${selectedDayData.dayNum})`}
            </span>
          </div>

          {selectedDayData.workouts.length > 0 ? (
            <div className="space-y-1.5">
              {selectedDayData.workouts.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-cream-50 border border-sand-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <span className="font-bold text-sand-500 block leading-tight">
                        {w.treinoTitulo || 'Treino Concluído'}
                      </span>
                      <span className="text-xs text-sand-400">
                        {w.tipo || 'Ginásio'} • {w.duracaoMinutos || 45} min
                        {w.distanciaKm ? ` • ${w.distanciaKm} km` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Feito ✓
                  </span>
                </div>
              ))}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(selectedDayData.date)}
                  className="text-[11px] font-bold text-roseGold-600 hover:text-roseGold-700 transition"
                >
                  + Registar outro treino neste dia
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-cream-50/70 border border-dashed border-sand-300/80 text-center space-y-2">
              <span className="text-xs text-sand-400 block">
                {selectedDayData.isToday
                  ? 'Ainda não registaste nenhum treino hoje.'
                  : `Sem registo de treino em ${selectedDayData.fullDayName.toLowerCase()} (${selectedDayData.dayNum}).`}
              </span>
              <button
                type="button"
                onClick={() => handleOpenAddModal(selectedDayData.date)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-roseGold-400 to-roseGold-500 text-white text-xs font-bold shadow-sm shadow-roseGold-200/50 hover:opacity-95 active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Registar Treino / Atividade</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── EQUILÍBRIO CORPORAL DA SEMANA (CORPO TODO) ── */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-sand-100 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-roseGold-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-sand-500">
              Equilíbrio Corporal da Semana
            </span>
          </div>
          <span className="text-xs font-bold text-roseGold-600 bg-roseGold-50 px-2 py-0.5 rounded-full border border-roseGold-200">
            Corpo Todo
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Quads */}
          <div
            className={`p-2.5 rounded-2xl border text-center transition ${
              bodyBalance.quads > 0
                ? 'bg-cream-100 border-roseGold-300'
                : 'bg-cream-50 border-sand-200 opacity-70'
            }`}
          >
            <span className="text-sm">🦵</span>
            <span className="text-xs font-bold text-sand-500 block mt-0.5">Quads</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
                bodyBalance.quads > 0
                  ? 'bg-roseGold-400 text-white'
                  : 'bg-sand-200 text-sand-500'
              }`}
            >
              {bodyBalance.quads}x
            </span>
          </div>

          {/* Glutes */}
          <div
            className={`p-2.5 rounded-2xl border text-center transition ${
              bodyBalance.glutes > 0
                ? 'bg-cream-100 border-roseGold-300'
                : 'bg-cream-50 border-sand-200 opacity-70'
            }`}
          >
            <span className="text-sm">🍑</span>
            <span className="text-xs font-bold text-sand-500 block mt-0.5">Glúteos</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
                bodyBalance.glutes > 0
                  ? 'bg-roseGold-400 text-white'
                  : 'bg-sand-200 text-sand-500'
              }`}
            >
              {bodyBalance.glutes}x
            </span>
          </div>

          {/* Upper Body */}
          <div
            className={`p-2.5 rounded-2xl border text-center transition ${
              bodyBalance.upper > 0
                ? 'bg-cream-100 border-roseGold-300'
                : 'bg-cream-50 border-sand-200 opacity-70'
            }`}
          >
            <span className="text-sm">💪</span>
            <span className="text-xs font-bold text-sand-500 block mt-0.5">Superiores</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
                bodyBalance.upper > 0
                  ? 'bg-roseGold-400 text-white'
                  : 'bg-sand-200 text-sand-500'
              }`}
            >
              {bodyBalance.upper}x
            </span>
          </div>

          {/* Full / Core */}
          <div
            className={`p-2.5 rounded-2xl border text-center transition ${
              bodyBalance.fullCore > 0
                ? 'bg-cream-100 border-roseGold-300'
                : 'bg-cream-50 border-sand-200 opacity-70'
            }`}
          >
            <span className="text-sm">⚡</span>
            <span className="text-xs font-bold text-sand-500 block mt-0.5">Full/Core</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
                bodyBalance.fullCore > 0
                  ? 'bg-roseGold-400 text-white'
                  : 'bg-sand-200 text-sand-500'
              }`}
            >
              {bodyBalance.fullCore}x
            </span>
          </div>
        </div>
      </div>

      {/* ── LOCAL DE TREINO (SLIDING SWITCH OU INDICADOR DE PREFERÊNCIA) ── */}
      {userPref === 'both' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-sand-500">
              Local de Treino
            </span>
            <span className="text-xs text-roseGold-600 font-semibold">
              {workoutMode === 'home' ? '🏠 Em Casa (Vídeos)' : '🏋️‍♀️ No Ginásio (Aparelhos)'}
            </span>
          </div>

          <div className="relative p-1 bg-cream-200/80 rounded-2xl border border-sand-200 select-none shadow-inner h-12 flex items-center">
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-md transition-all duration-300 ease-out flex items-center justify-center ${
                workoutMode === 'home' ? 'left-1' : 'left-[calc(50%+4px-4px)] translate-x-0'
              }`}
            />
            <button
              onClick={() => setWorkoutMode('home')}
              className={`relative z-10 flex-1 h-full rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                workoutMode === 'home' ? 'text-roseGold-600' : 'text-sand-400 hover:text-sand-600'
              }`}
            >
              <HomeIcon className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setWorkoutMode('gym')}
              className={`relative z-10 flex-1 h-full rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                workoutMode === 'gym' ? 'text-roseGold-600' : 'text-sand-400 hover:text-sand-600'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Gym</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-2xl border border-sand-100 shadow-soft text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-sand-500 text-xs uppercase tracking-wide">
              {userPref === 'gym' ? 'Treino no Ginásio' : 'Treino em Casa'}
            </span>
          </div>
          <span className="text-xs font-semibold text-roseGold-600 flex items-center gap-1.5 bg-roseGold-50 px-2.5 py-0.5 rounded-full border border-roseGold-200">
            {userPref === 'gym' ? <Dumbbell className="w-3.5 h-3.5" /> : <HomeIcon className="w-3.5 h-3.5" />}
            {userPref === 'gym' ? 'Rotinas com Aparelhos' : 'Aulas & Vídeos'}
          </span>
        </div>
      )}

      {/* ── RECOMENDAÇÃO INTELIGENTE (BASEADA NO HISTÓRICO DA SEMANA) ── */}
      {workoutMode === 'home' ? (
        <div className="space-y-4 animate-fade-in">
          {/* Recommendation Banner explaining WHY */}
          <div className="bg-gradient-to-r from-roseGold-50 to-cream-100 rounded-3xl p-4 border border-roseGold-200/80 shadow-soft space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-roseGold-600 font-bold text-xs">
                {hasTrainedToday ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {hasTrainedToday ? 'Treino de Hoje Concluído 🎉' : 'Recomendação do Coach AI'}
                </span>
              </div>
              {hasTrainedToday ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs">
                  ✓ Missão Cumprida
                </span>
              ) : activeStrategy.feedbackNotice ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-roseGold-100 text-roseGold-700 border border-roseGold-200 shadow-2xs">
                  ✨ Adaptado ao Feedback
                </span>
              ) : null}
            </div>
            <p className="text-xs text-sand-500 leading-relaxed">
              {activeStrategy.motivo}
            </p>
          </div>

          {/* Featured Video Card */}
          {recommendedHomeVideo && (
            <div className="bg-white rounded-3xl overflow-hidden shadow-soft border border-sand-100 hover:border-roseGold-200 transition-all">
              <div
                className="relative aspect-video w-full cursor-pointer bg-sand-200 group"
                onClick={() => setTab('videos')}
              >
                <img
                  src={recommendedHomeVideo.thumbnail}
                  alt={recommendedHomeVideo.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-sand-600/30 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white text-roseGold-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                </div>

                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/95 text-roseGold-600 text-xs font-bold">
                  {hasTrainedToday
                    ? 'Relaxamento / Alongamento Pós-Treino'
                    : `${recommendedHomeVideo.canal} • ${recommendedHomeVideo.nivel}`}
                </div>

                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-sand-600/80 text-white text-xs font-mono font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recommendedHomeVideo.duracao}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-roseGold-500">
                    Foco: {recommendedHomeVideo.foco}
                  </span>
                  <span className="text-xs text-sand-400 font-medium">
                    {recommendedHomeVideo.categoria}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-sand-500">
                  {recommendedHomeVideo.titulo}
                </h3>

                <p className="text-xs text-sand-400 line-clamp-2">
                  {recommendedHomeVideo.descricao}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-sand-100">
                  <button
                    onClick={() => setTab('videos')}
                    className="w-full py-2.5 rounded-2xl bg-roseGold-400 hover:bg-roseGold-500 text-white text-xs font-bold transition shadow-md shadow-roseGold-200 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {hasTrainedToday ? 'Ver Alongamento & Relaxamento (Opcional)' : 'Abrir Aula & Começar Treino'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GYM WORKOUT MODE */
        <div className="space-y-4 animate-fade-in">
          {/* Recommendation Banner explaining WHY */}
          <div className="bg-gradient-to-r from-roseGold-50 to-cream-100 rounded-3xl p-4 border border-roseGold-200/80 shadow-soft space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-roseGold-600 font-bold text-xs">
                {hasTrainedToday ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {hasTrainedToday ? 'Treino de Hoje Concluído 🎉' : 'Recomendação do Coach AI'}
                </span>
              </div>
              {hasTrainedToday ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-2xs">
                  ✓ Missão Cumprida
                </span>
              ) : activeStrategy.feedbackNotice ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-roseGold-100 text-roseGold-700 border border-roseGold-200 shadow-2xs">
                  ✨ Adaptado ao Feedback
                </span>
              ) : null}
            </div>
            <p className="text-xs text-sand-500 leading-relaxed">
              {activeStrategy.motivo}
            </p>
          </div>

          {activeStrategy.isAllWorkoutsDone ? (
            <div className="bg-white rounded-3xl p-5 shadow-soft border border-sand-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700">
                  🏆 Meta Semanal Concluída
                </span>
                <span className="text-xs text-sand-400 font-semibold font-mono">
                  {completedThisWeek}/{weeklyGoal} Treinos
                </span>
              </div>

              <h3 className="text-base font-bold text-sand-500">
                Rotinas de Força da Semana Concluídas 🎉
              </h3>

              <p className="text-xs text-sand-400 leading-relaxed">
                Já cobriste todos os grupos musculares da semana (Quadríceps, Glúteos & Posterior, Superiores e Core). O corpo precisa agora de repouso para consolidar a hipertrofia até ao início da próxima semana!
              </p>

              <div className="p-3 rounded-2xl bg-cream-50 border border-sand-200 text-xs text-sand-500 space-y-1">
                <span className="font-bold text-roseGold-600 block">💡 Sugestão para o Ginásio:</span>
                <span>Descanso merecido até ao próximo ciclo! Se quiseres ir ao ginásio hoje ou no fim de semana, faz apenas caminhada inclinada na passadeira, 15 min de mobilidade/alongamento suave ou sauna. Cargas pesadas só na próxima semana.</span>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setTab('workouts')}
                  className="w-full py-3 rounded-2xl bg-cream-200 hover:bg-cream-300 text-sand-600 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  Ver Todas as Rotinas / Próxima Semana <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : !recommendedGymWorkout ? (
            <div className="bg-white rounded-3xl p-5 shadow-soft border border-sand-100 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-roseGold-50 border border-roseGold-100 text-roseGold-500 flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-sand-500">
                  Ainda não tens planos de ginásio
                </h3>
                <p className="text-xs text-sand-400 leading-relaxed">
                  Cria a tua rotina personalizada ou pede ao AI Coach para gerar um plano de treino à tua medida.
                </p>
              </div>
              <button
                onClick={() => setTab('workouts')}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-roseGold-400 to-[#CF6E8E] text-white text-xs font-bold shadow-md shadow-roseGold-200 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Criar / Gerar Meu Primeiro Treino</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 shadow-soft border border-sand-100 space-y-3">
              {hasTrainedToday && (
                <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold block">Treino de hoje já registado!</span>
                    <span className="text-[11px] text-emerald-700">
                      {todayWorkouts.map((w) => w.treinoTitulo).join(', ')} • {todayWorkouts[0]?.duracaoMinutos || 30} min
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-roseGold-50 border border-sand-100 flex items-center justify-center text-base shadow-2xs">
                    <span>{getMuscleIcon(recommendedGymWorkout)}</span>
                  </div>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    hasTrainedToday
                      ? 'bg-cream-200 text-sand-500'
                      : 'bg-roseGold-100 text-roseGold-600'
                  }`}>
                    {hasTrainedToday
                      ? `Próxima Sessão (Amanhã) • ${recommendedGymWorkout.tag}`
                      : `Recomendado • ${recommendedGymWorkout.tag}`}
                  </span>
                </div>
                <span className="text-xs text-sand-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {recommendedGymWorkout.duracaoEstimada}
                </span>
              </div>

              <h3 className="text-base font-bold text-sand-500">
                {recommendedGymWorkout.titulo}
              </h3>

              <p className="text-xs text-sand-400">
                {recommendedGymWorkout.foco}. Todas as tuas cargas progressivas guardadas.
              </p>

              <div className="pt-1 flex flex-wrap gap-1.5 text-xs text-sand-400">
                {recommendedGymWorkout.exercicios.slice(0, 3).map((ex, i) => (
                  <span key={i} className="bg-cream-100 px-2 py-0.5 rounded-lg">
                    {ex.nome.split(' (')[0]}
                  </span>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onStartWorkout(recommendedGymWorkout)}
                  className={`w-full py-3 rounded-2xl text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2 active:scale-95 ${
                    hasTrainedToday
                      ? 'bg-sand-500 hover:bg-sand-600 shadow-sand-200'
                      : 'bg-roseGold-400 hover:bg-roseGold-500 shadow-roseGold-200'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {hasTrainedToday
                    ? `Ver Rotina da Próxima Sessão (${recommendedGymWorkout.tag})`
                    : `Iniciar ${recommendedGymWorkout.tag} no Ginásio`}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setTab('workouts')}
            className="w-full py-2.5 rounded-2xl bg-cream-200 hover:bg-cream-300 text-sand-500 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            Ver Todas as Rotinas de Ginásio <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* AI Coach Suggestion Banner */}
      <div
        onClick={() => setShowTipModal(true)}
        className="cursor-pointer bg-gradient-to-r from-roseGold-50 to-cream-200 border border-roseGold-200/60 rounded-3xl p-4 shadow-soft flex items-center gap-4 transition hover:border-roseGold-300 active:scale-[0.99]"
      >
        <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-roseGold-500 shadow-sm shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-roseGold-500">
            Dica do AI Coach
          </div>
          <p className="text-xs text-sand-500 font-medium line-clamp-2 mt-0.5">
            "{currentAiTip}"
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-sand-400 shrink-0" />
      </div>

      {/* Popup / Modal Maximizado da Dica do AI Coach */}
      {showTipModal && (
        <div
          className="fixed inset-0 z-50 bg-sand-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowTipModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-roseGold-100 relative space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-roseGold-100 to-roseGold-50 flex items-center justify-center text-roseGold-500 shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-roseGold-500 block">
                    Coach AI • Rise
                  </span>
                  <h3 className="text-base font-extrabold text-sand-500">
                    Dica do AI Coach
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowTipModal(false)}
                className="w-8 h-8 rounded-full bg-sand-100 text-sand-500 hover:bg-sand-200 flex items-center justify-center transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo integral da dica maximizado */}
            <div className="bg-gradient-to-br from-roseGold-50/60 via-cream-100/60 to-white rounded-2xl p-4 border border-roseGold-100/80">
              <p className="text-sm text-sand-600 leading-relaxed font-medium">
                "{currentAiTip}"
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 py-3 px-4 rounded-2xl bg-cream-100 hover:bg-cream-200 text-sand-600 text-xs font-bold transition-all text-center"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowTipModal(false);
                  setTab('coach');
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-roseGold-400 to-roseGold-500 hover:from-roseGold-500 hover:to-roseGold-600 text-white text-xs font-bold shadow-md shadow-roseGold-200/50 transition-all text-center flex items-center justify-center gap-1.5"
              >
                Falar com o Coach
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Calendário Mensal */}
      {isMonthModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sand-600/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onClick={() => setIsMonthModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-4 sm:p-5 max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-sand-200 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Calendário Mensal */}
            <div className="flex items-center justify-between border-b border-sand-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-roseGold-100 text-roseGold-600 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-sand-500 capitalize">
                  {monthCursor.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                  className="p-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-sand-500 transition"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                  className="p-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-sand-500 transition"
                  title="Mês seguinte"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMonthModalOpen(false)}
                  className="p-1.5 rounded-xl text-sand-400 hover:text-sand-600 hover:bg-cream-100 ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((wd) => (
                <span key={wd} className="text-[10px] font-bold uppercase text-sand-400 py-1">
                  {wd}
                </span>
              ))}

              {monthGridDays.map((cell, idx) => {
                if (!cell) return <div key={`empty-${idx}`} className="h-10" />;

                const isSel =
                  cell.date.getDate() === monthSelectedDate.getDate() &&
                  cell.date.getMonth() === monthSelectedDate.getMonth() &&
                  cell.date.getFullYear() === monthSelectedDate.getFullYear();

                return (
                  <button
                    key={cell.dayNum}
                    type="button"
                    onClick={() => setMonthSelectedDate(cell.date)}
                    className={`h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition relative ${
                      isSel
                        ? 'bg-roseGold-400 text-white shadow-sm'
                        : cell.isToday
                        ? 'bg-roseGold-50 text-roseGold-600 border border-roseGold-300'
                        : 'bg-cream-50/70 text-sand-500 hover:bg-cream-200'
                    }`}
                  >
                    <span className="font-mono leading-none">{cell.dayNum}</span>
                    {cell.hasWorkout && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1 ${
                          isSel ? 'bg-white' : 'bg-emerald-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Treinos do Dia Selecionado no Mês */}
            <div className="pt-2 border-t border-sand-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sand-400">
                  {monthSelectedDate.toLocaleDateString('pt-PT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className="text-[11px] font-bold text-roseGold-600">
                  {monthSelectedDayWorkouts.length} treino(s)
                </span>
              </div>

              {monthSelectedDayWorkouts.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {monthSelectedDayWorkouts.map((w, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-cream-50 border border-sand-200 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sand-500 block truncate">
                            {w.treinoTitulo || 'Treino Concluído'}
                          </span>
                          <span className="text-[11px] text-sand-400">
                            {w.tipo || 'Ginásio'} • {w.duracaoMinutos || 30} min
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-sand-400 text-center py-2 bg-cream-50/70 rounded-2xl border border-dashed border-sand-200">
                  Sem treinos registados neste dia.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  const target = new Date(monthSelectedDate);
                  setIsMonthModalOpen(false);
                  handleOpenAddModal(target);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-roseGold-400 to-roseGold-500 text-white text-xs font-bold shadow-md shadow-roseGold-200/50 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Registar Treino neste Dia</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Adicionar / Registar Treino ou Atividade */}
      <AddActivityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialDate={modalTargetDate}
        workouts={workouts}
        profile={profile}
        onSaveActivity={onLogActivity}
      />
    </div>
  );
}
