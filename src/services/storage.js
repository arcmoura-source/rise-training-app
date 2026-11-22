import { DEFAULT_PROFILE, DEFAULT_WORKOUTS, INITIAL_HISTORY } from '../data/defaultData';

const STORAGE_KEYS = {
  PROFILE: 'fit_rita_profile',
  PROFILES_LIST: 'fit_rita_all_profiles',
  ACTIVE_PROFILE_ID: 'fit_rita_active_profile_id',
  WORKOUTS: 'fit_rita_workouts',
  HISTORY: 'fit_rita_history',
  CHAT: 'fit_rita_chat',
  SETTINGS: 'fit_rita_settings',
};

export const isRitaDomain = () => {
  if (typeof window === 'undefined') return false;
  return (
    import.meta.env.VITE_APP_TARGET === 'rita' ||
    window.location.hostname.includes('rita')
  );
};

export const getProfilesList = () => {
  const isRita = isRitaDomain();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILES_LIST);
    if (data) {
      let parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Se NÃO for o domínio da Rita (ex: telemóvel da mãe ou clientes):
        // Limpar e expurgar automaticamente o 'perfil-rita' caso tenha ficado em cache
        if (!isRita) {
          const filtered = parsed.filter(p => p.id !== 'perfil-rita');
          if (filtered.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(filtered));
          }
          if (filtered.length > 0) return filtered;
          return [];
        }

        // Clean up accidental 'rista' profile or accidental onboarding clone
        const hasBadProfile = parsed.some(
          p => p.nome?.toLowerCase() === 'rista' ||
               (p.id !== 'perfil-rita' && p.altura === 1.65 && p.nome?.toLowerCase().includes('rit'))
        );
        if (hasBadProfile) {
          parsed = parsed.filter(
            p => !(p.nome?.toLowerCase() === 'rista' ||
                   (p.id !== 'perfil-rita' && p.altura === 1.65 && p.nome?.toLowerCase().includes('rit')))
          );
          if (!parsed.some(p => p.id === 'perfil-rita')) {
            parsed.unshift(DEFAULT_PROFILE);
          }
          localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(parsed));
          localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, 'perfil-rita');
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
        } else if (!parsed.some(p => p.id === 'perfil-rita')) {
          parsed.unshift(DEFAULT_PROFILE);
          localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (e) {}

  if (!isRita) {
    return [];
  }

  // Initialize with Rita's profile only on Rita's personal domain
  const initial = [DEFAULT_PROFILE];
  localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(initial));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, 'perfil-rita');
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
  return initial;
};

export const deleteProfile = (profileId) => {
  const isRita = isRitaDomain();
  if (isRita && profileId === 'perfil-rita') return getProfilesList();
  try {
    const list = getProfilesList();
    const updated = list.filter(p => p.id !== profileId);
    localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(updated));
    localStorage.removeItem('fit_history_' + profileId);
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    if (activeId === profileId) {
      const nextActive = updated[0];
      if (nextActive) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, nextActive.id);
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(nextActive));
      } else if (isRita) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, 'perfil-rita');
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
      }
    }
    return updated;
  } catch (e) {
    return getProfilesList();
  }
};

export const getProfile = () => {
  const isRita = isRitaDomain();
  try {
    const list = getProfilesList();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);

    // No domínio de clientes (não-Rita):
    if (!isRita) {
      if (!activeId || activeId === 'perfil-rita' || !list.some(p => p.id === activeId)) {
        if (list.length > 0) {
          const first = list[0];
          localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, first.id);
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(first));
          return first;
        }
        return null;
      }
      const found = list.find((p) => p.id === activeId);
      if (found) return found;
      return list[0] || null;
    }

    // No domínio pessoal da Rita:
    if (!activeId || !list.some(p => p.id === activeId)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, 'perfil-rita');
      const rita = list.find(p => p.id === 'perfil-rita') || DEFAULT_PROFILE;
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(rita));
      return rita;
    }

    const found = list.find((p) => p.id === activeId);
    if (found) {
      if (found.nome?.toLowerCase() === 'rista' || (found.id !== 'perfil-rita' && found.altura === 1.65 && found.nome?.toLowerCase().includes('rit'))) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, 'perfil-rita');
        return DEFAULT_PROFILE;
      }
      const rawObj = found.objetivo;
      const cleanObj = (!rawObj || rawObj === 'Alta Intensidade' || rawObj.toLowerCase().includes('hipertrofia'))
        ? 'Força, Condicionamento Geral & Resistência'
        : rawObj;
      return { ...DEFAULT_PROFILE, ...found, objetivo: cleanObj };
    }

    const legacy = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      return { ...DEFAULT_PROFILE, ...parsed };
    }

    return list[0] || DEFAULT_PROFILE;
  } catch (e) {
    return isRita ? DEFAULT_PROFILE : null;
  }
};

export const saveProfile = (updatedProfile) => {
  try {
    const list = getProfilesList();
    const idx = list.findIndex((p) => p.id === updatedProfile.id);
    let updatedList;
    if (idx >= 0) {
      updatedList = list.map((p) => (p.id === updatedProfile.id ? updatedProfile : p));
    } else {
      updatedList = [...list, updatedProfile];
    }

    localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(updatedList));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, updatedProfile.id);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
  } catch (e) {
    console.error('Error saving profile', e);
  }
};

export const createNewProfile = (newProfileData) => {
  const newId = 'perfil-' + Date.now();
  const newP = {
    id: newId,
    nome: newProfileData.nome || 'Novo Utilizador',
    peso: parseFloat(newProfileData.peso) || 60,
    massaMuscular: parseFloat(newProfileData.massaMuscular) || 40,
    altura: parseFloat(newProfileData.altura) || 1.65,
    objetivo: newProfileData.objetivo || 'Força, Condicionamento Geral & Resistência',
    ondeTreina: newProfileData.ondeTreina || 'both',
    diasSemanaAlvo: parseInt(newProfileData.diasSemanaAlvo) || 3,
    nivel: newProfileData.nivel || 'Iniciante',
  };

  const list = getProfilesList();
  const updatedList = [...list, newP];
  localStorage.setItem(STORAGE_KEYS.PROFILES_LIST, JSON.stringify(updatedList));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, newP.id);
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newP));
  // Novo perfil começa com 0 treinos concluídos
  localStorage.setItem('fit_history_' + newId, JSON.stringify([]));
  return newP;
};

export const switchActiveProfile = (profileId) => {
  const list = getProfilesList();
  const found = list.find((p) => p.id === profileId);
  if (found) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, found.id);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(found));
    return found;
  }
  return list[0];
};

export const getWorkouts = () => {
  const isRita = isRitaDomain();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);

    // No domínio de clientes (não-Rita): NUNCA injetar os planos pessoais da Rita
    if (!isRita) {
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const ritaDefaultIds = new Set(['treino-1', 'treino-2', 'treino-3', 'treino-4']);
      const clientOnly = parsed.filter((w) => w && !ritaDefaultIds.has(w.id));
      if (clientOnly.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(clientOnly));
      }
      return clientOnly;
    }

    if (!data) return DEFAULT_WORKOUTS;
    let parsed = JSON.parse(data);

    // Ensure treino-3 is updated with Ana's custom Upper Body exercises
    const defaultT3 = DEFAULT_WORKOUTS.find(w => w.id === 'treino-3');
    const existingT3Idx = parsed.findIndex(w => w.id === 'treino-3');
    if (existingT3Idx === -1) {
      if (defaultT3) parsed.push(defaultT3);
    } else if (defaultT3 && (!parsed[existingT3Idx].exercicios || parsed[existingT3Idx].exercicios.length < 7)) {
      parsed[existingT3Idx] = defaultT3;
    }

    // Include any other missing default workouts
    DEFAULT_WORKOUTS.forEach((dw) => {
      if (!parsed.some((w) => w.id === dw.id)) {
        parsed.push(dw);
      }
    });

    // Synchronize exercise names (English), gifs and ensure Back Extension in Treino 2
    parsed = parsed.map(w => {
      const defW = DEFAULT_WORKOUTS.find(dw => dw.id === w.id);
      if (!defW) return w;

      let currentExs = [...(w.exercicios || [])];

      // Ensure Back Extension is in Treino 2 (after RDL and before Leg Curl)
      if (w.id === 'treino-2' && !currentExs.some(e => e.nome?.toLowerCase().includes('back extension') || e.id === 'ex-2-3-back-ext')) {
        const backExtDef = defW.exercicios.find(e => e.id === 'ex-2-3-back-ext');
        const rdlIdx = currentExs.findIndex(e => e.id === 'ex-2-2' || e.nome?.toLowerCase().includes('rdl') || e.nome?.toLowerCase().includes('romeno'));
        if (backExtDef) {
          if (rdlIdx >= 0) {
            currentExs.splice(rdlIdx + 1, 0, backExtDef);
          } else {
            currentExs.unshift(backExtDef);
          }
        }
      }

      // Ensure Seated Hip Adductor is in Treino 1 (Quadríceps & Pernas)
      if (w.id === 'treino-1' && !currentExs.some(e => e.nome?.toLowerCase().includes('adduct') || e.id === 'ex-1-5')) {
        const adductorDef = defW.exercicios.find(e => e.id === 'ex-1-5');
        if (adductorDef) {
          currentExs.push(adductorDef);
        }
      }

      // Ensure Treino 4 uses Weighted Decline Crunch (5kg, 10kg)
      if (w.id === 'treino-4') {
        const defEx4_1 = defW.exercicios.find(e => e.id === 'ex-4-1');
        const ex41Idx = currentExs.findIndex(e => e.id === 'ex-4-1' || e.nome?.toLowerCase().includes('crunch') || e.nome?.toLowerCase().includes('polia'));
        if (defEx4_1 && ex41Idx >= 0) {
          currentExs[ex41Idx] = {
            ...currentExs[ex41Idx],
            ...defEx4_1,
            series: defEx4_1.series
          };
        }
      }

      const updatedEx = currentExs.map(ex => {
        const defEx = defW.exercicios.find(de => de.id === ex.id) ||
                      defW.exercicios.find(de => de.nome.toLowerCase() === ex.nome?.toLowerCase());
        if (defEx) {
          return {
            ...ex,
            nome: defEx.nome,
            gifUrl: defEx.gifUrl || ex.gifUrl,
            categoria: defEx.categoria || ex.categoria,
            dica: defEx.dica || ex.dica,
            // If it was Lying Leg Curl, force update to Seated Leg Curl gif and cue
            ...(ex.id === 'ex-2-4' ? {
              nome: defEx.nome,
              gifUrl: defEx.gifUrl,
              dica: defEx.dica,
            } : {}),
          };
        }
        return ex;
      });
      return { ...w, exercicios: updatedEx };
    });

    saveWorkouts(parsed);
    return parsed;
  } catch (e) {
    return DEFAULT_WORKOUTS;
  }
};

export const saveWorkouts = (workouts) => {
  localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
};

export const getHistory = (targetProfileId) => {
  try {
    const activeId = targetProfileId || localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || 'perfil-rita';

    // Se o perfil ativo NÃO for o da Rita, carregar o histórico próprio desse utilizador
    if (activeId !== 'perfil-rita') {
      const data = localStorage.getItem('fit_history_' + activeId);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      let changed = false;
      const fixed = parsed.map(h => {
        const d = new Date(h.data);
        const isOlivia = (h.treinoId === 'yt-ol-1' || (h.treinoTitulo || '').toLowerCase().includes('olivia') || (h.treinoTitulo || '').toLowerCase().includes('deep core'));
        const isMonday16 = d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 16;
        if (isOlivia && isMonday16) {
          changed = true;
          return { ...h, data: "2026-11-15T18:30:00.000Z" };
        }
        return h;
      });
      if (changed) {
        localStorage.setItem('fit_history_' + activeId, JSON.stringify(fixed));
        return fixed;
      }
      return parsed;
    }

    // Histórico exclusivo da Rita
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(INITIAL_HISTORY));
      return INITIAL_HISTORY;
    }
    const parsed = JSON.parse(data);

    // Check if the history has Terça (10 Nov), Quarta (11 Nov), Quinta (12 Nov) and Sábado (14 Nov)
    const hasTerca = parsed.some(h => {
      const d = new Date(h.data);
      return d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 10;
    });
    const hasQuarta = parsed.some(h => {
      const d = new Date(h.data);
      return d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 11;
    });
    const hasQuinta = parsed.some(h => {
      const d = new Date(h.data);
      return d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 12;
    });
    const hasSabado = parsed.some(h => {
      const d = new Date(h.data);
      return d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 14;
    });

    if (!hasTerca || !hasQuarta || !hasQuinta || !hasSabado) {
      // Synchronize Rita's stated week
      const updated = [
        ...INITIAL_HISTORY,
        ...parsed.filter(h => {
          const d = new Date(h.data);
          // filter out any older conflicting records on this specific week
          return !(d.getFullYear() === 2026 && d.getMonth() === 10 && (d.getDate() >= 9 && d.getDate() <= 14));
        })
      ];
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      return updated;
    }

    // Ensure Sunday (15 Nov) has the Olivia Lawson Pilates workout and remove it from Monday (16 Nov)
    let needsDateFix = false;
    let listWithFixedDates = parsed.map(h => {
      const d = new Date(h.data);
      const isOlivia = (h.treinoId === 'yt-ol-1' || (h.treinoTitulo || '').toLowerCase().includes('olivia') || (h.treinoTitulo || '').toLowerCase().includes('deep core'));
      const isMonday16 = d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 16;
      if (isOlivia && isMonday16) {
        needsDateFix = true;
        return {
          ...h,
          data: "2026-11-15T18:30:00.000Z", // Mover para Domingo, 15 Nov (ontem)
        };
      }
      return h;
    });

    const hasSundayOlivia = listWithFixedDates.some(h => {
      const d = new Date(h.data);
      const isOlivia = (h.treinoId === 'yt-ol-1' || (h.treinoTitulo || '').toLowerCase().includes('olivia') || (h.treinoTitulo || '').toLowerCase().includes('deep core'));
      return d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 15 && isOlivia;
    });

    if (!hasSundayOlivia) {
      needsDateFix = true;
      listWithFixedDates = [
        {
          id: "hist-dom",
          data: "2026-11-15T18:30:00.000Z", // Domingo, 15 Nov (Ontem)
          treinoId: "yt-ol-1",
          treinoTitulo: "Olivia Lawson: 30 MIN DEEP CORE AND GLUTES PILATES",
          duracaoMinutos: 30,
          caloriasEstimadas: 225,
          tipo: "video",
          canal: "Olivia Lawson",
          foco: "Glúteos & Core Profundo",
          categoria: "Glúteos",
          rating: 5,
          feedback: "Treino de Pilates sem repetições concluído! Foco intenso na ativação profunda do core e glúteos 🔥",
          tags: ["🔥 Muito Puxado", "❤️‍🔥 Amei o Treino", "✨ Glúteos & Core"],
          exerciciosFeitos: ["30 MIN DEEP CORE AND GLUTES PILATES (No Repeats)"],
        },
        ...listWithFixedDates.filter(h => {
          const d = new Date(h.data);
          const isOlivia = (h.treinoId === 'yt-ol-1' || (h.treinoTitulo || '').toLowerCase().includes('olivia') || (h.treinoTitulo || '').toLowerCase().includes('deep core'));
          const isMonday16 = d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 16;
          return !(isOlivia && isMonday16);
        })
      ];
    } else {
      const beforeLen = listWithFixedDates.length;
      listWithFixedDates = listWithFixedDates.filter(h => {
        const d = new Date(h.data);
        const isOlivia = (h.treinoId === 'yt-ol-1' || (h.treinoTitulo || '').toLowerCase().includes('olivia') || (h.treinoTitulo || '').toLowerCase().includes('deep core'));
        const isMonday16 = d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 16;
        return !(isOlivia && isMonday16);
      });
      if (listWithFixedDates.length !== beforeLen) {
        needsDateFix = true;
      }
    }

    // Ensure the Saturday Hyrox entry has the exact title, 5-star rating & feedback
    const enriched = listWithFixedDates.map(h => {
      if (h.treinoId === 'yt-ga-hyrox-1' || h.id === 'hist-sab') {
        return {
          ...h,
          treinoTitulo: "growingannanas: 30 MIN HYROX HIIT – Workout 1",
          rating: h.rating || 5,
          feedback: h.feedback || "Workout 1 Hyrox concluído! Desafiante, alta intensidade e excelente para o corpo todo 🔥",
          tags: h.tags || ["🔥 Muito Puxado", "❤️‍🔥 Amei o Treino", "⚡ Alta Intensidade"],
        };
      }
      return h;
    });

    // Ensure Saturday 21 Nov (Olivia Lawson Upper Body & Core) is logged for Rita
    let finalHistory = enriched;
    const hasSab21 = finalHistory.some(
      (h) => h.id === 'hist-sab-21' || h.youtubeId === 'rPhiowAOJ0E' || (h.treinoTitulo || '').includes('UPPER BODY & CORE WORKOUT')
    );
    if (!hasSab21) {
      needsDateFix = true;
      finalHistory = [
        {
          id: "hist-sab-21",
          data: "2026-11-21T18:00:00.000Z",
          treinoId: "yt-ol-upper-core",
          youtubeId: "rPhiowAOJ0E",
          link: "https://www.youtube.com/watch?v=rPhiowAOJ0E",
          treinoTitulo: "Olivia Lawson: 30 MIN UPPER BODY & CORE WORKOUT",
          duracaoMinutos: 30,
          caloriasEstimadas: 225,
          tipo: "Home Video",
          canal: "Olivia Lawson",
          foco: "Superiores & Core",
          categoria: "Superior",
          rating: 5,
          exerciciosFeitos: ["30 MIN UPPER BODY & CORE WORKOUT- Intermediate Arms & Abs Home Workout"],
        },
        ...finalHistory,
      ];
      finalHistory.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
    }

    if (needsDateFix || JSON.stringify(finalHistory) !== JSON.stringify(parsed)) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(finalHistory));
    }

    return finalHistory;
  } catch (e) {
    return [];
  }
};

export const addWorkoutHistory = (entry, targetProfileId) => {
  const activeId = targetProfileId || localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || 'perfil-rita';
  const current = getHistory(activeId);
  const updated = [entry, ...current];
  if (activeId === 'perfil-rita') {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } else {
    localStorage.setItem('fit_history_' + activeId, JSON.stringify(updated));
  }
  return updated;
};

export const getChatMessages = (profileName, targetProfileId) => {
  const activeId = targetProfileId || localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || (isRitaDomain() ? 'perfil-rita' : 'default');
  const chatKey = activeId === 'perfil-rita' ? STORAGE_KEYS.CHAT : `fit_chat_${activeId}`;
  const userName = (profileName || '').trim() || (isRitaDomain() ? 'Rita' : 'Atleta');

  try {
    const data = localStorage.getItem(chatKey);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (parsed[0].id === 'msg-welcome') {
          parsed[0].text = `Olá ${userName}! Como posso ajudar-te hoje com o teu treino?`;
        }
        return parsed;
      }
    }
  } catch (e) {}

  return [
    {
      id: "msg-welcome",
      sender: "ai",
      timestamp: new Date().toISOString(),
      text: `Olá ${userName}! Como posso ajudar-te hoje com o teu treino?`,
    }
  ];
};

export const saveChatMessages = (messages, targetProfileId) => {
  const activeId = targetProfileId || localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || (isRitaDomain() ? 'perfil-rita' : 'default');
  const chatKey = activeId === 'perfil-rita' ? STORAGE_KEYS.CHAT : `fit_chat_${activeId}`;
  localStorage.setItem(chatKey, JSON.stringify(messages));
};

// ── BACKUP & CLOUD RESTORE SERVICES ──
export const exportBackupData = () => {
  try {
    const backup = {
      app: "Rise",
      version: 2.0,
      exportDate: new Date().toISOString(),
      deviceTime: new Date().toLocaleString('pt-PT'),
      data: {}
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('fit_') || key === 'gemini_api_key')) {
        const val = localStorage.getItem(key);
        try {
          backup.data[key] = JSON.parse(val);
        } catch {
          backup.data[key] = val;
        }
      }
    }

    return backup;
  } catch (err) {
    console.error('Erro ao gerar cópia de segurança:', err);
    throw new Error('Não foi possível gerar a cópia de segurança.');
  }
};

export const importBackupData = (backupInput) => {
  try {
    let parsed = backupInput;
    if (typeof backupInput === 'string') {
      parsed = JSON.parse(backupInput);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Formato de ficheiro inválido.');
    }

    // Suporta formato direto ou embrulhado em .data
    const payload = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

    let restoredCount = 0;
    for (const [key, value] of Object.entries(payload)) {
      if (key && (key.startsWith('fit_') || key === 'gemini_api_key')) {
        if (typeof value === 'object' && value !== null) {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          localStorage.setItem(key, String(value));
        }
        restoredCount++;
      }
    }

    if (restoredCount === 0) {
      throw new Error('Nenhum dado compatível com o Rise foi encontrado no ficheiro.');
    }

    return { success: true, count: restoredCount };
  } catch (err) {
    console.error('Erro ao restaurar cópia:', err);
    throw err;
  }
};
