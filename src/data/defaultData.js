export const DEFAULT_PROFILE = {
  id: "perfil-rita",
  nome: "Rita",
  peso: 58.0,
  massaMuscular: 40.4,
  altura: 1.60,
  objetivo: "Força, Condicionamento Geral & Resistência",
  ondeTreina: "both", // 'both' (Home & Gym) | 'home' (Apenas em Casa) | 'gym' (Apenas no Ginásio)
  diasSemanaAlvo: 4,
  nivel: "Intermédio",
};

export const DEFAULT_WORKOUTS = [
  {
    id: "treino-1",
    titulo: "Treino 1: Quadríceps & Pernas",
    tag: "Quadríceps",
    foco: "Hipertrofia & Definição",
    cor: "from-roseGold-400 to-roseGold-600",
    icone: "Flame",
    duracaoEstimada: "45-55 min",
    exercicios: [
      {
        id: "ex-1-1",
        nome: "Leg Extension",
        categoria: "Quadríceps",
        dica: "Pausa de 1 segundo no topo da contração máxima. Não desças o peso com balanço.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/lever-leg-extension.gif",
        series: [
          { serie: 1, peso: 36, reps: 15, concluida: false },
          { serie: 2, peso: 43, reps: 12, concluida: false },
          { serie: 3, peso: 50, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-1-2",
        nome: "Leg Press 45º",
        categoria: "Quadríceps",
        dica: "Pés na largura dos ombros, ligeiramente apontados para fora. Controla a descida (3s).",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/sled-45-leg-press.gif",
        series: [
          { serie: 1, peso: 70, reps: 12, concluida: false },
          { serie: 2, peso: 90, reps: 10, concluida: false },
          { serie: 3, peso: 100, reps: 8, concluida: false },
        ]
      },
      {
        id: "ex-1-3",
        nome: "Bulgarian Split Squats",
        categoria: "Quadríceps / Glúteos",
        dica: "Tronco direito com ligeira inclinação. Peso nos halteres de cada lado.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/dumbbell-single-leg-split-squat.gif",
        series: [
          { serie: 1, peso: 8, reps: 12, concluida: false },
          { serie: 2, peso: 9, reps: 12, concluida: false },
          { serie: 3, peso: 8, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-1-4",
        nome: "Goblet Squat",
        categoria: "Quadríceps",
        dica: "Profundidade confortável mantendo a coluna alinhada.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/quads/dumbbell-goblet-squat.gif",
        series: [
          { serie: 1, peso: 14, reps: 12, concluida: false },
          { serie: 2, peso: 16, reps: 12, concluida: false },
          { serie: 3, peso: 18, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-1-5",
        nome: "Seated Hip Adductor",
        categoria: "Adutores",
        dica: "Costas bem apoiadas. Aperta as pernas uma contra a outra com controlo e faz uma pausa de 1 segundo no ponto de contração máxima.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/adductors/lever-seated-hip-adduction.gif",
        series: [
          { serie: 1, peso: 25, reps: 15, concluida: false },
          { serie: 2, peso: 30, reps: 12, concluida: false },
          { serie: 3, peso: 35, reps: 12, concluida: false },
        ]
      }
    ]
  },
  {
    id: "treino-2",
    titulo: "Treino 2: Glúteos & Posterior",
    tag: "Glúteos",
    foco: "Cadeia Posterior & Isolamento",
    cor: "from-sand-400 to-roseGold-500",
    icone: "Sparkles",
    duracaoEstimada: "50-60 min",
    exercicios: [
      {
        id: "ex-2-1",
        nome: "Hip Thrust",
        categoria: "Glúteos",
        dica: "2 segundos de pausa no topo esmagando os glúteos. Queixo recolhido a olhar em frente.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif",
        series: [
          { serie: 1, peso: 10, reps: 12, concluida: false },
          { serie: 2, peso: 15, reps: 12, concluida: false },
          { serie: 3, peso: 20, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-2-2",
        nome: "Romanian Deadlift (RDL)",
        categoria: "Posterior & Glúteos",
        dica: "Empurra a bacia para trás como se fosses fechar uma porta com os glúteos.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/glutes/barbell-romanian-deadlift.gif",
        series: [
          { serie: 1, peso: 20, reps: 12, concluida: false },
          { serie: 2, peso: 25, reps: 10, concluida: false },
          { serie: 3, peso: 30, reps: 8, concluida: false },
        ]
      },
      {
        id: "ex-2-3-back-ext",
        nome: "Back Extension",
        categoria: "Glúteos & Posterior",
        dica: "Queixo colado ao peito e costas ligeiramente arredondadas para focar 100% nos glúteos. Pés rodados 30º para fora. Contrai os glúteos no topo sem hiper-estender a lombar.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/hyperextension.gif",
        series: [
          { serie: 1, peso: 0, reps: 15, concluida: false },
          { serie: 2, peso: 5, reps: 12, concluida: false },
          { serie: 3, peso: 8, reps: 12, concluida: false },
        ]
      },
      {
        id: "ex-2-4",
        nome: "Seated Leg Curl",
        categoria: "Posterior da Coxa",
        dica: "Ajusta o apoio superior sobre as coxas para estares bem estável. Puxa os calcanhares para trás de forma controlada sem levantar a bacia.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/hamstrings/lever-seated-leg-curl.gif",
        series: [
          { serie: 1, peso: 25, reps: 12, concluida: false },
          { serie: 2, peso: 30, reps: 10, concluida: false },
          { serie: 3, peso: 35, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-2-3",
        nome: "Seated Hip Abductor",
        categoria: "Glúteo Médio",
        dica: "Inclina o tronco 45º à frente para recrutar o glúteo superior com máxima eficiência.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abductors/straight-leg-outer-hip-abductor.gif",
        series: [
          { serie: 1, peso: 35, reps: 15, concluida: false },
          { serie: 2, peso: 40, reps: 15, concluida: false },
          { serie: 3, peso: 45, reps: 12, concluida: false },
        ]
      }
    ]
  },
  {
    id: "treino-3",
    titulo: "Treino 3: Superiores (Costas, Ombros & Braços)",
    tag: "Superiores",
    foco: "Costas, Ombros, Braços & Peitoral",
    cor: "from-roseGold-500 to-sand-500",
    icone: "Flame",
    duracaoEstimada: "45-50 min",
    exercicios: [
      {
        id: "ex-3-1",
        nome: "Front Row",
        categoria: "Costas / Dorsais",
        dica: "Tronco inclinado a 45º com as costas direitas. Puxa os halteres em direção à anca esmagando as omoplatas.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/upper-back/cable-low-seated-row.gif",
        series: [
          { serie: 1, peso: 7.5, reps: 12, concluida: false },
          { serie: 2, peso: 10, reps: 10, concluida: false },
          { serie: 3, peso: 12.5, reps: 8, concluida: false },
        ]
      },
      {
        id: "ex-3-2",
        nome: "Lat Pulldown",
        categoria: "Costas / Dorsais",
        dica: "Peito bem aberto e ombros para trás. Puxa a barra em direção à clavícula focando nos dorsais.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/lats/cable-pulldown.gif",
        series: [
          { serie: 1, peso: 25, reps: 12, concluida: false },
          { serie: 2, peso: 30, reps: 10, concluida: false },
          { serie: 3, peso: 35, reps: 8, concluida: false },
        ]
      },
      {
        id: "ex-3-3",
        nome: "Bicep Curl",
        categoria: "Bíceps",
        dica: "Cotovelos colados ao tronco e sem balanço com o corpo. Contrai o bíceps no topo 1 segundo.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif",
        series: [
          { serie: 1, peso: 6, reps: 12, concluida: false },
          { serie: 2, peso: 7, reps: 10, concluida: false },
          { serie: 3, peso: 8, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-3-4",
        nome: "Tricep Pushdown",
        categoria: "Tríceps",
        dica: "Cotovelos fixos ao lado das costelas. Estende os antebraços até ao bloqueio completo dos tríceps.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/triceps/cable-pushdown.gif",
        series: [
          { serie: 1, peso: 15, reps: 12, concluida: false },
          { serie: 2, peso: 17.5, reps: 10, concluida: false },
          { serie: 3, peso: 20, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-3-5",
        nome: "Face Pull",
        categoria: "Deltóide Posterior & Postura",
        dica: "Puxa a corda em direção à linha dos olhos/testa, afastando as mãos no final do movimento.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/cable-standing-rear-delt-row-with-rope.gif",
        series: [
          { serie: 1, peso: 12.5, reps: 15, concluida: false },
          { serie: 2, peso: 15, reps: 12, concluida: false },
          { serie: 3, peso: 17.5, reps: 12, concluida: false },
        ]
      },
      {
        id: "ex-3-6",
        nome: "Lateral Raise",
        categoria: "Ombros",
        dica: "Eleva os halteres até à linha dos ombros, mantendo ligeira flexão nos cotovelos.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/delts/dumbbell-lateral-raise.gif",
        series: [
          { serie: 1, peso: 4, reps: 12, concluida: false },
          { serie: 2, peso: 5, reps: 12, concluida: false },
          { serie: 3, peso: 6, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-3-7",
        nome: "Chest Press",
        categoria: "Peitoral",
        dica: "Omoplatas retraídas e apoiadas no banco. Empurra com o peito sem esticar os cotovelos com violência.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-chest-press.gif",
        series: [
          { serie: 1, peso: 8, reps: 12, concluida: false },
          { serie: 2, peso: 10, reps: 10, concluida: false },
          { serie: 3, peso: 12, reps: 10, concluida: false },
        ]
      }
    ]
  },
  {
    id: "treino-4",
    titulo: "Treino 4: Core & Abdómen",
    tag: "Core & Abs",
    foco: "Fortalecimento do Core, Estabilidade & Definição Abdominal",
    cor: "from-roseGold-400 to-sand-400",
    icone: "⚡",
    muscleIcon: "⚡",
    duracaoEstimada: "30-40 min",
    exercicios: [
      {
        id: "ex-4-1",
        nome: "Crunch na Polia Alta (Cable Kneeling Crunch)",
        categoria: "Abdómen Superior & Médio",
        dica: "De joelhos virada para a polia ou de costas. Mantém a bacia fixa e contrai o abdómen aproximando o esterno do umbigo, sem puxar com os braços.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/cable-kneeling-crunch.gif",
        series: [
          { serie: 1, peso: 20, reps: 15, concluida: false },
          { serie: 2, peso: 25, reps: 12, concluida: false },
          { serie: 3, peso: 30, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-4-2",
        nome: "Elevação de Pernas na Cadeira de Capitão (Captain's Chair Leg Raise)",
        categoria: "Abdómen Inferior & Flexores da Anca",
        dica: "Antebraços bem apoiados nas almofadas, ombros longe das orelhas. Eleva os joelhos ou pernas em direção ao peito enrolando ligeiramente a bacia para recrutar os inferiores.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/captains-chair-straight-leg-raise.gif",
        series: [
          { serie: 1, peso: 0, reps: 12, concluida: false },
          { serie: 2, peso: 0, reps: 12, concluida: false },
          { serie: 3, peso: 0, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-4-3",
        nome: "Pallof Press na Polia (Cable Pallof Press)",
        categoria: "Anti-Rotação & Oblíquos",
        dica: "Posição lateral à polia com pés à largura dos ombros e joelhos destrancados. Estende os braços à frente do peito resistindo à força da polia que tenta rodar o teu tronco.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/band-horizontal-pallof-press.gif",
        series: [
          { serie: 1, peso: 7.5, reps: 12, concluida: false },
          { serie: 2, peso: 10, reps: 10, concluida: false },
          { serie: 3, peso: 10, reps: 10, concluida: false },
        ]
      },
      {
        id: "ex-4-4",
        nome: "Roda Abdominal (Ab Wheel Rollout)",
        categoria: "Estabilidade Profunda do Core",
        dica: "De joelhos, começa com a anca alinhada e abdómen bem ativo. Rola a roda à frente até onde manténs a lombar neutra (sem arquear as costas) e puxa de volta pelo abdómen.",
        gifUrl: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/abs/wheel-rollerout.gif",
        series: [
          { serie: 1, peso: 0, reps: 10, concluida: false },
          { serie: 2, peso: 0, reps: 10, concluida: false },
          { serie: 3, peso: 0, reps: 8, concluida: false },
        ]
      }
    ]
  }
];

export const INITIAL_HISTORY = [
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
  {
    id: "hist-sab",
    data: "2026-11-14T19:00:00.000Z", // Sábado
    treinoId: "yt-ga-hyrox-1",
    treinoTitulo: "growingannanas: 30 MIN HYROX HIIT – Workout 1",
    duracaoMinutos: 30,
    seriesConcluidas: 1,
    tipo: "Home Video",
    canal: "growingannanas",
    rating: 5,
    feedback: "Workout 1 Hyrox concluído! Desafiante, alta intensidade e excelente para o corpo todo 🔥",
    tags: ["🔥 Muito Puxado", "❤️‍🔥 Amei o Treino", "⚡ Alta Intensidade"],
  },
  {
    id: "hist-qui",
    data: "2026-11-12T18:00:00.000Z", // Quinta-feira
    treinoId: "treino-1",
    treinoTitulo: "Treino 1: Quadríceps & Pernas",
    duracaoMinutos: 48,
    seriesConcluidas: 12,
    tipo: "Ginásio",
  },
  {
    id: "hist-qua",
    data: "2026-11-11T17:30:00.000Z", // Quarta-feira
    treinoId: "treino-2",
    treinoTitulo: "Treino 2: Glúteos & Posterior",
    duracaoMinutos: 52,
    seriesConcluidas: 12,
    tipo: "Ginásio",
  },
  {
    id: "hist-ter",
    data: "2026-11-10T18:30:00.000Z", // Terça-feira
    treinoId: "treino-3",
    treinoTitulo: "Treino 3: Superiores (Costas, Ombros & Braços)",
    duracaoMinutos: 48,
    seriesConcluidas: 21,
    tipo: "Ginásio",
  }
];
