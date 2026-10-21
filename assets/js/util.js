// util.js
// Peças reutilizáveis da interface: criação de elementos, formatação, escolhas em botões,
// contador com − e +, janelas e downloads.

function h(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'hidden') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) e.append(c.nodeType ? c : String(c));
  return e;
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtN = x => isNum(x) ? x.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '—';
const fmtH = x => isNum(x) ? fmtN(x) + ' h' : '—';
const fmtR = x => isNum(x) ? x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
const fmtD = iso => iso ? iso.split('-').reverse().join('/') : '—';
const hoje = () => new Date().toISOString().slice(0, 10);
const plural = (n, um, varios) => n === 1 ? `1 ${um}` : `${n} ${varios}`;
const uid = () => Math.random().toString(36).slice(2, 9);

// Acrescenta filhos ignorando vazios e achatando listas (o append nativo escreveria "null" ou "[object HTMLElement]")
function put(el, ...kids) { for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false && c !== '') el.append(c.nodeType ? c : String(c)); return el; }

// Implementações de cada tela (preenchidas pelos arquivos em telas/)
const V = {};

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 4200);
}
function baixar(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = h('a', { href: url, download: nome, hidden: true });
  document.body.append(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
}
function abrirArquivo(accept, cb) {
  const inp = h('input', { type: 'file', accept, hidden: true });
  inp.addEventListener('change', () => {
    const f = inp.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { cb(r.result, f.name); } catch (e) { toast(e.message); } inp.remove(); };
    r.readAsText(f, 'utf-8');
  });
  document.body.append(inp); inp.click();
}
const nomeArquivo = s => String(s || 'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');

// Escolha única em botões grandes (rádios por baixo, para teclado e leitores de tela).
// opcoes: [[valor, rótulo, descrição?], ...]
function escolha(opcoes, valor, aoMudar, { cols = false, nome } = {}) {
  const grupo = nome || 'g' + uid();
  const wrap = h('div', { class: 'choices' + (cols ? ' cols' : ''), role: 'radiogroup' });
  for (const [v, rot, desc] of opcoes) {
    const inp = h('input', { type: 'radio', name: grupo, value: String(v), checked: valor !== null && valor !== undefined && String(valor) === String(v) });
    inp.addEventListener('change', () => aoMudar(v));
    wrap.append(h('label', { class: 'choice' }, inp, h('span', {}, rot, desc ? h('small', {}, desc) : null)));
  }
  return wrap;
}
const simNao = (valor, aoMudar) => escolha([['Sim', 'Sim'], ['Não', 'Não']], valor, aoMudar);

// Contador com botões − e +
function contador(valor, aoMudar, { passo = 1, min = 0, max = 9999, unidade = '', rotulo } = {}) {
  const inp = h('input', { type: 'number', inputmode: 'decimal', value: valor ?? '', min, max, step: passo, 'aria-label': rotulo });
  const definir = v => {
    v = Math.min(max, Math.max(min, Math.round(v / passo) * passo));
    inp.value = v; aoMudar(v);
  };
  inp.addEventListener('input', () => { const t = inp.value.replace(',', '.'); if (t === '') return aoMudar(null); const n = Number(t); if (Number.isFinite(n)) aoMudar(n); });
  inp.addEventListener('blur', () => { if (inp.value !== '') definir(Number(inp.value)); });
  return h('div', { class: 'stepper' },
    h('button', { type: 'button', 'aria-label': 'Diminuir', onclick: () => definir((Number(inp.value) || 0) - passo) }, '−'),
    inp,
    unidade ? h('span', { class: 'unit' }, unidade) : null,
    h('button', { type: 'button', 'aria-label': 'Aumentar', onclick: () => definir((Number(inp.value) || 0) + passo) }, '+'));
}

function texto(valor, aoMudar, attrs = {}) {
  return h('input', { class: 'in', type: 'text', value: valor ?? '', placeholder: attrs.placeholder, maxlength: attrs.maxlength || 80, oninput: e => aoMudar(e.target.value) });
}

// Bloco "pergunta + resposta"
function campo(pergunta, controle, dica) {
  const id = 'c' + uid();
  const temLabel = controle.matches && controle.matches('input, select, textarea');
  if (temLabel) controle.id = id;
  return h('div', { class: 'field' },
    temLabel ? h('label', { for: id }, pergunta) : h('div', { class: 'q' }, pergunta),
    dica ? h('span', { class: 'hint' }, dica) : null,
    controle);
}

function cabecalho(titulo, textoApoio) {
  return h('header', { class: 'head' }, h('h1', {}, titulo), textoApoio ? h('p', {}, textoApoio) : null);
}

function bolinhas(n) {
  const v = isNum(n) ? n : 0;
  return h('span', { class: 'dots', 'aria-label': isNum(n) ? NIVEIS_TXT[n][0] : 'não informado' }, '●'.repeat(v), h('i', {}, '●'.repeat(3 - v)));
}

// Janela (dialog). conteudo(corpo, rodape) monta o miolo; acoes = [{texto, classe, aoClicar}] onde aoClicar devolve true para fechar.
function janela({ titulo, subtitulo, montar, botaoOk = 'Salvar', aoConfirmar, larga }) {
  const msg = h('span', { class: 'dlg-msg', role: 'alert' });
  const corpo = h('div', { class: 'dlg-body' });
  const dlg = h('dialog', { 'aria-label': titulo, style: larga ? 'width:min(880px,calc(100vw - 24px))' : null });
  const fechar = () => { dlg.close(); dlg.remove(); };
  const ok = h('button', { class: 'btn', type: 'button', onclick: () => {
    msg.textContent = '';
    try { if (aoConfirmar() !== false) fechar(); } catch (e) { msg.textContent = e.message; }
  } }, botaoOk);
  const rodape = h('div', { class: 'dlg-foot' }, msg, h('button', { class: 'btn light', type: 'button', onclick: fechar }, 'Cancelar'), aoConfirmar ? ok : null);
  dlg.append(h('div', { class: 'dlg' },
    h('div', { class: 'dlg-head' }, h('div', {}, h('h2', {}, titulo), subtitulo ? h('p', {}, subtitulo) : null),
      h('button', { class: 'dlg-x', type: 'button', 'aria-label': 'Fechar', onclick: fechar }, '×')),
    corpo, rodape));
  dlg.addEventListener('cancel', e => { e.preventDefault(); fechar(); });
  document.body.append(dlg);
  const api = { corpo, rodape, ok, msg, fechar, erro: t => { msg.textContent = t; } };
  montar(corpo, api);
  dlg.showModal();
  corpo.scrollTop = 0;
  return api;
}
