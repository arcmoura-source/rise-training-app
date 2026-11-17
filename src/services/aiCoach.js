// ─────────────────────────────────────────────────────────────────────────────
// AI COACH SERVICE — Inteligência Avançada & Personal Trainer Dinâmico
// Suporta chamada live à Gemini API (com cascata de modelos e memória multi-turn)
// e motor de raciocínio de fitness local contextual em Português de Portugal.
// ─────────────────────────────────────────────────────────────────────────────

export const generateAiAdvice = async (userPrompt, profile, workouts, conversationHistory = []) => {
  const prompt = (userPrompt || '').trim();
  const promptLower = prompt.toLowerCase();

  const nome = profile?.nome || 'Rita';
  const objetivo = profile?.objetivo || 'Hipertrofia & Força (Quadríceps e Glúteos)';
  const ondeTreina = profile?.ondeTreina || 'both';
  const nivel = profile?.nivel || 'Intermédio';

  // ── 1. CHAMADA À GOOGLE GEMINI API (Cascata de Modelos com Memória Multi-Turn) ─
  const apiKey =
    localStorage.getItem('gemini_api_key') ||
    (import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '') ||
    '';

  if (apiKey && apiKey.trim()) {
    try {
      // Construir resumo dos treinos atuais da aluna
      let treinosDesc = '';
      if (Array.isArray(workouts) && workouts.length > 0) {
        treinosDesc = workouts
          .map((w, idx) => {
            const exs = w.exercicios ? w.exercicios.map((e) => e.nome).join(', ') : '';
            return `- ${w.titulo || `Treino ${idx + 1}`}: ${exs}`;
          })
          .join('\n');
      } else {
        treinosDesc = `- Treino 1: Quadríceps & Pernas (Leg Extension, Leg Press 45º, Afundos Búlgaros, Goblet Squat)
- Treino 2: Glúteos & Posterior (Hip Thrust na Máquina, Peso Morto Romeno RDL, Cadeira Abdutora, Mesa Flexora)
- Treino 3: Superiores (Front Row, Lat Pulldown, Bicep Curl, Tricep Pushdown, Face Pull, Lateral Raise, Chest Press)
- Treinos em casa: Vídeos de alta intensidade e força da growingannanas, Olivia Lawson, Heather Robertson e Caroline Girvan.`;
      }

      // Preparar histórico multi-turn da conversa
      const chatHistory = (conversationHistory || [])
        .filter((m) => m && m.id !== 'msg-welcome' && m.text && m.text.trim().length > 0)
        .slice(-10); // Últimas 10 mensagens para contexto contínuo

      const turns = [];
      const firstUserIdx = chatHistory.findIndex((m) => m.sender === 'user');
      if (firstUserIdx !== -1) {
        for (const msg of chatHistory.slice(firstUserIdx)) {
          const role = msg.sender === 'user' ? 'user' : 'model';
          if (turns.length > 0 && turns[turns.length - 1].role === role) {
            turns[turns.length - 1].parts[0].text += '\n\n' + msg.text;
          } else {
            turns.push({
              role,
              parts: [{ text: msg.text }],
            });
          }
        }
      }

      // Garantir alternância estrita: o último turno do histórico tem de ser 'model' se existir
      if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
        turns.pop();
      }

      const contents = [
        ...turns,
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ];

      const systemInstructionText = `És o Personal Trainer e AI Coach pessoal da ${nome}.
Perfil da aluna:
- Nome: ${nome}
- Foco principal: ${objetivo}
- Onde treina: ${ondeTreina === 'gym' ? 'Apenas Ginásio' : ondeTreina === 'home' ? 'Apenas Casa (com halteres e tapete)' : 'Ginásio e Casa'}
- Nível de treino: ${nivel}
Treinos habituais dela no plano:
${treinosDesc}

Regras obrigatórias de resposta:
1. Responde SEMPRE em Português de Portugal natural (PT-PT: usa "estás", "treinares", "pequeno-almoço", "ecrã", "banco", "peitoral", etc.).
2. MEMÓRIA ATIVA DA CONVERSA: Lê e leva SEMPRE em conta o histórico de mensagens anteriores. Se a ${nome} fizer perguntas de seguimento (ex: "e para o outro?", "quantas séries devo fazer disso?", "como substituo?", "diz-me mais"), responde sabendo exatamente ao que ela se refere no contexto do que já conversaram.
3. NUNCA menciones o peso em kg da aluna. NUNCA uses a expressão "especialista em hipertrofia" nem te descrevas assim.
4. ESTILO DE LINGUAGEM:
   - Podes dizer "tendo em conta o teu perfil e objetivo" de forma natural e pontual, mas NUNCA coloques o objetivo entre aspas ou parênteses (nunca escrevas "Hipertrofia..." nem (*Hipertrofia...*)).
   - NÃO repitas frases feitas nem digas "com base no teu objetivo" ou "tendo em conta o teu perfil e objetivo" em todas as respostas. Varia a linguagem de forma descontraída, calorosa e humana como um treinador real.
   - Vai DIRETO ao ponto da resposta sem introduções mecânicas.
5. Se a aluna fizer mais do que uma pergunta na mesma mensagem, responde a TODAS separando por tópicos claros e organizados.
6. ESCOPO ESTRITAMENTE LIMITADO A FITNESS & NUTRIÇÃO: O teu papel é exclusivamente ser Personal Trainer e Coach de Fitness/Nutrição. Responde APENAS a questões de treino, exercícios, execução biomecânica, postura, dores musculares, recuperação, sono, hidratação, suplementação e alimentação saudável.
7. Usa formatação limpa com tópicos (bullet points) e emojis elegantes para facilitar a leitura no ecrã de telemóvel.`;

      // Cascata inteligente de modelos: se o primeiro atingir limite de cota (429/503), tenta os outros automaticamente
      const candidateModels = [
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3-flash-preview',
        'gemini-3.8-flash'
      ];

      for (const model of candidateModels) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: systemInstructionText }]
                },
                contents
              })
            }
          );

          if (response.ok) {
            const data = await response.json();
            const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText && candidateText.trim().length > 10) {
              return candidateText;
            }
          }
        } catch (mErr) {
          // Continua para o próximo modelo na cascata
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, switching to local coach intelligence engine', err);
    }
  }

  // ── 2. MOTOR DE CONHECIMENTO LOCAL (Contextual & Multi-Turn Fallback) ───────
  await new Promise((res) => setTimeout(res, 350));

  // Histórico recente para extração contextual
  const recentHistoryText = (conversationHistory || [])
    .slice(-4)
    .map((m) => m?.text || '')
    .join(' ')
    .toLowerCase();

  // Módulos base de conhecimento
  const knowledgeModules = [
    {
      id: 'back_extension',
      title: 'Back Extension (Hiperextensão a 45º no Banco Romano)',
      match: (p) =>
        p.includes('back extension') ||
        p.includes('hiperextens') ||
        p.includes('banco romano') ||
        (p.includes('extensão') && p.includes('costas')) ||
        (p.includes('extensao') && p.includes('costas')),
      content: `Sim, deves sem dúvida incluir **Back Extension**! É fantástico para glúteos e cadeia posterior:
• **Foco em Glúteos (como deves fazer):**
  1. Arredonda ligeiramente a parte superior das costas (*queixo colado ao peito*).
  2. Roda os pés 30º para fora.
  3. A almofada deve ficar logo abaixo da anca (para a bacia dobrar livremente).
  4. Sobe empurrando a bacia contra o apoio e esmagando os glúteos — pára quando o corpo estiver alinhado, sem arquear a lombar!
• **Onde Encaixar:** No Treino 2 (Glúteos & Posterior), 3 a 4 séries de 12 a 15 repetições, começando com peso corporal e depois haltere ao peito.`,
      seriesAdvice: `Para o **Back Extension**, o volume ideal é:
• **3 a 4 séries de 12 a 15 repetições** com foco total na contração dos glúteos no topo.
• **Descanso:** 60 a 90 segundos entre séries.
• **Carga:** Começa apenas com peso corporal; quando dominares as 15 reps com técnica perfeita, segura num haltere de 4kg a 6kg ao peito.`
    },
    {
      id: 'hip_thrust',
      title: 'Hip Thrust (Execução & Força)',
      match: (p) =>
        p.includes('hip thrust') ||
        (p.includes('glúteo') && (p.includes('como') || p.includes('sentir') || p.includes('ativar'))),
      content: `Para sentires 100% de ativação nos glúteos e zero na lombar no **Hip Thrust**:
1. **Canelas a 90º no topo:** Nem demasiado perto nem longe do banco.
2. **Queixo colado ao peito:** Olha sempre em frente para o espelho, nunca deites a cabeça para trás.
3. **Pausa de 2 segundos no topo:** Esmaga os glúteos na contração máxima antes de descer de forma controlada.`,
      seriesAdvice: `No **Hip Thrust**, o teu exercício principal de carga:
• **3 a 4 séries de 8 a 12 repetições** com sobrecarga progressiva.
• **Pausa:** 2 segundos de contração no topo em cada repetição.
• **Descanso:** 90 a 120 segundos para recuperares a força total antes da série seguinte.`
    },
    {
      id: 'bulgaros',
      title: 'Afundos Búlgaros (Técnica & Foco)',
      match: (p) =>
        p.includes('búlgaro') || p.includes('bulgaro') || p.includes('afundo') || p.includes('split squat'),
      content: `No **Afundo Búlgaro**:
• **Foco em Glúteos:** Inclina o tronco cerca de 30º para a frente sobre a perna de apoio e empurra o chão pelo calcanhar.
• **Foco em Quadríceps:** Tronco perfeitamente vertical e deixa o joelho avançar ligeiramente à frente.
• **Equilíbrio:** Pés na largura da anca (em carris paralelos), nunca em linha reta atrás um do outro!`,
      seriesAdvice: `Nos **Afundos Búlgaros**:
• **3 séries de 10 a 12 repetições por perna**.
• **Descanso:** 60 a 90 segundos entre pernas.
• **Progressão:** Segura num haltere moderado do lado da perna que recua.`
    },
    {
      id: 'rdl',
      title: 'RDL / Peso Morto Romeno',
      match: (p) => p.includes('rdl') || p.includes('romeno') || p.includes('peso morto'),
      content: `• **Hinge de Anca:** Imagina que queres fechar uma gaveta atrás de ti com os glúteos.
• **Halteres colados às pernas:** Devem descer a raspar nas coxas até logo abaixo do joelho.
• **Lombar neutra:** Não curves a coluna para descer mais; a amplitude termina quando a anca deixa de recuar.`,
      seriesAdvice: `Para o **RDL (Peso Morto Romeno)**:
• **3 a 4 séries de 8 a 12 repetições**.
• **Descanso:** 90 segundos.
• **Cadência:** Desce em 3 segundos controlados e sobe com força pelo calcanhar.`
    },
    {
      id: 'dor_joelho',
      title: 'Desconforto ou Dor no Joelho',
      match: (p) =>
        (p.includes('dor') || p.includes('estalo') || p.includes('desconforto')) &&
        (p.includes('joelho') || p.includes('afundo') || p.includes('búlgaro') || p.includes('agach')),
      content: `• **Pausa de 2 semanas nos Afundos Búlgaros:** Substitui por **Step-ups controlados numa caixa baixa** ou **Leg Press unilateral com pés altos**.
• **Aquecimento específico:** 5 minutos de mobilidade de tornozelo + 2 séries leves de Leg Extension para aquecer o tendão patelar.
• **Regra de ouro:** Se houver dor articular aguda, pára o movimento de imediato.`
    },
    {
      id: 'cardio_antes_depois',
      title: 'Cardio: Antes ou Depois da Musculação?',
      match: (p) =>
        p.includes('cardio') || p.includes('passadeira') || p.includes('bicicleta') || p.includes('aquec'),
      content: `Faz **SEMPRE o cardio depois da musculação** (ou em horários separados).
• **Porquê?** Para treinares pernas e glúteos com cargas pesadas, precisas dos depósitos de glicogénio muscular cheios. Se fizeres cardio intenso antes, chegas à musculação fatigada.
• **Antes do treino:** Faz apenas 3 a 5 minutos de aquecimento cardiovascular suave + mobilidade dinâmica.
• **Depois do treino:** 15 a 20 minutos de caminhada inclinada na passadeira ou funcional moderado.`
    },
    {
      id: 'glute_bridge_hip_thrust',
      title: 'Glute Bridge vs Hip Thrust',
      match: (p) => p.includes('glute bridge') || (p.includes('ponte') && p.includes('glúteo')),
      content: `A principal diferença é a **amplitude de movimento**:
• **Hip Thrust (no Banco):** As costas elevadas permitem uma descida muito maior da anca, gerando alongamento sob carga máxima ➔ **estímulo superior para os glúteos**.
• **Glute Bridge (no Chão):** O chão trava a descida, mas é excelente para ativação inicial com elástico ou aquecimento.
• **Recomendação:** Mantém o Hip Thrust como exercício principal de carga pesada e usa a ponte no chão como ativação!`
    },
    {
      id: 'stiff_rdl',
      title: 'Diferença entre RDL e Stiff',
      match: (p) =>
        p.includes('stiff') && (p.includes('rdl') || p.includes('diferen') || p.includes('romeno')),
      content: `• **No RDL (Romanian Deadlift):** Há uma flexão natural de 20º nos joelhos e empurras a bacia para trás (*hip hinge*). Ativa fortemente glúteos e isquiotibiais com segurança para a coluna.
• **No Stiff:** Pernas quase esticadas e tronco desce mais perto do chão, concentrando a tensão no alongamento extremo da parte de trás da coxa.
• Para desenhar a curva glútea, o **RDL** é superior e muito mais confortável para as costas!`
    },
    {
      id: 'superiores',
      title: 'Treino de Membros Superiores (Costas, Ombros, Braços)',
      match: (p) =>
        p.includes('superior') ||
        p.includes('costas') ||
        p.includes('ombro') ||
        p.includes('braço') ||
        p.includes('bicep') ||
        p.includes('tricep') ||
        p.includes('peito'),
      content: `• **Costas (Remada / Lat Pulldown):** Puxa guiando pelos cotovelos e junta as omoplatas 1 segundo no final.
• **Ombros (Laterais & Face Pull):** Empurra os halteres para os lados e não para cima. O Face Pull previne ombros caídos para a frente.
• **Braços:** Mantém os cotovelos fixos junto ao tronco no Bíceps Curl e Tríceps Pushdown, sem embalar o corpo.`
    },
    {
      id: 'leg_press',
      title: 'Leg Press 45º',
      match: (p) => p.includes('leg press') || p.includes('prensa'),
      content: `• A tua bacia nunca deve enrolar para fora do banco no ponto mais baixo (mantém o cóccix 100% apoiado).
• **Pés mais baixos:** Mais quadríceps. **Pés mais altos e afastados:** Mais glúteos e posterior.
• Nunca bloqueies os joelhos no topo; mantém uma ligeira flexão de segurança.`,
      seriesAdvice: `No **Leg Press 45º**:
• **3 a 4 séries de 10 a 12 repetições** com descida controlada em 3 segundos.
• **Descanso:** 90 a 120 segundos.`
    },
    {
      id: 'proteina_nutricao',
      title: 'Proteína, Dieta e Suplementos',
      match: (p) =>
        p.includes('proteina') ||
        p.includes('proteína') ||
        p.includes('creatina') ||
        p.includes('dieta') ||
        p.includes('caloria') ||
        p.includes('comer') ||
        p.includes('água') ||
        p.includes('agua'),
      content: `• **Proteína diária:** Cerca de **100g a 115g de proteína** por dia, distribuída em 3 a 4 refeições (frango, ovos, peixe, queijo quark, iogurte grego ligeiro ou whey).
• **Água:** Pelo menos **2 a 2.5 litros** por dia. A hidratação influencia diretamente a força muscular.
• **Creatina Monohidratada:** 3g a 5g todos os dias com consistência (hidrata a célula muscular por dentro).`
    },
    {
      id: 'quantos_exercicios',
      title: 'Quantos Exercícios Fazer por Treino',
      match: (p) =>
        p.includes('quantos exerc') || p.includes('número de exerc') || p.includes('demasiados exerc'),
      content: `• O número ideal para cada sessão é entre **4 a 6 exercícios no máximo**.
• 1 ou 2 exercícios principais pesados (ex: Hip Thrust ou Leg Press) + 2 a 3 acessórios de isolamento (ex: Mesa Flexora, Abdutora).
• Mais vale 4 exercícios com intensidade e cargas desafiantes do que 8 exercícios a correr!`
    },
    {
      id: 'duracao_treino',
      title: 'Duração Ideal do Treino',
      match: (p) =>
        p.includes('quanto tempo') || p.includes('duração') || p.includes('duracao') || p.includes('minutos'),
      content: `• A duração ideal é entre **45 a 60 minutos** de musculação focada.
• Descansa 90 segundos entre séries pesadas. Treinos com mais de 70 minutos tendem a aumentar o cortisol e a diminuir o rendimento.`
    },
    {
      id: 'maquina_ocupada',
      title: 'Substituições e Máquinas Ocupadas',
      match: (p) =>
        p.includes('substitu') || p.includes('ocupad') || p.includes('trocar') || p.includes('em casa'),
      content: `• **Hip Thrust Máquina ocupada:** Faz Hip Thrust com Barra livre no banco ou Haltere na anca.
• **Leg Press ocupado:** Faz Agachamento Goblet pesado com haltere.
• **Extensora ocupada:** Faz Passadas a caminhar ou Sissy Squats com apoio.
• **Flexora ocupada:** Faz Peso Morto Romeno (RDL) com halteres.`
    },
    {
      id: 'progredir_cargas',
      title: 'Sobrecarga Progressiva e Aumentar Cargas',
      match: (p) =>
        p.includes('progredir') || p.includes('sobrecarga') || (p.includes('aumentar') && p.includes('carga')),
      content: `• **Repetições Primeiro:** Só aumentas a carga quando completares o teto de repetições em todas as séries com execução perfeita.
• **Micro-Aumentos:** Sobe 1kg a 2kg de cada vez, ou faz mais 1 repetição com a mesma carga anterior. Isso já é progresso real!`
    }
  ];

  // ── DETETAR PERGUNTAS DE SEGUIMENTO (Contextual Follow-ups) ─────────────────
  const isSeriesQuestion =
    promptLower.includes('quantas séries') ||
    promptLower.includes('quantas series') ||
    promptLower.includes('quantas reps') ||
    promptLower.includes('quantas repeti') ||
    promptLower.includes('que séries') ||
    promptLower.includes('que series') ||
    promptLower.includes('que carga') ||
    promptLower.includes('quanto peso') ||
    promptLower.includes('quanto descanso') ||
    promptLower.includes('número de repetições');

  const isTechniqueQuestion =
    promptLower.includes('como faço') ||
    promptLower.includes('como faco') ||
    promptLower.includes('como se faz') ||
    promptLower.includes('qual a técnica') ||
    promptLower.includes('qual a tecnica') ||
    promptLower.includes('como executar') ||
    promptLower.includes('qual a postura');

  // Identificar se existia um tópico no histórico recente
  const lastActiveTopic = knowledgeModules.find((m) => m.match(recentHistoryText));

  // SE FOR UMA PERGUNTA DE SEGUIMENTO CONTEXTUAL (ex: "e quantas séries?", "como faço?")
  if (isSeriesQuestion && lastActiveTopic) {
    if (lastActiveTopic.seriesAdvice) {
      return `Tendo em conta o teu perfil e objetivo, aqui tens a recomendação direta:\n\n${lastActiveTopic.seriesAdvice}\n\nLembra-te de manter sempre 1 a 2 repetições de reserva (RIR 1-2) com boa técnica! 💪✨`;
    }
    return `Para esse exercício, o ideal no teu plano são **3 a 4 séries de 10 a 12 repetições**, descansando cerca de 90 segundos entre séries para recuperares bem a força! 💪✨`;
  }

  if (isTechniqueQuestion && lastActiveTopic) {
    return `Em relação à execução de **${lastActiveTopic.title}**:\n\n${lastActiveTopic.content}\n\nFoca-te na conexão mente-músculo e na cadência controlada! Se tiveres alguma dúvida durante o movimento, diz-me. 💪✨`;
  }

  // ── Se perguntou dinamicamente "Devo incluir [X]?" ─────────────────────────
  const isIncludeQuestion =
    promptLower.includes('devo incluir') ||
    promptLower.includes('posso incluir') ||
    promptLower.includes('vale a pena incluir') ||
    promptLower.includes('adicionar ao treino') ||
    promptLower.includes('meter no treino') ||
    promptLower.includes('incluir no treino');

  // Identificar todos os tópicos presentes na mensagem atual do utilizador
  const matchedTopics = knowledgeModules.filter((m) => m.match(promptLower));

  // CASO 1: Múltiplas perguntas na mesma mensagem
  if (matchedTopics.length >= 2) {
    let responseText = `Olá ${nome}! Aqui estão as respostas diretas e organizadas às tuas questões:\n\n`;

    matchedTopics.forEach((topic, idx) => {
      responseText += `### ${idx + 1}. ${topic.title}\n${topic.content}\n\n`;
    });

    responseText += `Podes aplicar estas orientações já no teu próximo treino! Se precisares de ajustar algo específico no teu plano, avisa. 💪✨`;
    return responseText;
  }

  // CASO 2: Apenas 1 tópico identificado
  if (matchedTopics.length === 1) {
    const single = matchedTopics[0];
    return `Olá ${nome}! Em relação a **${single.title}**:

${single.content}

Se quiseres adaptar este detalhe diretamente a um dos teus treinos de ginásio ou vídeos de casa, diz-me! 💪✨`;
  }

  // CASO 3: Pergunta genérica "Devo incluir [exercício]?" não listado acima
  if (isIncludeQuestion) {
    let rawEx = prompt
      .replace(
        /^(ol[aá]|hey|coach|achas que|será que|devo incluir|posso incluir|vale a pena incluir|queria incluir|adicionar|incluir|meter)/gi,
        ''
      )
      .replace(/(no treino|ao treino|no meu treino|ao meu plano|no plano|\?|\!)+/gi, '')
      .trim();

    const exName = rawEx || 'esse exercício';

    return `Sim, ${nome}! Podes perfeitamente incluir **${exName}** no teu treino, desde que respeite a estrutura da tua semana.

Aqui tens a melhor estratégia para o executares tendo em conta o teu perfil e objetivo:

1. **Onde Encaixar no Teu Split:**
   • **Se for focado em Glúteos ou Cadeia Posterior:** Encaixa no **Treino 2 (Glúteos & Posterior)** logo a seguir aos exercícios compostos mais pesados (Hip Thrust e RDL).
   • **Se for focado em Quadríceps / Pernas:** Faz no **Treino 1 (Quadríceps & Pernas)** para acumulares estímulo concentrado.
   • **Se for focado em Costas, Ombros ou Braços:** Junta ao **Treino 3 (Superiores)**.

2. **Como Executar:**
   • Começa com uma carga moderada para dominar a amplitude articular e o tempo sob tensão (2 a 3 segundos na descida controlada e 1 segundo de pausa no pico de contração).
   • Não retires os teus exercícios base principais; usa este como exercício acessório complementar.

3. **Volume & Repetições:**
   • **3 séries de 10 a 12 repetições** (ou 12 a 15 se for um movimento de isolamento ou no tapete), terminando a série com 1 a 2 repetições de reserva antes da falha técnica (RIR 1-2).

Se quiseres, podes ir ao separador **Ginásio**, carregar em editar no treino correspondente e adicioná-lo já à tua rotina! 💪✨`;
  }

  // CASO 4: Saudações
  if (/^(ol[aá]|bom dia|boa tarde|boa noite|hey|oi|tudo bem|como est[aá]s|quem [eé]s)/i.test(promptLower)) {
    return `Olá ${nome}! ✨ Estou ótimo e pronto para te acompanhar!

Como teu **AI Personal Coach**, podes colocar-me dúvidas sobre:
• **Técnica & Execução:** Como fazer Back Extension, Hip Thrust, RDL, búlgaros, etc.
• **Organização:** Se deves incluir algum exercício novo na tua rotina e onde encaixar.
• **Membros Superiores:** Costas, ombros, braços e postura.
• **Alimentação & Suplementos:** Metas de proteína, creatina, hidratação e refeições pré/pós-treino.
• **Dores & Adaptações:** Dores musculares vs articulares, ou máquinas ocupadas.

Podes inclusive fazer mais do que uma pergunta na mesma mensagem que eu respondo a todas! Em que te posso ajudar hoje?`;
  }

  // CASO 5: Pergunta Aberta Dinâmica (Sem aspas no objetivo ou pergunta)
  return `Olá ${nome}! Em relação à tua dúvida:

1. **Abordagem Direta:**
   O segredo é priorizar a tensão mecânica nos músculos-alvo com boa técnica e amplitude segura, sem sobrecarregar a zona lombar ou articulações.

2. **Dica Técnica & Volume:**
   • Mantém sempre uma cadência controlada (2 a 3 segundos na fase excêntrica/descida).
   • Para o teu objetivo de ganho de massa magra e força, faz **3 a 4 séries de 8 a 12 repetições** com descanso de 60 a 90 segundos entre séries.
   • Não te esqueças de registar as repetições e cargas aqui na app para acompanhares a tua sobrecarga progressiva.

Se quiseres saber como executar um exercício específico em detalhe ou como adaptá-lo ao teu treino de ginásio ou casa, diz-me o nome exato! 💪✨`;
};
