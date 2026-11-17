import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Footprints,
  Flame,
  Bike,
  Link as LinkIcon,
  Dumbbell,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Info,
  MapPin,
  Gauge,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Configuração dos tipos de atividade
// Para Caminhada e Corrida, o cálculo calórico baseia-se diretamente na Distância (km) e Peso (kg):
// - Corrida: ~1.036 kcal / kg / km (Margaria / ACSM)
// - Caminhada: ~0.75 kcal / kg / km
// - Outras: Fórmula MET (Metabolic Equivalent of Task)
const ACTIVITY_PRESETS = [
  {
    id: 'caminhada',
    label: 'Caminhada',
    icon: Footprints,
    defaultTitle: 'Caminhada ao Ar Livre',
    defaultDuration: 45,
    defaultDistance: '3.5',
    requiresDistance: true,
    met: 3.8,
    tipo: 'Caminhada',
    foco: 'Cardio & Mobilidade',
  },
  {
    id: 'corrida',
    label: 'Corrida',
    icon: Flame,
    defaultTitle: 'Corrida Contínua',
    defaultDuration: 30,
    defaultDistance: '4.5',
    requiresDistance: true,
    met: 9.0,
    tipo: 'Corrida',
    foco: 'Cardio & Resistência',
  },
  {
    id: 'spinning',
    label: 'Spinning',
    icon: Bike,
    defaultTitle: 'Aula de Spinning / Bike',
    defaultDuration: 45,
    defaultDistance: '15.0',
    requiresDistance: false,
    met: 8.5,
    tipo: 'Spinning',
    foco: 'Ciclismo & Alta Intensidade',
  },
  {
    id: 'link',
    label: 'Link de Vídeo',
    icon: LinkIcon,
    defaultTitle: 'Treino Online / YouTube',
    defaultDuration: 30,
    defaultDistance: '',
    requiresDistance: false,
    met: 7.0,
    tipo: 'Vídeo Online',
    foco: 'Treino Guiado',
  },
  {
    id: 'ginasio',
    label: 'Ginásio',
    icon: Dumbbell,
    defaultTitle: 'Treino de Ginásio',
    defaultDuration: 50,
    defaultDistance: '',
    requiresDistance: false,
    met: 5.5,
    tipo: 'Ginásio',
    foco: 'Musculação & Hipertrofia',
  },
  {
    id: 'outro',
    label: 'Outro',
    icon: Sparkles,
    defaultTitle: 'Atividade Física',
    defaultDuration: 40,
    defaultDistance: '',
    requiresDistance: false,
    met: 5.0,
    tipo: 'Outro',
    foco: 'Condicionamento',
  },
];

const extractYoutubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
};

export default function AddActivityModal({
  isOpen,
  onClose,
  initialDate,
  workouts = [],
  profile,
  onSaveActivity,
}) {
  const [selectedPresetId, setSelectedPresetId] = useState('caminhada');
  const [customDate, setCustomDate] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    return d.toISOString().split('T')[0];
  });
  const [title, setTitle] = useState('Caminhada ao Ar Livre');
  const [duration, setDuration] = useState(45);
  const [distanceKm, setDistanceKm] = useState('3.5');
  const [calories, setCalories] = useState('');
  const [isCaloriesCustom, setIsCaloriesCustom] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [youtubeInfo, setYoutubeInfo] = useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [selectedGymWorkoutId, setSelectedGymWorkoutId] = useState('');
  const [notes, setNotes] = useState('');
  const [intensity, setIntensity] = useState('Moderada');

  const currentPreset =
    ACTIVITY_PRESETS.find((p) => p.id === selectedPresetId) || ACTIVITY_PRESETS[0];

  // Peso corporal do utilizador (default 58 kg)
  const userWeight = profile?.peso ? Number(profile.peso) : 58;

  // Cálculo rigoroso de calorias baseado na Distância e Peso (ou tempo/MET para ginásio)
  const autoEstimatedCalories = useMemo(() => {
    const dist = parseFloat(distanceKm);
    const durHours = (Number(duration) || 0) / 60;

    // 1. Caminhada com distância: Gasto calórico = Peso (kg) * Distância (km) * 0.75
    if (selectedPresetId === 'caminhada' && !isNaN(dist) && dist > 0) {
      return Math.round(userWeight * dist * 0.75);
    }

    // 2. Corrida com distância: Gasto calórico = Peso (kg) * Distância (km) * 1.036
    if (selectedPresetId === 'corrida' && !isNaN(dist) && dist > 0) {
      return Math.round(userWeight * dist * 1.036);
    }

    // 3. Spinning com distância: ~22 kcal por km + taxa horária de esforço
    if (selectedPresetId === 'spinning' && !isNaN(dist) && dist > 0) {
      return Math.round(dist * 20 + userWeight * durHours * 2.2);
    }

    // 4. Ginásio / Vídeos ou caso sem km: cálculo por MET e tempo
    const est = Math.round(currentPreset.met * userWeight * durHours);
    return Math.max(10, est);
  }, [selectedPresetId, distanceKm, duration, currentPreset.met, userWeight]);

  // Cálculo da velocidade média (km/h)
  const speedKmh = useMemo(() => {
    const dist = parseFloat(distanceKm);
    const dur = parseFloat(duration);
    if (isNaN(dist) || isNaN(dur) || dur <= 0 || dist <= 0) return null;
    return ((dist / dur) * 60).toFixed(1);
  }, [distanceKm, duration]);

  // Cálculo do Pace (min/km)
  const paceMinPerKm = useMemo(() => {
    const dist = parseFloat(distanceKm);
    const dur = parseFloat(duration);
    if (isNaN(dist) || isNaN(dur) || dur <= 0 || dist <= 0) return null;
    const totalMinPerKm = dur / dist;
    const mins = Math.floor(totalMinPerKm);
    const secs = Math.round((totalMinPerKm - mins) * 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs} /km`;
  }, [distanceKm, duration]);

  // Atualizar data inicial quando o modal abre
  useEffect(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      setCustomDate(d.toISOString().split('T')[0]);
    }
  }, [initialDate, isOpen]);

  // Atualizar as calorias sugeridas automaticamente quando a distância, duração ou tipo mudam
  useEffect(() => {
    if (!isCaloriesCustom) {
      setCalories(String(autoEstimatedCalories));
    }
  }, [autoEstimatedCalories, isCaloriesCustom]);

  // Atualizar preset
  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setIsCaloriesCustom(false);
    setDistanceKm(preset.defaultDistance || '');

    if (preset.id === 'ginasio' && workouts.length > 0) {
      const first = workouts[0];
      setSelectedGymWorkoutId(first.id);
      setTitle(first.titulo || preset.defaultTitle);
      setDuration(50);
    } else if (preset.id === 'link') {
      setTitle(youtubeInfo?.title || preset.defaultTitle);
      setDuration(preset.defaultDuration);
    } else {
      setTitle(preset.defaultTitle);
      setDuration(preset.defaultDuration);
    }
  };

  // Quando o utilizador cola um link de vídeo
  const handleVideoUrlChange = async (url) => {
    setVideoUrl(url);
    const ytId = extractYoutubeId(url);

    if (ytId) {
      setIsLoadingVideo(true);
      try {
        const resp = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`
        );
        if (resp.ok) {
          const data = await resp.json();
          setYoutubeInfo({
            id: ytId,
            title: data.title,
            author: data.author_name,
            thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          });
          if (data.title) setTitle(data.title);
        } else {
          setYoutubeInfo({
            id: ytId,
            title: 'Vídeo do YouTube',
            thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          });
        }
      } catch (err) {
        setYoutubeInfo({
          id: ytId,
          title: 'Vídeo do YouTube',
          thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        });
      } finally {
        setIsLoadingVideo(false);
      }
    } else {
      setYoutubeInfo(null);
    }
  };

  if (!isOpen) return null;

  // Formatação da data para apresentação amigável
  const dateObj = new Date(customDate + 'T12:00:00');
  const dateFormatted = dateObj.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || Number(duration) <= 0) return;

    // Se a atividade requer distância obrigatória (Caminhada ou Corrida), validar
    if (currentPreset.requiresDistance && (!distanceKm || parseFloat(distanceKm) <= 0)) {
      alert('Por favor insere a distância percorrida em km para podermos calcular as calorias exatas.');
      return;
    }

    const [y, m, d] = customDate.split('-').map(Number);
    const activityDate = new Date(y, m - 1, d, 12, 0, 0);

    const finalCalories = calories !== '' ? Number(calories) : autoEstimatedCalories;

    const newActivity = {
      id: `act-${Date.now()}`,
      data: activityDate.toISOString(),
      treinoTitulo: title.trim(),
      treinoId: selectedPresetId === 'ginasio' ? selectedGymWorkoutId : `custom-${selectedPresetId}`,
      tipo: currentPreset.tipo,
      duracaoMinutos: Number(duration),
      caloriasEstimadas: isNaN(finalCalories) ? autoEstimatedCalories : finalCalories,
      distanciaKm: distanceKm ? parseFloat(distanceKm) : null,
      ritmoPace: paceMinPerKm || null,
      velocidadeKmh: speedKmh ? parseFloat(speedKmh) : null,
      foco: currentPreset.foco,
      link: videoUrl.trim() || null,
      youtubeId: youtubeInfo?.id || extractYoutubeId(videoUrl) || null,
      canal: youtubeInfo?.author || null,
      intensidade: intensity,
      feedback: notes.trim() || null,
      rating: 5,
      manual: true,
    };

    // Celebração de confetes 🎉
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#ECA1B8', '#DF86A3', '#CF6E8E', '#F59E0B', '#10B981'],
      });
    } catch {}

    if (onSaveActivity) {
      onSaveActivity(newActivity);
    }
    onClose();
  };

  const hasDistance =
    selectedPresetId === 'caminhada' ||
    selectedPresetId === 'corrida' ||
    selectedPresetId === 'spinning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-600/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-[32px] p-5 max-w-sm w-full shadow-2xl border border-sand-200 space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sand-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-roseGold-400 to-roseGold-500 text-white flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-sand-500">Registar Treino</h3>
              <p className="text-[11px] text-sand-400 capitalize">{dateFormatted}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-sand-400 hover:text-sand-600 hover:bg-cream-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Seletor de Data */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-cream-50 border border-sand-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-roseGold-500 shrink-0" />
              <span className="text-xs font-bold text-sand-500">Data do Treino:</span>
            </div>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-2 py-1 rounded-xl bg-white border border-sand-200 text-xs font-bold text-sand-500 focus:outline-none focus:border-roseGold-400"
            />
          </div>

          {/* Categorias Rápidas */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-sand-400 block mb-1.5">
              Tipo de Atividade
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ACTIVITY_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSel = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`py-2 px-1.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      isSel
                        ? 'bg-roseGold-400 text-white border-roseGold-400 shadow-sm scale-102 font-bold'
                        : 'bg-cream-50 text-sand-500 border-sand-200 hover:bg-cream-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSel ? 'text-white' : 'text-roseGold-500'}`} />
                    <span className="text-[11px] leading-tight font-medium">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Caso 1: Link de Vídeo (YouTube) */}
          {selectedPresetId === 'link' && (
            <div className="space-y-2 p-3 rounded-2xl bg-roseGold-50/50 border border-roseGold-200">
              <label className="text-[11px] font-bold uppercase tracking-wider text-roseGold-700 block">
                Link do Vídeo (YouTube ou Web)
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="Cola aqui o link (ex: https://youtu.be/...)"
                  value={videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-sand-200 text-sand-500 focus:outline-none focus:border-roseGold-400"
                />
              </div>

              {isLoadingVideo && (
                <div className="flex items-center gap-2 text-xs text-roseGold-600 animate-pulse">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>A obter detalhes do vídeo...</span>
                </div>
              )}

              {youtubeInfo && (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-roseGold-200">
                  <img
                    src={youtubeInfo.thumbnail}
                    alt="Capa do vídeo"
                    className="w-14 h-10 object-cover rounded-lg shrink-0 shadow-sm"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-sand-500 truncate">{youtubeInfo.title}</p>
                    {youtubeInfo.author && (
                      <p className="text-[10px] text-sand-400">{youtubeInfo.author}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Caso 2: Ginásio (Escolher treino existente da aluna) */}
          {selectedPresetId === 'ginasio' && workouts.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-sand-400 block">
                Qual treino realizaste?
              </label>
              <select
                value={selectedGymWorkoutId}
                onChange={(e) => {
                  setSelectedGymWorkoutId(e.target.value);
                  const found = workouts.find((w) => w.id === e.target.value);
                  if (found) setTitle(found.titulo);
                }}
                className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500 focus:outline-none focus:border-roseGold-400"
              >
                {workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.titulo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nome / Título da Atividade */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-sand-400 block mb-1">
              Título / Nome do Treino
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Caminhada, Corrida no Parque, Aula..."
              className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500 focus:outline-none focus:border-roseGold-400"
            />
          </div>

          {/* MÉTRICAS PRINCIPAIS: Duração, Distância (Essencial!) e Calorias */}
          <div className="space-y-2">
            <div className={`grid ${hasDistance ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
              {/* Duração */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-sand-400 block mb-1">
                  Duração (min)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="300"
                    required
                    value={duration}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 0);
                      setDuration(val);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500 focus:outline-none focus:border-roseGold-400"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-sand-400">min</span>
                </div>
              </div>

              {/* Distância (Essencial para Caminhada e Corrida!) */}
              {hasDistance ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-sand-500 flex items-center gap-1">
                      <span>Distância</span>
                      {currentPreset.requiresDistance && (
                        <span className="text-roseGold-500 font-extrabold">*</span>
                      )}
                    </label>
                    {speedKmh && (
                      <span className="text-[10px] font-bold text-roseGold-600 font-mono">
                        {speedKmh} km/h
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="100"
                      required={currentPreset.requiresDistance}
                      placeholder="Ex: 4.5"
                      value={distanceKm}
                      onChange={(e) => {
                        setDistanceKm(e.target.value);
                        setIsCaloriesCustom(false); // Recalcular calorias automaticamente com a nova distância!
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500 focus:outline-none focus:border-roseGold-400"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-sand-400 font-bold">km</span>
                  </div>
                </div>
              ) : (
                /* Se não tiver distância, coloca as Calorias na 2ª coluna */
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-sand-400 block">
                      Calorias
                    </label>
                    {isCaloriesCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          setCalories(String(autoEstimatedCalories));
                          setIsCaloriesCustom(false);
                        }}
                        className="text-[10px] text-roseGold-600 font-bold hover:underline"
                        title="Repor valor estimado"
                      >
                        Repor
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      placeholder={`~${autoEstimatedCalories}`}
                      value={calories}
                      onChange={(e) => {
                        setCalories(e.target.value);
                        setIsCaloriesCustom(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500 focus:outline-none focus:border-roseGold-400"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-sand-400">kcal</span>
                  </div>
                </div>
              )}
            </div>

            {/* Linha das Calorias e Ritmo para atividades com Distância */}
            {hasDistance && (
              <div className="p-2.5 rounded-2xl bg-cream-50/80 border border-sand-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-roseGold-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sand-500">
                      Gasto Calórico Estimado
                    </span>
                  </div>
                  {isCaloriesCustom && (
                    <button
                      type="button"
                      onClick={() => {
                        setCalories(String(autoEstimatedCalories));
                        setIsCaloriesCustom(false);
                      }}
                      className="text-[10px] text-roseGold-600 font-bold hover:underline"
                    >
                      Repor (~{autoEstimatedCalories})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      placeholder={`~${autoEstimatedCalories}`}
                      value={calories}
                      onChange={(e) => {
                        setCalories(e.target.value);
                        setIsCaloriesCustom(true);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-sand-200 text-xs font-extrabold text-sand-500 focus:outline-none focus:border-roseGold-400"
                    />
                    <span className="absolute right-3 top-2 text-xs text-sand-400">kcal</span>
                  </div>

                  {paceMinPerKm && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-white border border-sand-200 text-right">
                      <span className="text-[9px] text-sand-400 block uppercase font-bold">Ritmo (Pace)</span>
                      <span className="text-xs font-extrabold text-roseGold-600 font-mono">
                        {paceMinPerKm}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-sand-400">
                  {selectedPresetId === 'corrida'
                    ? `Calculado: ${distanceKm || 0} km × ${userWeight} kg × 1.036 (podes editar com o valor do relógio).`
                    : selectedPresetId === 'caminhada'
                    ? `Calculado: ${distanceKm || 0} km × ${userWeight} kg × 0.75 (podes editar com o valor do relógio).`
                    : 'Estimado com base no teu peso e esforço (editável).'}
                </p>
              </div>
            )}
          </div>

          {/* Atalhos Rápidos de Duração */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {[20, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDuration(mins)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition ${
                  duration === mins
                    ? 'bg-roseGold-100 text-roseGold-700 border-roseGold-300'
                    : 'bg-white text-sand-400 border-sand-200 hover:bg-cream-100'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Notas Opcionais */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-sand-400 block mb-1">
              Notas ou Feedback (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Ritmo ligeiro, sensação ótima..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-sand-200 text-xs text-sand-500 focus:outline-none focus:border-roseGold-400"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-cream-100 text-sand-500 font-bold text-xs hover:bg-cream-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 rounded-2xl bg-gradient-to-r from-[#ECA1B8] to-[#CF6E8E] text-white font-extrabold text-xs shadow-md shadow-roseGold-300/40 hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar no Histórico
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
