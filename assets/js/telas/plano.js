// telas/plano.js
// Etapa 5: o resultado. Quem treina primeiro, de que jeito, quando, e o que ficou para depois.

const SITUACAO_TXT = {
  erro: ['!', 'Há entradas pendentes: corrija os campos sinalizados antes de usar o plano.'],
  aviso: ['!', ''],
  ok: ['✓', 'Plano calculado. Confirmar agenda e participação com a equipe.']
};

V.plano = {
  render(root) { this.root = root; },
  refresh() {
    const root = this.root, N = S.negocio;
    root.replaceChildren();
    const fim = R.reavaliacao;
    put(root, cabecalho('Plano de transição de competências', `${N.loja || 'Loja sem nome'}${N.segmento ? ', ' + N.segmento.toLowerCase() : ''}. Ciclo de 90 dias a partir de ${fmtD(N.dataBase)}; reavaliar em ${fmtD(fim)}. A lista e os prazos mudam com as entradas.`));

    // aviso principal: texto do motor (R.situacao) e pontos de atenção (R.alertas)
    const e = etapas();
    const tipo = R.situacao.tipo;
    const comAlertas = R.situacao.texto.startsWith('Plano calculado, com pontos de atenção');
    const txt = tipo === 'erro' ? SITUACAO_TXT.erro[1] : comAlertas ? 'Plano calculado, com pontos de atenção:' : R.situacao.texto;
    const links = [['loja', 'Negócio'], ['equipe', 'Equipe'], ['tarefas', 'Tarefas'], ['aprender', 'Diagnóstico']]
      .filter(([k]) => e[k].erro).map(([k, l]) => h('button', { class: 'link', onclick: () => mostrar(k) }, `${l}: ${e[k].estado.charAt(0).toLowerCase() + e[k].estado.slice(1)}`));
    put(root, h('div', { class: 'banner ' + tipo, role: 'status' }, h('span', { class: 'ico' }, tipo === 'ok' ? '✓' : '!'),
      h('div', {}, txt,
        tipo !== 'erro' && R.alertas.length ? h('ul', { style: 'margin:6px 0 0;padding-left:20px;font-weight:500' }, R.alertas.map(a => h('li', {}, a))) : null,
        links.length ? h('div', { class: 'more' }, links) : null,
        !R.plano.length && tipo !== 'erro' ? h('div', { class: 'more' }, h('button', { class: 'link', onclick: () => mostrar('aprender') }, 'Ir para o Diagnóstico')) : null)));

    if (S.cenario) put(root, quadroCenario(false));

    if (R.aguardando.length) put(root, h('section', { class: 'block' }, h('h3', {}, 'Aguardando reavaliação'),
      h('p', { class: 'small muted', style: 'margin-top:0' }, 'Preparação cultural concluída. Reaplique a autoavaliação: se a prontidão subir, o treino técnico entra no plano; se continuar baixa, uma nova preparação é proposta.'),
      h('div', { class: 'chips' }, R.aguardando.map(a => h('button', { onclick: () => mostrar('equipe') }, a.pessoaNome + ': reaplicar autoavaliação')))));

    if (!R.plano.length) return;
    const agora = R.plano.filter(p => p.admitida), depois = R.plano.filter(p => !p.admitida);
    const comVaga = agora.filter(p => p.d.X !== 'PRES');

    // uso do tempo, do dinheiro e das vagas
    const total = isNum(N.horas) ? N.horas : 0, orc = isNum(N.orcamento) ? N.orcamento : 0;
    const bar = h('div', { class: 'bar', role: 'img', 'aria-label': `${fmtH(R.resumo.horas)} reservadas de ${fmtH(total)} por semana` });
    if (total > 0) agora.forEach((p, i) => { const w = p.d.horas / total * 100; if (w > 0) bar.append(h('div', { class: 'seg ' + (p.d.X === 'CULT' ? 'cult' : 'c' + (i % 4)), style: `width:${w}%`, title: `${p.d.pessoaNome}: ${fmtH(p.d.horas)}` }, h('b', {}, p.d.pessoaNome), h('span', {}, fmtH(p.d.horas)))); });
    const slots = h('div', { class: 'slots', role: 'img', 'aria-label': `${R.resumo.vagas} de ${N.maxAcoes} ações simultâneas` });
    for (let i = 0; i < Math.min(isNum(N.maxAcoes) ? N.maxAcoes : 0, 30); i++) slots.append(h('i', { class: comVaga[i] ? (comVaga[i].d.X === 'CULT' ? 'cult' : 'on') : '' }));
    put(root, h('section', { class: 'capacity' },
      h('div', { class: 'facts' },
        h('div', {}, h('b', {}, `${R.resumo.noCiclo} de ${R.resumo.necessarias}`), 'ações necessárias entram no ciclo'),
        h('div', {}, h('b', {}, R.resumo.adiadas), 'no próximo ciclo'),
        h('div', {}, h('b', {}, fmtR(R.resumo.custo)), 'custo incremental previsto'),
        h('div', {}, h('b', {}, fmtD(fim)), 'reavaliar em')),
      h('div', { class: 'cap-row', style: 'margin-top:18px' }, h('span', { class: 't' }, 'Horas/semana reservadas'), bar, h('span', { class: 'v' }, h('b', {}, fmtN(R.resumo.horas)), ' de ', fmtN(total), ' h')),
      h('div', { class: 'cap-row' }, h('span', { class: 't' }, 'Orçamento do ciclo'), h('div', { class: 'bar thin' }, orc > 0 && R.resumo.custo > 0 ? h('div', { class: 'seg c0', style: `width:${Math.min(100, R.resumo.custo / orc * 100)}%` }) : null), h('span', { class: 'v' }, h('b', {}, fmtR(R.resumo.custo)), ' de ', fmtR(orc))),
      h('div', { class: 'cap-row' }, h('span', { class: 't' }, 'Ações simultâneas'), slots, h('span', { class: 'v' }, h('b', {}, R.resumo.vagas), ' de ', fmtN(N.maxAcoes))),
      h('p', { class: 'small muted', style: 'margin:8px 0 0' }, 'Preservação de competências não ocupa vaga de ação simultânea.')));

    put(root, h('h2', { class: 'section-title' }, 'No ciclo'));
    put(root, (agora.length ? agora.map(p => cartaoAcao(p, false)) : [
      h('div', { class: 'empty' }, h('p', {}, 'Nenhuma ação cabe nos recursos atuais.'), h('button', { class: 'btn', onclick: () => mostrar('loja') }, 'Revisar horas, orçamento e limite em Negócio'))]));

    if (depois.length) {
      put(root, h('h2', { class: 'section-title' }, 'Próximo ciclo'),
        h('p', { class: 'lead' }, 'Ações necessárias que não couberam no saldo. Ao não caber, a admissão tenta a ação seguinte com o saldo restante. Preservação adiada: manter revisão humana e não delegar a tarefa à IA.'));
      put(root, depois.map(p => cartaoAcao(p, true)));
    }

    put(root, h('section', { class: 'block', style: 'margin-top:26px' }, h('h3', {}, 'Notas'),
      h('ul', { class: 'help-list small' },
        h('li', {}, `Capacidade compartilhada: a reserva semanal inclui aprendiz e colega. Cada colega ensina no máximo ${N.maxAprendizes} pessoa(s) ao mesmo tempo.`),
        h('li', {}, 'Uma ação por pessoa e competência: diagnósticos da mesma competência em tarefas diferentes viram uma ação, com as tarefas como prática.'),
        h('li', {}, 'Ações técnicas de pessoas com baixa prontidão só serão geradas após a preparação e a nova coleta da faixa.'),
        h('li', {}, 'Concluída remove a ação do plano. Atualize também o nível demonstrado e a evidência; a conclusão não altera as competências automaticamente.'),
        h('li', {}, 'Mentoria por IA é uma intervenção recomendada; a ferramenta não executa conversas com um modelo.'))));
    put(root, h('div', { class: 'actions no-print', style: 'margin-top:8px' },
      h('button', { class: 'btn', onclick: () => window.print() }, 'Imprimir plano'),
      h('button', { class: 'btn light', onclick: exportarPlanilha }, 'Exportar planilha (.csv)')));
  }
};

function competenciaAcao(d) {
  return d.comp ? HABILIDADES[d.comp][0] : d.X === 'CULT' ? 'Prontidão para a mudança' : d.X === 'MAT' ? 'Maturidade digital da loja' : '—';
}

function cartaoAcao(p, depois) {
  const d = p.d, [titulo, desc] = INTERVENCAO_TXT[d.X];
  const quem = d.X === 'PARES' && d.colega ? ' · colega: ' + d.colega.nome
    : d.X === 'CULT' && d.colegas.length ? ' · conduz: ' + d.colegas.map(c => c.nome).join(' ou ')
    : d.X === 'CULT' ? ' · apoio externo' : '';
  return h('article', { class: 'action' + (depois ? ' later' : d.X === 'CULT' ? ' prep' : '') },
    h('div', { class: 'n' }, p.ordem),
    h('div', {},
      h('h3', {}, d.pessoaNome, h('span', { class: 'muted', style: 'font-weight:400;font-size:15px' }, '  ' + (d.ids.length > 1 ? d.ids.join(' + ') : d.id))),
      h('div', { class: 'what' }, d.intervencao + (d.grupo ? ' em grupo' : '') + quem),
      h('p', { class: 'desc' }, desc),
      d.trocaColega ? h('p', { class: 'extra' }, d.trocaColega + ': ' + d.intervencao.toLowerCase() + ' no lugar de pares.') : null,
      h('dl', {},
        h('div', {}, h('dt', {}, 'Competência'), h('dd', {}, competenciaAcao(d))),
        h('div', {}, h('dt', {}, d.X === 'MAT' ? 'Foco' : 'Tarefa(s)'), h('dd', {}, d.tarefaNome || '—')),
        h('div', {}, h('dt', {}, 'Horas/sem equipe · semanas'), h('dd', {}, `${fmtH(d.horas)} · ${d.semanas}`)),
        h('div', {}, h('dt', {}, 'Custo/ciclo · prazo'), h('dd', {}, `${fmtR(d.custoEfetivo)} · ${p.prazo}`))),
      d.preservacao && d.X !== 'PRES' ? h('p', { class: 'extra' }, 'Preservação: ' + d.preservacao + (depois ? '. Adiada: manter revisão humana e não delegar a tarefa.' : '.')) : null,
      h('div', { class: 'next' }, (depois ? 'Motivo: ' : 'Próxima etapa: ') + p.motivo),
      depois ? null : h('div', {}, h('div', { class: 'small muted', style: 'margin-bottom:6px' }, 'Andamento:'),
        escolha(ANDAMENTOS.map(a => [a, ANDAMENTO_TXT[a]]), d.andamento, v => {
          concluirAcao(S, d, v); update();
          if (v === 'Concluída') toast(d.X === 'CULT' ? `Preparação concluída: reaplique a autoavaliação de ${d.pessoaNome} na Equipe.`
            : d.X === 'MAT' ? 'Ação de maturidade concluída: atualize as respostas de maturidade em Negócio.'
            : `${d.id} concluída: sai do plano. Atualize o nível de ${d.pessoaNome} na Equipe após conferir a evidência.`);
        }))));
}

function exportarPlanilha() {
  const cols = ['Ordem', 'ID', 'Pessoa', 'Tarefa', 'Competência', 'Intervenção', 'Colega / condução', 'Preservação', 'Horas/sem equipe', 'Custo/ciclo R$', 'Semanas', 'Prazo', 'Motivo / próxima etapa', 'Andamento', 'Ação admitida', 'Saldo h/sem'];
  const q = v => { const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v ?? ''); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const linhas = R.plano.map(p => [p.ordem, p.d.ids.length > 1 ? p.d.ids.join('+') : p.d.id, p.d.pessoaNome, p.d.tarefaNome, competenciaAcao(p.d), p.d.intervencao,
    p.d.colega ? p.d.colega.nome : p.d.X === 'CULT' ? (p.d.colegas.map(c => c.nome).join(' ou ') || 'apoio externo') : '',
    p.d.preservacao, p.d.horas, p.d.custoEfetivo, p.d.semanas, p.prazo, p.motivo, p.d.andamento, p.admitida ? 'Sim' : 'Não', p.saldo]);
  baixar(`Plano_${nomeArquivo(S.negocio.loja || 'loja')}_${hoje()}.csv`, '﻿' + [cols, ...linhas].map(r => r.map(q).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
  toast('Plano exportado (.csv).');
}
