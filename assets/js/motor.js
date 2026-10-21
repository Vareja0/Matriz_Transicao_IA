// motor.js
// Toda a lógica de cálculo. Versão 2 das regras: parte das fórmulas da planilha Matriz_Transicao_IA_v1.xlsx
// e muda o que os testes de sentido apontaram (ver diagnostico.txt, Parte 3). Mudanças marcadas com [v2-n].
// Não depende da interface: pode ser testado sozinho (veja testes/Executar_Testes.html).

const COMPS = [
  ['C01', 'Usar IA e formular instruções', 'Digitais e de dados'],
  ['C02', 'Conferir resultados e decidir', 'Cognitivas complexas'],
  ['C03', 'Organizar dados e estoque', 'Digitais e de dados'],
  ['C04', 'Atender com empatia e adaptar-se', 'Socioemocionais e adaptação'],
  ['C05', 'Revisar e criar conteúdo', 'Cognitivas complexas'],
  ['C06', 'Conduzir mudança e orientar equipe', 'Liderança']
];
// [v2-7] EXT (apoio externo) e [v2-8] MAT (maturidade digital da loja) entram no catálogo
const INTERV_CODES = ['CULT', 'PARES', 'EXP', 'TUTOR', 'RED', 'PRES', 'EXT', 'MAT'];
const TASK_Q = ['ativa', 'q1', 'q2', 'q3', 'q4', 'q5', 'r1', 'r2', 'r3'];
const ANDAMENTOS = ['Não iniciada', 'Em andamento', 'Concluída'];
const PRONTIDOES = ['Baixa', 'Moderada', 'Alta'];
const MATURIDADE_ITENS = ['Registros digitais organizados', 'Equipamentos e acesso disponíveis', 'Rotinas de conferência de dados', 'Apoio à aprendizagem na rotina'];
const EPS = 1e-9;

const isNum = x => typeof x === 'number' && Number.isFinite(x);
const filled = x => x !== undefined && x !== null && String(x).trim() !== '';
const up = s => String(s).trim().toUpperCase();
// [v2-13] compara códigos pelo número (D9 < D10 < D100), não pelo texto
const idNum = id => { const m = /(\d+)/.exec(String(id || '')); return m ? +m[1] : 0; };
const cmpId = (a, b) => idNum(a) - idNum(b) || (up(a) < up(b) ? -1 : up(a) > up(b) ? 1 : 0);

// ---------- dados de exemplo (Mercado Aurora, fictício) ----------
function exemploAurora() {
  return {
    versao: '2.0',
    negocio: {
      loja: 'Mercado Aurora (simulado)', segmento: 'Minimercado de bairro', dataBase: '2026-09-22',
      horas: 3, orcamento: 80, maxAcoes: 3,
      maturidade: [1, 1, 2, 2],
      riscoAlto: 2, prontBaixa: 1, prontAlta: 2, presHoras: 0.5,
      maxAprendizes: 2,            // [v2-9] aprendizes simultâneos por colega
      cultGrupo: 'Sim',            // [v2-10] preparação cultural em grupo
      cultHoraExtra: 0.25,         // [v2-10] horas a mais por pessoa extra no grupo
      matAndamento: 'Não iniciada',
      intervencoes: {
        CULT: { nome: 'Preparação cultural', horas: 1, semanas: 2, custo: 0, participantes: 'Pessoa(s) + colega', compartilhado: false },
        PARES: { nome: 'Aprendizagem entre pares', horas: 1, semanas: 4, custo: 0, participantes: 'Pessoa + colega', compartilhado: false },
        EXP: { nome: 'Experimentação assistida', horas: 1, semanas: 8, custo: 0, participantes: 'Pessoa', compartilhado: false },
        TUTOR: { nome: 'Mentoria por IA', horas: 0.5, semanas: 4, custo: 0, participantes: 'Pessoa', compartilhado: false },
        RED: { nome: 'Redesenho gradual', horas: 0.5, semanas: 8, custo: 0, participantes: 'Pessoa', compartilhado: false },
        PRES: { nome: 'Preservação de competências', horas: 0, semanas: 4, custo: 0, participantes: 'Pessoa + colega', compartilhado: false },
        EXT: { nome: 'Apoio externo', horas: 1, semanas: 4, custo: 0, participantes: 'Pessoa + apoio externo', compartilhado: false },
        MAT: { nome: 'Elevar maturidade digital', horas: 1, semanas: 8, custo: 0, participantes: 'Gestor', compartilhado: false }
      }
    },
    equipe: [
      { id: 'E01', nome: 'Helena', funcao: 'Proprietária-gestora', gestor: 'Sim', prontidao: 'Alta', c: [1, 2, 2, 3, 1, 1], obs: '', prep: '' },
      { id: 'E02', nome: 'Bruno', funcao: 'Atendimento e vendas', gestor: 'Não', prontidao: 'Baixa', c: [0, 1, 1, 3, 1, 0], obs: '', prep: '' },
      { id: 'E03', nome: 'Carla', funcao: 'Estoque e reposição', gestor: 'Não', prontidao: 'Moderada', c: [1, 2, 1, 2, 0, 0], obs: '', prep: '' },
      { id: 'E04', nome: 'Diego', funcao: 'Marketing e mídias', gestor: 'Não', prontidao: 'Alta', c: [2, 2, 3, 2, 1, 1], obs: '', prep: '' },
      { id: 'E05', nome: 'Elisa', funcao: 'Caixa e retaguarda', gestor: 'Não', prontidao: 'Alta', c: [1, 3, 2, 3, 0, 0], obs: '', prep: '' }
    ],
    tarefas: [
      ['T01', 'Responder dúvidas no WhatsApp', 'Sim', 'Não', 'Não', 'Sim', 'Sim', 'Não', 'Sim', 'Sim', 'Não'],
      ['T02', 'Planejar pedido ao fornecedor', 'Sim', 'Não', 'Não', 'Sim', 'Sim', 'Não', 'Sim', 'Sim', 'Sim'],
      ['T03', 'Criar conteúdo para redes sociais', 'Sim', 'Não', 'Não', 'Não', 'Não', 'Sim', 'Não', 'Sim', 'Sim'],
      ['T04', 'Conferir lançamentos do caixa', 'Sim', 'Não', 'Não', 'Sim', 'Sim', 'Não', 'Não', 'Sim', 'Sim'],
      ['T05', 'Negociar reclamação sensível', 'Sim', 'Não', 'Sim', 'Não', 'Não', 'Não', 'Sim', 'Sim', 'Sim'],
      ['T06', 'Analisar indicadores de vendas', 'Sim', 'Não', 'Não', 'Não', 'Não', 'Não', 'Não', 'Sim', 'Sim'],
      ['T07', 'Preparar roteiro de capacitação', 'Sim', 'Não', 'Não', 'Não', 'Não', 'Sim', 'Não', 'Não', 'Sim'],
      ['T08', 'Conferir produtos na prateleira', 'Sim', 'Sim', 'Não', 'Sim', 'Não', 'Não', 'Não', 'Sim', 'Sim']
    ].map(r => { const t = { id: r[0], nome: r[1] }; TASK_Q.forEach((k, i) => t[k] = r[i + 2]); return t; }),
    diagnosticos: [
      ['D01', 'E01', 'T06', 'C01', 3, 3, 'Entrada simulada'],
      ['D02', 'E02', 'T01', 'C01', 2, 3, 'Entrada simulada'],
      ['D03', 'E03', 'T02', 'C03', 3, 3, 'Entrada simulada'],
      ['D04', 'E04', 'T03', 'C05', 2, 2, 'Entrada simulada'],
      ['D05', 'E05', 'T04', 'C01', 2, 2, 'Entrada simulada'],
      ['D06', 'E01', 'T07', 'C06', 2, 3, 'Entrada simulada'],
      ['D07', 'E01', 'T05', 'C04', 3, 3, 'Tarefa humana'],
      ['D08', 'E05', 'T02', 'C02', 2, 3, 'Sem lacuna, com preservação']
    ].map(r => ({ id: r[0], pessoa: r[1], tarefa: r[2], comp: r[3], meta: r[4], crit: r[5], andamento: 'Não iniciada', evidencia: r[6] }))
  };
}

function estadoVazio() {
  const s = exemploAurora();
  s.negocio.loja = ''; s.negocio.segmento = '';
  s.negocio.dataBase = new Date().toISOString().slice(0, 10);
  s.equipe = []; s.tarefas = []; s.diagnosticos = [];
  return s;
}

function addDays(iso, n) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// ---------- Negocio!B46: validação dos parâmetros ----------
function validarNegocio(N) {
  const e = [];
  const base = [N.horas, N.orcamento, N.maxAcoes];
  if (!base.every(isNum)) e.push('Preencha horas semanais, orçamento e máximo de ações.');
  else {
    if (Math.min(...base) < 0) e.push('Horas, orçamento e máximo de ações não podem ser negativos.');
    if (!Number.isInteger(N.maxAcoes)) e.push('O máximo de ações simultâneas deve ser um número inteiro.');
  }
  if (!N.maturidade.every(isNum)) e.push('Responda os quatro itens de maturidade digital.');
  else if (N.maturidade.some(x => x < 0 || x > 3)) e.push('Maturidade digital vai de 0 a 3.');
  if (![N.riscoAlto, N.prontBaixa, N.prontAlta, N.presHoras].every(isNum)) e.push('Preencha os limites de risco, prontidão e preservação.');
  else {
    if (N.riscoAlto < 1 || N.riscoAlto > 3) e.push('O limite de risco alto deve ficar entre 1 e 3.');
    if (N.prontBaixa < 0) e.push('O limite de prontidão baixa não pode ser negativo.');
    if (N.prontAlta <= N.prontBaixa) e.push('O limite de prontidão alta deve ser maior que o de prontidão baixa.');
    if (N.prontAlta > 3) e.push('O limite de prontidão alta não pode passar de 3.');
    if (N.presHoras < 0) e.push('As horas de preservação não podem ser negativas.');
  }
  if (!isNum(N.maxAprendizes) || !Number.isInteger(N.maxAprendizes) || N.maxAprendizes < 1) e.push('Aprendizes por colega: número inteiro a partir de 1.');
  if (N.cultGrupo !== 'Sim' && N.cultGrupo !== 'Não') e.push('Indique se a preparação cultural é feita em grupo.');
  if (!isNum(N.cultHoraExtra) || N.cultHoraExtra < 0) e.push('Horas extras por pessoa na preparação em grupo: número a partir de 0.');
  for (const k of INTERV_CODES) {
    const it = N.intervencoes[k];
    if (![it.horas, it.semanas, it.custo].every(isNum)) { e.push(`Preencha horas, semanas e custo de “${it.nome}”.`); continue; }
    if (Math.min(it.horas, it.semanas, it.custo) < 0) e.push(`“${it.nome}” tem valor negativo.`);
    if (it.semanas < 1 || it.semanas > 12) e.push(`A duração de “${it.nome}” deve ficar entre 1 e 12 semanas.`);
  }
  return e;
}

// [v2-6] intervenções compatíveis para uma necessidade técnica (pessoa × competência).
// Prontidão moderada prefere ações acompanhadas; mentoria por IA só para prontidão alta e quem já usa IA (C01 ≥ 1).
// [v2-7] apoio externo é o último recurso: só quando nenhuma opção interna é compatível.
const ORDEM_EMPATE = ['PARES', 'RED', 'EXP', 'TUTOR'];
function escolherIntervencao(a, IV, semColega) {
  const W = semColega ? 0 : a.colegas.length, U = a.lacuna;
  const compat = [];
  if (W > 0) compat.push('PARES');
  if (a.automacao) compat.push('RED');
  if (U >= 2 || a.prontidao === 'Moderada') compat.push('EXP');
  if ((U === 1 || W === 0) && a.prontidao === 'Alta' && a.nivelIA >= 1) compat.push('TUTOR');
  if (!compat.length) return 'EXT';
  const min = Math.min(...compat.map(k => IV[k].custo));
  return ORDEM_EMPATE.find(k => compat.includes(k) && IV[k].custo === min);
}

// ---------- cálculo completo: Equipe, Tarefas, Diagnostico e Plano ----------
function compute(S) {
  const N = S.negocio;
  const negErros = validarNegocio(N);
  const negOK = negErros.length === 0;
  const matOK = N.maturidade.every(isNum);
  const matMedia = matOK ? N.maturidade.reduce((a, b) => a + b, 0) / 4 : null;          // Negocio!B19
  const teto = matOK ? (matMedia < 1 ? 1 : matMedia < 2 ? 2 : 3) : null;                 // Negocio!B20
  const IV = N.intervencoes;
  const idCount = (list, id) => list.filter(x => filled(x.id) && up(x.id) === up(id)).length;

  // Equipe!L (situação do cadastro)
  const equipe = S.equipe.map(p => {
    const vazio = ![p.id, p.nome, p.funcao, p.gestor, p.prontidao].some(filled) && !p.c.some(isNum);
    const erros = [];
    if (!vazio) {
      if (!filled(p.id)) erros.push('Informe o código.');
      else if (idCount(S.equipe, p.id) !== 1) erros.push('Código repetido.');
      if (!filled(p.nome)) erros.push('Informe o nome.');
      if (!filled(p.funcao)) erros.push('Informe a função.');
      if (p.gestor !== 'Sim' && p.gestor !== 'Não') erros.push('Indique se é gestor.');
      if (!PRONTIDOES.includes(p.prontidao)) erros.push('Indique a faixa de prontidão.');
      if (!p.c.every(isNum)) erros.push('Preencha as seis competências.');
      else if (p.c.some(x => x < 0 || x > 3)) erros.push('Competências vão de 0 a 3.');
    }
    return { ...p, vazio, erros, ok: !vazio && erros.length === 0 };
  });
  const pessoaOK = id => equipe.filter(p => p.ok && up(p.id) === up(id));

  // Tarefas!L:O (risco, classe inicial, classe final, situação)
  const tarefas = S.tarefas.map(t => {
    const vazio = ![t.id, t.nome, ...TASK_Q.map(k => t[k])].some(filled);
    const erros = [];
    if (!vazio) {
      if (!filled(t.id)) erros.push('Informe o código.');
      else if (idCount(S.tarefas, t.id) !== 1) erros.push('Código repetido.');
      if (!filled(t.nome)) erros.push('Descreva a tarefa.');
      if (TASK_Q.some(k => t[k] !== 'Sim' && t[k] !== 'Não')) erros.push('Responda Sim ou Não em todas as perguntas.');
    }
    const ok = !vazio && erros.length === 0;
    let risco = null, inicial = null, final = null;
    if (ok) {
      risco = (t.r1 === 'Sim' ? 1 : 0) + (t.r2 === 'Sim' ? 1 : 0) + (t.r3 === 'Não' ? 1 : 0);
      inicial = (t.q1 === 'Sim' || t.q2 === 'Sim') ? 'Humana'
        : (t.q3 === 'Sim' && t.q4 === 'Sim') ? 'Automação'
        : t.q5 === 'Sim' ? 'Colaboração' : 'Aumento';
      final = (inicial === 'Automação' && isNum(N.riscoAlto) && risco >= N.riscoAlto) ? 'Aumento' : inicial;
    }
    return { ...t, vazio, erros, ok, risco, inicial, final };
  });
  const tarefaOK = id => tarefas.filter(t => t.ok && up(t.id) === up(id));

  // Diagnostico!I:W — campos por diagnóstico
  const diags = S.diagnosticos.map(d => {
    const vazio = ![d.id, d.pessoa, d.tarefa, d.comp, d.andamento].some(filled) && !isNum(d.meta) && !isNum(d.crit);
    const erros = [];
    if (!vazio) {
      if (!filled(d.id)) erros.push('Informe o código.');
      else if (idCount(S.diagnosticos, d.id) !== 1) erros.push('Código repetido.');
      if (!filled(d.pessoa)) erros.push('Escolha a pessoa.');
      else if (pessoaOK(d.pessoa).length !== 1) erros.push('Pessoa inexistente ou com cadastro incompleto.');
      if (!filled(d.tarefa)) erros.push('Escolha a tarefa.');
      else if (tarefaOK(d.tarefa).length !== 1) erros.push('Tarefa inexistente ou incompleta.');
      if (!COMPS.some(c => c[0] === d.comp)) erros.push('Escolha a competência.');
      if (!isNum(d.meta) || d.meta < 0 || d.meta > 3) erros.push('Meta futura de 0 a 3.');
      if (!isNum(d.crit) || d.crit < 1 || d.crit > 3) erros.push('Criticidade de 1 a 3.');
      if (!ANDAMENTOS.includes(d.andamento)) erros.push('Escolha o andamento.');
      if (filled(d.pessoa) && filled(d.tarefa) && filled(d.comp) &&
        S.diagnosticos.filter(x => up(x.pessoa) === up(d.pessoa) && up(x.tarefa) === up(d.tarefa) && x.comp === d.comp).length !== 1)
        erros.push('Combinação pessoa + tarefa + competência repetida.');
      if (!negOK) erros.push('Corrija os parâmetros do Negócio.');
    }
    const ok = !vazio && erros.length === 0;
    const r = { ...d, vazio, erros, ok, X: '', nec: '' };
    if (!ok) { r.justificativa = vazio ? '' : 'Corrigir os campos de entrada'; return r; }

    const p = pessoaOK(d.pessoa)[0], t = tarefaOK(d.tarefa)[0];
    const ci = COMPS.findIndex(c => c[0] === d.comp);
    Object.assign(r, {
      pessoaId: p.id, pessoaNome: p.nome, gestor: p.gestor, tarefaNome: t.nome, compNome: COMPS[ci][1], ci,
      classe: t.final, risco: t.risco, prontidao: p.prontidao, nivel: p.c[ci], teto,
      ativa: t.ativa === 'Sim'
    });
    r.metaCiclo = Math.min(d.meta, teto);                       // S
    r.lacunaFutura = Math.max(0, d.meta - r.nivel);             // T
    r.lacunaCiclo = Math.max(0, r.metaCiclo - r.nivel);         // U
    r.prioridade = r.lacunaCiclo * d.crit;                      // V
    r.colegas = equipe.filter(o => o.ok && up(o.id) !== up(d.pessoa) && o.prontidao !== 'Baixa' && o.c[ci] === 3); // W
    r.preservacao = (r.classe !== 'Humana' && r.risco >= N.riscoAlto) ? 'Registrar e praticar sem IA' : '';       // Z
    r.bloqueadoMat = r.metaCiclo < d.meta && r.lacunaCiclo === 0 && r.lacunaFutura > 0;  // [v2-8] só o teto impede a ação
    r.relevante = !(r.classe === 'Humana' || !r.ativa || d.andamento === 'Concluída');
    // Necessidade do diagnóstico. [v2-2] prontidão baixa só gera preparação quando há lacuna;
    // sem lacuna e com risco alto, a ação é preservação.
    if (r.relevante) {
      if (r.lacunaCiclo > 0) r.nec = p.prontidao === 'Baixa' ? 'CULT' : 'TEC';
      else if (r.preservacao) r.nec = 'PRES';
    }
    return r;
  });

  // ---------- [v2-1] ações agrupadas ----------
  const acoes = [];
  const validos = diags.filter(d => d.ok);
  const porId = id => S.equipe.find(p => up(p.id) === up(id));
  const ordemDiag = (a, b) => cmpId(a.id, b.id);

  // Treino técnico: uma ação por pessoa × competência (as tarefas viram contexto de prática)
  const grupos = new Map();
  for (const d of validos.filter(d => d.nec === 'TEC').sort(ordemDiag)) {
    const k = up(d.pessoaId) + '|' + d.comp;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(d);
  }
  for (const ds of grupos.values()) {
    const f = ds[0], p = equipe.find(o => up(o.id) === up(f.pessoaId));
    const a = {
      tipo: 'TEC', id: f.id, ids: ds.map(d => d.id), pessoa: f.pessoaId, pessoas: [f.pessoaId], pessoaNome: f.pessoaNome,
      gestor: f.gestor === 'Sim', comp: f.comp, compNome: f.compNome, tarefaNome: ds.map(d => d.tarefaNome).join(' · '),
      lacuna: Math.max(...ds.map(d => d.lacunaCiclo)), crit: Math.max(...ds.map(d => d.crit)),
      prioridade: Math.max(...ds.map(d => d.prioridade)), risco: Math.max(...ds.map(d => d.risco)),
      preservacao: ds.some(d => d.preservacao) ? 'Registrar e praticar sem IA' : '',
      automacao: ds.some(d => d.classe === 'Automação'), colegas: f.colegas, prontidao: p.prontidao, nivelIA: p.c[0],
      metaGradual: ds.some(d => d.metaCiclo < d.meta),
      andamento: ds.some(d => d.andamento === 'Em andamento') ? 'Em andamento' : 'Não iniciada'
    };
    a.X = escolherIntervencao(a, IV, false);
    if (a.X === 'PARES') a.alternativa = escolherIntervencao(a, IV, true);
    acoes.push(a);
  }

  // [v2-1][v2-10] Preparação cultural: uma por pessoa; em grupo quando houver duas ou mais
  const aguardando = [];
  const precisaPrep = new Map();
  for (const d of validos.filter(d => d.nec === 'CULT').sort(ordemDiag)) {
    const k = up(d.pessoaId);
    if (!precisaPrep.has(k)) precisaPrep.set(k, []);
    precisaPrep.get(k).push(d);
  }
  const prepFeita = [], prepFazer = [];
  for (const [k, ds] of precisaPrep) (porId(k).prep === 'Concluída' ? prepFeita : prepFazer).push(ds);
  // [v2-4] preparação concluída e prontidão ainda baixa: aguardar a reaplicação da autoavaliação
  for (const ds of prepFeita) aguardando.push({ pessoa: ds[0].pessoaId, pessoaNome: ds[0].pessoaNome, ids: ds.map(d => d.id) });
  const montarPrep = lista => {
    const ds = lista.flat(), membros = lista.map(l => l[0].pessoaId);
    const facilitadores = equipe.filter(o => o.ok && o.prontidao !== 'Baixa' && !membros.some(m => up(m) === up(o.id)));
    const n = membros.length;
    acoes.push({
      tipo: 'CULT', X: 'CULT', id: ds.map(d => d.id).sort(cmpId)[0], ids: ds.map(d => d.id).sort(cmpId), pessoa: n === 1 ? membros[0] : '', pessoas: membros,
      pessoaNome: lista.map(l => l[0].pessoaNome).join(', '), gestor: ds.some(d => d.gestor === 'Sim'), comp: null, compNome: '',
      tarefaNome: [...new Set(ds.map(d => d.tarefaNome))].join(' · '), prioridade: Math.max(...ds.map(d => d.prioridade)),
      risco: Math.max(...ds.map(d => d.risco)), preservacao: ds.some(d => d.preservacao) ? 'Registrar e praticar sem IA' : '',
      grupo: n > 1, horasExtra: (n - 1) * N.cultHoraExtra, colegas: facilitadores, apoioExterno: facilitadores.length === 0,
      andamento: membros.some(m => porId(m).prep === 'Em andamento') ? 'Em andamento' : 'Não iniciada'
    });
  };
  if (prepFazer.length) {
    if (N.cultGrupo === 'Sim') montarPrep(prepFazer);
    else prepFazer.forEach(l => montarPrep([l]));
  }

  // Preservação sem lacuna: uma por pessoa
  const pres = new Map();
  for (const d of validos.filter(d => d.nec === 'PRES').sort(ordemDiag)) {
    const k = up(d.pessoaId);
    if (!pres.has(k)) pres.set(k, []);
    pres.get(k).push(d);
  }
  for (const ds of pres.values()) {
    const f = ds[0];
    acoes.push({
      tipo: 'PRES', X: 'PRES', id: f.id, ids: ds.map(d => d.id), pessoa: f.pessoaId, pessoas: [f.pessoaId], pessoaNome: f.pessoaNome,
      gestor: f.gestor === 'Sim', comp: f.comp, compNome: f.compNome, tarefaNome: [...new Set(ds.map(d => d.tarefaNome))].join(' · '),
      prioridade: Math.max(...ds.map(d => d.crit)),   // [v2-5] prioridade pela criticidade, não zero
      risco: Math.max(...ds.map(d => d.risco)), preservacao: 'Registrar e praticar sem IA', colegas: [],
      andamento: ds.some(d => d.andamento === 'Em andamento') ? 'Em andamento' : 'Não iniciada'
    });
  }

  // [v2-8] Maturidade digital: ação da loja quando o teto bloqueia alguém por completo (lacuna do ciclo 0,
  // lacuna futura > 0) ou quando o teto é 1 (loja sem base digital)
  const limitados = validos.filter(d => d.relevante && d.metaCiclo < d.meta && (d.bloqueadoMat || teto === 1));
  const focoMat = matOK ? MATURIDADE_ITENS.filter((_, i) => N.maturidade[i] === Math.min(...N.maturidade)) : [];
  if (matOK && teto < 3 && limitados.length && N.matAndamento !== 'Concluída') {
    const gestor = equipe.find(p => p.ok && p.gestor === 'Sim');
    acoes.push({
      tipo: 'MAT', X: 'MAT', id: limitados.map(d => d.id).sort(cmpId)[0], ids: [], pessoa: gestor ? gestor.id : '', pessoas: gestor ? [gestor.id] : [],
      pessoaNome: 'Loja' + (gestor ? ' (' + gestor.nome + ')' : ''), gestor: true, comp: null, compNome: '', tarefaNome: focoMat.join(' · '),
      prioridade: Math.min(9, Math.max(...limitados.map(d => (d.meta - d.metaCiclo) * d.crit))), risco: 0, preservacao: '', colegas: [],
      foco: focoMat, andamento: N.matAndamento === 'Em andamento' ? 'Em andamento' : 'Não iniciada'
    });
  }

  const aplicarIV = a => {
    const iv = IV[a.X];
    a.intervencao = iv.nome;
    a.horas = iv.horas + (a.horasExtra || 0) + (a.preservacao && a.X !== 'PRES' ? N.presHoras : 0) + (a.X === 'PRES' ? N.presHoras : 0);
    a.semanas = Math.max(iv.semanas, a.preservacao ? 4 : 0);
    a.custo = iv.custo;
  };
  acoes.forEach(aplicarIV);

  // [v2-3] Ordem: prioridade; preparação cultural só desempata; depois gestor, risco, custo e código
  acoes.sort((a, b) => b.prioridade - a.prioridade || (b.X === 'CULT') - (a.X === 'CULT') || b.gestor - a.gestor
    || b.risco - a.risco || a.custo - b.custo || cmpId(a.id, b.id));

  // Plano: admissão sequencial por horas, orçamento, vagas e carga dos colegas
  let usoH = 0, usoC = 0, usoN = 0;
  const pagos = new Set(), carga = {};
  const plano = acoes.map((a, i) => {
    // [v2-9] colega com menor carga; se todos estão no limite, usa a intervenção alternativa
    if (a.X === 'PARES') {
      const livre = a.colegas.filter(c => (carga[up(c.id)] || 0) < N.maxAprendizes)
        .sort((x, y) => (carga[up(x.id)] || 0) - (carga[up(y.id)] || 0) || cmpId(x.id, y.id))[0];
      if (livre) a.colega = livre;
      else { a.trocaColega = `Colegas aptos já com ${N.maxAprendizes} aprendizes`; a.X = a.alternativa; aplicarIV(a); }
    }
    const custoEf = IV[a.X].compartilhado && pagos.has(a.X) ? 0 : a.custo;   // [v2-12]
    const consomeVaga = a.X !== 'PRES';                                         // [v2-5]
    const cabeH = usoH + a.horas <= N.horas + EPS;
    const cabeC = usoC + custoEf <= N.orcamento + EPS;
    const cabeN = !consomeVaga || usoN < N.maxAcoes;
    const admitida = negOK && cabeH && cabeC && cabeN;
    a.justificativa = justificar(a);
    const motivo = admitida ? a.justificativa
      : !cabeH ? 'Horas semanais insuficientes' : !cabeC ? 'Orçamento insuficiente' : 'Limite de ações simultâneas';
    if (admitida) {
      usoH += a.horas; usoC += custoEf; if (consomeVaga) usoN++;
      if (IV[a.X].compartilhado) pagos.add(a.X);
      if (a.X === 'PARES') carga[up(a.colega.id)] = (carga[up(a.colega.id)] || 0) + 1;
    }
    a.custoEfetivo = custoEf;
    const prazo = !admitida ? 'Próximo ciclo' : a.X === 'CULT' ? 'Preparação cultural' : a.semanas <= 4 ? '0-30 dias' : '31-90 dias';
    return { ordem: i + 1, d: a, admitida, motivo, prazo, saldo: (N.horas || 0) - usoH };
  });

  function justificar(a) {
    if (a.X === 'CULT') return a.apoioExterno ? 'Sem colega com prontidão moderada ou alta: preparação com apoio externo'
      : a.grupo ? 'Conversa em grupo; reaplicar a autoavaliação antes do treino' : 'Preparar e reaplicar prontidão antes do treino';
    if (a.X === 'PRES') return 'Preservar competência mesmo sem lacuna';
    if (a.X === 'MAT') return 'Elevar a maturidade digital (foco: ' + a.foco.join(', ') + ')';
    if (a.X === 'EXT') return 'Sem colega apto na loja: buscar apoio externo (fornecedor, curso, Sebrae)';
    if (a.X === 'PARES') return a.colega ? 'Combinar agenda com ' + a.colega.nome : 'Escolher colega nível 3 e combinar agenda';
    if (a.metaGradual) return 'Meta gradual limitada pela maturidade';
    return 'Desenvolver a lacuna com recursos existentes';
  }

  // devolve a ação de cada diagnóstico (para a tela de Diagnóstico)
  for (const d of diags.filter(d => d.ok)) {
    const a = acoes.find(x => x.ids.includes(d.id));
    if (a) Object.assign(d, { X: a.X, acao: a.id, intervencao: a.intervencao, horas: a.horas, semanas: a.semanas, custo: a.custo });
    d.justificativa = d.andamento === 'Concluída' ? 'Atualizar nível e evidência na reavaliação'
      : !d.ativa ? 'Tarefa inativa'
      : d.classe === 'Humana' ? 'Manter responsabilidade humana'
      : a ? a.justificativa + (a.ids.length > 1 ? ` (ação ${a.id}, junto com ${a.ids.filter(x => x !== d.id).join(', ')})` : '')
      : d.nec === 'CULT' ? 'Aguardando reavaliação da prontidão'
      : d.bloqueadoMat ? `Bloqueado pela maturidade digital (lacuna futura ${d.lacunaFutura})`
      : 'Sem lacuna no ciclo';
  }

  const pend = {
    negocio: negErros.length,
    equipe: equipe.filter(p => !p.vazio && !p.ok).length,
    tarefas: tarefas.filter(t => !t.vazio && !t.ok).length,
    diagnosticos: diags.filter(d => !d.vazio && !d.ok).length
  };
  const temPend = pend.negocio + pend.equipe + pend.tarefas + pend.diagnosticos > 0;
  const noCiclo = plano.filter(x => x.admitida).length;
  const adiadas = plano.length - noCiclo;

  // [v2-7] pontos de atenção
  const alertas = [];
  for (const p of plano.filter(p => p.d.X === 'CULT' && p.d.apoioExterno))
    alertas.push(`Preparação cultural de ${p.d.pessoaNome}: não há colega com prontidão moderada ou alta para conduzir; buscar apoio externo.`);
  const ext = plano.filter(p => p.d.X === 'EXT');
  if (ext.length) alertas.push(`Apoio externo necessário para ${ext.map(p => p.d.pessoaNome).join(', ')}: ninguém na loja tem nível 3 e a mentoria por IA não é indicada.`);
  if (aguardando.length) alertas.push(`Reaplicar a autoavaliação de ${aguardando.map(a => a.pessoaNome).join(', ')}: preparação cultural concluída.`);

  const soPres = plano.length > 0 && plano.every(p => p.d.X === 'PRES');
  const situacao = temPend ? { tipo: 'erro', texto: 'Há entradas pendentes: corrija os campos sinalizados antes de usar o plano.' }   // Plano!A7
    : plano.length === 0 ? { tipo: 'aviso', texto: aguardando.length ? alertas[alertas.length - 1] : 'Sem ações: confira tarefas ativas, lacunas, risco e ações concluídas.' }
    : N.horas === 0 ? { tipo: 'aviso', texto: 'Sem horas disponíveis: negociar tempo para capacitação.' }
    : adiadas > 0 ? { tipo: 'aviso', texto: 'Há ações adiadas: confira horas, orçamento e limite simultâneo.' }
    : alertas.length ? { tipo: 'aviso', texto: 'Plano calculado, com pontos de atenção: ' + alertas.join(' ') }
    : soPres ? { tipo: 'ok', texto: 'Equipe sem lacunas no ciclo: manter a preservação nas tarefas de risco alto.' }
    : { tipo: 'ok', texto: 'Plano calculado. Confirmar agenda e participação com a equipe.' };

  return {
    negErros, negOK, matMedia, teto, reavaliacao: addDays(N.dataBase, 90),
    equipe, tarefas, diags, plano, pend, situacao, alertas, aguardando,
    resumo: { noCiclo, adiadas, horas: usoH, custo: usoC, vagas: usoN, necessarias: plano.length }
  };
}

// [v2-4] registrar andamento de uma ação do plano (usado pela tela e pelos testes)
function concluirAcao(S, a, valor) {
  if (a.X === 'CULT') a.pessoas.forEach(id => { const p = S.equipe.find(x => up(x.id) === up(id)); if (p) p.prep = valor === 'Não iniciada' ? '' : valor; });
  else if (a.X === 'MAT') S.negocio.matAndamento = valor;
  else S.diagnosticos.filter(d => a.ids.includes(d.id)).forEach(d => d.andamento = valor);
}
// [v2-4] nova autoavaliação reabre o ciclo de preparação da pessoa
function aplicarAutoavaliacao(p, res) {
  p.prontidao = res.prontidao;
  p.c = COMPS.map(c => res.competencias[c[0]]);
  p.prep = '';
}

// ---------- autoavaliação do colaborador ----------
const PERGUNTAS = [
  'Consigo aprender a usar uma ferramenta de IA com orientação.',
  'Consigo reconhecer quando preciso de ajuda ao usar IA.',
  'Minha liderança oferece apoio para aprender novas formas de trabalho.',
  'Tenho espaço para conversar sobre dúvidas e dificuldades com a mudança.',
  'A possibilidade de usar IA no trabalho me deixa ansioso(a).',
  'O medo de errar com IA me impede de experimentar novas tarefas.',
  'Estou disposto(a) a testar novas formas de realizar minhas tarefas.',
  'Estou disposto(a) a aprender com colegas e compartilhar o que aprendo.'
];
function calcularAutoavaliacao(id, skills, answers, low = 1, high = 2, simulated = false) {
  if (!String(id).trim() || skills.length !== 6 || answers.length !== 8) throw new Error('Preencha o código, as 6 competências e as 8 perguntas.');
  if (![...skills, ...answers].every(x => Number.isInteger(x) && x >= 0 && x <= 3)) throw new Error('Cada resposta deve ser um número inteiro entre 0 e 3.');
  if (!Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high > 3 || high <= low) throw new Error('Os limites devem satisfazer 0 ≤ baixa < alta ≤ 3.');
  const avg = answers.reduce((s, x, i) => s + ([4, 5].includes(i) ? 3 - x : x), 0) / 8;   // itens 5 e 6 invertidos
  let band = avg < low ? 'Baixa' : avg < high ? 'Moderada' : 'Alta';
  // [v2-11] medo e ansiedade no máximo: faixa baixa; um dos dois no máximo: no máximo moderada
  if (answers[4] === 3 && answers[5] === 3) band = 'Baixa';
  else if ((answers[4] === 3 || answers[5] === 3) && band === 'Alta') band = 'Moderada';
  const alertas = answers.every(x => x === answers[0]) ? ['Todas as respostas de prontidão iguais: confirmar a faixa em conversa.'] : [];
  return {
    versao: '2.0', codigo: String(id).trim(), origem: simulated ? 'Demonstração simulada' : 'Autoavaliação individual',
    prontidao: band, competencias: Object.fromEntries(COMPS.map((c, i) => [c[0], skills[i]])),
    limites: { baixa_menor_que: low, alta_a_partir_de: high }, alertas
  };
}
