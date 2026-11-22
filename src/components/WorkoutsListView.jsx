import React, { useState } from 'react';
import {
  Dumbbell, Flame, Sparkles, Play, Plus, ChevronDown, ChevronUp,
  Clock, Trash2, X, Video, Pencil, Check, Save, Wand2, Loader2
} from 'lucide-react';
import { getMuscleIcon, MUSCLE_OPTIONS } from '../utils/muscleIcons';
import { generateWorkoutWithAi } from '../services/workoutGenerator';

export default function WorkoutsListView({
  workouts,
  onStartWorkout,
  onAddWorkout,
  onDeleteWorkout,
  onUpdateWorkout,
  profile,
}) {
  const [expandedId, setExpandedId] = useState(workouts[0]?.id || 'treino-1');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeGifId, setActiveGifId] = useState(null);
  const [editingId, setEditingId] = useState(null);        // which workout is in edit mode
  const [editDraft, setEditDraft] = useState(null);         // draft copy while editing

  // ── AI Workout Generation State ──────────────────────────────────────────
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');

  // ── New Workout Form State ───────────────────────────────────────────────
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaTag, setNovaTag] = useState('');
  const [novoFoco, setNovoFoco] = useState('');
  const [novaDuracao, setNovaDuracao] = useState('45 min');
  const [novoMuscleIcon, setNovoMuscleIcon] = useState('🏋️‍♀️');
  const [exercicios, setExercicios] = useState([
    { nome: '', dica: '', series: defaultSeries() }
  ]);

  function defaultSeries() {
    return [
      { serie: 1, peso: 10, reps: 12, concluida: false },
      { serie: 2, peso: 12, reps: 10, concluida: false },
      { serie: 3, peso: 15, reps: 10, concluida: false },
    ];
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toggleExpand = (id) => setExpandedId((p) => (p === id ? null : id));
  const toggleGif = (id) => setActiveGifId((p) => (p === id ? null : id));

  // ── Edit Mode ────────────────────────────────────────────────────────────
  const startEdit = (w) => {
    setEditDraft(JSON.parse(JSON.stringify(w)));   // deep clone
    setEditingId(w.id);
    setExpandedId(w.id);
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };

  const saveEdit = () => {
    onUpdateWorkout(editDraft);
    setEditingId(null);
    setEditDraft(null);
  };

  // ── Draft helpers ────────────────────────────────────────────────────────
  const draftSetField = (exIdx, sIdx, field, val) => {
    const d = { ...editDraft };
    d.exercicios[exIdx].series[sIdx][field] = Number(val) || 0;
    setEditDraft(d);
  };
  const draftAdjust = (exIdx, sIdx, field, delta) => {
    const d = { ...editDraft };
    d.exercicios[exIdx].series[sIdx][field] = Math.max(0, (d.exercicios[exIdx].series[sIdx][field] || 0) + delta);
    setEditDraft(d);
  };
  const draftExField = (exIdx, field, val) => {
    const d = { ...editDraft };
    d.exercicios[exIdx][field] = val;
    setEditDraft(d);
  };
  const draftAddSerie = (exIdx) => {
    const d = { ...editDraft };
    const ex = d.exercicios[exIdx];
    const last = ex.series[ex.series.length - 1];
    ex.series.push({ serie: ex.series.length + 1, peso: last?.peso || 10, reps: last?.reps || 10, concluida: false });
    setEditDraft(d);
  };
  const draftRemoveSerie = (exIdx, sIdx) => {
    const d = { ...editDraft };
    if (d.exercicios[exIdx].series.length <= 1) return;
    d.exercicios[exIdx].series.splice(sIdx, 1);
    setEditDraft(d);
  };
  const draftAddExercicio = () => {
    const d = { ...editDraft };
    d.exercicios.push({ id: 'ex-' + Date.now(), nome: '', dica: '', series: defaultSeries() });
    setEditDraft(d);
  };
  const draftRemoveExercicio = (exIdx) => {
    const d = { ...editDraft };
    if (d.exercicios.length <= 1) return;
    d.exercicios.splice(exIdx, 1);
    setEditDraft(d);
  };

  // ── AI Workout Generation Handler ───────────────────────────────────────
  const handleAiGenerate = async (queryToUse) => {
    const textPrompt = (queryToUse || aiPrompt || '').trim();
    setIsGenerating(true);
    setAiSuccessMessage('');

    try {
      const generated = await generateWorkoutWithAi(textPrompt, profile);
      if (generated) {
        setNovoTitulo(generated.titulo || '');
        setNovaTag(generated.tag || '');
        setNovoFoco(generated.foco || '');
        setNovaDuracao(generated.duracaoEstimada || '45 min');
        setNovoMuscleIcon(generated.muscleIcon || getMuscleIcon(generated));
        if (Array.isArray(generated.exercicios) && generated.exercicios.length > 0) {
          setExercicios(generated.exercicios);
        }
        setAiSuccessMessage('Rotina gerada com sucesso! Revê ou ajusta os detalhes abaixo.');
      }
    } catch (err) {
      console.error('Falha ao gerar treino com AI:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── New Workout Form ─────────────────────────────────────────────────────
  const handleAddExField = () =>
    setExercicios([...exercicios, { nome: '', dica: '', series: defaultSeries() }]);

  const handleRemoveExField = (i) => {
    if (exercicios.length <= 1) return;
    setExercicios(exercicios.filter((_, idx) => idx !== i));
  };

  const handleExChange = (i, field, val) => {
    const u = [...exercicios]; u[i][field] = val; setExercicios(u);
  };

  const handleSaveNew = (e) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;
    const filtered = exercicios.filter((ex) => ex.nome.trim());
    const list = filtered.length ? filtered : [{ nome: 'Exercício 1', dica: '', series: defaultSeries() }];

    const novo = {
      id: 'treino-' + Date.now(),
      titulo: novoTitulo.trim(),
      tag: novaTag.trim() || 'Treino',
      foco: novoFoco.trim() || 'Hipertrofia & Força',
      duracaoEstimada: novaDuracao.trim() || '45 min',
      cor: 'from-roseGold-400 to-roseGold-600',
      icone: 'Flame',
      muscleIcon: novoMuscleIcon || getMuscleIcon({ titulo: novoTitulo, tag: novaTag, foco: novoFoco }),
      exercicios: list.map((ex, i) => ({
        id: `ex-${Date.now()}-${i}`,
        nome: ex.nome.trim() || `Exercício ${i + 1}`,
        dica: ex.dica.trim(),
        series: defaultSeries(),
      })),
    };

    onAddWorkout(novo);
    setShowAddModal(false);
    setNovoTitulo(''); setNovaTag(''); setNovoFoco(''); setNovaDuracao('45 min'); setNovoMuscleIcon('🏋️‍♀️');
    setAiPrompt(''); setAiSuccessMessage('');
    setExercicios([{ nome: '', dica: '', series: defaultSeries() }]);
    setExpandedId(novo.id);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-roseGold-500">As Tuas Rotinas</span>
          <h1 className="text-2xl font-extrabold text-sand-500 tracking-tight">Treinos & Cargas</h1>
          <p className="text-xs text-sand-400 mt-0.5">Edita cargas, séries e exercícios de cada rotina</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-11 h-11 rounded-2xl bg-roseGold-400 hover:bg-roseGold-500 text-white flex items-center justify-center shadow-md shadow-roseGold-200 transition active:scale-95"
          title="Criar Novo Treino"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Workout Cards */}
      {workouts.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-sand-100 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-roseGold-50 border border-roseGold-100 text-roseGold-500 flex items-center justify-center mx-auto">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-sand-500">Ainda não tens treinos criados</h3>
            <p className="text-xs text-sand-400 leading-relaxed max-w-xs mx-auto">
              Cria a tua primeira rotina personalizada ou pede ao nosso AI Coach para gerar um plano à medida do teu nível e objetivo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-roseGold-400 to-[#CF6E8E] hover:from-roseGold-500 hover:to-[#BD5C7E] text-white text-xs font-bold shadow-md shadow-roseGold-200 flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <Wand2 className="w-4 h-4" />
            <span>Criar ou Gerar Treino com IA</span>
          </button>
        </div>
      ) : (
      <div className="space-y-4">
        {workouts.map((w, index) => {
          const isExpanded = expandedId === w.id;
          const isEditing = editingId === w.id;
          const draft = isEditing ? editDraft : null;
          const isT1 = index % 2 === 0;

          return (
            <div key={w.id} className="bg-white rounded-3xl p-5 shadow-soft border border-sand-100 transition-all">
              {/* Card Header Row */}
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 pr-2 cursor-pointer"
                  onClick={() => { if (!isEditing) toggleExpand(w.id); }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isT1 ? 'bg-roseGold-100 text-roseGold-600' : 'bg-sand-200 text-sand-600'
                    }`}>{w.tag}</span>
                    <span className="text-xs text-sand-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {w.duracaoEstimada}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-sand-500 mt-1.5">{isEditing ? editDraft.titulo : w.titulo}</h3>
                  <p className="text-xs text-sand-400">{isEditing ? editDraft.foco : w.foco}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Edit Toggle */}
                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(w)}
                      className="p-2 rounded-xl text-sand-400 hover:text-roseGold-500 hover:bg-roseGold-50 transition"
                      title="Editar Treino"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={cancelEdit}
                        className="p-2 rounded-xl text-sand-400 hover:bg-cream-200 transition"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={saveEdit}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-roseGold-400 hover:bg-roseGold-500 text-white text-xs font-bold transition shadow-sm"
                        title="Guardar alterações"
                      >
                        <Save className="w-3.5 h-3.5" /> Guardar
                      </button>
                    </div>
                  )}

                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm border border-sand-100 ${
                      isT1 ? 'bg-roseGold-50 text-roseGold-600'
                           : 'bg-sand-100 text-sand-600'
                    }`}
                    title={w.foco || w.tag}
                  >
                    <span>{getMuscleIcon(isEditing ? editDraft : w)}</span>
                  </div>

                  {!isEditing && (
                    <button onClick={() => toggleExpand(w.id)} className="text-sand-400 p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Details / Edit Panel */}
              {(isExpanded || isEditing) && (
                <div className="mt-4 pt-4 border-t border-sand-100 space-y-3 animate-fade-in">

                  {/* ── EDIT HEADER FIELDS ── */}
                  {isEditing && (
                    <div className="grid grid-cols-2 gap-2 mb-1">
                      <div>
                        <label className="text-[9px] font-bold text-sand-400 uppercase">Nome</label>
                        <input value={draft.titulo}
                          onChange={(e) => setEditDraft({ ...draft, titulo: e.target.value })}
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl bg-cream-50 border border-sand-200 text-xs font-semibold text-sand-500 focus:outline-none focus:border-roseGold-400"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-sand-400 uppercase">Tag / Grupo</label>
                        <input value={draft.tag}
                          onChange={(e) => setEditDraft({ ...draft, tag: e.target.value })}
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl bg-cream-50 border border-sand-200 text-xs text-sand-500 focus:outline-none focus:border-roseGold-400"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-sand-400 uppercase">Foco</label>
                        <input value={draft.foco}
                          onChange={(e) => setEditDraft({ ...draft, foco: e.target.value })}
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl bg-cream-50 border border-sand-200 text-xs text-sand-500 focus:outline-none focus:border-roseGold-400"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-sand-400 uppercase">Duração</label>
                        <input value={draft.duracaoEstimada}
                          onChange={(e) => setEditDraft({ ...draft, duracaoEstimada: e.target.value })}
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl bg-cream-50 border border-sand-200 text-xs text-sand-500 focus:outline-none focus:border-roseGold-400"
                        />
                      </div>
                      <div className="col-span-2 pt-1">
                        <label className="text-[9px] font-bold text-sand-400 uppercase block mb-1">Ícone do Músculo em Foco</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {MUSCLE_OPTIONS.map((opt) => {
                            const isSelected = (draft.muscleIcon || getMuscleIcon(draft)) === opt.emoji;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setEditDraft({ ...draft, muscleIcon: opt.emoji })}
                                className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 border transition ${
                                  isSelected
                                    ? 'bg-roseGold-100 border-roseGold-400 text-roseGold-700 font-bold shadow-xs'
                                    : 'bg-white border-sand-200 text-sand-600 hover:bg-cream-100'
                                }`}
                              >
                                <span className="text-sm">{opt.emoji}</span>
                                <span className="text-[11px]">{opt.id}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-sand-500 uppercase tracking-wider">
                      Exercícios ({isEditing ? draft.exercicios.length : w.exercicios.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      {isEditing && (
                        <button onClick={draftAddExercicio}
                          className="text-xs text-roseGold-500 font-bold hover:text-roseGold-600 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Exercício
                        </button>
                      )}
                      {!isEditing && onDeleteWorkout && workouts.length > 1 && (
                        <button onClick={() => onDeleteWorkout(w.id)}
                          className="text-xs text-rose-400 hover:text-rose-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Apagar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── EXERCISE LIST ── */}
                  <div className="space-y-3">
                    {(isEditing ? draft.exercicios : w.exercicios).map((ex, i) => {
                      const exKey = ex.id || `${w.id}-${i}`;
                      const isShowingGif = activeGifId === exKey;

                      return (
                        <div key={exKey} className="bg-cream-50 rounded-2xl p-3 border border-cream-200 space-y-2.5">
                          {/* Exercise Header */}
                          <div className="flex items-center justify-between gap-2">
                            {isEditing ? (
                              <input
                                value={ex.nome}
                                onChange={(e) => draftExField(i, 'nome', e.target.value)}
                                placeholder="Nome do exercício"
                                className="flex-1 px-2.5 py-1.5 rounded-xl bg-white border border-sand-200 text-xs font-bold text-sand-500 focus:outline-none focus:border-roseGold-400"
                              />
                            ) : (
                              <span className="text-xs font-bold text-sand-500">{i + 1}. {ex.nome}</span>
                            )}

                            <div className="flex items-center gap-1 shrink-0">
                              {!isEditing && ex.gifUrl && (
                                <button onClick={() => toggleGif(exKey)}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                                    isShowingGif ? 'bg-roseGold-400 text-white' : 'bg-white text-roseGold-600 border border-sand-200'
                                  }`}
                                >
                                  <Video className="w-3 h-3" /> {isShowingGif ? 'Fechar' : 'GIF'}
                                </button>
                              )}
                              <span className="text-xs text-roseGold-600 font-bold bg-roseGold-50 px-2 py-0.5 rounded-lg border border-roseGold-200">
                                {ex.series.length} séries
                              </span>
                              {isEditing && draft.exercicios.length > 1 && (
                                <button onClick={() => draftRemoveExercicio(i)}
                                  className="p-1 text-rose-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dica field when editing */}
                          {isEditing && (
                            <input
                              value={ex.dica}
                              onChange={(e) => draftExField(i, 'dica', e.target.value)}
                              placeholder="Dica ou nota de postura (opcional)"
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-sand-200 text-xs text-sand-400 focus:outline-none"
                            />
                          )}

                          {/* GIF Preview (view mode only) */}
                          {!isEditing && isShowingGif && ex.gifUrl && (
                            <div className="rounded-xl overflow-hidden bg-white border border-sand-200 p-2 animate-fade-in">
                              <img
                                src={ex.gifUrl}
                                alt={ex.nome}
                                className="w-full h-auto max-h-48 object-contain rounded-lg"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fb = e.target.parentElement.querySelector('.gif-error-fallback');
                                  if (fb) fb.style.display = 'flex';
                                }}
                              />
                              <div className="gif-error-fallback hidden flex-col items-center justify-center p-3 text-center bg-cream-50 rounded-lg w-full h-28">
                                <Dumbbell className="w-5 h-5 text-roseGold-500 mb-1 animate-pulse" />
                                <span className="text-xs font-bold text-sand-500">{ex.nome}</span>
                                <span className="text-[9px] text-sand-400">Postura e execução técnica</span>
                              </div>
                              {ex.dica && (
                                <p className="text-xs text-sand-500 mt-1.5 italic text-center">💡 {ex.dica}</p>
                              )}
                            </div>
                          )}

                          {/* Series Rows */}
                          <div className="space-y-1.5">
                            {/* Column headers */}
                            <div className="grid grid-cols-12 text-[9px] font-bold uppercase tracking-wider text-sand-400 px-1">
                              <span className="col-span-2 text-center">Série</span>
                              <span className="col-span-4 text-center">Carga (kg)</span>
                              <span className="col-span-4 text-center">Reps</span>
                              {isEditing && <span className="col-span-2 text-center">Del</span>}
                            </div>

                            {ex.series.map((s, si) => (
                              <div key={si} className="grid grid-cols-12 items-center gap-1 bg-white rounded-xl p-1.5 border border-sand-200">
                                <div className="col-span-2 text-center text-xs font-bold text-sand-500">#{si + 1}</div>

                                {/* Weight */}
                                <div className="col-span-4 flex items-center justify-center gap-0.5 bg-cream-50 rounded-lg py-1 px-1 border border-cream-200">
                                  {isEditing && (
                                    <button onClick={() => draftAdjust(i, si, 'peso', -2.5)}
                                      className="text-sand-400 hover:text-sand-600 font-bold px-0.5 text-xs">-</button>
                                  )}
                                  <input type="number" step="0.5" value={s.peso}
                                    onChange={(e) => isEditing ? draftSetField(i, si, 'peso', e.target.value) : null}
                                    readOnly={!isEditing}
                                    className={`w-9 text-center font-bold text-sand-500 text-xs bg-transparent focus:outline-none ${!isEditing ? 'cursor-default' : ''}`}
                                  />
                                  {isEditing && (
                                    <button onClick={() => draftAdjust(i, si, 'peso', 2.5)}
                                      className="text-sand-400 hover:text-sand-600 font-bold px-0.5 text-xs">+</button>
                                  )}
                                </div>

                                {/* Reps */}
                                <div className="col-span-4 flex items-center justify-center gap-0.5 bg-cream-50 rounded-lg py-1 px-1 border border-cream-200">
                                  {isEditing && (
                                    <button onClick={() => draftAdjust(i, si, 'reps', -1)}
                                      className="text-sand-400 hover:text-sand-600 font-bold px-0.5 text-xs">-</button>
                                  )}
                                  <input type="number" value={s.reps}
                                    onChange={(e) => isEditing ? draftSetField(i, si, 'reps', e.target.value) : null}
                                    readOnly={!isEditing}
                                    className={`w-7 text-center font-bold text-sand-500 text-xs bg-transparent focus:outline-none ${!isEditing ? 'cursor-default' : ''}`}
                                  />
                                  {isEditing && (
                                    <button onClick={() => draftAdjust(i, si, 'reps', 1)}
                                      className="text-sand-400 hover:text-sand-600 font-bold px-0.5 text-xs">+</button>
                                  )}
                                </div>

                                {/* Delete Series */}
                                {isEditing && (
                                  <div className="col-span-2 flex justify-center">
                                    <button onClick={() => draftRemoveSerie(i, si)}
                                      className="p-1 text-rose-300 hover:text-rose-500">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Add Serie Button */}
                            {isEditing && (
                              <button onClick={() => draftAddSerie(i)}
                                className="w-full py-1 rounded-xl border border-dashed border-roseGold-300 text-roseGold-500 text-xs font-semibold hover:bg-roseGold-50 transition"
                              >
                                + Adicionar Série
                              </button>
                            )}
                          </div>

                          {/* Dica (view mode) */}
                          {!isEditing && ex.dica && !isShowingGif && (
                            <p className="text-xs text-sand-400 italic">💡 {ex.dica}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Start Workout Button (view mode only) */}
                  {!isEditing && (
                    <div className="pt-2">
                      <button onClick={() => onStartWorkout(w)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-roseGold-400 hover:bg-roseGold-500 text-white font-bold text-xs shadow-md shadow-roseGold-200 transition active:scale-[0.98]"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Começar {w.tag} Agora
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* ── MODAL: Adicionar Novo Treino ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sand-600/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-cream-50 rounded-3xl p-5 max-w-md w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-sand-200 space-y-4">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3">
              <div className="flex items-center gap-2 text-roseGold-600 font-extrabold text-sm">
                <div className="w-7 h-7 rounded-lg bg-roseGold-100 flex items-center justify-center text-roseGold-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Novo Treino de Ginásio</span>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAiSuccessMessage('');
                }}
                className="p-1 rounded-xl text-sand-400 hover:text-sand-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Cartão de Geração com AI Coach ── */}
            <div className="bg-gradient-to-br from-roseGold-50/90 via-cream-100/90 to-white rounded-2xl p-3.5 border border-roseGold-200 shadow-soft space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-roseGold-600 flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-roseGold-500" />
                  Gerar Rotina com AI Coach
                </span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-roseGold-100 text-roseGold-700 border border-roseGold-200">
                  Inteligente
                </span>
              </div>
              <p className="text-[11px] text-sand-500 leading-relaxed">
                Descreve o teu objetivo ou escolhe uma das sugestões para criar automaticamente os exercícios, repetições, cargas e dicas técnicas:
              </p>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ex: Ombros e braços em 40 min, Glúteos 4 exercícios..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAiGenerate(aiPrompt);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-roseGold-200 text-xs text-sand-600 placeholder-sand-300 focus:outline-none focus:border-roseGold-400 shadow-2xs"
                />
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleAiGenerate(aiPrompt)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-roseGold-400 to-roseGold-500 hover:from-roseGold-500 hover:to-roseGold-600 text-white text-xs font-bold shadow-md shadow-roseGold-200 flex items-center gap-1.5 shrink-0 disabled:opacity-60 transition active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>A criar...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>Gerar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sugestões Rápidas de Treinos */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {[
                  { label: 'Glúteos & Posterior', icon: '🍑' },
                  { label: 'Quadríceps & Pernas', icon: '🦵' },
                  { label: 'Superiores & Braços', icon: '💪' },
                  { label: 'Core & Oblíquos', icon: '⚡' },
                  { label: 'Full Body 40 min', icon: '🏋️‍♀️' },
                  { label: 'Mobilidade & Postura', icon: '🧘‍♀️' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => {
                      setAiPrompt(chip.label);
                      handleAiGenerate(chip.label);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-white/95 hover:bg-white text-[11px] font-semibold text-sand-600 border border-sand-200 hover:border-roseGold-300 transition flex items-center gap-1 shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>

              {aiSuccessMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{aiSuccessMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1 text-sand-400">
              <div className="h-px bg-sand-200 flex-1" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Detalhes da Rotina</span>
              <div className="h-px bg-sand-200 flex-1" />
            </div>

            <form onSubmit={handleSaveNew} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-sand-400 uppercase">Nome do Treino *</label>
                <input type="text" placeholder="Ex: Treino 3: Costas & Bíceps" required
                  value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-sand-200 text-xs font-semibold text-sand-500 focus:outline-none focus:border-roseGold-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-sand-400 uppercase">Tag / Grupo</label>
                  <input type="text" placeholder="Ex: Costas" value={novaTag}
                    onChange={(e) => setNovaTag(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-sand-200 text-xs text-sand-500 focus:outline-none focus:border-roseGold-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-sand-400 uppercase">Duração Est.</label>
                  <input type="text" placeholder="Ex: 45 min" value={novaDuracao}
                    onChange={(e) => setNovaDuracao(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-sand-200 text-xs text-sand-500 focus:outline-none focus:border-roseGold-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-sand-400 uppercase">Foco</label>
                <input type="text" placeholder="Ex: Hipertrofia de Dorsais" value={novoFoco}
                  onChange={(e) => setNovoFoco(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-sand-200 text-xs text-sand-500 focus:outline-none focus:border-roseGold-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-sand-400 uppercase block mb-1">Ícone do Músculo em Foco</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {MUSCLE_OPTIONS.map((opt) => {
                    const isSelected = (novoMuscleIcon || '🏋️‍♀️') === opt.emoji;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNovoMuscleIcon(opt.emoji)}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 border transition ${
                          isSelected
                            ? 'bg-roseGold-100 border-roseGold-400 text-roseGold-700 font-bold shadow-xs'
                            : 'bg-white border-sand-200 text-sand-600 hover:bg-cream-100'
                        }`}
                      >
                        <span className="text-sm">{opt.emoji}</span>
                        <span className="text-[11px]">{opt.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-sand-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sand-400 uppercase">Exercícios ({exercicios.length})</span>
                  <button type="button" onClick={handleAddExField}
                    className="text-xs text-roseGold-500 font-bold hover:text-roseGold-600 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
                {exercicios.map((ex, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl border border-sand-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sand-500">#{idx + 1}</span>
                      {exercicios.length > 1 && (
                        <button type="button" onClick={() => handleRemoveExField(idx)}
                          className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                    <input type="text" placeholder="Nome do exercício (ex: Remada Curvada)"
                      value={ex.nome} onChange={(e) => handleExChange(idx, 'nome', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-cream-50 border border-sand-200 text-xs text-sand-500 focus:outline-none"
                    />
                    <input type="text" placeholder="Dica de postura (opcional)"
                      value={ex.dica} onChange={(e) => handleExChange(idx, 'dica', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-cream-50 border border-sand-200 text-xs text-sand-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-cream-200 text-sand-500 text-xs font-semibold">Cancelar</button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-roseGold-400 hover:bg-roseGold-500 text-white text-xs font-bold shadow-md shadow-roseGold-200">
                  Guardar Treino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
