// ─────────────────────────────────────────────────────────────────────────────
// FEEDBACK ADVISOR SERVICE — Motor de Análise de Feedback e Adaptação de Treino
// Interpreta as avaliações por estrelas, tags e notas da aluna nos treinos
// anteriores para moldar diretamente as recomendações seguintes e o AI Coach.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analisa as últimas sessões concluídas e extrai sinais fisiológicos e de esforço.
 * @param {Array} history - Lista de treinos concluídos do utilizador
 * @returns {Object|null} Análise estruturada do feedback recente
 */
export function analyzeRecentFeedback(history = []) {
  if (!Array.isArray(history) || history.length === 0) return null;

  // Filtrar treinos válidos e ordenar por data decrescente (mais recente primeiro)
  const sorted = [...history]
    .filter((h) => h && (h.data || h.date))
    .sort((a, b) => new Date(b.data || b.date) - new Date(a.data || a.date));

  if (sorted.length === 0) return null;

  const latest = sorted[0];
  const lastThree = sorted.slice(0, 3);

  // Extrair texto, tags e nota
  const rawFeedback = (latest.feedback || latest.notes || latest.comentario || '').trim();
  const feedbackLower = rawFeedback.toLowerCase();
  const tags = Array.isArray(latest.tags) ? latest.tags : [];
  const tagsLower = tags.map((t) => (t || '').toLowerCase()).join(' ');
  const rating = Number(latest.rating) || (rawFeedback ? 4 : 5);

  const treinoTitulo = latest.treinoTitulo || latest.titulo || 'Treino anterior';
  const treinoTipo = (latest.tipo || '').toLowerCase();

  // Sinais de Fadiga / Esforço Extremo / Desgaste (mesmo com avaliação de 5★!)
  const isEntryExhausting = (entry) => {
    const t = (Array.isArray(entry?.tags) ? entry.tags.join(' ') : '').toLowerCase();
    const f = (entry?.feedback || entry?.notes || entry?.comentario || '').toLowerCase();
    const r = Number(entry?.rating) || 5;
    return (
      r <= 2 ||
      t.includes('desgast') ||
      t.includes('cansaço') ||
      t.includes('pesado') ||
      t.includes('muito puxado') ||
      t.includes('fadiga') ||
      t.includes('pouca energia') ||
      f.includes('desgast') ||
      f.includes('esgotad') ||
      f.includes('cansad') ||
      f.includes('muito pesado') ||
      f.includes('exausta') ||
      f.includes('exaustão') ||
      f.includes('cansaço') ||
      f.includes('fadiga') ||
      f.includes('morri') ||
      f.includes('pesadíssimo') ||
      f.includes('não aguentei')
    );
  };

  const isFatigueOrHeavy = isEntryExhausting(latest);
  const recentExhaustingCount = lastThree.filter(isEntryExhausting).length;
  const isHeavyExhaustion =
    tagsLower.includes('desgast') ||
    tagsLower.includes('cansaço') ||
    feedbackLower.includes('desgast') ||
    feedbackLower.includes('exausta') ||
    feedbackLower.includes('esgotad') ||
    recentExhaustingCount >= 2;

  // Sinais de Dor Articular ou Desconforto
  const hasPainOrDiscomfort =
    tagsLower.includes('desconforto') ||
    tagsLower.includes('dor') ||
    feedbackLower.includes('dor') ||
    feedbackLower.includes('lesão') ||
    feedbackLower.includes('joelho') ||
    feedbackLower.includes('lombar') ||
    feedbackLower.includes('ombro') ||
    feedbackLower.includes('pulso') ||
    feedbackLower.includes('coluna') ||
    feedbackLower.includes('articula');

  // Se o treino anterior trabalhou pernas / glúteos
  const isLowerBody =
    latest.treinoId === 'treino-1' ||
    latest.treinoId === 'treino-2' ||
    treinoTitulo.toLowerCase().includes('quad') ||
    treinoTitulo.toLowerCase().includes('perna') ||
    treinoTitulo.toLowerCase().includes('glúteo') ||
    treinoTitulo.toLowerCase().includes('booty') ||
    treinoTipo.includes('corrida') ||
    treinoTipo.includes('caminhada') ||
    treinoTipo.includes('spinning');

  // Sinais de Alta Energia / Satisfação Plena
  const isHighEnergy =
    rating >= 4 &&
    (tagsLower.includes('adorei') ||
      tagsLower.includes('perfeitas') ||
      tagsLower.includes('amei') ||
      tagsLower.includes('acelerado') ||
      feedbackLower.includes('amei') ||
      feedbackLower.includes('adorei') ||
      feedbackLower.includes('ótimo') ||
      feedbackLower.includes('cargas perfeitas') ||
      feedbackLower.includes('top') ||
      feedbackLower.includes('excelente'));

  // Sinal de Treino Demasiado Leve
  const isTooLight =
    rating <= 2 &&
    (feedbackLower.includes('leve') ||
      feedbackLower.includes('fácil') ||
      feedbackLower.includes('baixo') ||
      feedbackLower.includes('pouco'));

  return {
    latest,
    lastThree,
    rating,
    tags,
    rawFeedback,
    treinoTitulo,
    treinoTipo,
    isLowerBody,
    isFatigueOrHeavy,
    isHeavyExhaustion,
    hasPainOrDiscomfort,
    isHighEnergy,
    isTooLight,
  };
}

/**
 * Converte o histórico recente num formato rico para ser injetado no prompt da Gemini API.
 * @param {Array} history
 * @param {number} maxEntries
 * @returns {string}
 */
export function formatHistoryForAi(history = [], maxEntries = 5) {
  if (!Array.isArray(history) || history.length === 0) {
    return 'Ainda sem registos de treino anteriores.';
  }

  const recent = [...history]
    .filter((h) => h && (h.data || h.date))
    .sort((a, b) => new Date(b.data || b.date) - new Date(a.data || a.date))
    .slice(0, maxEntries);

  if (recent.length === 0) {
    return 'Ainda sem registos de treino anteriores.';
  }

  return recent
    .map((h, idx) => {
      const dt = h.data || h.date;
      const dateStr = dt
        ? new Date(dt).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })
        : `Sessão ${idx + 1}`;
      const stars = h.rating ? `${'★'.repeat(h.rating)} (${h.rating}/5)` : 'Sem classificação por estrelas';
      const tagsStr = Array.isArray(h.tags) && h.tags.length > 0 ? ` [Tags: ${h.tags.join(', ')}]` : '';
      const fbStr = (h.feedback || h.notes || '').trim() ? ` | Feedback da aluna: "${h.feedback || h.notes}"` : '';
      const durStr = h.duracaoMinutos ? ` (${h.duracaoMinutos} min${h.caloriasEstimadas ? `, ~${h.caloriasEstimadas} kcal` : ''})` : '';
      return `- ${dateStr}: ${h.treinoTitulo || 'Treino'}${durStr} — ${stars}${tagsStr}${fbStr}`;
    })
    .join('\n');
}

/**
 * Adapta a estratégia de recomendação diária com base no feedback da última sessão e no estado do dia.
 * @param {Object} baseStrategy - Estratégia calculada pelo equilíbrio semanal
 * @param {Object|null} feedbackAnalysis - Análise do feedback
 * @param {boolean} hasTrainedToday - Se o utilizador já concluiu um treino hoje
 * @param {Array} todayWorkouts - Treinos realizados hoje
 * @returns {Object} Estratégia enriquecida e adaptada
 */
export function getFeedbackAdaptedStrategy(
  baseStrategy,
  feedbackAnalysis,
  hasTrainedToday = false,
  todayWorkouts = []
) {
  if (!feedbackAnalysis) {
    if (hasTrainedToday) {
      return {
        ...baseStrategy,
        motivo: `Treino de hoje já registado com sucesso! 🎉 O teu estímulo diário está garantido. Para hoje, a prioridade é o descanso muscular e hidratação. A recomendação abaixo é a previsão para a tua próxima sessão (amanhã): ${baseStrategy.targetLabel}.`,
        feedbackNotice: {
          tipo: 'success',
          titulo: 'Treino de hoje concluído ✓',
          texto: 'Foco em descanso e boa nutrição até amanhã.',
        },
        adaptationType: 'today_completed',
      };
    }
    return {
      ...baseStrategy,
      feedbackNotice: null,
      adaptationType: 'standard',
    };
  }

  const {
    rating,
    rawFeedback,
    tags,
    treinoTitulo,
    isLowerBody,
    hasPainOrDiscomfort,
    isFatigueOrHeavy,
    isHeavyExhaustion,
    isHighEnergy,
    isTooLight,
  } = feedbackAnalysis;

  // Se o utilizador JÁ TREINOU HOJE, o texto nunca deve dizer "para hoje é treinar X"
  if (hasTrainedToday) {
    const feedbackQuote = rawFeedback ? ` ("${rawFeedback}")` : tags.length > 0 ? ` (${tags[0]})` : '';

    // Se toda a meta semanal de treinos já foi cumprida, não sugerir treino de força para o dia seguinte
    if (baseStrategy.isAllWorkoutsDone) {
      return {
        ...baseStrategy,
        gymId: null,
        motivo: `Meta da semana 100% cumprida! 🏆 Parabéns! Já realizaste todos os grupos musculares da semana. Todo o estímulo de hipertrofia por esta semana está concluído com distinção — agora a prioridade máxima é descanso merecido, hidratação e sono reparador até à próxima semana!`,
        feedbackNotice: {
          tipo: 'success',
          titulo: 'Meta Semanal Atingida! 🏆',
          texto: 'Todos os grupos musculares trabalhados com sucesso. Descanso merecido!',
        },
        adaptationType: 'today_completed_goal_achieved',
      };
    }

    if (hasPainOrDiscomfort) {
      return {
        ...baseStrategy,
        focusArea: isLowerBody ? 'upper' : 'mobility',
        targetLabel: isLowerBody ? 'Superiores & Tronco (Amanhã)' : 'Mobilidade Suave (Amanhã)',
        motivo: `Treino de hoje concluído com sucesso! 🎉 Como registaste desconforto articular${feedbackQuote}, agora o segredo é repouso e hidratação para recuperar. Para a tua próxima sessão (amanhã), a recomendação adapta-se para proteger as tuas articulações com foco em ${baseStrategy.targetLabel}.`,
        feedbackNotice: {
          tipo: 'warning',
          titulo: 'Treino de hoje feito • Proteção articular',
          texto: `Repouso hoje após desconforto registado.`,
        },
        adaptationType: 'today_completed_pain',
      };
    }

    if (isFatigueOrHeavy) {
      return {
        ...baseStrategy,
        motivo: `Excelente esforço! O teu treino de hoje já está concluído com sucesso. Como sentiste grande exigência física${feedbackQuote}, o foco para o resto do dia é descansar, nutrir e dormir bem. Para a tua próxima sessão (amanhã), a recomendação do plano será ${baseStrategy.targetLabel}.`,
        feedbackNotice: {
          tipo: 'info',
          titulo: 'Treino de hoje feito • Recuperação',
          texto: `Recuperação prioritária após esforço elevado.`,
        },
        adaptationType: 'today_completed_fatigue',
      };
    }

    if (isHighEnergy) {
      const starsStr = '★'.repeat(rating);
      return {
        ...baseStrategy,
        motivo: `Treino de hoje concluído com nota máxima! 🎉 Fantástica energia (${starsStr}${feedbackQuote}). O teu trabalho muscular por hoje está feito! Para a tua próxima sessão (amanhã), continuaremos esse excelente ritmo com foco em ${baseStrategy.targetLabel}.`,
        feedbackNotice: {
          tipo: 'success',
          titulo: 'Treino de hoje concluído ✓',
          texto: `Excelente consistência e energia.`,
        },
        adaptationType: 'today_completed_energy',
      };
    }

    return {
      ...baseStrategy,
      motivo: `Treino de hoje já registado com sucesso! 🎉 O teu trabalho muscular por hoje está cumprido. Para o resto do dia, a prioridade é descansar, hidratar e alimentar as tuas fibras musculares. Para a tua próxima sessão (amanhã), o foco será ${baseStrategy.targetLabel}.`,
      feedbackNotice: {
        tipo: 'success',
        titulo: 'Treino de hoje concluído ✓',
        texto: 'Foco em descanso e boa nutrição até à próxima sessão.',
      },
      adaptationType: 'today_completed',
    };
  }

  // ── CASOS PARA QUANDO O UTILIZADOR AINDA NÃO TREINOU HOJE ─────────────────

  // 1. Caso de Dor Articular ou Desconforto (ex: joelhos, lombar, ombros)
  if (hasPainOrDiscomfort) {
    const feedbackQuote = rawFeedback ? ` ("${rawFeedback}")` : tags.length > 0 ? ` (${tags[0]})` : '';
    // Se o desconforto foi em pernas/joelhos, desviar de pernas para superiores ou mobilidade
    if (isLowerBody) {
      return {
        focusArea: 'upper',
        targetLabel: 'Superiores & Mobilidade (Proteção Articular 🛡️)',
        motivo: `Adaptado ao teu feedback: No treino anterior (${treinoTitulo}) registaste desconforto articular${feedbackQuote}. Para poupar os membros inferiores e permitir recuperação segura dos teus joelhos/anca, o foco recomendado de hoje é Superiores e tronco.`,
        gymId: 'treino-3',
        feedbackNotice: {
          tipo: 'warning',
          titulo: 'Treino adaptado ao teu feedback de desconforto',
          texto: `Como sentiste desconforto em ${treinoTitulo}, hoje preservamos as pernas e focamos no tronco e postura.`,
        },
        adaptationType: 'pain_relief',
      };
    }
    return {
      focusArea: 'mobility',
      targetLabel: 'Recuperação Ativa & Mobilidade Suave',
      motivo: `Adaptado ao teu feedback: Registaste desconforto${feedbackQuote}. Priorizamos mobilidade e descompressão articular para regenerar os tecidos antes de voltares a pegar em cargas altas.`,
      gymId: 'treino-2',
      feedbackNotice: {
        tipo: 'warning',
        titulo: 'Foco em regeneração e mobilidade',
        texto: `Cargas pausadas temporariamente para descompressão articular ativa.`,
      },
      adaptationType: 'pain_relief',
    };
  }

  // 2. Caso de Desgaste Elevado / Fadiga Acentuada (mesmo tendo gostado e dado 5 estrelas!)
  if (isFatigueOrHeavy) {
    const feedbackQuote = rawFeedback ? ` ("${rawFeedback}")` : tags.length > 0 ? ` (${tags[0]})` : '';

    if (isHeavyExhaustion) {
      return {
        ...baseStrategy,
        focusArea: 'mobility',
        suggestRestDay: true,
        targetLabel: 'Dia de Descanso ou Mobilidade Suave 🛌',
        motivo: `Adaptado ao teu feedback: Mesmo tendo gostado do treino (${treinoTitulo}), indicaste elevado desgaste${feedbackQuote}. O músculo cresce e o corpo recupera no descanso — hoje recomendamos um dia de descanso total ou apenas 10–15 min de alongamentos suaves!`,
        feedbackNotice: {
          tipo: 'info',
          titulo: 'Descanso Recomendado 🛌',
          texto: `Após um treino muito desgastante, prioriza o descanso e recuperação antes da próxima carga.`,
        },
        adaptationType: 'rest_recommended',
      };
    }

    // Se foi pernas/glúteos que puxou muito, dar descanso aos membros inferiores
    if (isLowerBody && baseStrategy.focusArea !== 'upper') {
      return {
        focusArea: 'upper',
        targetLabel: 'Superiores & Tronco (Descanso de Pernas 🍃)',
        motivo: `Adaptado ao teu feedback: No treino de ${treinoTitulo} indicaste esforço extremo${feedbackQuote}. Para dar às pernas as 48h de recuperação necessárias à hipertrofia e evitar sobrecarga, sugerimos hoje focar em Superiores e Costas.`,
        gymId: 'treino-3',
        feedbackNotice: {
          tipo: 'info',
          titulo: 'Adaptação por esforço elevado anterior',
          texto: `Damos descanso às pernas após ${treinoTitulo} para maximizar a tua recuperação e crescimento muscular.`,
        },
        adaptationType: 'muscle_recovery',
      };
    }

    return {
      ...baseStrategy,
      motivo: `Adaptado ao teu feedback: Como a sessão anterior (${treinoTitulo}) foi muito exigente${feedbackQuote}, mantém hoje um ritmo controlado com foco estrito na execução e tempos de descanso generosos.`,
      feedbackNotice: {
        tipo: 'info',
        titulo: 'Ritmo adaptado ao cansaço anterior',
        texto: `Mantém pausas completas entre séries para recuperar bem.`,
      },
      adaptationType: 'pacing',
    };
  }

  // 3. Caso de Treino Demasiado Leve (1-2 estrelas por falta de intensidade)
  if (isTooLight) {
    return {
      ...baseStrategy,
      motivo: `Adaptado ao teu feedback: Como indicaste que a sessão anterior (${treinoTitulo}) foi leve, a recomendação de hoje foca-se em elevar a intensidade, desacelerar a fase excêntrica e desafiar a tua musculatura!`,
      feedbackNotice: {
        tipo: 'boost',
        titulo: 'Estímulo reforçado',
        texto: `Aumentámos o desafio hoje porque achaste o treino anterior leve.`,
      },
      adaptationType: 'intensity_boost',
    };
  }

  // 4. Caso de Alta Energia & Excelente Sensação (4-5 estrelas / Amei o treino)
  if (isHighEnergy) {
    const starsStr = '★'.repeat(rating);
    const feedbackQuote = rawFeedback ? ` — "${rawFeedback}"` : '';
    return {
      ...baseStrategy,
      motivo: `Inspirado no teu ótimo feedback: Vens de um treino de topo em ${treinoTitulo} (${starsStr}${feedbackQuote})! O plano de hoje dá continuidade a esse embalo com foco em ${baseStrategy.targetLabel}.`,
      feedbackNotice: {
        tipo: 'success',
        titulo: `Excelente ritmo de ${starsStr}`,
        texto: `Aproveitamos a tua boa energia anterior para manter a consistência no ponto.`,
      },
      adaptationType: 'energy_boost',
    };
  }

  // Padrão com nota do feedback
  return {
    ...baseStrategy,
    feedbackNotice: rawFeedback
      ? {
          tipo: 'neutral',
          titulo: `Último feedback registado`,
          texto: `"${rawFeedback}" (${treinoTitulo})`,
        }
      : null,
    adaptationType: 'standard',
  };
}
