// estado.js
// Guarda os dados do gerente no navegador, abre e salva cópias de segurança
// e resume o andamento de cada etapa para a tela de Início.

const STORE_KEY = 'matriz-transicao-ia:v1';
let S, R, current = 'inicio';
let armazenamentoOK = true;

function exemploMarcado() { const s = exemploAurora(); s.exemplo = true; s.cenario = null; return s; }
function vazioMarcado() { const s = estadoVazio(); s.exemplo = false; s.cenario = null; return s; }

// ---------- cenários (.json) ----------
// Formato: { formato: 'cenario-matriz-transicao-ia', id, titulo, descricao, o_que_observar: [...], dados: { negocio, equipe, tarefas, diagnosticos } }.
// Os campos omitidos em "dados" recebem os valores padrão (ver cenarios/LEIA-ME.txt).
const FORMATO_CENARIO = 'cenario-matriz-transicao-ia';
const texto200 = (v, n = 400) => String(v ?? '').slice(0, n);
function lerCenario(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('Arquivo não reconhecido como cenário: o conteúdo não é um objeto JSON.');
  if (obj.formato !== FORMATO_CENARIO) {
    if (obj.negocio) return { meta: null, dados: obj };   // cópia salva comum também é aceita
    throw new Error(`Arquivo não reconhecido como cenário: falta "formato": "${FORMATO_CENARIO}" e o bloco "dados".`);
  }
  if (!obj.dados || typeof obj.dados !== 'object' || !obj.dados.negocio) throw new Error('Cenário incompleto: falta "dados" com "negocio".');
  for (const k of ['equipe', 'tarefas', 'diagnosticos']) if (obj.dados[k] !== undefined && !Array.isArray(obj.dados[k])) throw new Error(`Cenário inválido: "dados.${k}" deve ser uma lista.`);
  const meta = { id: texto200(obj.id, 20), titulo: texto200(obj.titulo, 160) || 'Cenário sem título', descricao: texto200(obj.descricao, 1200),
    o_que_observar: (Array.isArray(obj.o_que_observar) ? obj.o_que_observar : []).slice(0, 20).map(x => texto200(x)) };
  return { meta, dados: obj.dados };
}
function importarCenario() {
  abrirArquivo('.json,application/json', (txt, nome) => {
    let json, c, s;
    try { json = JSON.parse(txt); } catch (e) { throw new Error(`“${nome}” não é um JSON válido.`); }
    c = lerCenario(json);
    s = normalizar({ ...c.dados, exemplo: false, cenario: c.meta });
    const titulo = c.meta ? `${c.meta.id ? c.meta.id + ' · ' : ''}${c.meta.titulo}` : (s.negocio.loja || nome);
    if (!confirm(`Substituir os dados atuais pelo cenário “${titulo}”?\n\nSalve uma cópia datada antes, se precisar.`)) return;
    S = s; update(); mostrar('inicio');
    const R0 = R; toast(`Cenário carregado: ${titulo}. ${R0.pend.negocio + R0.pend.equipe + R0.pend.tarefas + R0.pend.diagnosticos ? 'Há entradas a corrigir.' : 'Plano calculado.'}`);
  });
}

function normalizar(s) {
  const base = exemploAurora();
  if (s && s.formato === FORMATO_CENARIO) { const c = lerCenario(s); s = { ...c.dados, exemplo: false, cenario: c.meta }; }
  if (!s || typeof s !== 'object' || !s.negocio) throw new Error('Arquivo não reconhecido como cópia da matriz.');
  const N = Object.assign({}, base.negocio, s.negocio);
  N.maturidade = [0, 1, 2, 3].map(i => isNum(s.negocio.maturidade?.[i]) ? s.negocio.maturidade[i] : null);
  N.intervencoes = {};
  for (const k of INTERV_CODES) {
    N.intervencoes[k] = Object.assign({}, base.negocio.intervencoes[k], s.negocio.intervencoes?.[k] || {});
    N.intervencoes[k].compartilhado = N.intervencoes[k].compartilhado === true;
  }
  return {
    versao: '2.0', exemplo: !!s.exemplo, cenario: s.cenario && typeof s.cenario === 'object' ? s.cenario : null, negocio: N,
    equipe: (s.equipe || []).map(p => ({ id: p.id ?? '', nome: p.nome ?? '', funcao: p.funcao ?? '', gestor: p.gestor ?? '', prontidao: p.prontidao ?? '',
      c: [0, 1, 2, 3, 4, 5].map(i => isNum(p.c?.[i]) ? p.c[i] : null), obs: p.obs ?? '', prep: p.prep ?? '' })),
    tarefas: (s.tarefas || []).map(t => { const o = { id: t.id ?? '', nome: t.nome ?? '' }; TASK_Q.forEach(k => o[k] = t[k] ?? ''); return o; }),
    diagnosticos: (s.diagnosticos || []).map(d => ({ id: d.id ?? '', pessoa: d.pessoa ?? '', tarefa: d.tarefa ?? '', comp: d.comp ?? '',
      meta: isNum(d.meta) ? d.meta : null, crit: isNum(d.crit) ? d.crit : null, andamento: d.andamento || 'Não iniciada', evidencia: d.evidencia ?? '' }))
  };
}
function carregar() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return normalizar(JSON.parse(raw)); } catch (e) { armazenamentoOK = false; }
  return exemploMarcado();
}
function salvar() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); armazenamentoOK = true; } catch (e) { armazenamentoOK = false; }
}
function update() { R = compute(S); salvar(); refresh(); }

// Códigos internos (o gerente nunca precisa vê-los)
function novoId(prefixo, lista) {
  let n = 0;
  for (const x of lista) { const m = new RegExp('^' + prefixo + '(\\d+)$', 'i').exec(x.id || ''); if (m) n = Math.max(n, +m[1]); }
  return prefixo + String(n + 1).padStart(2, '0');
}
const pessoaPorId = id => S.equipe.find(p => up(p.id) === up(id));
const tarefaPorId = id => S.tarefas.find(t => up(t.id) === up(id));
const calcPessoa = id => R.equipe.find(p => up(p.id) === up(id));
const questionarioFeito = p => PRONTIDOES.includes(p.prontidao) && p.c.every(isNum);

// ---------- cópia de segurança ----------
function guardarCopia() {
  baixar(`Copia_Matriz_${nomeArquivo(S.negocio.loja || 'loja')}_${hoje()}.json`, JSON.stringify({ ...S, salvoEm: new Date().toISOString() }, null, 2), 'application/json;charset=utf-8');
  toast('Cópia baixada. Guarde-a antes da reavaliação.');
}
function abrirCopia() {
  abrirArquivo('.json,application/json', txt => {
    let s;
    try { s = normalizar(JSON.parse(txt)); } catch (e) { throw new Error('Arquivo não reconhecido como cópia da matriz.'); }
    if (!confirm('Substituir os dados atuais pela cópia selecionada?')) return;
    S = s; update(); mostrar('inicio'); toast('Cópia aberta.');
  });
}

// ---------- andamento das etapas (Início e menu) ----------
function etapas() {
  const N = S.negocio;
  const pessoasFalta = R.equipe.filter(p => !p.vazio && !p.ok);
  const tarefasFalta = R.tarefas.filter(t => !t.vazio && !t.ok);
  const aprFalta = R.diags.filter(d => !d.vazio && !d.ok);
  const lojaOk = R.negOK && !!String(N.loja).trim();
  const e = {
    loja: { feito: lojaOk, erro: !lojaOk,
      estado: lojaOk ? `${fmtH(N.horas)}/semana, orçamento ${fmtR(N.orcamento)}, até ${N.maxAcoes} ações simultâneas` : !String(N.loja).trim() ? 'Informe o nome da loja' : 'Corrigir parâmetros' },
    equipe: { feito: S.equipe.length > 0 && !pessoasFalta.length, erro: pessoasFalta.length > 0,
      estado: !S.equipe.length ? 'Nenhuma pessoa cadastrada'
        : pessoasFalta.length ? `Corrigir cadastro: ${pessoasFalta.map(p => p.nome || 'sem nome').join(', ')}` : `${plural(S.equipe.length, 'pessoa', 'pessoas')}, cadastro OK` },
    tarefas: { feito: S.tarefas.length > 0 && !tarefasFalta.length, erro: tarefasFalta.length > 0,
      estado: !S.tarefas.length ? 'Nenhuma tarefa cadastrada' : tarefasFalta.length ? `Corrigir tarefa: ${plural(tarefasFalta.length, 'tarefa', 'tarefas')}` : `${plural(S.tarefas.length, 'tarefa', 'tarefas')}, classificação OK` },
    aprender: { feito: S.diagnosticos.length > 0 && !aprFalta.length, erro: aprFalta.length > 0,
      estado: !S.diagnosticos.length ? 'Nenhum diagnóstico' : aprFalta.length ? `Corrigir entrada: ${plural(aprFalta.length, 'diagnóstico', 'diagnósticos')}` : `${plural(S.diagnosticos.length, 'diagnóstico', 'diagnósticos')}, entradas OK` }
  };
  e.plano = { feito: false, erro: false, estado: R.plano.length ? `${R.resumo.noCiclo} de ${R.resumo.necessarias} ações no ciclo, ${R.resumo.adiadas} no próximo ciclo` : 'Sem ações: preencha o Diagnóstico' };
  return e;
}
function proximaEtapa() {
  const e = etapas();
  return ['loja', 'equipe', 'tarefas', 'aprender'].find(k => !e[k].feito) || 'plano';
}
