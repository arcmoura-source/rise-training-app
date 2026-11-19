// Muscle Icon mapping & detection for gym workouts

export const MUSCLE_OPTIONS = [
  { id: 'quads', emoji: '🦵', label: 'Quadríceps & Pernas', keywords: ['quad', 'perna', 'coxa', 'squat', 'leg', 'adutor', 'agach'] },
  { id: 'glutes', emoji: '🍑', label: 'Glúteos & Posterior', keywords: ['glút', 'glut', 'posterior', 'hamstring', 'bumbum', 'anca', 'hip', 'rdl', 'stiff'] },
  { id: 'upper', emoji: '💪', label: 'Superiores & Braços', keywords: ['superio', 'costa', 'dorsal', 'ombro', 'braço', 'braco', 'bícep', 'bicep', 'trícep', 'tricep', 'peit', 'pull', 'push', 'upper'] },
  { id: 'core', emoji: '⚡', label: 'Core & Abdómen', keywords: ['core', 'abdóm', 'abdom', 'prancha', 'lombar', 'abs'] },
  { id: 'fullbody', emoji: '🏋️‍♀️', label: 'Full Body & Força', keywords: ['full', 'corpo', 'geral', 'funcional', 'força'] },
  { id: 'cardio', emoji: '🔥', label: 'Cardio & HIIT', keywords: ['cardio', 'hiit', 'corrida', 'queima'] },
  { id: 'mobility', emoji: '🧘‍♀️', label: 'Mobilidade & Alongamento', keywords: ['along', 'mobilid', 'yoga', 'pilates', 'flexib'] }
];

export function getMuscleIcon(workout) {
  if (!workout) return '🏋️‍♀️';

  // If explicit emoji is stored on the workout
  if (workout.muscleIcon && typeof workout.muscleIcon === 'string') {
    return workout.muscleIcon;
  }
  if (workout.icone && typeof workout.icone === 'string' && /[\p{Emoji}]/u.test(workout.icone)) {
    return workout.icone;
  }

  // Auto-detect based on text in tag, title, and foco
  const searchStr = `${workout.tag || ''} ${workout.titulo || ''} ${workout.foco || ''}`.toLowerCase();

  // Check glutes first to avoid matching generic 'pernas' before 'glúteos e posterior'
  if (
    searchStr.includes('glút') ||
    searchStr.includes('glut') ||
    searchStr.includes('posterior') ||
    searchStr.includes('bumbum') ||
    searchStr.includes('hip thrust') ||
    searchStr.includes('hamstring')
  ) {
    return '🍑';
  }

  if (
    searchStr.includes('quad') ||
    searchStr.includes('perna') ||
    searchStr.includes('coxa') ||
    searchStr.includes('agach') ||
    searchStr.includes('leg press') ||
    searchStr.includes('extensora') ||
    searchStr.includes('adutor')
  ) {
    return '🦵';
  }

  if (
    searchStr.includes('superio') ||
    searchStr.includes('costa') ||
    searchStr.includes('dorsal') ||
    searchStr.includes('ombro') ||
    searchStr.includes('braço') ||
    searchStr.includes('braco') ||
    searchStr.includes('bícep') ||
    searchStr.includes('bicep') ||
    searchStr.includes('trícep') ||
    searchStr.includes('tricep') ||
    searchStr.includes('peit') ||
    searchStr.includes('pull') ||
    searchStr.includes('push')
  ) {
    return '💪';
  }

  if (
    searchStr.includes('core') ||
    searchStr.includes('abdóm') ||
    searchStr.includes('abdom') ||
    searchStr.includes('prancha') ||
    searchStr.includes('barriga')
  ) {
    return '⚡';
  }

  if (searchStr.includes('cardio') || searchStr.includes('corrida') || searchStr.includes('hiit')) {
    return '🔥';
  }

  if (searchStr.includes('along') || searchStr.includes('mobilid') || searchStr.includes('yoga') || searchStr.includes('pilates')) {
    return '🧘‍♀️';
  }

  return '🏋️‍♀️';
}

export function getMuscleInfo(workout) {
  const emoji = getMuscleIcon(workout);
  const found = MUSCLE_OPTIONS.find((m) => m.emoji === emoji);
  return {
    emoji,
    label: found ? found.label : (workout?.tag || 'Músculo em Foco'),
  };
}
