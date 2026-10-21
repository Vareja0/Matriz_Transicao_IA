// telas/equipe.js
// Etapa 2: Equipe e autoavaliação. Cada pessoa vira um cartão; a autoavaliação pode ser aplicada
// na hora, junto com a pessoa, ou enviado como arquivo para ela responder sozinha.

V.equipe = {
  render(root) {
    put(root, cabecalho('Equipe e autoavaliação', 'Uma ficha por pessoa. Prontidão: somente a faixa. Competências: 0 a 3 (ver Guia). A faixa e os níveis vêm da autoavaliação individual.'));
    put(root, h('div', { class: 'actions', style: 'margin-bottom:20px' },
      h('button', { class: 'btn', onclick: () => editarPessoa(null) }, '+ Adicionar pessoa'),
      h('button', { class: 'btn light', onclick: receberResposta }, 'Importar resultado (.json)')));

    if (!S.equipe.length) {
      put(root, h('div', { class: 'empty' }, h('p', {}, 'Nenhuma pessoa cadastrada.'), h('button', { class: 'btn big', onclick: () => editarPessoa(null) }, '+ Adicionar pessoa')));
      return;
    }
    put(root, h('div', { class: 'cards' }, S.equipe.map(p => cartaoPessoa(p))));
    put(root, h('div', { class: 'actions', style: 'margin-top:26px' }, h('button', { class: 'btn big', onclick: () => mostrar('tarefas') }, 'Próxima etapa: Tarefas')));
  }
};

function cartaoPessoa(p) {
  const calc = calcPessoa(p.id);
  const feito = questionarioFeito(p);
  const outrosErros = calc.erros.filter(e => !/prontidão|competências/i.test(e));
  return h('article', { class: 'card' + (calc.ok ? '' : ' warn') },
    h('div', {}, h('h3', {}, p.nome || 'Sem nome'), h('div', { class: 'role' }, p.id + ' · ' + (p.funcao || 'Função não informada'))),
    p.gestor === 'Sim' ? h('div', {}, h('span', { class: 'pill' }, 'Gestor')) : null,
    feito
      ? h('div', { class: 'status ok' }, h('div', {}, PRONTIDAO_TXT[p.prontidao][0], h('div', { class: 'small muted', style: 'font-weight:400' }, PRONTIDAO_TXT[p.prontidao][1])))
      : h('div', { class: 'status err' }, 'Autoavaliação pendente: faixa de prontidão e competências não informadas'),
    feito ? h('div', { class: 'skills' }, COMPS.map((c, i) => h('div', {}, h('span', {}, HABILIDADES[c[0]][0]), h('span', { class: 'muted', style: 'white-space:nowrap', title: NIVEIS_TXT[p.c[i]][0] }, 'Nível ' + p.c[i] + ' ', bolinhas(p.c[i]))))) : null,
    outrosErros.length ? h('div', { class: 'status err' }, 'Corrigir cadastro: ' + outrosErros.join(' ')) : null,
    p.prep === 'Concluída' && p.prontidao === 'Baixa' ? h('div', { class: 'status info' }, 'Preparação cultural concluída: reaplique a autoavaliação.') : null,
    h('div', { class: 'card-actions' },
      feito ? null : h('button', { class: 'btn', onclick: () => fazerQuestionario(p) }, 'Aplicar autoavaliação'),
      feito ? null : h('button', { class: 'btn light', onclick: () => enviarQuestionario(p) }, 'Baixar formulário do colaborador'),
      h('button', { class: 'btn quiet', onclick: () => editarPessoa(p) }, 'Editar'),
      feito ? h('button', { class: 'btn quiet', onclick: () => fazerQuestionario(p) }, 'Reaplicar autoavaliação') : null,
      feito ? h('button', { class: 'btn quiet', onclick: () => enviarQuestionario(p) }, 'Formulário do colaborador') : null,
      h('button', { class: 'btn danger', onclick: () => removerPessoa(p) }, 'Remover')));
}

function editarPessoa(p) {
  const novo = !p;
  const d = novo ? { nome: '', funcao: '', gestor: 'Não', prontidao: '', c: [null, null, null, null, null, null], prep: '' } : JSON.parse(JSON.stringify(p));
  janela({
    titulo: novo ? 'Adicionar pessoa' : 'Editar ' + p.id + ' · ' + (p.nome || 'pessoa'),
    botaoOk: 'Salvar',
    montar(corpo) {
      put(corpo, 
        campo('Pessoa', texto(d.nome, v => d.nome = v, { placeholder: 'Ex.: Helena' }), 'O código (E01, E02…) é gerado automaticamente. Nomes devem ser únicos.'),
        campo('Função', texto(d.funcao, v => d.funcao = v, { placeholder: 'Ex.: Estoque e reposição' })),
        campo('Gestor?', simNao(d.gestor, v => d.gestor = v), 'Em empate de prioridade, o gestor vem antes no plano.'));
      if (!novo) put(corpo, 
        h('div', { class: 'group-title' }, 'Resultado da autoavaliação'),
        h('p', { class: 'small muted', style: 'margin-top:-6px' }, 'Transcreva a faixa e os seis níveis da autoavaliação. Não presuma aprendizagem: o nível só muda com nova autoavaliação e conferência.'),
        campo('Prontidão', escolha(PRONTIDOES.map(x => [x, PRONTIDAO_TXT[x][0]]), d.prontidao, v => d.prontidao = v)),
        COMPS.map((c, i) => campo(HABILIDADES[c[0]][0], escolha(NIVEIS_TXT.map((n, j) => [j, n[0]]), d.c[i], v => d.c[i] = v))));
      else put(corpo, h('p', { class: 'preview' }, 'Depois de salvar, aplique a autoavaliação na tela ou baixe o formulário do colaborador.'));
    },
    aoConfirmar() {
      d.nome = d.nome.trim(); d.funcao = d.funcao.trim();
      if (!d.nome) throw new Error('Informe o nome.');
      if (!d.funcao) throw new Error('Informe a função.');
      if (S.equipe.some(x => x !== p && up(x.nome) === up(d.nome))) throw new Error('Nome repetido: use também o sobrenome.');
      if (novo) { const n = { id: novoId('E', S.equipe), obs: '', ...d }; S.equipe.push(n); update(); mostrar('equipe'); toast(`${n.id} · ${n.nome} cadastrado. Aplique a autoavaliação.`); }
      else { if (d.prontidao !== p.prontidao) d.prep = ''; Object.assign(p, d); update(); mostrar('equipe'); toast('Alterações salvas.'); }
    }
  });
}

function removerPessoa(p) {
  const itens = S.diagnosticos.filter(d => up(d.pessoa) === up(p.id));
  if (!confirm(`Remover ${p.nome || 'esta pessoa'} da equipe?` + (itens.length ? `\n\n${plural(itens.length, 'diagnóstico', 'diagnósticos')} desta pessoa também ${itens.length === 1 ? 'será apagado' : 'serão apagados'}.` : ''))) return;
  S.diagnosticos = S.diagnosticos.filter(d => !itens.includes(d));
  S.equipe = S.equipe.filter(x => x !== p);
  update(); mostrar('equipe'); toast('Pessoa removida.');
}

function fazerQuestionario(p) {
  const N = S.negocio;
  let q, res = null;
  const dlg = janela({
    titulo: 'Autoavaliação individual · ' + p.id + ' · ' + p.nome, subtitulo: 'Seis competências e oito itens de prontidão. As respostas de prontidão não são salvas.', larga: true,
    botaoOk: 'Gerar resultado',
    montar(corpo) {
      q = questionario({ nome: p.nome, low: N.prontBaixa, high: N.prontAlta, exemplo: S.exemplo && p.id === 'E02', onMudou: () => dlg && dlg.erro('') });
      put(corpo, h('div', { class: 'privacy' }, 'As respostas da parte 2 não ficam guardadas. Só o resultado vai para a ficha da pessoa.'), q.el);
    },
    aoConfirmar() {
      if (!res) {
        res = q.resultado(p.id);
        dlg.corpo.replaceChildren(quadroResultado(res));
        dlg.corpo.scrollTop = 0;
        dlg.ok.textContent = 'Aplicar na Equipe';
        return false;
      }
      aplicarAutoavaliacao(p, res);
      update(); mostrar('equipe'); toast(`Equipe atualizada: ${p.id} (${p.nome}) com ${PRONTIDAO_TXT[p.prontidao][0].toLowerCase()}.`);
    }
  });
}

function enviarQuestionario(p) {
  const N = S.negocio;
  janela({
    titulo: 'Formulário do colaborador · ' + p.id + ' · ' + p.nome,
    montar(corpo) {
      const arq = `Formulario_Colaborador_${nomeArquivo(p.nome)}.html`;
      put(corpo, 
        h('ol', { class: 'help-list', style: 'font-size:16.5px' },
          h('li', {}, 'Clique em ', h('b', {}, 'Baixar formulário'), '. O arquivo ', h('b', {}, arq), ' já vem com o código, o nome e os limites de prontidão da loja.'),
          h('li', {}, 'Entregue o arquivo a ', p.nome, ' (WhatsApp, e-mail ou pendrive).'),
          h('li', {}, p.nome, ' abre o arquivo e responde. Funciona offline; não há armazenamento local, login ou transmissão automática.'),
          h('li', {}, p.nome, ' devolve o resultado ', h('b', {}, `Resposta_${nomeArquivo(p.nome)}.json`), ', com a faixa e os níveis, sem as oito respostas individuais.'),
          h('li', {}, 'Em ', h('b', {}, 'Equipe'), ', use ', h('b', {}, 'Importar resultado (.json)'), '.')),
        h('div', { class: 'actions', style: 'margin-top:18px' }, h('button', { class: 'btn big', onclick: () => {
          const a = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
          const html = MODELO_FORMULARIO.replace('data-mode="colaborador"',
            `data-mode="colaborador" data-codigo="${a(p.id)}" data-nome="${a(p.nome)}" data-low="${a(N.prontBaixa)}" data-high="${a(N.prontAlta)}" data-loja="${a(N.loja)}"`);
          baixar(arq, html, 'text/html;charset=utf-8');
          toast(`“${arq}” baixado. Entregue a ${p.nome}.`);
        } }, 'Baixar formulário')));
    }
  });
}

function receberResposta() {
  abrirArquivo('.json,application/json', txt => {
    let r;
    try { r = JSON.parse(txt); } catch (e) { throw new Error('Resultado inválido: faltam código, prontidão ou competências.'); }
    if (!r || !PRONTIDOES.includes(r.prontidao) || !r.competencias) throw new Error('Resultado inválido: faltam código, prontidão ou competências.');
    const niveis = COMPS.map(c => r.competencias[c[0]]);
    if (!niveis.every(x => Number.isInteger(x) && x >= 0 && x <= 3)) throw new Error('Resultado inválido: níveis devem ser inteiros de 0 a 3.');
    let p = S.equipe.find(x => up(x.id) === up(r.codigo || '') && (!r.nome || up(x.nome) === up(r.nome)))
      || S.equipe.find(x => r.nome && up(x.nome) === up(r.nome))
      || S.equipe.find(x => !r.nome && up(x.nome) === up(r.codigo || ''));
    const nome = r.nome || r.codigo || 'Sem nome';
    if (!p) {
      if (!confirm(`“${nome}” não está na Equipe. Adicionar como nova pessoa?`)) return;
      p = { id: novoId('E', S.equipe), nome, funcao: '', gestor: 'Não', prontidao: '', c: [], obs: '', prep: '' };
      S.equipe.push(p);
    } else if (questionarioFeito(p) && !confirm(`${p.id} · ${p.nome} já tem autoavaliação. Substituir pelo resultado importado?`)) return;
    aplicarAutoavaliacao(p, r);
    update(); mostrar('equipe');
    toast(p.funcao ? `Equipe atualizada: ${p.id} (${p.nome}).` : `${p.id} adicionado à Equipe. Complete a função em Editar.`);
  });
}
