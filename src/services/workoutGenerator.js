// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT GENERATOR SERVICE — Geração Inteligente de Treinos Personalizados
// Suporta Gemini API live com fallback inteligente para regras biomecânicas.
// ─────────────────────────────────────────────────────────────────────────────

import { getMuscleIcon } from '../utils/muscleIcons';

// Modelos candidatos para cascata de API
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.8-flash',
];

/**
 * Gera um treino estruturado baseado num pedido em linguagem natural ou tema.
 * @param {string} promptText - ex: "Glúteos e posterior foco em carga", "Ombros e braços 35 min"
 * @param {Object} profile - Perfil da aluna (Rita, nível, objetivos)
 * @returns {Promise<Object>} Treino no formato padrão da app
 */
export async function generateWorkoutWithAi(promptText, profile = {}) {
  const userRequest = (promptText || '').trim();
  const nome = profile.nome || 'Rita';
  const nivel = profile.nivel || 'Intermédio';

  const apiKey =
    localStorage.getItem('gemini_api_key') ||
    (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '') ||
    '';

  if (apiKey && apiKey.trim()) {
    try {
      const systemInstruction = `És o AI Personal Trainer de elite da app Rise, focado no treino de força e hipertrofia feminina estética para a ${nome} (nível: ${nivel}).
O teu papel é criar uma rotina de treino segura, altamente eficaz e biomecanicamente inteligente com base no pedido da aluna.

DEVES RESPONDER ESTRITAMENTE EM JSON VÁLIDO (sem blocos markdown \`\`\`json, apenas o JSON puro) com a seguinte estrutura:
{
  "titulo": "Nome apelativo do treino (ex: Treino: Foco em Glúteos & Isquiotibiais)",
  "tag": "Nome curto do grupo (ex: Glúteos, Quadríceps, Superiores, Core, Full Body)",
  "foco": "Objetivo biomecânico claro (ex: Isolamento de glúteo máximo e posterior com sobrecarga)",
  "duracaoEstimada": "Tempo realista (ex: 45 min, 50 min)",
  "muscleIcon": "Emoji representativo (ex: 🍑 para glúteos, 🦵 para pernas/quadríceps, 💪 para superiores, ⚡ para core, 🏋️‍♀️ para full body, 🧘‍♀️ para mobilidade)",
  "exercicios": [
    {
      "nome": "Nome do exercício em Português com termo em Inglês entre parênteses se aplicável",
      "categoria": "Grupo muscular alvo",
      "dica": "Dica técnica de ouro em Português de Portugal para postura, respiração ou conexão mente-músculo",
      "series": [
        { "serie": 1, "peso": 10, "reps": 12, "concluida": false },
        { "serie": 2, "peso": 15, "reps": 10, "concluida": false },
        { "serie": 3, "peso": 20, "reps": 8, "concluida": false }
      ]
    }
  ]
}

Regras:
1. Inclui entre 4 a 6 exercícios que façam sentido juntos.
2. Séries devem ter pesos iniciais realistas e repetições ajustadas ao objetivo (8-15 reps).
3. Todas as dicas em Português de Portugal (PT-PT), motivadoras e técnicas.`;

      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: [{ role: 'user', parts: [{ text: `Cria o seguinte treino: "${userRequest || 'Treino completo de força'}"` }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.7,
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (parsed && parsed.titulo && Array.isArray(parsed.exercicios)) {
                return formatGeneratedWorkout(parsed, userRequest);
              }
            }
          }
        } catch (mErr) {
          console.warn(`Tentativa com ${model} falhou, a tentar próximo...`, mErr);
        }
      }
    } catch (err) {
      console.warn('Erro ao chamar Gemini API para gerar treino, a usar gerador local:', err);
    }
  }

  // Fallback Inteligente Local caso não haja API Key ou em caso de offline/erro
  return generateLocalWorkout(userRequest, profile);
}

/**
 * Garante que o treino gerado tem IDs únicos e formatação válida para a app.
 */
function formatGeneratedWorkout(raw, query) {
  const id = 'treino-' + Date.now();
  const muscleIcon = raw.muscleIcon || getMuscleIcon({ titulo: raw.titulo, tag: raw.tag, foco: raw.foco });

  return {
    id,
    titulo: raw.titulo || `Treino Personalizado: ${raw.tag || 'Força'}`,
    tag: raw.tag || 'Treino',
    foco: raw.foco || 'Hipertrofia & Força Muscular',
    duracaoEstimada: raw.duracaoEstimada || '45 min',
    cor: 'from-roseGold-400 to-roseGold-600',
    icone: muscleIcon,
    muscleIcon: muscleIcon,
    exercicios: (raw.exercicios || []).map((ex, i) => ({
      id: `ex-${Date.now()}-${i + 1}`,
      nome: ex.nome || `Exercício ${i + 1}`,
      categoria: ex.categoria || raw.tag || 'Geral',
      dica: ex.dica || 'Mantém a postura alinhada e controla a respiração em toda a amplitude.',
      series: Array.isArray(ex.series) && ex.series.length > 0
        ? ex.series.map((s, sIdx) => ({
            serie: sIdx + 1,
            peso: Number(s.peso) || 10,
            reps: Number(s.reps) || 12,
            concluida: false,
          }))
        : [
            { serie: 1, peso: 10, reps: 15, concluida: false },
            { serie: 2, peso: 12.5, reps: 12, concluida: false },
            { serie: 3, peso: 15, reps: 10, concluida: false },
          ],
    })),
  };
}

/**
 * Gerador de treinos local rico com regras de personal training.
 */
function generateLocalWorkout(query, profile) {
  const q = (query || '').toLowerCase();

  // 1. Glúteos & Posterior
  if (q.includes('glút') || q.includes('glut') || q.includes('posterior') || q.includes('bumbum') || q.includes('hip thrust') || q.includes('rdl')) {
    return formatGeneratedWorkout({
      titulo: 'Treino: Glúteos & Cadeia Posterior Intensa',
      tag: 'Glúteos & Posterior',
      foco: 'Isolamento de glúteos e isquiotibiais com sobrecarga progressiva',
      duracaoEstimada: '50 min',
      muscleIcon: '🍑',
      exercicios: [
        {
          nome: 'Hip Thrust com Barra (Barbell Hip Thrust)',
          categoria: 'Glúteos',
          dica: 'Pausa de 2 segundos no topo esmagando os glúteos. Queixo recolhido a olhar em frente para proteger a lombar.',
          series: [
            { serie: 1, peso: 20, reps: 12, concluida: false },
            { serie: 2, peso: 30, reps: 10, concluida: false },
            { serie: 3, peso: 40, reps: 8, concluida: false },
          ],
        },
        {
          nome: 'Romanian Deadlift com Halteres (Dumbbell RDL)',
          categoria: 'Posterior & Glúteos',
          dica: 'Empurra a bacia para trás com ligeira flexão de joelhos. Sente o alongamento dos isquiotibiais antes de subir.',
          series: [
            { serie: 1, peso: 16, reps: 12, concluida: false },
            { serie: 2, peso: 20, reps: 10, concluida: false },
            { serie: 3, peso: 24, reps: 8, concluida: false },
          ],
        },
        {
          nome: 'Bulgarian Split Squat com Halteres',
          categoria: 'Glúteos & Quadríceps',
          dica: 'Inclina o tronco 20º à frente para direcionar a tensão máxima para o glúteo da perna da frente.',
          series: [
            { serie: 1, peso: 8, reps: 12, concluida: false },
            { serie: 2, peso: 10, reps: 10, concluida: false },
            { serie: 3, peso: 12, reps: 8, concluida: false },
          ],
        },
        {
          nome: 'Cadeira Abdutora no Banco (Seated Hip Abductor)',
          categoria: 'Glúteo Médio',
          dica: 'Inclina o tronco ligeiramente à frente para recrutar a porção superior do glúteo com máxima amplitude.',
          series: [
            { serie: 1, peso: 35, reps: 15, concluida: false },
            { serie: 2, peso: 40, reps: 12, concluida: false },
            { serie: 3, peso: 45, reps: 12, concluida: false },
          ],
        },
        {
          nome: 'Mesa Flexora Sentada (Seated Leg Curl)',
          categoria: 'Isquiotibiais',
          dica: 'Puxa com controlo e aguenta 1 segundo no pico de contração antes de controlar a fase excêntrica.',
          series: [
            { serie: 1, peso: 25, reps: 12, concluida: false },
            { serie: 2, peso: 30, reps: 10, concluida: false },
            { serie: 3, peso: 35, reps: 10, concluida: false },
          ],
        },
      ],
    }, query);
  }

  // 2. Quadríceps & Pernas
  if (q.includes('quad') || q.includes('perna') || q.includes('coxa') || q.includes('squat') || q.includes('leg press')) {
    return formatGeneratedWorkout({
      titulo: 'Treino: Quadríceps Potente & Membros Inferiores',
      tag: 'Quadríceps',
      foco: 'Hipertrofia de quadríceps, força e estabilidade articular',
      duracaoEstimada: '45-50 min',
      muscleIcon: '🦵',
      exercicios: [
        {
          nome: 'Leg Press 45º',
          categoria: 'Quadríceps & Glúteos',
          dica: 'Pés alinhados com os ombros a meio da plataforma. Não bloqueies os joelhos com violência no topo.',
          series: [
            { serie: 1, peso: 80, reps: 12, concluida: false },
            { serie: 2, peso: 100, reps: 10, concluida: false },
            { serie: 3, peso: 110, reps: 8, concluida: false },
          ],
        },
        {
          nome: 'Leg Extension (Cadeira Extensora)',
          categoria: 'Quadríceps',
          dica: 'Pausa de 1 segundo na contração máxima no topo. Controla a descida em 3 segundos.',
          series: [
            { serie: 1, peso: 35, reps: 15, concluida: false },
            { serie: 2, peso: 40, reps: 12, concluida: false },
            { serie: 3, peso: 45, reps: 10, concluida: false },
          ],
        },
        {
          nome: 'Goblet Squat com Haltere',
          categoria: 'Quadríceps & Core',
          dica: 'Haltere seguro junto à linha da clavícula. Desce profundo mantendo o peito alto e joelhos para fora.',
          series: [
            { serie: 1, peso: 14, reps: 12, concluida: false },
            { serie: 2, peso: 16, reps: 10, concluida: false },
            { serie: 3, peso: 18, reps: 10, concluida: false },
          ],
        },
        {
          nome: 'Cadeira Adutora (Seated Hip Adductor)',
          categoria: 'Adutores',
          dica: 'Aperta forte com os joelhos no centro e faz pausa de 1 segundo para estabilizar a bacia.',
          series: [
            { serie: 1, peso: 25, reps: 15, concluida: false },
            { serie: 2, peso: 30, reps: 12, concluida: false },
            { serie: 3, peso: 35, reps: 12, concluida: false },
          ],
        },
      ],
    }, query);
  }

  // 3. Superiores / Costas / Ombros / Braços
  if (q.includes('superio') || q.includes('costa') || q.includes('ombro') || q.includes('braço') || q.includes('braco') || q.includes('bicep') || q.includes('tricep') || q.includes('peito')) {
    return formatGeneratedWorkout({
      titulo: 'Treino: Superiores Definidos & Postura Elegante',
      tag: 'Superiores',
      foco: 'Costas esculpidas, deltoides redondos e definição de braços',
      duracaoEstimada: '45 min',
      muscleIcon: '💪',
      exercicios: [
        {
          nome: 'Puxada ao Peito na Polia (Lat Pulldown)',
          categoria: 'Costas / Dorsais',
          dica: 'Peito orgulhoso e omoplatas a descer. Puxa a barra até ao queixo focando na força dos dorsais.',
          series: [
            { serie: 1, peso: 25, reps: 12, concluida: false },
            { serie: 2, peso: 30, reps: 10, concluida: false },
            { serie: 3, peso: 35, reps: 8, concluida: false },
          ],
        },
        {
          nome: 'Remada Sentada com Cabo (Seated Cable Row)',
          categoria: 'Costas / Rombóides',
          dica: 'Tronco direito sem balanço. Puxa em direção ao umbigo esmagando as costas no ponto final.',
          series: [
            { serie: 1, peso: 20, reps: 12, concluida: false },
            { serie: 2, peso: 25, reps: 10, concluida: false },
            { serie: 3, peso: 30, reps: 8, concluida: false },
          ],
        },
        {
          nome: 'Elevações Laterais com Halteres (Lateral Raise)',
          categoria: 'Ombros / Deltóide Lateral',
          dica: 'Cotovelos ligeiramente fletidos, lidera o movimento com os cotovelos até à linha dos ombros.',
          series: [
            { serie: 1, peso: 4, reps: 15, concluida: false },
            { serie: 2, peso: 5, reps: 12, concluida: false },
            { serie: 3, peso: 6, reps: 10, concluida: false },
          ],
        },
        {
          nome: 'Extensão de Tríceps na Polia (Tricep Pushdown)',
          categoria: 'Tríceps',
          dica: 'Cotovelos pregados ao tronco, estende os antebraços até ao bloqueio completo sem mexer os ombros.',
          series: [
            { serie: 1, peso: 15, reps: 12, concluida: false },
            { serie: 2, peso: 17.5, reps: 10, concluida: false },
            { serie: 3, peso: 20, reps: 10, concluida: false },
          ],
        },
        {
          nome: 'Curl de Bíceps com Halteres (Bicep Curl)',
          categoria: 'Bíceps',
          dica: 'Contrai o bíceps com rotação controlada no topo sem utilizar o balanço do corpo.',
          series: [
            { serie: 1, peso: 6, reps: 12, concluida: false },
            { serie: 2, peso: 7, reps: 10, concluida: false },
            { serie: 3, peso: 8, reps: 10, concluida: false },
          ],
        },
      ],
    }, query);
  }

  // 4. Core & Abdómen
  if (q.includes('core') || q.includes('abdóm') || q.includes('abdom') || q.includes('abs') || q.includes('barriga') || q.includes('prancha')) {
    return formatGeneratedWorkout({
      titulo: 'Treino: Core Blindado & Cintura Definida',
      tag: 'Core & Abs',
      foco: 'Estabilidade profunda, anti-rotação e fortalecimento abdominal',
      duracaoEstimada: '35 min',
      muscleIcon: '⚡',
      exercicios: [
        {
          nome: 'Ab Crunch no Banco Inclinado com Peso',
          categoria: 'Abdómen Superior & Médio',
          dica: 'Segura o peso junto ao peito e enrola o tronco esmagando o abdómen no topo sem puxar o pescoço.',
          series: [
            { serie: 1, peso: 5, reps: 15, concluida: false },
            { serie: 2, peso: 10, reps: 12, concluida: false },
            { serie: 3, peso: 10, reps: 10, concluida: false },
          ],
        },
        {
          nome: 'Elevação de Pernas na Cadeira de Capitão',
          categoria: 'Abdómen Inferior',
          dica: 'Enrola a bacia ligeiramente para cima no final de cada elevação para recrutar a porção inferior.',
          series: [
            { serie: 1, peso: 0, reps: 12, concluida: false },
            { serie: 2, peso: 0, reps: 12, concluida: false },
            { serie: 3, peso: 0, reps: 10, concluida: false },
          ],
        },
        {
          nome: 'Pallof Press na Polia (Anti-Rotação)',
          categoria: 'Oblíquos & Estabilidade',
          dica: 'Resiste à tração da polia mantendo o tronco firme no centro enquanto estendes os braços à frente.',
          series: [
            { serie: 1, peso: 7.5, reps: 12, concluida: false },
            { serie: 2, peso: 10, reps: 10, concluida: false },
            { serie: 3, peso: 10, reps: 10, concluida: false },
          ],
        },
        {
          nome: 'Roda Abdominal (Ab Wheel Rollout)',
          categoria: 'Core Profundo',
          dica: 'Rola até ao ponto em que manténs a coluna lombar neutra e puxa com a força do abdómen.',
          series: [
            { serie: 1, peso: 0, reps: 10, concluida: false },
            { serie: 2, peso: 0, reps: 10, concluida: false },
            { serie: 3, peso: 0, reps: 8, concluida: false },
          ],
        },
      ],
    }, query);
  }

  // 5. Default: Full Body Dinâmico
  return formatGeneratedWorkout({
    titulo: 'Treino: Full Body Equilíbrio & Força',
    tag: 'Full Body',
    foco: 'Estímulo corporal global e gasto calórico elevado',
    duracaoEstimada: '45 min',
    muscleIcon: '🏋️‍♀️',
    exercicios: [
      {
        nome: 'Goblet Squat com Haltere',
        categoria: 'Pernas & Core',
        dica: 'Mantém o peito aberto e desce com controlo, empurrando pelo chão na subida.',
        series: [
          { serie: 1, peso: 12, reps: 12, concluida: false },
          { serie: 2, peso: 14, reps: 10, concluida: false },
          { serie: 3, peso: 16, reps: 10, concluida: false },
        ],
      },
      {
        nome: 'Romanian Deadlift com Halteres',
        categoria: 'Glúteos & Posterior',
        dica: 'Bacia para trás, costas firmes e peito aberto sentindo o alongamento da cadeia posterior.',
        series: [
          { serie: 1, peso: 14, reps: 12, concluida: false },
          { serie: 2, peso: 18, reps: 10, concluida: false },
          { serie: 3, peso: 20, reps: 8, concluida: false },
        ],
      },
      {
        nome: 'Remada Unilateral com Haltere',
        categoria: 'Costas & Postura',
        dica: 'Apoio firme no banco. Puxa o haltere em direção ao bolso com o cotovelo colado ao corpo.',
        series: [
          { serie: 1, peso: 10, reps: 12, concluida: false },
          { serie: 2, peso: 12, reps: 10, concluida: false },
          { serie: 3, peso: 14, reps: 8, concluida: false },
        ],
      },
      {
        nome: 'Shoulder Press com Halteres',
        categoria: 'Ombros',
        dica: 'Empurra os halteres para cima sem arquear as costas nem encolher os ombros.',
        series: [
          { serie: 1, peso: 6, reps: 12, concluida: false },
          { serie: 2, peso: 7, reps: 10, concluida: false },
          { serie: 3, peso: 8, reps: 8, concluida: false },
        ],
      },
      {
        nome: 'Prancha Isométrica com Toque nos Ombros',
        categoria: 'Core & Estabilidade',
        dica: 'Bacia imóvel sem oscilar de um lado para o outro enquanto tocas com a mão no ombro oposto.',
        series: [
          { serie: 1, peso: 0, reps: 12, concluida: false },
          { serie: 2, peso: 0, reps: 12, concluida: false },
          { serie: 3, peso: 0, reps: 10, concluida: false },
        ],
      },
    ],
  }, query);
}
