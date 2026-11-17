// ─────────────────────────────────────────────────────────────────────────────
// VIDEO VALIDATOR SERVICE
// Verifica automaticamente em segundo plano se os vídeos do YouTube estão
// ativos, públicos e com reprodução incorporada autorizada pelo criador.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_KEY = 'fit_videos_health_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // Validade de 24 horas

export const getCachedHealth = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

export const saveCachedHealth = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {}
};

/**
 * Valida um único vídeo do YouTube em tempo real usando a API oficial oEmbed da Google.
 * Retorna { ok: boolean, title?: string, author?: string, error?: string }
 */
export const validateYoutubeVideo = async (youtubeId) => {
  if (!youtubeId || typeof youtubeId !== 'string') {
    return { ok: false, error: 'ID inválido' };
  }

  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}&format=json`;
    const response = await fetch(url);

    if (response.status === 200) {
      const data = await response.json();
      return {
        ok: true,
        title: data.title || '',
        author: data.author_name || '',
      };
    }

    if (response.status === 401) {
      return { ok: false, error: 'Reprodução incorporada desativada pelo criador' };
    }

    if (response.status === 404) {
      return { ok: false, error: 'Vídeo não encontrado ou removido do YouTube' };
    }

    return { ok: false, error: `Status HTTP ${response.status}` };
  } catch (e) {
    // Se houver falha de rede (ex: offline), não descartamos o vídeo por precaução
    return { ok: true, isOfflineFallback: true };
  }
};

/**
 * Valida uma lista de vídeos em segundo plano, respeitando a cache.
 * Retorna os IDs dos vídeos que estão 100% saudáveis.
 */
export const auditVideosList = async (videos, onProgress) => {
  const cache = getCachedHealth();
  const now = Date.now();
  let updatedCache = false;

  const validIds = new Set();
  const invalidIds = new Set();

  for (const video of videos) {
    const ytid = video.youtubeId;
    if (!ytid) continue;

    // Verificar se já temos verificação recente em cache
    const cached = cache[ytid];
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      if (cached.ok) {
        validIds.add(ytid);
      } else {
        invalidIds.add(ytid);
      }
      continue;
    }

    // Verificar via rede
    const result = await validateYoutubeVideo(ytid);
    cache[ytid] = {
      ok: result.ok,
      timestamp: now,
      error: result.error || null,
    };
    updatedCache = true;

    if (result.ok) {
      validIds.add(ytid);
    } else {
      invalidIds.add(ytid);
    }

    if (onProgress) {
      onProgress({ ytid, ok: result.ok });
    }
  }

  if (updatedCache) {
    saveCachedHealth(cache);
  }

  return {
    validIds: Array.from(validIds),
    invalidIds: Array.from(invalidIds),
  };
};
