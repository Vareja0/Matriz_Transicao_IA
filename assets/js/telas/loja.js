// telas/loja.js
// Etapa 1: Negócio. Recursos do ciclo, maturidade digital, parâmetros e catálogo de intervenções.
// Os parâmetros técnicos da planilha ficam escondidos em "Ajustes avançados".

V.loja = {
  render(root) {
    const N = S.negocio;
    const muda = (k) => v => { N[k] = v; update(); };
    put(root, cabecalho('Negócio e regras', 'Defina os recursos que a loja pode dedicar à capacitação neste ciclo de 90 dias. Horas = horas de participantes por semana, inclusive o colega que ensina.'));
    this.aviso = h('div');
    put(root, this.aviso);

    put(root, h('section', { class: 'block' }, h('h2', { style: 'margin-bottom:16px' }, 'A loja'),
      campo('Loja', texto(N.loja, v => { N.loja = v; update(); }, { placeholder: 'Ex.: Mercado Aurora' })),
      campo('Segmento', texto(N.segmento, v => { N.segmento = v; update(); }, { placeholder: 'Ex.: Minimercado de bairro' })),
      campo('Data-base do ciclo', h('input', { class: 'in', type: 'date', value: N.dataBase, style: 'max-width:240px', oninput: e => { N.dataBase = e.target.value; update(); } }),
        'A reavaliação é marcada para 90 dias depois.')));

    put(root, h('section', { class: 'block' }, h('h2', {}, 'Recursos do ciclo'),
      h('p', { class: 'lead' }, 'O plano admite ações em ordem de prioridade até esgotar horas, orçamento ou limite de ações simultâneas.'),
      campo('Horas de capacitação da equipe / semana', contador(N.horas, muda('horas'), { passo: 0.5, unidade: 'h/semana', rotulo: 'Horas de capacitação por semana' }),
        'Soma das horas de todos os participantes, inclusive o colega nas ações entre pares.'),
      campo('Orçamento do ciclo (R$)', contador(N.orcamento, muda('orcamento'), { passo: 10, unidade: 'R$', rotulo: 'Orçamento do ciclo' }),
        'Custo zero pressupõe colegas internos e ferramentas já disponíveis.'),
      campo('Máximo de ações simultâneas', contador(N.maxAcoes, muda('maxAcoes'), { passo: 1, unidade: 'ações', rotulo: 'Máximo de ações simultâneas' }),
        'Ações além do limite ficam para o próximo ciclo.')));

    this.resumoMat = h('div', { class: 'preview' });
    put(root, h('section', { class: 'block' }, h('h2', {}, 'Maturidade digital'),
      h('p', { class: 'lead' }, '0 = ausente; 1 = inicial; 2 = regular; 3 = consolidada. A média define o teto da meta no ciclo; a meta futura continua registrada.'),
      MATURIDADE_PERGUNTAS.map(([q], i) => campo(q, escolha(MATURIDADE_ESCALA.map((m, j) => [j, m[0], m[1]]), N.maturidade[i], v => { N.maturidade[i] = v; N.matAndamento = 'Não iniciada'; update(); }, { cols: true }))),
      this.resumoMat));

    // ----- ajustes avançados -----
    const num = (obj, k, attrs = {}) => h('input', { class: 'in', type: 'number', step: attrs.step || 'any', min: attrs.min, max: attrs.max, value: obj[k] ?? '', style: 'max-width:130px',
      oninput: e => { const t = e.target.value; obj[k] = t === '' ? null : Number(t); update(); } });
    const linhas = INTERV_CODES.map(k => {
      const it = N.intervencoes[k];
      return h('tr', {}, h('td', {}, h('b', {}, INTERVENCAO_TXT[k][0]), h('div', { class: 'small muted' }, k + ' · ' + it.participantes)),
        h('td', {}, num(it, 'horas', { step: 0.5, min: 0 })), h('td', {}, num(it, 'semanas', { step: 1, min: 1, max: 12 })), h('td', {}, num(it, 'custo', { step: 10, min: 0 })),
        h('td', {}, h('input', { type: 'checkbox', checked: it.compartilhado, 'aria-label': 'Custo único no ciclo para ' + INTERVENCAO_TXT[k][0], onchange: e => { it.compartilhado = e.target.checked; update(); } })));
    });
    put(root, h('details', { class: 'advanced' }, h('summary', {}, 'Parâmetros operacionais provisórios e catálogo de intervenções'),
      h('div', { class: 'inner' },
        h('p', { class: 'lead' }, 'Parâmetros provisórios, não validados empiricamente.'),
        campo('Risco alto: soma dos 3 itens maior ou igual a', num(N, 'riscoAlto', { step: 1, min: 1, max: 3 }), 'Risco = Sim em R1 + Sim em R2 + Não em R3. Risco alto rebaixa automação para aumento e exige preservação.'),
        campo('Prontidão baixa: média menor que', num(N, 'prontBaixa', { step: 0.125, min: 0, max: 3 })),
        campo('Prontidão alta: média maior ou igual a', num(N, 'prontAlta', { step: 0.125, min: 0, max: 3 }), 'Os formulários de autoavaliação gerados depois da alteração já usam os novos limites.'),
        campo('Preservação: horas de participantes / semana', num(N, 'presHoras', { step: 0.5, min: 0 }), 'Somadas às horas da intervenção quando há preservação.'),
        campo('Aprendizes por colega ao mesmo tempo', num(N, 'maxAprendizes', { step: 1, min: 1 }), 'Um colega nível 3 ensina no máximo este número de pessoas no ciclo; acima disso, o plano usa outra intervenção.'),
        campo('Preparação cultural em grupo?', simNao(N.cultGrupo, v => { N.cultGrupo = v; update(); }), 'Sim: uma conversa única para todas as pessoas com prontidão baixa.'),
        campo('Preparação em grupo: horas a mais por pessoa', num(N, 'cultHoraExtra', { step: 0.25, min: 0 }), 'Somadas às horas da preparação para cada pessoa além da primeira.'),
        h('h3', { style: 'margin:22px 0 8px' }, 'Catálogo de intervenções'),
        h('p', { class: 'small muted', style: 'margin-top:0' }, 'As horas já incluem o tempo do colega. Entre as intervenções compatíveis, vale a de menor custo; empate: pares, redesenho, experimentação e tutor; apoio externo só quando nenhuma delas é compatível. “Custo único”: o custo é cobrado uma vez no ciclo, mesmo com várias pessoas (ex.: uma assinatura de IA).'),
        h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Intervenção'), h('th', {}, 'Horas/semana'), h('th', {}, 'Semanas'), h('th', {}, 'Custo/ciclo R$'), h('th', {}, 'Custo único'))), h('tbody', {}, linhas))))));

    put(root, h('div', { class: 'actions' }, h('button', { class: 'btn big', onclick: () => mostrar('equipe') }, 'Próxima etapa: Equipe')));
  },
  refresh() {
    this.aviso.replaceChildren(R.negErros.length || !String(S.negocio.loja).trim()
      ? h('div', { class: 'banner aviso' }, h('span', { class: 'ico' }, '!'), h('div', {}, 'Corrija os parâmetros para liberar o plano:', h('ul', { style: 'margin:6px 0 0;padding-left:20px;font-weight:500' },
          !String(S.negocio.loja).trim() ? h('li', {}, 'Informe o nome da loja.') : null, R.negErros.map(e => h('li', {}, e)))))
      : '');
    this.resumoMat.replaceChildren(R.teto === null
      ? 'Média de maturidade: preencher maturidade. Teto da meta no ciclo: pendente.'
      : h('span', {}, 'Média de maturidade: ', h('b', {}, fmtN(R.matMedia)), '  ·  Teto da meta no ciclo: ', h('b', {}, R.teto), '  ·  Reavaliação após 90 dias: ', h('b', {}, fmtD(R.reavaliacao))));
  }
};
