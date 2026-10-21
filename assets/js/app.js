// app.js
// Menu lateral, troca de telas e inicialização. Carregado por último.

const VIEWS = [
  { id: 'inicio', marca: '⌂', label: 'Início' },
  { id: 'loja', n: 1, label: 'Negócio' },
  { id: 'equipe', n: 2, label: 'Equipe e autoavaliação' },
  { id: 'tarefas', n: 3, label: 'Tarefas' },
  { id: 'aprender', n: 4, label: 'Diagnóstico' },
  { id: 'plano', n: 5, label: 'Plano' },
  { sep: true },
  { id: 'ajuda', marca: '?', label: 'Guia' }
];
let mainEl, navEl, brandEl, savedEl;

function montarGestor() {
  brandEl = h('div', { class: 'brand' });
  navEl = h('nav', { class: 'nav', 'aria-label': 'Etapas' });
  for (const v of VIEWS) {
    if (v.sep) { navEl.append(h('div', { class: 'sep' })); continue; }
    navEl.append(h('button', { 'data-view': v.id, onclick: () => mostrar(v.id) }, h('span', { class: 'mark' }, v.n || v.marca), h('span', {}, v.label)));
  }
  savedEl = h('div', { class: 'saved' });
  const menu = h('details', {}, h('summary', {}, 'Mais opções'), h('div', { class: 'menu' },
    h('button', { onclick: guardarCopia }, 'Salvar cópia datada (.json)'),
    h('button', { onclick: abrirCopia }, 'Abrir cópia salva'),
    h('button', { onclick: importarCenario }, 'Importar cenário (.json)'),
    h('button', { onclick: () => { if (confirm('Substituir todos os dados pelo exemplo fictício do Mercado Aurora?\n\nSalve uma cópia datada antes, se precisar.')) { S = exemploMarcado(); update(); mostrar('inicio'); } } }, 'Carregar exemplo (Mercado Aurora)'),
    h('button', { onclick: () => { if (confirm('Apagar todos os dados e começar do zero?\n\nSalve uma cópia datada antes, se precisar.')) { S = vazioMarcado(); update(); mostrar('loja'); toast('Dados apagados. Comece pelo Negócio.'); } } }, 'Começar do zero')));
  mainEl = h('main', { id: 'main', tabindex: '-1' });
  document.getElementById('root').append(h('div', { class: 'app' },
    h('aside', { class: 'side' }, brandEl, navEl, h('div', { class: 'side-foot no-print' }, menu, savedEl)), mainEl));
  S = carregar(); R = compute(S);
  const hash = location.hash.slice(1);
  mostrar(V[hash] ? hash : 'inicio');
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (V[id] && id !== current) mostrar(id); });
}

function mostrar(id) {
  current = id;
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  mainEl.replaceChildren();
  V[id].render(mainEl);
  refresh();
  mainEl.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function refresh() {
  brandEl.replaceChildren(h('small', {}, 'Transição de competências para IA'), h('strong', {}, S.negocio.loja || 'Loja sem nome'));
  const e = etapas();
  for (const v of VIEWS) {
    if (v.sep) continue;
    const b = navEl.querySelector(`[data-view="${v.id}"]`);
    b.setAttribute('aria-current', v.id === current ? 'page' : 'false');
    const m = b.querySelector('.mark');
    const st = e[v.id];
    m.className = 'mark' + (st && st.feito ? ' done' : '') + (st && st.erro ? ' pend' : '');
    m.textContent = st && st.feito ? '✓' : (v.n || v.marca);
    b.title = st ? st.estado : '';
    if (v.id === current && navEl.scrollWidth > navEl.clientWidth) navEl.scrollLeft = Math.max(0, b.offsetLeft - 16);
  }
  savedEl.textContent = armazenamentoOK ? '✓ Salvo automaticamente neste navegador' : 'Este navegador não salva automaticamente. Use “Salvar cópia datada”.';
  V[current].refresh && V[current].refresh();
}

montarGestor();
