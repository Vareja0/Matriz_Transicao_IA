// formulario.js
// Autoavaliação individual: competências atuais e prontidão para a mudança.
// É usado de dois jeitos: dentro da tela do gerente e no arquivo entregue a cada pessoa.

function questionario({ nome, pedirNome = false, voce = false, low = 1, high = 2, exemplo = false, onMudou }) {
  const resp = { nome: nome || '', skills: Array(6).fill(null), answers: Array(8).fill(null) };
  const blocos = { skills: [], answers: [] };
  const el = h('div');
  const mudou = () => onMudou && onMudou();

  if (pedirNome) {
    const nomeIn = texto('', v => { resp.nome = v; mudou(); }, { placeholder: 'Ex.: Bruno' });
    put(el, h('div', { class: 'block' }, campo('Seu nome', nomeIn, 'Use o mesmo nome cadastrado na Equipe. Evite outros dados pessoais.')));
    blocos.nome = nomeIn;
  }

  const parte1 = h('div', { class: 'block' }, h('h2', {}, 'Competências atuais'),
    h('p', { class: 'lead' }, '0 = não utiliza · 1 = executa com apoio · 2 = executa com autonomia · 3 = executa e ensina colegas.'));
  COMPS.forEach((c, i) => {
    const [titulo, desc] = HABILIDADES[c[0]];
    const f = campo(titulo, escolha(NIVEIS_TXT.map((n, j) => [j, n[0], n[1]]), null, v => { resp.skills[i] = v; f.classList.remove('missing'); mudou(); }, { cols: true }), desc);
    blocos.skills.push(f); put(parte1, f);
  });

  const parte2 = h('div', { class: 'block' }, h('h2', {}, 'Prontidão para a mudança'),
    h('p', { class: 'lead' }, '0 = discordo totalmente · 1 = discordo · 2 = concordo · 3 = concordo totalmente. Os itens sobre ansiedade têm pontuação invertida. Instrumento experimental de apoio à conversa, sem validação psicométrica.'));
  PERGUNTAS.forEach((q, i) => {
    const f = campo(q, escolha(QUESTIONARIO_ESCALA.map((t, j) => [j, t]), null, v => { resp.answers[i] = v; f.classList.remove('missing'); mudou(); }));
    blocos.answers.push(f); put(parte2, f);
  });
  put(el, parte1, parte2);

  if (exemplo) el.prepend(h('p', { class: 'small' }, h('button', { class: 'btn quiet', type: 'button', onclick: () => {
    // respostas fictícias do Bruno (cenário Mercado Aurora)
    const marcar = (lista, valores) => lista.forEach((f, i) => { const r = f.querySelector(`input[value="${valores[i]}"]`); r.checked = true; r.dispatchEvent(new Event('change')); });
    marcar(blocos.skills, [0, 1, 1, 3, 1, 0]); marcar(blocos.answers, [0, 1, 1, 1, 3, 3, 1, 0]);
  } }, 'Preencher exemplo de Bruno')));

  return {
    el,
    // devolve o resultado ou lança erro explicando o que falta, destacando a primeira pergunta sem resposta
    resultado(codigo) {
      const nomeFinal = (resp.nome || '').trim();
      if (pedirNome && !nomeFinal) { blocos.nome.classList.add('bad'); blocos.nome.focus(); throw new Error('Preencha o nome.'); }
      const faltando = [...blocos.skills.filter((f, i) => resp.skills[i] === null), ...blocos.answers.filter((f, i) => resp.answers[i] === null)];
      faltando.forEach(f => f.classList.add('missing'));
      if (faltando.length) { faltando[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); throw new Error('Responda todos os itens antes de gerar o resultado.'); }
      const r = calcularAutoavaliacao(codigo || nomeFinal, resp.skills, resp.answers, low, high, exemplo && resp.skills.join() === '0,1,1,3,1,0');
      r.nome = nomeFinal || nome || '';
      return r;
    }
  };
}

// Quadro com o resultado (não mostra as 8 respostas individuais)
function quadroResultado(r, voce = false) {
  const [faixa, explica] = PRONTIDAO_TXT[r.prontidao];
  return h('div', {},
    h('p', { class: 'muted', style: 'margin:0' }, 'Resultado para compartilhar' + (r.nome ? ' · ' + r.nome : '')),
    h('p', { class: 'result-band' }, faixa),
    h('p', { style: 'margin-top:0' }, explica),
    (r.alertas || []).map(a => h('p', { class: 'status info', style: 'margin:8px 0' }, a)),
    h('div', { class: 'skills block', style: 'padding:16px 18px;margin:12px 0' },
      COMPS.map(c => h('div', {}, h('span', {}, HABILIDADES[c[0]][0]), h('span', {}, NIVEIS_TXT[r.competencias[c[0]]][0], ' ', bolinhas(r.competencias[c[0]]))))),
    h('p', { class: 'small muted' }, 'Respostas individuais de prontidão não são incluídas no resultado nem na impressão.'));
}

// ---------- arquivo entregue a cada pessoa ----------
function montarColaborador() {
  const ds = document.documentElement.dataset;
  const nome = ds.nome || '';
  const low = Number(ds.low ?? 1), high = Number(ds.high ?? 2);
  document.title = 'Autoavaliação individual' + (nome ? ' · ' + nome : '');
  const q = questionario({ nome, pedirNome: !nome, voce: true, low, high });
  const saida = h('div');
  const botao = h('button', { class: 'btn big', type: 'button', onclick: () => {
    aviso.textContent = '';
    let r;
    try { r = q.resultado(ds.codigo); } catch (e) { aviso.textContent = e.message; return; }
    const arquivo = `Resposta_${nomeArquivo(r.nome || r.codigo)}.json`;
    saida.replaceChildren(h('div', { class: 'block', style: 'border:2px solid var(--green)' },
      h('h2', {}, 'Resultado gerado'),
      h('p', { class: 'lead' }, 'Baixe o resultado e entregue o arquivo à liderança. O arquivo contém o código, a faixa de prontidão e os níveis de competências.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn big', type: 'button', onclick: () => {
        baixar(arquivo, JSON.stringify(r, null, 2), 'application/json;charset=utf-8');
        toast(`Resultado salvo como “${arquivo}”.`);
      } }, 'Baixar resultado (.json)')),
      h('p', { class: 'small muted' }, `Arquivo: “${arquivo}”.`),
      h('hr', { style: 'border:0;border-top:1px dashed var(--line);margin:18px 0' }),
      quadroResultado(r, true),
      h('p', { class: 'small muted' }, 'Se o navegador não baixar arquivos, mostre esta tela à liderança para transcrição. Ao concluir, feche a página.')));
    saida.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } }, 'Gerar meu resultado');
  const aviso = h('p', { role: 'alert', style: 'color:var(--alert);font-weight:700' });
  document.getElementById('root').append(h('div', { class: 'solo' },
    cabecalho('Como você se prepara para trabalhar com IA?', (nome ? (ds.codigo ? ds.codigo + ' · ' : '') + nome + '. ' : '') + 'Uma autoavaliação para orientar aprendizagem e conversar sobre a mudança no pequeno varejo.'),
    h('div', { class: 'privacy' }, 'As respostas de prontidão são processadas apenas nesta página. O arquivo de resultado contém seu código, a faixa de prontidão e os níveis de competências. Não inclui as oito respostas individuais.'),
    q.el, aviso, botao, saida));
}
