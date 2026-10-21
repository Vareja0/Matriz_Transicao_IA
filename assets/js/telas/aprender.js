// telas/aprender.js
// Etapa 4: Diagnóstico por pessoa, tarefa e competência (meta futura, criticidade, andamento).

V.aprender = {
  render(root) {
    put(root, cabecalho('Diagnóstico por pessoa, tarefa e competência', 'Um diagnóstico por pessoa, tarefa e competência. Informe meta futura, criticidade e andamento; nível atual, meta do ciclo, lacuna, prioridade e intervenção são calculados.'));
    if (!S.equipe.length || !S.tarefas.length) {
      put(root, h('div', { class: 'empty' }, h('p', {}, 'Cadastre ' + (!S.equipe.length ? 'pessoas na Equipe' : 'tarefas') + ' antes do Diagnóstico.'),
        h('button', { class: 'btn big', onclick: () => mostrar(!S.equipe.length ? 'equipe' : 'tarefas') }, 'Ir para ' + (!S.equipe.length ? 'Equipe' : 'Tarefas'))));
      return;
    }
    put(root, h('div', { class: 'actions', style: 'margin-bottom:22px' }, h('button', { class: 'btn', onclick: () => editarItem(null) }, '+ Adicionar diagnóstico')));

    const semItens = [];
    for (const p of S.equipe) {
      const itens = S.diagnosticos.filter(d => up(d.pessoa) === up(p.id));
      if (!itens.length) { semItens.push(p); continue; }
      put(root, h('section', { class: 'block' },
        h('div', { style: 'display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:6px' },
          h('h2', { style: 'margin:0' }, p.id + ' · ' + p.nome), h('button', { class: 'btn quiet', onclick: () => editarItem(null, p.id) }, '+ Diagnóstico para ' + p.nome)),
        itens.map(linhaItem)));
    }
    const orfaos = S.diagnosticos.filter(d => !pessoaPorId(d.pessoa));
    if (orfaos.length) put(root, h('section', { class: 'block' }, h('h2', {}, 'Pessoa inexistente'), orfaos.map(linhaItem)));
    if (semItens.length) put(root, h('section', { class: 'block' }, h('h3', {}, 'Pessoas sem diagnóstico'),
      h('p', { class: 'small muted', style: 'margin-top:0' }, 'Sem diagnóstico, a pessoa não gera ações no plano.'),
      h('div', { class: 'chips' }, semItens.map(p => h('button', { onclick: () => editarItem(null, p.id) }, '+ ' + p.nome)))));
    if (S.diagnosticos.length) put(root, h('div', { class: 'actions', style: 'margin-top:8px' }, h('button', { class: 'btn big', onclick: () => mostrar('plano') }, 'Próxima etapa: Plano')));
  }
};

function linhaItem(d) {
  const c = R.diags[S.diagnosticos.indexOf(d)];
  const t = tarefaPorId(d.tarefa);
  const hab = HABILIDADES[d.comp] ? HABILIDADES[d.comp][0] : 'Competência não informada';
  let resultado;
  if (!c.ok) resultado = h('div', { class: 'status err' }, 'Corrigir entrada: ' + c.erros.join(' '));
  else if (c.X) resultado = h('div', { class: 'status ok' }, h('div', {}, 'Intervenção: ' + c.intervencao + (c.preservacao && c.X !== 'PRES' ? ' + preservação' : ''), h('div', { class: 'small muted', style: 'font-weight:400' }, c.justificativa)));
  else resultado = h('div', { class: 'status info' }, PROXIMO_PASSO_TXT[c.justificativa] || c.justificativa);
  return h('div', { style: 'border-top:1px solid var(--line);padding:14px 0;display:grid;grid-template-columns:1fr auto;gap:10px 18px;align-items:center' },
    h('div', {},
      h('div', { style: 'font-weight:700;font-size:17px' }, d.id + ' · ' + hab, h('div', { class: 'muted', style: 'font-weight:400;font-size:15px' }, 'Tarefa: ' + (t ? t.id + ' · ' + t.nome : 'inexistente') + (c.ok ? ` · Classe final: ${c.classe} · Risco ${c.risco}` : ''))),
      c.ok ? h('div', { class: 'small', style: 'margin:3px 0 6px' },
        'Nível atual ', h('b', {}, c.nivel), '  ·  Meta futura ', h('b', {}, d.meta), '  ·  Meta do ciclo ', h('b', {}, c.metaCiclo),
        '  ·  Lacuna do ciclo ', h('b', {}, c.lacunaCiclo), '  ·  Criticidade ', h('b', {}, d.crit), '  ·  Prioridade ', h('b', {}, c.prioridade),
        '  ·  ', h('span', { class: 'pill' }, d.andamento)) : null,
      resultado),
    h('div', { class: 'actions' }, h('button', { class: 'btn quiet', onclick: () => editarItem(d) }, 'Editar'), h('button', { class: 'btn danger', onclick: () => removerItem(d) }, 'Remover')));
}

function editarItem(d, pessoaInicial) {
  const novo = !d;
  const x = novo ? { pessoa: pessoaInicial || '', tarefa: '', comp: '', meta: null, crit: null, andamento: 'Não iniciada', evidencia: '' } : { ...d };
  let previa;
  const atualizarPrevia = () => {
    const p = pessoaPorId(x.pessoa); const ci = COMPS.findIndex(c => c[0] === x.comp);
    previa.replaceChildren(!p || ci < 0 ? 'Escolha a pessoa e a competência para ver o nível atual.'
      : !questionarioFeito(p) ? `${p.id} · ${p.nome}: autoavaliação pendente na Equipe.`
      : h('span', {}, `Nível atual de ${p.nome} em ${COMPS[ci][0]}: `, h('b', {}, NIVEIS_TXT[p.c[ci]][0]), `. Teto da meta no ciclo: ${R.teto ?? 'pendente'}.`));
  };
  janela({
    titulo: novo ? 'Adicionar diagnóstico' : 'Editar ' + d.id, larga: true,
    montar(corpo) {
      previa = h('div', { class: 'preview' });
      put(corpo, 
        campo('Pessoa', escolha(S.equipe.map(p => [p.id, p.id + ' · ' + p.nome]), x.pessoa, v => { x.pessoa = v; atualizarPrevia(); }, { cols: true })),
        campo('Tarefa', escolha(S.tarefas.map(t => [t.id, t.id + ' · ' + t.nome]), x.tarefa, v => x.tarefa = v, { cols: true })),
        campo('Competência', escolha(COMPS.map(c => [c[0], HABILIDADES[c[0]][0], HABILIDADES[c[0]][1]]), x.comp, v => { x.comp = v; atualizarPrevia(); }, { cols: true })),
        previa,
        campo('Meta futura (0-3)', escolha(NIVEIS_TXT.map((n, j) => [j, n[0], n[1]]), x.meta, v => x.meta = v, { cols: true }), 'Meta do ciclo = mínimo entre meta futura e teto da maturidade. A meta futura e a lacuna total continuam visíveis.'),
        campo('Criticidade (1-3)', escolha([1, 2, 3].map(n => [n, IMPORTANCIA_TXT[n][0], IMPORTANCIA_TXT[n][1]]), x.crit, v => x.crit = v)),
        campo('Andamento', escolha(ANDAMENTOS.map(a => [a, ANDAMENTO_TXT[a]]), x.andamento, v => x.andamento = v)),
        campo('Evidência / observação', texto(x.evidencia, v => x.evidencia = v, { placeholder: 'Ex.: entrada simulada', maxlength: 200 })));
      atualizarPrevia();
    },
    aoConfirmar() {
      const falta = [!x.pessoa && 'pessoa', !x.tarefa && 'tarefa', !x.comp && 'competência', x.meta === null && 'meta futura', x.crit === null && 'criticidade'].filter(Boolean);
      if (falta.length) throw new Error('Corrigir entrada: informe ' + falta.join(', ') + '.');
      if (S.diagnosticos.some(o => o !== d && up(o.pessoa) === up(x.pessoa) && up(o.tarefa) === up(x.tarefa) && o.comp === x.comp))
        throw new Error('Combinação pessoa + tarefa + competência repetida.');
      if (novo) S.diagnosticos.push({ id: novoId('D', S.diagnosticos), ...x });
      else Object.assign(d, x);
      update(); mostrar('aprender'); toast('Diagnóstico salvo. Plano recalculado.');
    }
  });
}

function removerItem(d) {
  if (!confirm(`Remover o diagnóstico ${d.id}?`)) return;
  S.diagnosticos = S.diagnosticos.filter(o => o !== d);
  update(); mostrar('aprender');
}
