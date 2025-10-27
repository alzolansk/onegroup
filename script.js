// ===== Helpers =====
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtMoney = n => BRL.format(n || 0);
const parseMoney = (s) => {
  if (!s) return 0;
  const clean = String(s)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const x = Number(clean);
  return isFinite(x) ? x : 0;
};
const pad = (n) => String(n).padStart(2, '0');
const onlyMonth = (iso) => iso?.slice(0, 7); // YYYY-MM
const normalizeText = (value = '') => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// tema inicial (localStorage)
const THEME_KEY = 'og.theme';
const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
document.documentElement.classList.toggle('theme-light', savedTheme === 'light');
document.documentElement.classList.toggle('theme-dark',  savedTheme !== 'light');

// ===== Estado / Persistência =====
const KEY = 'og.ledger.v1';
let items;
let storageReset = false;
const rawItems = localStorage.getItem(KEY);
try {
  items = JSON.parse(rawItems || '[]');
} catch (err) {
  console.warn('Storage corrompido, reiniciando lista.', err);
  if (rawItems !== null) {
    localStorage.setItem(`${KEY}.backup`, rawItems);
  }
  items = [];
  storageReset = true;
  localStorage.setItem(KEY, JSON.stringify(items));
}
if (!Array.isArray(items)) {
  console.warn('Formato inesperado em localStorage. Resetando dados.');
  if (rawItems !== null) {
    localStorage.setItem(`${KEY}.backup`, rawItems);
  }
  items = [];
  storageReset = true;
  localStorage.setItem(KEY, JSON.stringify(items));
}

// cria demo se vazio
if (!items.length && !storageReset) {
  const now = new Date();
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  items = [
    { id: crypto.randomUUID(), data: `${y}-${m}-03`, descricao: 'Nicki minaj vinil', categoria: 'moradia', tipo: 'receita', valor: 3000 },
    { id: crypto.randomUUID(), data: `${y}-${m}-20`, descricao: 'asdsdsd', categoria: 'renda', tipo: 'receita', valor: 67.63 },
    { id: crypto.randomUUID(), data: `${y}-${m}-19`, descricao: 'Nicki minaj vinil', categoria: 'alimentação', tipo: 'receita', valor: 300 },
    { id: crypto.randomUUID(), data: `${y}-${m}-01`, descricao: 'Alimentação', categoria: 'alimentação', tipo: 'despesa', valor: 500 }
  ];
  localStorage.setItem(KEY, JSON.stringify(items));
}

// ===== UI Refs =====
const monthPicker   = document.getElementById('monthPicker');
const sumReceitas   = document.getElementById('sumReceitas');
const sumDespesas   = document.getElementById('sumDespesas');
const sumSaldo      = document.getElementById('sumSaldo');
const grandSaldo    = document.getElementById('grandSaldo');
const tbody         = document.getElementById('tbody');

const tipo          = document.getElementById('tipo');
const descricao     = document.getElementById('descricao');
const dataInput     = document.getElementById('data');
const categoria     = document.getElementById('categoria');
const valor         = document.getElementById('valor');
const addBtn        = document.getElementById('addBtn');

const filtroCategoria = document.getElementById('filtroCategoria');
const busca           = document.getElementById('busca');
const limparFiltros   = document.getElementById('limparFiltros');

// Modal / botão ver todos
const viewAllWrap   = document.getElementById('viewAllWrap');
const viewAllBtn    = document.getElementById('viewAllBtn');
const listModal     = document.getElementById('listModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalTbody    = document.getElementById('modalTbody');
const recurringModal   = document.getElementById('recurringModal');
const recurringContent = document.getElementById('recurringContent');
const recurringClose   = document.getElementById('recurringClose');
const recurringConfirm = document.getElementById('recurringConfirm');
let recurringContext = null;
let recurringLastFocus = null;

// ===== Configs =====
const MAX_ROWS = 3;

// ===== Estado de edição (INLINE) =====
let inlineEditingId = null; // <<-- IMPORTANTE: fora de função/loop

// ===== Inicialização =====
const now = new Date();
monthPicker.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

// ===== Listeners =====
monthPicker?.addEventListener('change', render);
filtroCategoria?.addEventListener('change', render);
busca?.addEventListener('input', render);
limparFiltros?.addEventListener('click', () => {
  filtroCategoria.value = '';
  busca.value = '';
  render();
});

// máscara simples de moeda on-blur (form de novo item)
valor?.addEventListener('blur', () => {
  const v = parseMoney(valor.value);
  valor.value = v ? v.toFixed(2).replace('.', ',') : '';
});

// add novo item (não é usado para editar)
addBtn?.addEventListener('click', () => {
    const t = tipo.value;
    const d = dataInput.value;
    const c = categoria.value;
    const desc = descricao.value.trim();
    const v = parseMoney(valor.value);

    if (!t) return alert('Selecione o tipo.');
    if (!d) return alert('Informe a data.');
    if (!c) return alert('Selecione a categoria.');
    if (!v || v <= 0) return alert('Informe um valor válido.');

    const newItem = { id: crypto.randomUUID(), tipo: t, data: d, categoria: c, descricao: desc, valor: v };
    items.unshift(newItem);
    localStorage.setItem(KEY, JSON.stringify(items));

    const suggested = suggestRecurring(newItem);
    if (!suggested) {
      toast('Movimentação adicionada!', 'success');
    }

    tipo.value = '';
    descricao.value = '';
    dataInput.value = '';
    categoria.value = '';
    valor.value = '';

    render();
});

// ===== Funções =====
function bindRowActions(container) {
  if (!container) return;

  container.querySelectorAll('button[data-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.getAttribute('data-id');
      const act = btn.getAttribute('data-act');

      // EDITAR -> entra em modo inline
      if (act === 'edit') {
        inlineEditingId = id;
        render();

        // máscara de valor nos inputs inline (opcional)
        const rowEl = (tbody.querySelector(`button[data-id="${id}"][data-act="save"]`) || modalTbody.querySelector(`button[data-id="${id}"][data-act="save"]`))?.closest('.trow');
        const valInput = rowEl?.querySelector('[data-field="valor"]');
        valInput?.addEventListener('blur', () => {
          const v = parseMoney(valInput.value);
          valInput.value = v ? v.toFixed(2).replace('.', ',') : '';
        });

        return;
      }

      // SALVAR -> lê inputs inline e persiste
      if (act === 'save') {
        const rowEl = btn.closest('.trow');
        if (!rowEl) return;

        const get = (f) => rowEl.querySelector(`[data-field="${f}"]`);
        const newData = (get('data')?.value || '').trim();        // YYYY-MM-DD
        const newDesc = (get('descricao')?.value || '').trim();
        const newCat  = (get('categoria')?.value || '').trim();
        const newTipo = (get('tipo')?.value || '').trim();
        const newVal  = parseMoney(get('valor')?.value || '');

        if (!newData) return alert('Informe a data.');
        if (!newCat)  return alert('Selecione a categoria.');
        if (!newTipo) return alert('Selecione o tipo.');
        if (!newVal || newVal <= 0) return alert('Informe um valor válido.');

        const idx = items.findIndex(x => x.id === id);
        if (idx >= 0) {
          items[idx] = { ...items[idx], data: newData, descricao: newDesc, categoria: newCat, tipo: newTipo, valor: newVal };
          localStorage.setItem(KEY, JSON.stringify(items));
          toast('Movimentação salva!', 'success');
        }

        inlineEditingId = null;
        render();
        return;
      }
      

      // EXCLUIR
      if (act === 'del') {
        if (confirm('Excluir este lançamento?')) {
          items = items.filter(x => x.id !== id);
          localStorage.setItem(KEY, JSON.stringify(items));
          toast('Movimentação excluída.', 'error');
          render();
        }
      }
    });
  });
}

// refs do modal de gráfico
const chartModal  = document.getElementById('chartModal');
const chartClose  = document.getElementById('chartClose');
const chartTitle  = document.getElementById('chartTitle');
const chartCanvas = document.getElementById('chartCanvas').getContext('2d');

let chartInstance = null;

// paleta por categoria (fixa pra ficar consistente)
const CAT_COLORS = {
  'alimentação': '#f59e0b', // laranja
  'renda':       '#0ea5e9', // azul claro
  'moradia':     '#8b5cf6', // roxo
  'transporte':  '#14b8a6', // teal
  'lazer':       '#eab308', // amarelo
  'saúde':       '#ef4444', // vermelho
  'educação':    '#10b981', // verde
  'outros':      '#64748b'  // slate
};

function openChartModal(kind) {
  // kind: 'receita' | 'despesa'
  const month = monthPicker.value; // YYYY-MM
  const monthItems = items.filter(i => i.data?.slice(0,7) === month && i.tipo === (kind === 'receita' ? 'receita' : 'despesa'));

  // agrupa por categoria
  const map = {};
  for (const it of monthItems) {
    const c = it.categoria || 'outros';
    map[c] = (map[c] || 0) + it.valor;
  }
  const labels = Object.keys(map);
  const data   = Object.values(map);

  chartTitle.textContent = kind === 'receita' ? 'Receitas por categoria (mês selecionado)' : 'Despesas por categoria (mês selecionado)';

  // cores coerentes
  const bg = labels.map(l => CAT_COLORS[l] || '#94a3b8');
  const border = bg.map(() => getComputedStyle(document.documentElement).getPropertyValue('--surface') || '#fff');

  // destrói gráfico antigo
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: bg.map(hex => hex + 'cc'), // leve transparência
        borderColor: '#0000', // sem borda
        hoverOffset: 8
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text') || '#fff',
            boxWidth: 14,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw ?? 0;
              return ` ${ctx.label}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}`;
            }
          }
        }
      },
      layout: { padding: 6 },
      cutout: '56%' // donut mais bonito
    }
  });

  // abre modal
  chartModal.style.display = 'flex';
  chartClose.focus();
}

// fechar modal gráfico
chartClose?.addEventListener('click', () => chartModal.style.display = 'none');
chartModal?.addEventListener('click', (e) => { if (e.target === chartModal) chartModal.style.display = 'none'; });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') chartModal.style.display = 'none'; });

// eventos dos botões
document.getElementById('btnChartReceitas')?.addEventListener('click', () => openChartModal('receita'));
document.getElementById('btnChartDespesas')?.addEventListener('click', () => openChartModal('despesa'));

// Modal (abrir/fechar)
let lastFocus = null;
function openModal() {
  lastFocus = document.activeElement;
  listModal.style.display = 'flex';
  closeModalBtn.focus();
}
function closeModal() {
  listModal.style.display = 'none';
  if (lastFocus) lastFocus.focus();
}
viewAllBtn?.addEventListener('click', openModal);
closeModalBtn?.addEventListener('click', closeModal);
listModal?.addEventListener('click', (e) => { if (e.target === listModal) closeModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ===== Render =====
function render() {
  const month = monthPicker.value; // YYYY-MM
  const q = busca.value?.trim().toLowerCase() || '';
  const cat = filtroCategoria.value || '';

  // itens do mês (sem filtro de busca/categoria)
  const monthItems = items.filter(i => onlyMonth(i.data) === month);

  // itens visíveis (com filtro de busca/categoria)
  const visible = monthItems.filter(i => {
    if (cat && i.categoria !== cat) return false;
    if (q && !`${i.descricao}`.toLowerCase().includes(q)) return false;
    return true;
  });

  // totais com base nos visíveis
  const receitas = visible.filter(i => i.tipo === 'receita').reduce((a, b) => a + b.valor, 0);
  const despesas = visible.filter(i => i.tipo === 'despesa').reduce((a, b) => a + b.valor, 0);
  const saldo = receitas - despesas;

  sumReceitas.textContent = fmtMoney(receitas);
  sumDespesas.textContent = fmtMoney(despesas);
  sumSaldo.textContent = fmtMoney(saldo);
  if (grandSaldo) {
    grandSaldo.textContent = fmtMoney(saldo);
  }

  sumSaldo.classList.remove('green', 'red');
  grandSaldo?.classList.remove('green', 'red');
  if (saldo >= 0) {
    sumSaldo.classList.add('green');
    grandSaldo?.classList.add('green');
  } else {
    sumSaldo.classList.add('red');
    grandSaldo?.classList.add('red');
  }

  // limpa tabela principal
  tbody.innerHTML = '';

  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'trow';
    empty.innerHTML = '<div style="grid-column: 1 / -1; color:#9aa3b2">Sem lançamentos para este mês.</div>';
    tbody.appendChild(empty);
  } else {
    const limited = visible.slice(0, MAX_ROWS);
    for (const i of limited) {
      const row = document.createElement('div');
      row.className = 'trow';

      const isEditing = i.id === inlineEditingId;

      const dateObj = new Date(i.data + 'T00:00:00');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dateObj.getFullYear();
      const dataFmt = `${dd}/${mm}/${yyyy}`;

      const valueClass = i.tipo === 'despesa' ? 'negative' : 'positive';
      const sign = i.tipo === 'despesa' ? '-' : '+';

      row.innerHTML = isEditing
        ? `
          <div>
            <input class="inline-control" type="date" value="${i.data}" data-field="data" />
          </div>
          <div>
            <input class="inline-control" type="text" value="${i.descricao || ''}" placeholder="descrição" data-field="descricao" />
          </div>
          <div>
            <select class="inline-control" data-field="categoria">
              <option value="alimentação" ${i.categoria==='alimentação'?'selected':''}>alimentação</option>
              <option value="renda" ${i.categoria==='renda'?'selected':''}>renda</option>
              <option value="moradia" ${i.categoria==='moradia'?'selected':''}>moradia</option>
              <option value="transporte" ${i.categoria==='transporte'?'selected':''}>transporte</option>
              <option value="lazer" ${i.categoria==='lazer'?'selected':''}>lazer</option>
              <option value="saúde" ${i.categoria==='saúde'?'selected':''}>saúde</option>
              <option value="educação" ${i.categoria==='educação'?'selected':''}>educação</option>
              <option value="outros" ${i.categoria==='outros'?'selected':''}>outros</option>
            </select>
          </div>
          <div>
            <select class="inline-control" data-field="tipo">
              <option value="receita" ${i.tipo==='receita'?'selected':''}>receita</option>
              <option value="despesa" ${i.tipo==='despesa'?'selected':''}>despesa</option>
            </select>
          </div>
          <div>
            <input class="inline-control align-right" type="text" value="${i.valor.toFixed(2).replace('.', ',')}" data-field="valor" />
          </div>
          <div class="actions">
            <button class="btn small" data-act="save" data-id="${i.id}">salvar</button>
            <button class="btn small red" data-act="del" data-id="${i.id}">excluir</button>
          </div>
        `
        : `
          <div>${dataFmt}</div>
          <div>${i.descricao || '<span style="color:#6e7796">—</span>'}</div>
          <div><span class="chip">${i.categoria}</span></div>
          <div>${i.tipo}</div>
          <div class="value ${valueClass}">${sign} ${fmtMoney(i.valor)}</div>
          <div class="actions">
            <button class="btn small" data-act="edit" data-id="${i.id}">editar</button>
            <button class="btn small red" data-act="del" data-id="${i.id}">excluir</button>
          </div>
        `;

      tbody.appendChild(row);
    }
  }

  // botão "ver todos" pelo total do mês (independe dos filtros)
  const hasOverflow = (monthItems.length > MAX_ROWS);
  viewAllWrap.style.display = hasOverflow ? 'flex' : 'none';

  // monta modal com TODAS do mês
  modalTbody.innerHTML = '';
  if (hasOverflow) {
    for (const i of monthItems) {
      const row = document.createElement('div');
      row.className = 'trow';

      const isEditing = i.id === inlineEditingId;

      const dateObj = new Date(i.data + 'T00:00:00');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dateObj.getFullYear();
      const dataFmt = `${dd}/${mm}/${yyyy}`;

      const valueClass = i.tipo === 'despesa' ? 'negative' : 'positive';
      const sign = i.tipo === 'despesa' ? '-' : '+';

      row.innerHTML = isEditing
        ? `
          <div>
            <input class="inline-control" type="date" value="${i.data}" data-field="data" />
          </div>
          <div>
            <input class="inline-control" type="text" value="${i.descricao || ''}" placeholder="descrição" data-field="descricao" />
          </div>
          <div>
            <select class="inline-control" data-field="categoria">
              <option value="alimentação" ${i.categoria==='alimentação'?'selected':''}>alimentação</option>
              <option value="renda" ${i.categoria==='renda'?'selected':''}>renda</option>
              <option value="moradia" ${i.categoria==='moradia'?'selected':''}>moradia</option>
              <option value="transporte" ${i.categoria==='transporte'?'selected':''}>transporte</option>
              <option value="lazer" ${i.categoria==='lazer'?'selected':''}>lazer</option>
              <option value="saúde" ${i.categoria==='saúde'?'selected':''}>saúde</option>
              <option value="educação" ${i.categoria==='educação'?'selected':''}>educação</option>
              <option value="outros" ${i.categoria==='outros'?'selected':''}>outros</option>
            </select>
          </div>
          <div>
            <select class="inline-control" data-field="tipo">
              <option value="receita" ${i.tipo==='receita'?'selected':''}>receita</option>
              <option value="despesa" ${i.tipo==='despesa'?'selected':''}>despesa</option>
            </select>
          </div>
          <div>
            <input class="inline-control align-right" type="text" value="${i.valor.toFixed(2).replace('.', ',')}" data-field="valor" />
          </div>
          <div class="actions">
            <button class="btn small" data-act="save" data-id="${i.id}">salvar</button>
            <button class="btn small red" data-act="del" data-id="${i.id}">excluir</button>
          </div>
        `
        : `
          <div>${dataFmt}</div>
          <div>${i.descricao || '<span style="color:#6e7796">—</span>'}</div>
          <div><span class="chip">${i.categoria}</span></div>
          <div>${i.tipo}</div>
          <div class="value ${valueClass}">${sign} ${fmtMoney(i.valor)}</div>
          <div class="actions">
            <button class="btn small" data-act="edit" data-id="${i.id}">editar</button>
            <button class="btn small red" data-act="del" data-id="${i.id}">excluir</button>
          </div>
        `;

      modalTbody.appendChild(row);
    }
  }

  // ligar ações nos dois lugares
  bindRowActions(tbody);
  bindRowActions(modalTbody);
}

function toast(message, type = 'info', ms = 3000, opts = {}) {
    const host = document.getElementById('toaster');
    if (!host) return;

    const config = opts || {};
    const autoClose = typeof config.duration === 'number' ? config.duration : ms;

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const actionMarkup = config.action?.label
      ? `<button class="toast-action" type="button">${config.action.label}</button>`
      : '';

    el.innerHTML = `
    <div class="icon">
        ${
        type === 'success'
            ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2ecc71" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>`
            : type === 'error'
            ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff4d4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
            : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#3a63ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16" r="1.2"/></svg>`
        }
    </div>
    <div class="msg">
      <span>${message}</span>
      ${actionMarkup}
    </div>
    <button class="close" aria-label="fechar">
        <svg viewBox="0 0 24 24" width="20" height="20">
        <line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
    </button>
    `;

    const closeBtn = el.querySelector('.close');
    const actionBtn = el.querySelector('.toast-action');
    let timer = null;
    let dismissed = false;

    function dismiss(node) {
        if (dismissed) return;
        dismissed = true;
        if (timer) clearTimeout(timer);
        node.style.animation = 'toast-out .2s ease-in forwards';
        node.addEventListener('animationend', () => node.remove(), { once: true });
    }

    closeBtn?.addEventListener('click', () => dismiss(el));
    actionBtn?.addEventListener('click', () => {
        if (typeof config.action?.onClick === 'function') {
            config.action.onClick();
        }
        dismiss(el);
    });

    if (autoClose > 0) {
        timer = setTimeout(() => dismiss(el), autoClose);
    }

    host.appendChild(el);
}

function collectRecurringMonths(item, horizon = 6) {
  if (!item?.data) return [];

  const descKey = normalizeText(item.descricao);
  if (!descKey) return [];

  const baseDate = new Date(item.data + 'T00:00:00');
  if (Number.isNaN(baseDate.getTime())) return [];

  const baseDay = baseDate.getDate();
  const sameType = item.tipo;
  const options = [];

  for (let offset = 1; offset <= horizon; offset += 1) {
    const future = new Date(baseDate);
    future.setDate(1);
    future.setMonth(future.getMonth() + offset);

    const year = future.getFullYear();
    const month = future.getMonth();
    const monthKey = `${year}-${pad(month + 1)}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(baseDay, daysInMonth);
    const isoDate = `${monthKey}-${pad(day)}`;

    const exists = items.some(entry => {
      if (!entry) return false;
      if (entry.tipo !== sameType) return false;
      if (!entry.descricao) return false;
      if (normalizeText(entry.descricao) !== descKey) return false;
      return onlyMonth(entry.data) === monthKey;
    });

    const labelRaw = future.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const label = labelRaw ? labelRaw.charAt(0).toUpperCase() + labelRaw.slice(1) : monthKey;

    options.push({
      monthKey,
      date: isoDate,
      label,
      disabled: exists,
      reason: exists ? 'Ja existe lancamento semelhante neste mes' : ''
    });
  }

  return options;
}

function renderRecurringModal() {
  if (!recurringContent) return;

  recurringContent.innerHTML = '';

  if (!recurringContext) {
    recurringContent.innerHTML = '<p class="repeat-empty">Selecione uma movimentacao para continuar.</p>';
    recurringConfirm?.setAttribute('disabled', 'disabled');
    return;
  }

  const months = collectRecurringMonths(recurringContext);
  if (!months.length) {
    recurringContent.innerHTML = '<p class="repeat-empty">Nao ha meses futuros disponiveis.</p>';
    recurringConfirm?.setAttribute('disabled', 'disabled');
    return;
  }

  let hasSelectable = false;

  months.forEach(opt => {
    const label = document.createElement('label');
    label.className = `repeat-option${opt.disabled ? ' disabled' : ''}`;

    const [year, month, day] = opt.date.split('-');
    const friendlyDate = `${day}/${month}/${year}`;
    const hint = opt.disabled ? opt.reason : `Criar lancamento em ${friendlyDate}`;

    label.innerHTML = `
      <input type="checkbox" ${opt.disabled ? 'disabled' : 'checked'} data-month="${opt.monthKey}" data-date="${opt.date}">
      <div class="repeat-meta">
        <strong>${opt.label}</strong>
        <small>${hint}</small>
      </div>
    `;

    recurringContent.appendChild(label);

    if (!opt.disabled) hasSelectable = true;
  });

  if (hasSelectable) {
    recurringConfirm?.removeAttribute('disabled');
  } else {
    recurringConfirm?.setAttribute('disabled', 'disabled');
  }
}

function closeRecurringModal() {
  if (!recurringModal) return;
  recurringModal.style.display = 'none';
  recurringContent?.replaceChildren();

  recurringContext = null;

  if (recurringLastFocus) {
    recurringLastFocus.focus();
    recurringLastFocus = null;
  }
}

function handleRecurringConfirm() {
  if (!recurringContent || !recurringContext) return;

  const selected = Array.from(recurringContent.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)'));
  if (!selected.length) {
    toast('Selecione ao menos um mes.', 'info');
    return;
  }

  const descKey = normalizeText(recurringContext.descricao);
  const template = { ...recurringContext };
  const created = [];

  selected.forEach(input => {
    const iso = input.getAttribute('data-date');
    const monthKey = input.getAttribute('data-month');
    if (!iso || !monthKey) return;

    const alreadyExists = items.some(entry =>
      entry &&
      entry.tipo === template.tipo &&
      normalizeText(entry.descricao) === descKey &&
      onlyMonth(entry.data) === monthKey
    );
    if (alreadyExists) return;

    const clone = {
      ...template,
      id: crypto.randomUUID(),
      data: iso
    };
    created.push(clone);
    items.unshift(clone);
  });

  if (!created.length) {
    toast('Nada a adicionar: os meses selecionados ja possuem lancamentos.', 'info');
    closeRecurringModal();
    return;
  }

  localStorage.setItem(KEY, JSON.stringify(items));
  toast(`Movimentacao replicada em ${created.length} ${created.length === 1 ? 'mes' : 'meses'}.`, 'success');
  closeRecurringModal();
  render();
}

function suggestRecurring(item) {
  if (!item) return false;

  const descKey = normalizeText(item.descricao);
  if (!descKey) return false;

  const monthKey = onlyMonth(item.data);
  if (!monthKey) return false;

  const sameType = item.tipo;
  let matches = 0;
  let matchesOtherMonths = 0;

  for (const entry of items) {
    if (!entry) continue;
    if (entry.id === item.id) continue;
    if (entry.tipo !== sameType) continue;
    if (!entry.descricao) continue;

    if (normalizeText(entry.descricao) === descKey) {
      matches += 1;
      if (onlyMonth(entry.data) !== monthKey) {
        matchesOtherMonths += 1;
      }
    }
  }

  if (!matches || !matchesOtherMonths) return false;

  const months = collectRecurringMonths(item);
  const hasSelectable = months.some(opt => !opt.disabled);
  if (!hasSelectable) return false;

  toast('Movimentacao adicionada! Deseja aplicar nos proximos meses?', 'success', 8000, {
    action: {
      label: 'Escolher meses',
      onClick: () => openRecurringModal(item)
    },
    duration: 8000
  });

  return true;
}

function openRecurringModal(item) {
  if (!item || !recurringModal || !recurringContent) return;

  recurringContext = item;
  const activeEl = document.activeElement;
  recurringLastFocus = (activeEl && typeof activeEl.focus === 'function') ? activeEl : null;

  renderRecurringModal();

  recurringModal.style.display = 'flex';

  setTimeout(() => {
    const firstInput = recurringContent.querySelector('input[type="checkbox"]:not(:disabled)');
    if (firstInput) {
      firstInput.focus();
    } else {
      recurringClose?.focus();
    }
  }, 0);
}

recurringClose?.addEventListener('click', closeRecurringModal);
recurringModal?.addEventListener('click', (e) => {
  if (e.target === recurringModal) closeRecurringModal();
});
recurringConfirm?.addEventListener('click', handleRecurringConfirm);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && recurringModal?.style.display === 'flex') {
    closeRecurringModal();
  }
});

const themeToggle = document.getElementById('themeToggle');
themeToggle?.addEventListener('click', () => {
  const isLight = document.documentElement.classList.contains('theme-light');
  // alterna classes
  document.documentElement.classList.toggle('theme-light', !isLight);
  document.documentElement.classList.toggle('theme-dark',  isLight);
  // salva
  localStorage.setItem(THEME_KEY, !isLight ? 'light' : 'dark');
});


render();
