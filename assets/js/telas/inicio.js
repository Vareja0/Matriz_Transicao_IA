// telas/inicio.js
// Tela de boas-vindas: explica para que serve e mostra o caminho, etapa por etapa.

const ETAPAS_INFO = [
  ['loja', 'Negócio', 'Horas de capacitação, orçamento, limite de ações simultâneas e maturidade digital.'],
  ['equipe', 'Equipe e autoavaliação', 'Pessoas, faixa de prontidão e níveis nas competências C01 a C06.'],
  ['tarefas', 'Tarefas', 'Inventário de tarefas, perguntas guiadas, risco e classificação.'],
  ['aprender', 'Diagnóstico', 'Pessoa × tarefa × competência: meta futura, criticidade e andamento.'],
  ['plano', 'Plano', 'Ações ordenadas e admitidas por horas, orçamento e limite simultâneo.']
];

V.inicio = {
  render(root) {
    const e = etapas(), prox = proximaEtapa();
    put(root, cabecalho('Matriz integrada de transição de competências para IA',
      (S.negocio.loja ? S.negocio.loja + '. ' : '') + 'Artefato de apoio à decisão sobre capacitação de equipes de pequeno varejo para o uso de IA, respeitando horas, orçamento e limite de ações do ciclo de 90 dias.'));

    if (S.exemplo) put(root, h('div', { class: 'example-bar' },
      h('div', {}, h('b', {}, 'Cenário fictício.'), ' Mercado Aurora: demonstração simulada. Todos os nomes, respostas, níveis e recursos foram criados para a simulação.'),
      h('button', { class: 'btn', onclick: comecarDoZero }, 'Começar do zero')));
    if (S.cenario) put(root, quadroCenario(true));

    put(root, h('p', { class: 'hello' }, prox === 'plano'
      ? 'Entradas completas. Consulte o Plano e confirme agenda e participação com a equipe.'
      : 'Preencha as etapas na ordem. Os dados são salvos automaticamente neste navegador.'),
      h('div', { class: 'actions', style: 'margin-bottom:26px' },
        h('button', { class: 'btn big', onclick: () => mostrar(prox) }, prox === 'plano' ? 'Abrir o Plano' : 'Continuar: ' + ETAPAS_INFO.find(x => x[0] === prox)[1]),
        h('button', { class: 'btn light', onclick: importarCenario }, 'Importar cenário (.json)')));

    put(root, h('ol', { class: 'journey' }, ETAPAS_INFO.map(([id, titulo, desc], i) => {
      const st = e[id];
      return h('li', { class: id === prox ? 'next' : '' },
        h('span', { class: 'mark' + (st.feito ? ' done' : ''), 'aria-label': st.feito ? 'Etapa concluída' : 'Etapa ' + (i + 1) }, st.feito ? '✓' : i + 1),
        h('div', {}, h('h3', {}, titulo), h('p', {}, desc), h('div', { class: 'state ' + (st.erro ? 'err' : st.feito ? 'ok' : '') }, st.estado)),
        h('button', { class: id === prox ? 'btn' : 'btn light', onclick: () => mostrar(id) }, st.feito ? 'Ver' : 'Abrir'));
    })));
  }
};

// Quadro do cenário importado: título, descrição e o que observar no plano
function quadroCenario(aberto) {
  const c = S.cenario;
  return h('div', { class: 'example-bar', style: 'display:block' },
    h('div', {}, h('b', {}, 'Cenário de teste' + (c.id ? ' ' + c.id : '') + ': '), c.titulo),
    c.descricao ? h('p', { class: 'small', style: 'margin:6px 0 0' }, c.descricao) : null,
    c.o_que_observar.length ? h('details', { open: aberto || null, style: 'margin-top:8px' }, h('summary', { style: 'cursor:pointer;font-weight:700' }, 'O que observar'),
      h('ul', { class: 'help-list small', style: 'margin:6px 0 0' }, c.o_que_observar.map(x => h('li', {}, x)))) : null,
    aberto ? h('div', { class: 'actions', style: 'margin-top:10px' }, h('button', { class: 'btn light', onclick: comecarDoZero }, 'Começar do zero')) : null);
}

function comecarDoZero() {
  if (!confirm((S.cenario ? 'Apagar o cenário' : 'Apagar o exemplo') + ' e começar do zero?\n\nO exemplo pode ser recarregado em “Mais opções”.')) return;
  S = vazioMarcado(); update(); mostrar('loja');
}
