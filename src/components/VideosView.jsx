import React, { useState, useMemo, useEffect } from 'react';
import {
  Play, Clock, CheckCircle2, Search, X, ExternalLink, Plus,
  Heart, Flame, Sparkles, ChevronDown, Check, Loader2, Link2, Trash2
} from 'lucide-react';
import { YOUTUBE_VIDEOS, CANAIS_FAVORITOS } from '../data/videoData';
import confetti from 'canvas-confetti';
import VideoFeedbackModal from './VideoFeedbackModal';
import { auditVideosList, validateYoutubeVideo } from '../services/videoValidator';

// ── Persistence helpers ──────────────────────────────────────────────────────
const STORAGE_LIKED   = 'rise_liked_videos';
const STORAGE_CUSTOM  = 'rise_custom_videos';
const STORAGE_HIDDEN  = 'rise_hidden_videos';

function getLiked() {
  try { return JSON.parse(localStorage.getItem(STORAGE_LIKED) || '[]'); } catch { return []; }
}
function saveLiked(ids) {
  localStorage.setItem(STORAGE_LIKED, JSON.stringify(ids));
}
function getHiddenVideos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_HIDDEN) || '[]'); } catch { return []; }
}
function saveHiddenVideos(ids) {
  localStorage.setItem(STORAGE_HIDDEN, JSON.stringify(ids));
}
export function generateWorkoutDescription(title = '', channel = '', categoria = '', foco = '') {
  const lower = title.toLowerCase();
  const c = channel || 'Treino';

  if (lower.includes('hyrox')) {
    return `Desafio oficial da série Hyrox com ${c}. Treino de alta intensidade com halteres, combinando blocos potentes de cardio funcional, força e resistência muscular total.`;
  }
  if (categoria === 'Alta Intensidade' || lower.includes('hiit') || lower.includes('tabata') || lower.includes('sweat')) {
    return `Treino explosivo de alta intensidade com ${c}. Intercala estímulos potentes de cardio e força funcional para queima calórica acelerada e condicionamento total.`;
  }
  if (categoria === 'Glúteos' || lower.includes('glute') || lower.includes('booty') || lower.includes('bunda')) {
    return `Treino completo focado na construção e definição da curva glútea com ${c}. Exercícios com sobrecarga progressiva e tensão constante na cadeia posterior.`;
  }
  if (lower.includes('quad') || lower.includes('leg') || lower.includes('perna') || lower.includes('squat')) {
    return `Sessão intensa de força para pernas e quadríceps com ${c}. Trabalho com halteres para hipertrofia, força funcional e pernas tonificadas.`;
  }
  if (lower.includes('upper') || lower.includes('arm') || lower.includes('costas') || lower.includes('ombro') || lower.includes('braço')) {
    return `Treino focado em membros superiores e postura com ${c}. Fortalecimento de costas, ombros e braços com halteres para um tronco esculpido e alinhado.`;
  }
  if (categoria === 'Pilates') {
    return `Sequência dinâmica de Pilates com ${c} no tapete. Fortalecimento profundo do core, definição da cintura e estabilização postural sem impacto articular.`;
  }
  if (categoria === 'Mobilidade') {
    return `Rotina fluida de mobilidade ativa e alongamento com ${c}. Ideal para aliviar tensões articulares, aumentar a amplitude e acelerar a recuperação muscular.`;
  }
  return `Treino completo de força e resistência com ${c}, focado em movimentos dinâmicos para tonificar a musculatura e elevar o gasto calórico.`;
}

function getCustomVideos() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_CUSTOM) || '[]');
    let modified = false;
    const upgraded = raw.map((v) => {
      let updated = { ...v };
      const lower = (v.titulo || '').toLowerCase();

      // Corrigir duração a partir do título (ex: 40 MIN -> 40 min)
      const durMatch = (v.titulo || '').match(/(\d+)\s*(?:min|m\b)/i);
      if (durMatch && (!v.duracao || v.duracao !== `${durMatch[1]} min`)) {
        updated.duracao = `${durMatch[1]} min`;
        modified = true;
      }

      // Se for Hyrox / HIIT / Tabata -> Nível 5 (Avançado 🔥🔥)
      const isExtreme5 =
        lower.includes('hyrox') ||
        lower.includes('hiit') ||
        lower.includes('tabata');

      // Se for Cardio / Sweat / Burn (sem ser Hyrox/HIIT) -> Nível 4 (Puxado 🔥)
      const isCardio4 =
        !isExtreme5 && (
          lower.includes('cardio') ||
          lower.includes('sweat') ||
          lower.includes('burn')
        );

      if (isExtreme5) {
        if (updated.categoria !== 'Alta Intensidade') {
          updated.categoria = 'Alta Intensidade';
          modified = true;
        }
        if (updated.nivel !== 'Avançado 🔥🔥') {
          updated.nivel = 'Avançado 🔥🔥';
          modified = true;
        }
        if (updated.intensidade !== 5) {
          updated.intensidade = 5;
          modified = true;
        }
        const newFoco = lower.includes('hyrox') ? 'Cardio, Força & Hyrox' : 'HIIT & Alta Intensidade';
        if (updated.foco !== newFoco) {
          updated.foco = newFoco;
          modified = true;
        }
        updated.targetArea = 'fullbody';
      } else if (isCardio4) {
        if (updated.categoria !== 'Alta Intensidade') {
          updated.categoria = 'Alta Intensidade';
          modified = true;
        }
        if (updated.nivel !== 'Puxado 🔥') {
          updated.nivel = 'Puxado 🔥';
          modified = true;
        }
        if (updated.intensidade !== 4) {
          updated.intensidade = 4;
          modified = true;
        }
        if (!updated.foco || updated.foco.includes('Hyrox')) {
          updated.foco = 'Cardio & Resistência';
          modified = true;
        }
        updated.targetArea = 'fullbody';
      }

      // Substituir descrição genérica antiga por descrição técnica de fitness
      if (
        !updated.descricao ||
        updated.descricao.includes('coleção pessoal') ||
        updated.descricao.includes('colecao pessoal') ||
        updated.descricao.includes('Adicionado à') ||
        updated.descricao.trim().length < 20
      ) {
        updated.descricao = generateWorkoutDescription(
          updated.titulo,
          updated.canal,
          updated.categoria,
          updated.foco
        );
        modified = true;
      }

      return updated;
    });

    if (modified) {
      localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(upgraded));
    }
    return upgraded;
  } catch {
    return [];
  }
}

export default function VideosView({ profile, onLogVideoWorkout, history }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [customVideos, setCustomVideos] = useState(() => getCustomVideos());
  const [likedIds, setLikedIds]         = useState(() => getLiked());
  const [hiddenIds, setHiddenIds]       = useState(() => getHiddenVideos());

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCanal, setSelectedCanal]       = useState('Todos');
  const [searchTerm, setSearchTerm]             = useState('');
  const [activeVideo, setActiveVideo]           = useState(null);
  const [feedbackVideo, setFeedbackVideo]       = useState(null);
  const [showAddModal, setShowAddModal]         = useState(false);
  const [showOnlyFavs, setShowOnlyFavs]         = useState(false);
  const [invalidYtIds, setInvalidYtIds]         = useState(() => new Set());

  // Link-only smart addition
  const [newUrl, setNewUrl]                     = useState('');
  const [isAnalyzing, setIsAnalyzing]           = useState(false);
  const [enrichedPreview, setEnrichedPreview]   = useState(null);
  const [enrichError, setEnrichError]           = useState('');

  // ── Derived data ───────────────────────────────────────────────────────────
  const allVideos = useMemo(() => [...customVideos, ...YOUTUBE_VIDEOS], [customVideos]);

  // Background verification of YouTube videos
  useEffect(() => {
    let isMounted = true;
    auditVideosList(allVideos).then(({ invalidIds }) => {
      if (isMounted && invalidIds && invalidIds.length > 0) {
        setInvalidYtIds(new Set(invalidIds));
      }
    });
    return () => { isMounted = false; };
  }, [allVideos]);

  // Smart recommendation: user's profile level match first, then favorite channels, then intensity
  const smartSorted = useMemo(() => {
    const likedCanais = CANAIS_FAVORITOS.filter(c => c.intensidadeMedia >= 3).map(c => c.nome);
    const nivelLower = (profile?.nivel || 'Intermédio').toLowerCase();
    const isBeginner = nivelLower.includes('inici');
    const isAdvanced = nivelLower.includes('avan');

    // Nível de intensidade ideal para cada utilizador:
    // Iniciante: 1 a 3
    // Intermédio: 4 e 3 no topo (treinos de tonificação e força como Killer Lower Body, Legs & Booty, etc.)
    // Avançado: 5 e 4 no topo (Hyrox, Killer Extreme)
    const getLevelScore = (video) => {
      const int = video.intensidade || 3;
      if (isBeginner) {
        if (int <= 3) return 10 - int;
        return -int;
      }
      if (isAdvanced) {
        return int;
      }
      // Intermédio (Rita e Mãe):
      // Prioridade máxima para treinos de nível 4 (intenso mas equilibrado) e 3 (moderado)
      if (int === 4) return 10;
      if (int === 3) return 9;
      if (int === 5) return 4; // Treinos Avançados (Hyrox) surgem mais abaixo na lista
      return 3;
    };

    return [...allVideos].sort((a, b) => {
      const aLiked = likedIds.includes(a.id) ? 1 : 0;
      const bLiked = likedIds.includes(b.id) ? 1 : 0;
      if (aLiked !== bLiked) return bLiked - aLiked;

      const scoreA = getLevelScore(a);
      const scoreB = getLevelScore(b);
      if (scoreA !== scoreB) return scoreB - scoreA;

      const aFav = likedCanais.includes(a.canal) ? 1 : 0;
      const bFav = likedCanais.includes(b.canal) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      return (b.intensidade || 0) - (a.intensidade || 0);
    });
  }, [allVideos, likedIds, profile?.nivel]);

  const categories = ['Todos', 'Alta Intensidade', 'Glúteos', 'Força', 'Pilates', 'Mobilidade'];
  const canais = ['Todos', 'growingannanas', 'Olivia Lawson', 'Heather Robertson', 'Move With Nicole', 'Caroline Girvan', 'Pamela Reif'];

  const filteredVideos = useMemo(() => {
    const nivelLower = (profile?.nivel || 'Intermédio').toLowerCase();
    const isBeginner = nivelLower.includes('inici');
    const isAdvanced = nivelLower.includes('avan');

    return smartSorted.filter((v) => {
      if (hiddenIds.includes(v.id)) return false;
      if (invalidYtIds.has(v.youtubeId)) return false;
      if (showOnlyFavs && !likedIds.includes(v.id)) return false;

      // Filtrar estritamente por nível de intensidade do perfil (exceto vídeos adicionados manualmente)
      if (!v.isCustom) {
        const int = v.intensidade || 3;
        if (isBeginner && int > 3) return false;
        if (!isBeginner && !isAdvanced && int >= 5) return false;
      }

      const matchesCategory = selectedCategory === 'Todos' || v.categoria === selectedCategory;
      const matchesCanal    = selectedCanal === 'Todos' || v.canal.toLowerCase() === selectedCanal.toLowerCase();
      const matchesSearch   = searchTerm === '' ||
        v.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.canal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.foco.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesCanal && matchesSearch;
    });
  }, [smartSorted, selectedCategory, selectedCanal, searchTerm, showOnlyFavs, likedIds, hiddenIds, invalidYtIds, profile?.nivel]);

  const toggleLike = (id, e) => {
    e.stopPropagation();
    const updated = likedIds.includes(id)
      ? likedIds.filter(x => x !== id)
      : [...likedIds, id];
    setLikedIds(updated);
    saveLiked(updated);
  };

  const handleDeleteVideo = (video, e) => {
    e.stopPropagation();
    if (!window.confirm('Tens a certeza que queres eliminar este vídeo?')) return;

    if (video.isCustom || customVideos.some((cv) => cv.id === video.id)) {
      const updatedCustom = customVideos.filter((cv) => cv.id !== video.id);
      setCustomVideos(updatedCustom);
      localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(updatedCustom));
    } else {
      const updatedHidden = [...hiddenIds, video.id];
      setHiddenIds(updatedHidden);
      saveHiddenVideos(updatedHidden);
    }

    if (likedIds.includes(video.id)) {
      const updatedLiked = likedIds.filter((x) => x !== video.id);
      setLikedIds(updatedLiked);
      saveLiked(updatedLiked);
    }

    if (activeVideo?.id === video.id) {
      setActiveVideo(null);
    }
  };

  const handleFinishVideo = (video) => {
    setFeedbackVideo(video);
  };

  const handleSubmitFeedback = ({ rating, note, comment, feedback, isFavorite, tags, data }) => {
    if (!feedbackVideo) return;

    const duracaoMinutos = parseInt(feedbackVideo.duracao) || 30;
    const caloriasEstimadas = Math.round(duracaoMinutos * 7.5);
    const feedbackText = (feedback || comment || note || '').trim();

    const logEntry = {
      id: 'log-video-' + Date.now(),
      treinoId: feedbackVideo.id,
      treinoTitulo: feedbackVideo.titulo,
      canal: feedbackVideo.canal,
      data: data || new Date().toISOString(),
      duracaoMinutos,
      caloriasEstimadas,
      tipo: 'video',
      foco: feedbackVideo.foco,
      categoria: feedbackVideo.categoria,
      rating: Number(rating) || 5,
      avaliacao: Number(rating) || 5,
      feedback: feedbackText,
      comentario: feedbackText,
      tags: Array.isArray(tags) ? tags : [],
      exerciciosFeitos: [feedbackVideo.titulo],
    };

    onLogVideoWorkout(logEntry);

    // If rated 4-5 stars or checked favorite, add to favorites automatically
    if (isFavorite || rating >= 4) {
      if (!likedIds.includes(feedbackVideo.id)) {
        const updated = [...likedIds, feedbackVideo.id];
        setLikedIds(updated);
        saveLiked(updated);
      }
    }

    setFeedbackVideo(null);
    setActiveVideo(null);
  };

  const extractYoutubeId = (url) => {
    const m = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return m && m[2].length === 11 ? m[2] : null;
  };

  // ── Auto-enrichment: When a URL is pasted, auto-detect all fields ────────────
  useEffect(() => {
    const ytId = extractYoutubeId(newUrl.trim());
    if (!ytId) {
      setEnrichedPreview(null);
      setEnrichError('');
      setIsAnalyzing(false);
      return;
    }

    let isCancelled = false;
    setIsAnalyzing(true);
    setEnrichError('');

    const fetchMeta = async () => {
      try {
        let title = '';
        let author = '';

        // 1. Try noembed (CORS friendly)
        try {
          const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${ytId}`);
          if (res.ok) {
            const data = await res.json();
            title = data.title || '';
            author = data.author_name || '';
          }
        } catch (e) {
          // ignore fallback
        }

        // 2. Try official YouTube oEmbed if needed
        if (!title) {
          try {
            const res2 = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`);
            if (res2.ok) {
              const data2 = await res2.json();
              title = data2.title || '';
              author = data2.author_name || '';
            }
          } catch (e) {
            // ignore fallback
          }
        }

        if (isCancelled) return;

        const rawTitle = title || 'Treino em Casa no YouTube';
        const rawAuthor = author || 'YouTube';

        // Extract duration from title (e.g. 25 MIN, 30 min) or default to 25 min
        const durMatch = rawTitle.match(/(\d+)\s*(?:min|m\b)/i);
        const duracao = durMatch ? `${durMatch[1]} min` : '25 min';

        // Analyze title to categorize exactly like the official 29 videos
        const lower = rawTitle.toLowerCase();
        let categoria = 'Força';
        let targetArea = 'fullbody';
        let foco = 'Treino de Força';
        let nivel = 'Puxado 🔥';
        let intensidade = 4;

        if (
          lower.includes('hyrox') ||
          lower.includes('hiit') ||
          lower.includes('tabata')
        ) {
          categoria = 'Alta Intensidade';
          targetArea = 'fullbody';
          foco = lower.includes('hyrox') ? 'Cardio, Força & Hyrox' : 'HIIT & Alta Intensidade';
          nivel = 'Avançado 🔥🔥';
          intensidade = 5;
        } else if (
          lower.includes('cardio') ||
          lower.includes('sweat') ||
          lower.includes('burn')
        ) {
          categoria = 'Alta Intensidade';
          targetArea = 'fullbody';
          foco = 'Cardio & Resistência';
          nivel = 'Puxado 🔥';
          intensidade = 4;
        } else if (lower.includes('pilates')) {
          categoria = 'Pilates';
          targetArea = 'fullCore';
          foco = 'Pilates & Fortalecimento do Core';
          nivel = 'Moderado ✨';
          intensidade = 3;
        } else if (lower.includes('glute') || lower.includes('booty') || lower.includes('bunda') || lower.includes('glúteo') || lower.includes('hip thrust')) {
          categoria = 'Glúteos';
          targetArea = 'glutes';
          foco = 'Glúteos & Cadeia Posterior';
          nivel = lower.includes('killer') || lower.includes('heavy') ? 'Muito Intenso 🔥🔥' : 'Puxado 🔥';
          intensidade = lower.includes('killer') || lower.includes('heavy') ? 5 : 4;
        } else if (lower.includes('quad') || lower.includes('leg') || lower.includes('perna') || lower.includes('squat')) {
          categoria = 'Força';
          targetArea = 'quads';
          foco = 'Quadríceps & Pernas';
          nivel = 'Intenso 🔥';
          intensidade = 4;
        } else if (lower.includes('upper') || lower.includes('arm') || lower.includes('costas') || lower.includes('ombro') || lower.includes('braço') || lower.includes('back')) {
          categoria = 'Força';
          targetArea = 'upper';
          foco = 'Membros Superiores & Postura';
          nivel = 'Puxado 🔥';
          intensidade = 4;
        } else if (lower.includes('stretch') || lower.includes('mobility') || lower.includes('alongamento') || lower.includes('mobilidade') || lower.includes('yoga')) {
          categoria = 'Mobilidade';
          targetArea = 'fullCore';
          foco = 'Mobilidade Ativa & Flexibilidade';
          nivel = 'Suave ✨';
          intensidade = 1;
        }

        const previewItem = {
          id: 'yt-custom-' + Date.now(),
          titulo: rawTitle,
          canal: rawAuthor,
          duracao,
          categoria,
          targetArea,
          foco,
          nivel,
          intensidade,
          youtubeId: ytId,
          thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          descricao: generateWorkoutDescription(rawTitle, rawAuthor, categoria, foco),
        };

        setEnrichedPreview(previewItem);
      } catch (err) {
        if (!isCancelled) {
          setEnrichError('Não foi possível detetar os detalhes. Verifica o link.');
        }
      } finally {
        if (!isCancelled) setIsAnalyzing(false);
      }
    };

    fetchMeta();

    return () => {
      isCancelled = true;
    };
  }, [newUrl]);

  const handleAddCustomVideo = async (e) => {
    e.preventDefault();
    if (!enrichedPreview) {
      alert('Por favor insere um link válido do YouTube.');
      return;
    }

    const updated = [enrichedPreview, ...customVideos];
    setCustomVideos(updated);
    localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(updated));

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#ECA1B8', '#DF86A3', '#D4AF37'],
      });
    } catch (err) {}

    setNewUrl('');
    setEnrichedPreview(null);
    setShowAddModal(false);
  };

  // Intensity bar display
  const intensityBar = (level = 0) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= level ? 'bg-roseGold-400' : 'bg-cream-300'}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-24">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-bold text-sand-500">Vídeos & Treinos em Casa</h2>
          <p className="text-xs text-sand-400 mt-0.5">
            {filteredVideos.length} treinos guiados das tuas criadoras favoritas
          </p>
        </div>
        <button
          onClick={() => {
            setNewUrl('');
            setEnrichedPreview(null);
            setShowAddModal(true);
          }}
          className="w-10 h-10 rounded-2xl bg-roseGold-400 hover:bg-roseGold-500 text-white flex items-center justify-center shadow-md shadow-roseGold-200 transition active:scale-95 shrink-0"
          title="Adicionar link do YouTube"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" />
        <input
          type="text"
          placeholder="Pesquisar por exercício, canal ou foco..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-sand-200 text-xs text-sand-500 placeholder-sand-300 shadow-soft focus:outline-none focus:border-roseGold-400 transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-sand-400 hover:text-sand-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Categories Filter ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSel = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isSel
                  ? 'bg-roseGold-400 text-white shadow-xs'
                  : 'bg-white text-sand-400 border border-sand-200 hover:border-sand-300'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Favorite Channels & Filter Favorites ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowOnlyFavs(!showOnlyFavs)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold border transition shrink-0 ${
            showOnlyFavs
              ? 'bg-roseGold-400 text-white border-roseGold-400 shadow-xs'
              : 'bg-white text-sand-400 border-sand-200 hover:text-sand-600'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${showOnlyFavs ? 'fill-current' : ''}`} />
          Favoritos
        </button>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {canais.map((canal) => {
            const isSel = selectedCanal.toLowerCase() === canal.toLowerCase();
            return (
              <button
                key={canal}
                onClick={() => setSelectedCanal(canal)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  isSel
                    ? 'bg-sand-500 text-white'
                    : 'bg-cream-100 text-sand-400 hover:bg-cream-200'
                }`}
              >
                {canal}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Filters Summary ── */}
      <div className="flex items-center justify-between text-xs text-sand-400 px-1">
        <span>
          A mostrar <strong>{filteredVideos.length}</strong> de {allVideos.length} vídeos
        </span>
        {likedIds.length > 0 && (
          <span className="text-xs text-roseGold-500 font-semibold flex items-center gap-1">
            <Heart className="w-3 h-3 fill-current" />
            {likedIds.length} favorito{likedIds.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Videos Grid ── */}
      <div className="space-y-4">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-10 text-sand-400">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Nenhum vídeo encontrado</p>
            <p className="text-xs mt-1">Tenta outra pesquisa ou adiciona um link do YouTube</p>
          </div>
        ) : (
          filteredVideos.map((video) => {
            const isLiked = likedIds.includes(video.id);
            const isWatched = history?.some(h => h.treinoId === video.id);

            return (
              <div
                key={video.id}
                className={`bg-white rounded-3xl overflow-hidden shadow-soft border transition-all group ${
                  isLiked ? 'border-roseGold-200' : 'border-sand-100 hover:border-roseGold-100'
                }`}
              >
                {/* Thumbnail */}
                <div
                  className="relative aspect-video w-full cursor-pointer overflow-hidden bg-sand-200"
                  onClick={() => setActiveVideo(video)}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-sand-600/25 group-hover:bg-sand-600/35 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/95 text-roseGold-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </div>

                  {/* Duration badge */}
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-md bg-sand-600/85 backdrop-blur-xs text-white text-xs font-mono font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {video.duracao}
                  </div>

                  {/* Channel badge */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-roseGold-600 text-xs font-bold shadow-xs">
                    {video.canal}
                  </div>

                  {/* Watched badge */}
                  {isWatched && (
                    <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      Feito
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-sand-400 uppercase tracking-wider">
                          {video.categoria} • {video.nivel}
                        </span>
                        {intensityBar(video.intensidade)}
                      </div>
                      <h3 className="text-base font-bold text-sand-600 leading-snug">
                        {video.titulo}
                      </h3>
                    </div>

                    {/* Heart & Delete Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => toggleLike(video.id, e)}
                        className={`p-2 rounded-xl transition active:scale-90 ${
                          isLiked
                            ? 'text-roseGold-500 bg-roseGold-50 hover:bg-roseGold-100'
                            : 'text-sand-300 hover:text-roseGold-400 hover:bg-cream-100'
                        }`}
                        title={isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => handleDeleteVideo(video, e)}
                        className="p-2 rounded-xl text-sand-300 hover:text-rose-500 hover:bg-rose-50 transition active:scale-90"
                        title="Eliminar vídeo"
                        aria-label="Eliminar vídeo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-sand-400 line-clamp-2 leading-relaxed">
                    {video.descricao}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-sand-100">
                    <span className="text-xs font-semibold text-roseGold-500">
                      {video.foco}
                    </span>

                    <button
                      onClick={() => setActiveVideo(video)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-sand-500 text-xs font-semibold transition"
                    >
                      <Play className="w-3.5 h-3.5 text-roseGold-500 fill-current" />
                      Treinar Agora
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Active Video Player Modal ── */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-sand-600/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-sand-200 pb-5">
            <div className="p-4 flex items-center justify-between border-b border-sand-100">
              <div className="flex-1 pr-2">
                <span className="text-xs font-bold text-roseGold-500">{activeVideo.canal}</span>
                <h3 className="text-sm font-bold text-sand-600 truncate">{activeVideo.titulo}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => toggleLike(activeVideo.id, e)}
                  className={`p-2 rounded-xl transition ${
                    likedIds.includes(activeVideo.id) ? 'text-roseGold-500' : 'text-sand-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedIds.includes(activeVideo.id) ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="p-1 rounded-xl text-sand-400 hover:text-sand-600 hover:bg-cream-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?autoplay=1&rel=0`}
                title={activeVideo.titulo}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="px-5 pt-3 space-y-3">
              <div className="flex items-center gap-2">
                {intensityBar(activeVideo.intensidade)}
                <span className="text-xs text-sand-400">{activeVideo.nivel}</span>
                <span className="text-xs text-roseGold-500 font-medium ml-auto">{activeVideo.foco}</span>
              </div>

              <p className="text-xs text-sand-400 leading-relaxed">
                {activeVideo.descricao}
              </p>

              <div className="flex gap-2">
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideo.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-cream-200 hover:bg-cream-300 text-sand-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir no YouTube
                </a>
                <button
                  onClick={() => handleFinishVideo(activeVideo)}
                  className="flex-1 py-2.5 rounded-xl bg-roseGold-400 hover:bg-roseGold-500 text-white text-xs font-bold shadow-md shadow-roseGold-200 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" /> Marcar Concluído
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Add Custom Video (Link-Only Automatic Detection) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-600/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-cream-50 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-sand-200 space-y-4">
            <div className="flex items-center justify-between border-b border-sand-200 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-roseGold-100 text-roseGold-500 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-sand-600">Adicionar Vídeo do YouTube</h3>
                  <p className="text-[11px] text-sand-400">Só precisas de colar o link!</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-sand-400 hover:text-sand-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomVideo} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-sand-500 mb-1 block">
                  Link do Vídeo
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                  required
                  autoFocus
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sand-200 text-xs text-sand-600 placeholder-sand-300 focus:outline-none focus:border-roseGold-400 font-mono shadow-inner"
                />
              </div>

              {/* Status: Analyzing */}
              {isAnalyzing && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-cream-200/80 border border-sand-200 text-xs text-roseGold-600 font-medium animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>A analisar o vídeo e a preencher os detalhes com IA...</span>
                </div>
              )}

              {/* Status: Error */}
              {enrichError && !isAnalyzing && (
                <p className="text-xs text-rose-500 bg-rose-50 p-2 rounded-xl border border-rose-200">
                  {enrichError}
                </p>
              )}

              {/* Status: Enriched Preview Card */}
              {enrichedPreview && !isAnalyzing && (
                <div className="rounded-2xl bg-white border border-roseGold-200 p-3 space-y-2 shadow-soft animate-fade-in">
                  <div className="flex items-center gap-1.5 text-xs text-roseGold-500 font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Detalhes Detetados Automaticamente</span>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-sand-200 shrink-0">
                      <img
                        src={enrichedPreview.thumbnail}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-mono text-white">
                        {enrichedPreview.duracao}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-sand-600 line-clamp-2 leading-snug">
                        {enrichedPreview.titulo}
                      </h4>
                      <p className="text-xs text-roseGold-500 font-semibold mt-0.5">
                        {enrichedPreview.canal}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-sand-100 text-[11px] text-sand-400">
                    <span className="px-2 py-0.5 rounded-lg bg-cream-100 text-sand-600 font-bold">
                      {enrichedPreview.categoria}
                    </span>
                    <span>•</span>
                    <span className="text-sand-500 font-medium">
                      {enrichedPreview.foco}
                    </span>
                    <span className="ml-auto font-medium text-roseGold-500">
                      {enrichedPreview.nivel}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-cream-200 text-sand-500 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!enrichedPreview || isAnalyzing}
                  className="flex-1 py-2.5 rounded-xl bg-roseGold-400 hover:bg-roseGold-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-roseGold-200 transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5-Star Rating & Feedback Modal ── */}
      <VideoFeedbackModal
        video={feedbackVideo}
        isOpen={!!feedbackVideo}
        onClose={() => setFeedbackVideo(null)}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </div>
  );
}
