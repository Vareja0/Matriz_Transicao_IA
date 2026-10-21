// telas/tarefas.js
// Etapa 3: Tarefas. Cada tarefa responde as perguntas guiadas (Ativa, Q1-Q5, R1-R3);
// o motor diz se a IA pode ajudar e se há risco de a equipe perder a prática.

V.tarefas = {
  render(root) {
    put(root, cabecalho('Inventário e classificação das tarefas', 'Responda Sim/Não. Q1 ou Q2 mantém a tarefa humana; Q3 + Q4 permite automação; Q5 indica colaboração; nos demais casos, aumento. Risco = Sim em R1 + Sim em R2 + Não em R3.'));
    const existentes = new Set(S.tarefas.map(t => up(t.nome)));
    const sugestoes = SUGESTOES_TAREFAS.filter(s => !existentes.has(up(s)));
    put(root, h('div', { class: 'actions', style: 'margin-bottom:14px' }, h('button', { class: 'btn', onclick: () => editarTarefa(null) }, '+ Adicionar tarefa')));
    if (sugestoes.length) put(root, h('div', { style: 'margin:0 0 22px' }, h('p', { class: 'small muted', style: 'margin:0 0 8px' }, 'Tarefas frequentes no pequeno varejo (clique para cadastrar):'),
      h('div', { class: 'chips' }, sugestoes.map(s => h('button', { onclick: () => editarTarefa(null, s) }, '+ ' + s)))));

    if (!S.tarefas.length) { put(root, h('div', { class: 'empty' }, h('p', {}, 'Nenhuma tarefa cadastrada.'))); return; }
    put(root, h('div', { class: 'cards' }, S.tarefas.map(cartaoTarefa)));
    put(root, h('div', { class: 'actions', style: 'margin-top:26px' }, h('button', { class: 'btn big', onclick: () => mostrar('aprender') }, 'Próxima etapa: Diagnóstico')));
  }
};

function cartaoTarefa(t) {
  const c = R.tarefas.find(x => x.id === t.id);
  const faltam = PERGUNTAS_TAREFA.filter(([k]) => t[k] !== 'Sim' && t[k] !== 'Não').length;
  const riscoAlto = c.ok && c.risco >= S.negocio.riscoAlto;
  return h('article', { class: 'card' + (c.ok ? '' : ' warn') },
    h('h3', {}, t.nome || 'Tarefa sem nome'), h('div', { class: 'role' }, t.id),
    t.ativa === 'Não' ? h('div', {}, h('span', { class: 'pill yellow' }, 'Inativa')) : null,
    c.ok ? h('div', { class: 'status ok' }, h('div', {}, 'Classe final: ' + c.final, h('div', { class: 'small muted', style: 'font-weight:400' }, `Classe inicial: ${c.inicial} · Risco: ${c.risco} de 3`)))
      : h('div', { class: 'status err' }, 'Corrigir tarefa: ' + (faltam ? `${plural(faltam, 'pergunta', 'perguntas')} sem resposta Sim/Não` : c.erros.join(' '))),
    riscoAlto ? h('div', { class: 'status info' }, h('div', {}, 'Risco alto', h('div', { class: 'small', style: 'font-weight:400' }, c.inicial === 'Automação' ? 'Automação rebaixada para aumento. Preservação obrigatória.' : 'Preservação obrigatória: registrar e praticar sem IA.'))) : null,
    h('div', { class: 'card-actions' },
      h('button', { class: c.ok ? 'btn quiet' : 'btn', onclick: () => editarTarefa(t) }, c.ok ? 'Editar' : 'Responder perguntas guiadas'),
      h('button', { class: 'btn danger', onclick: () => removerTarefa(t) }, 'Remover')));
}

function editarTarefa(t, nomeSugerido) {
  const novo = !t;
  const d = novo ? { nome: nomeSugerido || '', ativa: 'Sim' } : JSON.parse(JSON.stringify(t));
  const campos = {};
  janela({
    titulo: novo ? 'Adicionar tarefa' : t.id + ' · ' + t.nome,
    montar(corpo) {
      put(corpo, campo('Tarefa', texto(d.nome, v => d.nome = v, { placeholder: 'Ex.: Responder dúvidas no WhatsApp' }), 'O código (T01, T02…) é gerado automaticamente.'));
      PERGUNTAS_TAREFA.forEach(([k, q, dica], i) => {
        if (i === 1) put(corpo, h('div', { class: 'group-title' }, 'Classificação (Q1 a Q5)'));
        if (i === 6) put(corpo, h('div', { class: 'group-title' }, 'Risco (R1 a R3)'));
        const f = campo(q, simNao(d[k], v => { d[k] = v; f.classList.remove('missing'); }), dica);
        campos[k] = f; put(corpo, f);
      });
    },
    aoConfirmar() {
      d.nome = (d.nome || '').trim();
      if (!d.nome) throw new Error('Descreva a tarefa.');
      if (S.tarefas.some(x => x !== t && up(x.nome) === up(d.nome))) throw new Error('Tarefa repetida.');
      const faltam = PERGUNTAS_TAREFA.filter(([k]) => d[k] !== 'Sim' && d[k] !== 'Não');
      if (faltam.length) {
        faltam.forEach(([k]) => campos[k].classList.add('missing'));
        campos[faltam[0][0]].scrollIntoView({ behavior: 'smooth', block: 'center' });
        throw new Error('Responda Sim ou Não em todas as perguntas.');
      }
      if (novo) { const n = { id: novoId('T', S.tarefas) }; TASK_Q.forEach(k => n[k] = ''); Object.assign(n, d); S.tarefas.push(n); }
      else Object.assign(t, d);
      update(); mostrar('tarefas'); toast('Tarefa salva.');
    }
  });
}

function removerTarefa(t) {
  const itens = S.diagnosticos.filter(d => up(d.tarefa) === up(t.id));
  if (!confirm(`Remover a tarefa “${t.nome}”?` + (itens.length ? `\n\n${plural(itens.length, 'diagnóstico', 'diagnósticos')} com esta tarefa também ${itens.length === 1 ? 'será apagado' : 'serão apagados'}.` : ''))) return;
  S.diagnosticos = S.diagnosticos.filter(d => !itens.includes(d));
  S.tarefas = S.tarefas.filter(x => x !== t);
  update(); mostrar('tarefas'); toast('Tarefa removida.');
}
