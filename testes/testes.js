// testes.js: verificações do motor (assets/js/motor.js), versão 2 das regras.
// Os valores esperados foram calculados à mão a partir das regras do Guia (v2). Mudanças marcadas [v2-n].
const resultados = [];
const t = (n, obtido, esperado) => resultados.push({ n, obtido, esperado, ok: JSON.stringify(obtido) === JSON.stringify(esperado) });
const D = (r, id) => r.diags.find(d => d.id === id);
const A = (r, id) => r.plano.find(p => p.d.ids.includes(id));
let s = exemploAurora(), r = compute(s);

// Caso Mercado Aurora
t('Teto de maturidade', r.teto, 2);
t('T01: automação de risco alto vira aumento', r.tarefas[0].final, 'Aumento');
t('T02: automação de risco alto vira aumento', r.tarefas[1].final, 'Aumento');
t('T05: atendimento sensível permanece humano', r.tarefas[4].final, 'Humana');
t('D02: prontidão baixa com lacuna gera preparação cultural', D(r, 'D02').X, 'CULT');
t('D03: estoque com colega apto gera pares', D(r, 'D03').X, 'PARES');
t('D03: colega designado é Diego', A(r, 'D03').d.colega.nome, 'Diego');
t('D08: preservação mesmo sem lacuna', D(r, 'D08').X, 'PRES');
t('Ordem do plano (prioridade; gestora vence empate; código numérico)', r.plano.map(p => p.d.id), ['D02', 'D01', 'D06', 'D03', 'D08', 'D04', 'D05']);
t('Prioridade máxima do caso', A(r, 'D02').d.prioridade, 6);
t('[v2-5] Preservação tem prioridade igual à criticidade', A(r, 'D08').d.prioridade, 3);
t('Ações admitidas no caso', r.resumo.noCiclo, 4);
t('[v2-5] Vagas usadas (preservação não ocupa vaga)', r.resumo.vagas, 3);
t('Horas admitidas no caso', r.resumo.horas, 3);
t('Ações adiadas no caso', r.resumo.adiadas, 3);
t('Motivos e próximas etapas', r.plano.map(p => p.motivo), ['Preparar e reaplicar prontidão antes do treino', 'Meta gradual limitada pela maturidade', 'Desenvolver a lacuna com recursos existentes', 'Horas semanais insuficientes', 'Preservar competência mesmo sem lacuna', 'Horas semanais insuficientes', 'Horas semanais insuficientes']);
t('Prazos', r.plano.map(p => p.prazo), ['Preparação cultural', '0-30 dias', '0-30 dias', 'Próximo ciclo', '0-30 dias', 'Próximo ciclo', 'Próximo ciclo']);
t('Saldo de horas por linha', r.plano.map(p => p.saldo), [1.5, 1, 0.5, 0.5, 0, 0, 0]);
t('Reavaliação em 90 dias', r.reavaliacao, '2026-12-21');
t('Mensagem de situação', r.situacao.texto, 'Há ações adiadas: confira horas, orçamento e limite simultâneo.');
t('Sem ação de maturidade no Aurora (ninguém bloqueado pelo teto)', r.plano.some(p => p.d.X === 'MAT'), false);

// Cenários de estresse
s = exemploAurora(); s.negocio.horas = 0; r = compute(s);
t('Zero horas adia todas as ações', r.resumo.noCiclo, 0);
t('Zero horas não vira ausência de necessidade', r.resumo.necessarias, 7);
t('Zero horas: mensagem específica', r.situacao.texto, 'Sem horas disponíveis: negociar tempo para capacitação.');
s = exemploAurora(); s.negocio.horas = 6; r = compute(s);
t('Limite simultâneo permanece ativo (3 vagas + preservação)', [r.resumo.vagas, r.resumo.noCiclo], [3, 4]);
s.negocio.maxAcoes = 8; r = compute(s);
t('Ampliação de tempo admite mais ações', r.resumo.noCiclo, 7);
s = exemploAurora(); s.negocio.intervencoes.CULT.custo = 100; r = compute(s);
t('Orçamento impede preparação de custo superior', r.plano[0].motivo, 'Orçamento insuficiente');
s = exemploAurora(); s.equipe[1].prontidao = 'Alta'; r = compute(s);
t('Mudança de prontidão remove preparação (C01 = 0: sem mentoria por IA)', D(r, 'D02').X, 'EXP');
s = exemploAurora(); s.equipe[3].c[2] = 2; r = compute(s);
t('[v2-6] Sem colega nível 3 e prontidão moderada: experimentação, não mentoria', D(r, 'D03').X, 'EXP');
s = exemploAurora(); s.negocio.intervencoes.PARES.custo = 50; r = compute(s);
t('Menor custo altera a intervenção compatível', D(r, 'D03').X, 'EXP');
s = exemploAurora(); s.equipe[2].c[2] = 2; r = compute(s);
t('Competência elevada fecha lacuna do ciclo', D(r, 'D03').lacunaCiclo, 0);
t('Meta futura permanece visível', D(r, 'D03').lacunaFutura, 1);

// Validações de entrada
s = exemploAurora(); s.equipe[0].c[0] = null; r = compute(s);
t('Campo vazio não vira nível zero', r.equipe[0].ok, false);
t('Diagnóstico bloqueia cadastro incompleto', D(r, 'D01').ok, false);
s = exemploAurora(); s.equipe[1].id = 'E01'; r = compute(s);
t('Pessoa duplicada sinalizada', r.equipe[1].ok, false);
s = exemploAurora(); s.diagnosticos[0].pessoa = 'E99'; r = compute(s);
t('Código inexistente bloqueado', D(r, 'D01').ok, false);
s = exemploAurora(); s.diagnosticos[2].andamento = 'Concluída'; r = compute(s);
t('Concluída sai da fila', r.plano.filter(p => p.d.ids.includes('D03')).length, 0);
s = exemploAurora(); s.tarefas.forEach(x => x.ativa = 'Não'); r = compute(s);
t('Sem tarefas ativas gera plano vazio', r.plano.length, 0);
s = exemploAurora(); s.negocio.maturidade[0] = null; r = compute(s);
t('Maturidade incompleta fica pendente', r.teto, null);
t('Maturidade incompleta bloqueia parâmetros', r.negOK, false);
s = exemploAurora(); s.negocio.maxAprendizes = 0; r = compute(s);
t('Aprendizes por colega precisa ser ≥ 1', r.negOK, false);
s = exemploAurora(); s.diagnosticos.push({ id: 'D09', pessoa: 'E04', tarefa: 'T06', comp: 'C02', meta: 3, crit: 2, andamento: 'Não iniciada', evidencia: '' }); r = compute(s);
t('Nova linha calcula sem configuração extra', D(r, 'D09').ok, true);
t('Meta futura da nova linha', D(r, 'D09').lacunaFutura, 1);

// [v2-1] agrupamento
s = exemploAurora(); s.equipe[1].prontidao = 'Moderada'; s.diagnosticos.push({ id: 'D09', pessoa: 'E02', tarefa: 'T02', comp: 'C01', meta: 2, crit: 2, andamento: 'Não iniciada', evidencia: '' }); r = compute(s);
t('[v2-1] Mesma competência em 2 tarefas vira uma ação', A(r, 'D02').d.ids, ['D02', 'D09']);
s = exemploAurora(); s.diagnosticos.push({ id: 'D09', pessoa: 'E02', tarefa: 'T03', comp: 'C05', meta: 2, crit: 2, andamento: 'Não iniciada', evidencia: '' }); r = compute(s);
t('[v2-1] Uma preparação cultural por pessoa, mesmo com 2 diagnósticos', r.plano.filter(p => p.d.X === 'CULT').map(p => p.d.ids), [['D02', 'D09']]);
// [v2-10] grupo
s = exemploAurora(); s.equipe[2].prontidao = 'Baixa'; r = compute(s);
t('[v2-10] Duas pessoas com prontidão baixa: uma preparação em grupo', r.plano.filter(p => p.d.X === 'CULT').map(p => p.d.pessoas), [['E02', 'E03']]);
t('[v2-10] Horas do grupo: 1 + 0,25 por pessoa extra + 0,5 de preservação', A(r, 'D02').d.horas, 1.75);
s.negocio.cultGrupo = 'Não'; r = compute(s);
t('[v2-10] Sem grupo: uma preparação para cada pessoa', r.plano.filter(p => p.d.X === 'CULT').length, 2);
// [v2-2] baixa sem lacuna
s = exemploAurora(); s.equipe[1].c[0] = 2; r = compute(s);
t('[v2-2] Prontidão baixa sem lacuna e risco alto: preservação, não preparação', D(r, 'D02').X, 'PRES');
// [v2-3] ordem
s = exemploAurora(); s.diagnosticos[1].crit = 1; r = compute(s);
t('[v2-3] Preparação de prioridade 2 vem depois das ações de prioridade 3', r.plano.map(p => p.d.id).indexOf('D02') > r.plano.map(p => p.d.id).indexOf('D03'), true);
// [v2-4] conclusão da preparação
s = exemploAurora(); r = compute(s); concluirAcao(s, A(r, 'D02').d, 'Concluída'); r = compute(s);
t('[v2-4] Preparação concluída: Bruno aguarda reavaliação', r.aguardando.map(a => a.pessoa), ['E02']);
t('[v2-4] Diagnóstico D02 continua aberto', s.diagnosticos[1].andamento, 'Não iniciada');
aplicarAutoavaliacao(s.equipe[1], { prontidao: 'Moderada', competencias: { C01: 0, C02: 1, C03: 1, C04: 3, C05: 1, C06: 0 } }); r = compute(s);
t('[v2-4] Reavaliado como moderada: treino técnico entra no plano', A(r, 'D02') && A(r, 'D02').d.X, 'EXP');
// [v2-5] preservação sem vaga
s = exemploAurora(); s.negocio.maxAcoes = 1; s.negocio.horas = 10; r = compute(s);
t('[v2-5] Com 1 vaga, a preservação ainda entra', A(r, 'D08').admitida, true);
// [v2-6] mentoria só para alta com C01 ≥ 1
s = exemploAurora(); r = compute(s);
t('[v2-6] Diego (alta, C01 = 2, lacuna 1) mantém mentoria por IA', D(r, 'D04').X, 'TUTOR');
// [v2-7] apoio externo
s = exemploAurora(); s.equipe[1].prontidao = 'Alta'; s.diagnosticos[1].meta = 1; r = compute(s);
t('[v2-7] Alta, C01 = 0, lacuna 1, sem colega: apoio externo', D(r, 'D02').X, 'EXT');
t('[v2-7] Alerta de apoio externo', r.alertas.some(a => a.startsWith('Apoio externo necessário para Bruno')), true);
s = exemploAurora(); s.equipe.forEach(p => p.prontidao = 'Baixa'); r = compute(s);
t('[v2-7] Preparação sem colega apto pede apoio externo', r.plano.find(p => p.d.X === 'CULT').d.apoioExterno, true);
// [v2-8] maturidade
s = exemploAurora(); s.negocio.maturidade = [0, 0, 1, 0]; r = compute(s);
t('[v2-8] Teto 1: ação da loja para maturidade', r.plano.some(p => p.d.X === 'MAT'), true);
t('[v2-8] Diagnóstico bloqueado pelo teto explica o motivo', D(r, 'D01').justificativa, 'Bloqueado pela maturidade digital (lacuna futura 2)');
// [v2-9] carga do colega
s = exemploAurora(); s.negocio.maxAprendizes = 1; s.negocio.horas = 10; s.negocio.maxAcoes = 9; s.equipe[4].c[2] = 1;
s.diagnosticos.push({ id: 'D09', pessoa: 'E05', tarefa: 'T02', comp: 'C03', meta: 3, crit: 3, andamento: 'Não iniciada', evidencia: '' }); r = compute(s);
t('[v2-9] Diego ensina só 1 pessoa; a outra recebe alternativa', [A(r, 'D03').d.X, A(r, 'D09').d.X], ['PARES', 'TUTOR']);
// [v2-11] autoavaliação
t('Autoavaliação de Bruno retorna baixa', calcularAutoavaliacao('E02', [0, 1, 1, 3, 1, 0], [0, 1, 1, 1, 3, 3, 1, 0], 1, 2, true).prontidao, 'Baixa');
t('Fronteira média 1 retorna moderada', calcularAutoavaliacao('X', [0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 2, 2, 1, 1]).prontidao, 'Moderada');
t('Fronteira média 2 retorna alta', calcularAutoavaliacao('X', [0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 1, 1, 2, 2]).prontidao, 'Alta');
t('[v2-11] Ansiedade e medo no máximo: baixa', calcularAutoavaliacao('X', [0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 3, 3, 2, 2]).prontidao, 'Baixa');
t('[v2-11] Medo no máximo limita a moderada', calcularAutoavaliacao('X', [0, 0, 0, 0, 0, 0], [3, 3, 3, 3, 0, 3, 3, 3]).prontidao, 'Moderada');
t('[v2-11] Respostas todas iguais geram alerta', calcularAutoavaliacao('X', [0, 0, 0, 0, 0, 0], [3, 3, 3, 3, 3, 3, 3, 3]).alertas.length, 1);
t('Exportação não contém respostas individuais', Object.keys(calcularAutoavaliacao('X', [0, 0, 0, 0, 0, 0], [2, 2, 2, 2, 1, 1, 2, 2])).sort(), ['alertas', 'codigo', 'competencias', 'limites', 'origem', 'prontidao', 'versao']);
// [v2-12] custo compartilhado
s = exemploAurora(); s.negocio.intervencoes.TUTOR.custo = 30; s.negocio.intervencoes.TUTOR.compartilhado = true; s.negocio.intervencoes.EXT.custo = 50; s.negocio.orcamento = 40; r = compute(s);
t('[v2-12] Assinatura única: duas mentorias pagam R$ 30 uma vez', [A(r, 'D01').admitida, A(r, 'D06').admitida, r.resumo.custo], [true, true, 30]);
// [v2-7] apoio externo é último recurso
s = exemploAurora(); s.negocio.intervencoes.TUTOR.custo = 30; r = compute(s);
t('[v2-7] Mentoria paga compatível continua (apoio externo só sem opção interna)', D(r, 'D01').X, 'TUTOR');
// [v2-13] código numérico
s = exemploAurora(); s.diagnosticos[3].id = 'D10'; s.diagnosticos[4].id = 'D9'; r = compute(s);
t('[v2-13] Desempate por código numérico (D9 antes de D10)', r.plano.map(p => p.d.id).filter(x => x === 'D9' || x === 'D10'), ['D9', 'D10']);

// ---------- exibição ----------
if (typeof document !== 'undefined') {
  const okN = resultados.filter(r => r.ok).length;
  const resumo = document.getElementById('resumo');
  resumo.textContent = `${okN} de ${resultados.length} verificações aprovadas`;
  resumo.className = okN === resultados.length ? 'banner ok' : 'banner erro';
  const tb = document.getElementById('linhas');
  for (const r of resultados) {
    const tr = document.createElement('tr');
    const cel = (txt, cls) => { const td = document.createElement('td'); td.style.whiteSpace = 'normal';
      if (cls) { const s = document.createElement('span'); s.className = cls; s.textContent = txt; td.append(s); } else td.textContent = txt; tr.append(td); };
    cel(r.ok ? 'Aprovado' : 'Falhou', r.ok ? 'chip ok' : 'chip err'); cel(r.n); cel(JSON.stringify(r.obtido)); cel(JSON.stringify(r.esperado));
    tb.append(tr);
  }
}
