// ===== Authentication Check =====
const currentUser = localStorage.getItem('onegroup_current_user');
if (!currentUser) {
    window.location.href = 'login.html';
}

// Display username in workspace pill
const workspacePill = document.getElementById('workspacePill');
if (workspacePill && currentUser) {
    workspacePill.textContent = currentUser;
}

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

const SETTINGS_KEY = 'og.settings.v1';
const defaultSettings = { budget: 0, widgetCollapsed: false };
let settings = { ...defaultSettings };
try {
  const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  if (savedSettings && typeof savedSettings === 'object') {
    settings = { ...defaultSettings, ...savedSettings };
  }
} catch (err) {
  console.warn('Falha ao carregar configuracoes, usando padrao.', err);
  settings = { ...defaultSettings };
}
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Nao foi possivel salvar configuracoes.', err);
  }
}

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
const monthTextEl   = document.getElementById('monthText');

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
const insightsBtn      = document.getElementById('insightsBtn');
const insightsModal    = document.getElementById('insightsModal');
const insightsClose    = document.getElementById('insightsClose');
const budgetEdit       = document.getElementById('budgetEdit');
const economyCard      = document.getElementById('economyCard');
const economySummary   = document.getElementById('economySummary');
const economyDetail    = document.getElementById('economyDetail');
const dailyAverageValue  = document.getElementById('dailyAverageValue');
const dailyAverageDetail = document.getElementById('dailyAverageDetail');
const forecastValue    = document.getElementById('forecastValue');
const forecastDetail   = document.getElementById('forecastDetail');
const trendSubtitle    = document.getElementById('trendSubtitle');
const categorySubtitle = document.getElementById('categorySubtitle');
const insightListEl    = document.getElementById('insightList');
const trendCanvasEl    = document.getElementById('trendChart');
const categoryCanvasEl = document.getElementById('categoryChart');
const dailyWidget      = document.getElementById('dailyWidget');
const dailyWidgetClose = document.getElementById('dailyWidgetClose');
const dailyWidgetOpen  = document.getElementById('dailyWidgetOpen');
const dailySpendEl     = document.getElementById('dailySpend');
const dailyRemainingEl = document.getElementById('dailyRemaining');
const dailySpendLabel  = document.getElementById('dailySpendLabel');
let recurringContext = null;
let recurringLastFocus = null;

let insightsLastFocus = null;
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
  filtroCategoriaSelect?.setValue(''); // Reset custom select
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
    tipoSelect?.setValue(''); // Reset custom select
    descricao.value = '';
    dataInput.value = '';
    categoria.value = '';
    categoriaSelect?.setValue(''); // Reset custom select
    valor.value = '';

    render();
});

budgetEdit?.addEventListener('click', handleBudgetEdit);

insightsBtn?.addEventListener('click', openInsightsModal);
insightsClose?.addEventListener('click', closeInsightsModal);
insightsModal?.addEventListener('click', (e) => { if (e.target === insightsModal) closeInsightsModal(); });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && insightsModal?.style.display === 'flex') {
    closeInsightsModal();
  }
});

// fecha o widget pelo botão "x"
dailyWidgetClose?.addEventListener('click', (event) => {
  event.preventDefault();
  
  // Adiciona animação de saída
  if (dailyWidget && !dailyWidget.hidden) {
    dailyWidget.style.animation = 'widget-slide-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    
    setTimeout(() => {
      settings.widgetCollapsed = true;
      saveSettings();
      applyWidgetState();
      
      if (dailyWidgetOpen && !dailyWidgetOpen.hidden) {
        dailyWidgetOpen.focus();
      }
    }, 300);
  }
});

// segurança: delega o clique no container (caso o alvo mude)
dailyWidget?.addEventListener('click', (e) => {
  const closeHit = e.target?.closest?.('#dailyWidgetClose');
  if (closeHit) {
    e.preventDefault();
    
    // Adiciona animação de saída
    if (dailyWidget && !dailyWidget.hidden) {
      dailyWidget.style.animation = 'widget-slide-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
      
      setTimeout(() => {
        settings.widgetCollapsed = true;
        saveSettings();
        applyWidgetState();
        
        if (dailyWidgetOpen && !dailyWidgetOpen.hidden) {
          dailyWidgetOpen.focus();
        }
      }, 300);
    }
  }
});
dailyWidgetOpen?.addEventListener('click', (event) => {
  event.preventDefault();
  settings.widgetCollapsed = false;
  saveSettings();
  applyWidgetState();
  if (dailyWidgetClose) {
    dailyWidgetClose.focus();
  }
});

// acessibilidade: fechar com ESC quando visível
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dailyWidget && !dailyWidget.hidden) {
    // Adiciona animação de saída
    dailyWidget.style.animation = 'widget-slide-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    
    setTimeout(() => {
      settings.widgetCollapsed = true;
      saveSettings();
      applyWidgetState();
      
      if (dailyWidgetOpen && !dailyWidgetOpen.hidden) {
        dailyWidgetOpen.focus();
      }
    }, 300);
  }
});

applyWidgetState();

// ===== Funções =====
function bindRowActions(container) {
  if (!container) return;

  container.querySelectorAll('button[data-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id  = btn.getAttribute('data-id');
      const act = btn.getAttribute('data-act');

      // EDITAR -> entra em modo inline
      if (act === 'edit') {
        const rowEl = btn.closest('.trow');
        
        // Adiciona efeito de "preparação" antes da transição
        if (rowEl) {
          rowEl.querySelectorAll('.editable-field').forEach((field, index) => {
            field.style.transition = 'all 0.2s ease';
            field.style.transform = 'scale(1.02)';
            field.style.background = 'color-mix(in oklab, var(--brand) 12%, transparent)';
            
            setTimeout(() => {
              field.style.transform = 'scale(1)';
              field.style.background = 'transparent';
            }, 150 + (index * 30));
          });
        }

        // Define o ID de edição e re-renderiza após um delay para a animação
        setTimeout(() => {
          inlineEditingId = id;
          render();

          // Foco automático no primeiro campo editável
          setTimeout(() => {
            const newRowEl = (tbody.querySelector(`button[data-id="${id}"][data-act="save"]`) || modalTbody.querySelector(`button[data-id="${id}"][data-act="save"]`))?.closest('.trow');
            const firstInput = newRowEl?.querySelector('.inline-control');
            firstInput?.focus();

            // máscara de valor nos inputs inline
            const valInput = newRowEl?.querySelector('[data-field="valor"]');
            valInput?.addEventListener('blur', () => {
              const v = parseMoney(valInput.value);
              valInput.value = v ? v.toFixed(2).replace('.', ',') : '';
            });
          }, 100);
        }, 300);

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

        // Animação de saída suave
        const inputs = rowEl.querySelectorAll('.inline-control');
        inputs.forEach((input, index) => {
          input.style.animation = `field-fade-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards`;
          input.style.animationDelay = `${index * 50}ms`;
        });

        // Aguarda animação antes de re-renderizar
        setTimeout(() => {
          inlineEditingId = null;
          render();
        }, 400);
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

const trendCanvasCtx    = trendCanvasEl && typeof trendCanvasEl.getContext === 'function' ? trendCanvasEl.getContext('2d') : null;
const categoryCanvasCtx = categoryCanvasEl && typeof categoryCanvasEl.getContext === 'function' ? categoryCanvasEl.getContext('2d') : null;

let trendChartInstance = null;
let categoryChartInstance = null;
let insightsChartsDirty = true;

const analyticsState = {
  monthKey: '',
  monthReceitas: 0,
  monthDespesas: 0,
  monthSaldo: 0,
  progressRatio: 1,
  averageValor: 0,
  averageDetail: '',
  forecastValor: 0,
  forecastDetail: '',
  categories: [],
  series: [],
  insights: [],
  trendSubtitle: '',
  categorySubtitle: ''
};

const triggeredAlerts = new Set();

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

function parseMonthKey(monthKey) {
  if (!monthKey) return null;
  const parts = String(monthKey).split('-');
  if (parts.length !== 2) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!year || !month) return null;
  return { year, month };
}

function formatMonthLabel(monthKey, style = 'long') {
  const parts = parseMonthKey(monthKey);
  if (!parts) return monthKey || '';
  const date = new Date(parts.year, parts.month - 1, 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  const options = style === 'short'
    ? { month: 'short', year: '2-digit' }
    : { month: 'long', year: 'numeric' };
  let label = date.toLocaleString('pt-BR', options);
  if (!label) return monthKey;
  label = label.charAt(0).toUpperCase() + label.slice(1);
  return label;
}

function buildMonthlySnapshot() {
  const map = new Map();
  for (const entry of items) {
    if (!entry?.data) continue;
    const monthKey = onlyMonth(entry.data);
    if (!monthKey) continue;
    if (!map.has(monthKey)) {
      map.set(monthKey, {
        receitas: 0,
        despesas: 0,
        saldo: 0,
        categorias: new Map()
      });
    }
    const bucket = map.get(monthKey);
    if (entry.tipo === 'receita') {
      bucket.receitas += entry.valor;
    } else if (entry.tipo === 'despesa') {
      bucket.despesas += entry.valor;
      const cat = entry.categoria || 'outros';
      bucket.categorias.set(cat, (bucket.categorias.get(cat) || 0) + entry.valor);
    }
    bucket.saldo = bucket.receitas - bucket.despesas;
  }
  return map;
}

function computeDailyAverageInfo(monthKey, totalDespesas) {
  const parts = parseMonthKey(monthKey);
  if (!parts) {
    return {
      value: 0,
      detail: 'Selecione um mes valido.',
      daysElapsed: 0,
      daysInMonth: 0,
      isCurrent: false,
      progress: 1
    };
  }
  const { year, month } = parts;
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrent = today.getFullYear() === year && (today.getMonth() + 1) === month;
  const daysElapsed = isCurrent ? Math.max(1, Math.min(today.getDate(), daysInMonth)) : daysInMonth;
  const average = totalDespesas / Math.max(1, daysElapsed);
  const detail = isCurrent
    ? `Ritmo ate o dia ${String(daysElapsed).padStart(2, '0')} de ${daysInMonth}.`
    : `Media distribuida pelos ${daysInMonth} dias do mes.`;
  return {
    value: average,
    detail,
    daysElapsed,
    daysInMonth,
    isCurrent,
    progress: daysInMonth ? (daysElapsed / daysInMonth) : 1
  };
}

function computeForecastInfo(monthKey, totalDespesas, monthlyMap, averageInfo) {
  const monthsSorted = Array.from(monthlyMap.keys()).sort();
  const currentIndex = monthsSorted.indexOf(monthKey);
  const prevKeys = currentIndex > 0 ? monthsSorted.slice(Math.max(0, currentIndex - 3), currentIndex) : [];
  const prevValues = prevKeys.map(key => Math.max(0, monthlyMap.get(key)?.despesas || 0));
  const avgPrev = prevValues.length ? prevValues.reduce((acc, val) => acc + val, 0) / prevValues.length : 0;
  let forecast = totalDespesas;
  let detail = 'Sem historico suficiente para prever.';
  const progress = averageInfo?.progress ?? 1;
  const isCurrent = averageInfo?.isCurrent;

  if (isCurrent && progress < 0.99) {
    const paceProjection = progress > 0 ? totalDespesas / Math.max(progress, 0.1) : totalDespesas;
    if (avgPrev > 0) {
      forecast = (paceProjection * 0.6) + (avgPrev * 0.4);
      detail = `Media ponderada do ritmo atual com os ultimos ${prevValues.length} meses.`;
    } else {
      forecast = paceProjection;
      detail = 'Estimativa baseada no ritmo do mes atual.';
    }
  } else if (avgPrev > 0) {
    forecast = avgPrev;
    detail = `Media simples dos ultimos ${prevValues.length} meses.`;
  }

  forecast = Math.max(forecast, totalDespesas);
  return {
    value: forecast,
    detail,
    prevKeys,
    avgPrev
  };
}

function updateInsightList(list) {
  if (!insightListEl) return;
  insightListEl.innerHTML = '';
  if (!Array.isArray(list) || !list.length) {
    const li = document.createElement('li');
    li.innerHTML = '<strong>Nenhum insight ainda</strong><span>Adicione movimentacoes ou defina metas para habilitar as sugestoes.</span>';
    insightListEl.appendChild(li);
    return;
  }
  list.forEach(item => {
    const li = document.createElement('li');
    if (item.tag) {
      const tag = document.createElement('span');
      tag.className = 'insight-tag';
      tag.textContent = item.tag;
      li.appendChild(tag);
    }
    if (item.title) {
      const title = document.createElement('strong');
      title.textContent = item.title;
      li.appendChild(title);
    }
    if (item.detail) {
      const detail = document.createElement('span');
      detail.textContent = item.detail;
      li.appendChild(detail);
    }
    insightListEl.appendChild(li);
  });
}

function emitCategoryAlerts(monthKey, categoriasMap, totalDespesas) {
  if (!categoriasMap || !categoriasMap.size || !totalDespesas) return;
  categoriasMap.forEach((valor, cat) => {
    if (!valor) return;
    const share = valor / totalDespesas;
    if (share >= 0.6) {
      const id = `cat:${monthKey}:${cat}`;
      if (triggeredAlerts.has(id)) return;
      triggeredAlerts.add(id);
      const pct = Math.round(share * 100);
      toast(`A categoria ${cat} responde por ${pct}% das despesas do mes.`, 'error', 5000);
    }
  });
}

function emitBudgetAlert(monthKey, totalDespesas, budget) {
  if (!budget || totalDespesas <= budget) return;
  const id = `budget:${monthKey}`;
  if (triggeredAlerts.has(id)) return;
  triggeredAlerts.add(id);
  const diff = totalDespesas - budget;
  toast(`Meta de gastos ultrapassada em ${fmtMoney(diff)}.`, 'error', 5000);
}

function updateEconomyCardDisplay(budget, totalDespesas) {
  if (!economySummary || !economyDetail || !economyCard) return;
  economyCard.classList.remove('good', 'alert');
  if (budget > 0) {
    const diff = budget - totalDespesas;
    const prefix = diff >= 0 ? '+' : '-';
    economySummary.textContent = `${prefix} ${fmtMoney(Math.abs(diff))}`;
    if (diff >= 0) {
      economyDetail.textContent = `Voce ainda pode gastar ${fmtMoney(diff)} dentro da meta de ${fmtMoney(budget)}.`;
      economyCard.classList.add('good');
    } else {
      economyDetail.textContent = `Voce ultrapassou a meta em ${fmtMoney(Math.abs(diff))}.`;
      economyCard.classList.add('alert');
    }
  } else {
    economySummary.textContent = '--';
    economyDetail.textContent = 'Defina uma meta mensal para acompanhar sua economia.';
  }
}

function updateDailyWidget(monthKey, monthItems, bucket, budget) {
  if (!dailyWidget || !dailySpendEl || !dailyRemainingEl) return;
  const parts = parseMonthKey(monthKey);
  if (!parts) {
    if (dailySpendLabel) dailySpendLabel.textContent = 'Gasto do dia';
    dailySpendEl.textContent = '--';
    dailyRemainingEl.textContent = '--';
    return;
  }
  const { year, month } = parts;
  const today = new Date();
  let referenceISO = null;
  let label = 'Gasto do dia';
  const currentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;

  if (currentMonth) {
    referenceISO = `${monthKey}-${pad(today.getDate())}`;
    label = 'Gasto de hoje';
  } else {
    const latest = monthItems
      .filter(entry => entry?.tipo === 'despesa' && entry?.data)
      .map(entry => entry.data)
      .sort()
      .pop();
    if (latest) {
      referenceISO = latest;
      const dateObj = new Date(`${latest}T00:00:00`);
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      label = `Gasto do dia ${dd}/${mm}`;
    } else {
      label = 'Sem despesas registradas';
    }
  }

  const dailyTotal = referenceISO
    ? monthItems.filter(entry => entry.tipo === 'despesa' && entry.data === referenceISO)
        .reduce((total, entry) => total + (entry?.valor || 0), 0)
    : 0;

  if (dailySpendLabel) dailySpendLabel.textContent = label;
  dailySpendEl.textContent = fmtMoney(dailyTotal);

  const baseSaldo = bucket?.saldo ?? 0;
  const restante = budget > 0 ? (budget - (bucket?.despesas || 0)) : baseSaldo;
  dailyRemainingEl.textContent = fmtMoney(restante);
  dailyRemainingEl.classList.toggle('positive', restante >= 0);
  dailyRemainingEl.classList.toggle('negative', restante < 0);
}

function generateInsights(monthKey, monthlyMap, bucket, forecastInfo, budget) {
  const output = [];
  const monthsSorted = Array.from(monthlyMap.keys()).sort();
  const idx = monthsSorted.indexOf(monthKey);
  const prevKey = idx > 0 ? monthsSorted[idx - 1] : null;
  const prevBucket = prevKey ? monthlyMap.get(prevKey) : null;

  if (bucket && prevBucket) {
    let topCat = null;
    bucket.categorias.forEach((valor, cat) => {
      const prevValor = prevBucket.categorias?.get?.(cat) || 0;
      const diff = valor - prevValor;
      if (diff <= 0) return;
      const pct = prevValor > 0 ? diff / prevValor : null;
      const score = pct !== null ? pct : diff / Math.max(valor, 1);
      if (!topCat || score > topCat.score) {
        topCat = { cat, valor, prevValor, diff, pct, score };
      }
    });
    if (topCat && (topCat.diff >= 100 || (topCat.pct !== null && topCat.pct >= 0.15))) {
      const pctTxt = topCat.pct !== null ? `${Math.round(topCat.pct * 100)}%` : 'novos gastos';
      output.push({
        tag: 'crescimento',
        title: `Categoria em alta: ${topCat.cat}`,
        detail: `Despesas em ${topCat.cat} somam ${fmtMoney(topCat.valor)} contra ${fmtMoney(topCat.prevValor)} em ${formatMonthLabel(prevKey, 'short')} (${pctTxt}).`
      });
    }
  }

  if (typeof budget === 'number' && budget > 0 && bucket) {
    const diff = budget - bucket.despesas;
    if (diff >= 0) {
      output.push({
        tag: 'meta',
        title: 'Meta controlada',
        detail: `Voce ainda tem ${fmtMoney(diff)} antes de atingir a meta de ${fmtMoney(budget)}.`
      });
    } else {
      output.push({
        tag: 'meta',
        title: 'Meta ultrapassada',
        detail: `O mes excedeu a meta em ${fmtMoney(Math.abs(diff))}. Reavalie as despesas mais pesadas.`
      });
    }
  }

  if (forecastInfo && budget > 0) {
    const diffPrev = forecastInfo.value - budget;
    if (diffPrev > budget * 0.1) {
      output.push({
        tag: 'previsao',
        title: 'Risco de extrapolar meta',
        detail: `A previsao indica ${fmtMoney(forecastInfo.value)}, acima da meta de ${fmtMoney(budget)}.`
      });
    }
  }

  if (bucket) {
    if (bucket.saldo < 0) {
      output.push({
        tag: 'saldo',
        title: 'Saldo negativo',
        detail: `O saldo do mes esta negativo em ${fmtMoney(Math.abs(bucket.saldo))}.`
      });
    } else if (bucket.saldo > 0) {
      output.push({
        tag: 'saldo',
        title: 'Saldo positivo',
        detail: `Voce acumulou saldo de ${fmtMoney(bucket.saldo)} no mes.`
      });
    }
  }

  return output;
}

function refreshAnalytics(monthKey, monthItems) {
  analyticsState.monthKey = monthKey;
  const monthlyMap = buildMonthlySnapshot();
  const bucket = monthlyMap.get(monthKey) || {
    receitas: 0,
    despesas: 0,
    saldo: 0,
    categorias: new Map()
  };

  analyticsState.monthReceitas = bucket.receitas;
  analyticsState.monthDespesas = bucket.despesas;
  analyticsState.monthSaldo = bucket.saldo;

  updateEconomyCardDisplay(Number(settings.budget) || 0, bucket.despesas);

  const averageInfo = computeDailyAverageInfo(monthKey, bucket.despesas);
  analyticsState.averageValor = averageInfo.value;
  analyticsState.averageDetail = averageInfo.detail;
  if (dailyAverageValue) dailyAverageValue.textContent = fmtMoney(averageInfo.value);
  if (dailyAverageDetail) dailyAverageDetail.textContent = averageInfo.detail;

  const forecastInfo = computeForecastInfo(monthKey, bucket.despesas, monthlyMap, averageInfo);
  analyticsState.forecastValor = forecastInfo.value;
  analyticsState.forecastDetail = forecastInfo.detail;
  if (forecastValue) forecastValue.textContent = fmtMoney(forecastInfo.value);
  if (forecastDetail) forecastDetail.textContent = forecastInfo.detail;

  const categoriesArray = Array.from(bucket.categorias.entries()).sort((a, b) => b[1] - a[1]);
  analyticsState.categories = categoriesArray;
  const categorySubtitleText = categoriesArray.length
    ? `Mes: ${formatMonthLabel(monthKey)}`
    : 'Sem despesas registradas para este mes.';
  analyticsState.categorySubtitle = categorySubtitleText;
  if (categorySubtitle) categorySubtitle.textContent = categorySubtitleText;

  const monthsSorted = Array.from(monthlyMap.keys()).sort();
  const lastMonths = monthsSorted.slice(-6);
  analyticsState.series = lastMonths.map(key => {
    const data = monthlyMap.get(key);
    return { key, receitas: data?.receitas || 0, despesas: data?.despesas || 0 };
  });
  const trendText = lastMonths.length
    ? `Periodo: ${formatMonthLabel(lastMonths[0])} a ${formatMonthLabel(lastMonths[lastMonths.length - 1])}`
    : 'Sem dados suficientes.';
  analyticsState.trendSubtitle = trendText;
  if (trendSubtitle) trendSubtitle.textContent = trendText;

  const insights = generateInsights(monthKey, monthlyMap, bucket, forecastInfo, Number(settings.budget) || 0);
  analyticsState.insights = insights;
  updateInsightList(insights);

  emitCategoryAlerts(monthKey, bucket.categorias, bucket.despesas);
  emitBudgetAlert(monthKey, bucket.despesas, Number(settings.budget) || 0);
  updateDailyWidget(monthKey, monthItems, bucket, Number(settings.budget) || 0);

  insightsChartsDirty = true;
  if (insightsModal?.style.display === 'flex') {
    renderInsightsCharts();
    insightsChartsDirty = false;
  }
}

function renderInsightsCharts() {
  if (typeof Chart === 'undefined') return;

  if (trendChartInstance) {
    trendChartInstance.destroy();
    trendChartInstance = null;
  }
  if (categoryChartInstance) {
    categoryChartInstance.destroy();
    categoryChartInstance = null;
  }

  if (trendCanvasCtx && analyticsState.series.length) {
    const labels = analyticsState.series.map(s => formatMonthLabel(s.key, 'short'));
    const receitasData = analyticsState.series.map(s => s.receitas);
    const despesasData = analyticsState.series.map(s => s.despesas);
    const maxSerie = Math.max(
      ...receitasData.filter(Number.isFinite),
      ...despesasData.filter(Number.isFinite),
      0
    );
    const suggestedMax = maxSerie > 0 ? maxSerie * 1.1 : undefined;

    trendChartInstance = new Chart(trendCanvasCtx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: receitasData,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.15)',
            tension: 0.32,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Despesas',
            data: despesasData,
            borderColor: '#f87171',
            backgroundColor: 'rgba(248,113,113,0.2)',
            tension: 0.32,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            suggestedMax,
            ticks: {
              callback: (value) => fmtMoney(value)
            },
            grid: {
              color: 'rgba(148,163,184,0.12)'
            }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text') || '#e6e8ef'
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmtMoney(ctx.raw)}`
            }
          }
        }
      }
    });
  } else if (trendCanvasCtx) {
    trendCanvasCtx.clearRect(0, 0, trendCanvasCtx.canvas.width, trendCanvasCtx.canvas.height);
  }

  if (categoryCanvasCtx && analyticsState.categories.length) {
    const top = analyticsState.categories.slice(0, 6);
    const labels = top.map(([cat]) => cat);
    const values = top.map(([_, val]) => val);
    const colors = labels.map(cat => (CAT_COLORS[cat] || '#64748b'));
    const maxValue = Math.max(...values.filter(Number.isFinite), 0);
    const suggestedMax = maxValue > 0 ? maxValue * 1.1 : undefined;

    categoryChartInstance = new Chart(categoryCanvasCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Despesas',
          data: values,
          backgroundColor: colors.map(c => `${c}dd`),
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            min: 0,
            suggestedMax,
            ticks: {
              callback: (value) => fmtMoney(value)
            },
            grid: { color: 'rgba(148,163,184,0.12)' }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text') || '#e6e8ef'
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => fmtMoney(ctx.raw)
            }
          }
        }
      }
    });
  } else if (categoryCanvasCtx) {
    categoryCanvasCtx.clearRect(0, 0, categoryCanvasCtx.canvas.width, categoryCanvasCtx.canvas.height);
  }

  requestAnimationFrame(() => {
    trendChartInstance?.resize();
    categoryChartInstance?.resize();
  });
}

function handleBudgetEdit() {
  if (!budgetEdit) return;
  const current = settings.budget ? settings.budget.toFixed(2).replace('.', ',') : '';
  const value = prompt('Qual a meta mensal de gastos? (em R$)', current);
  if (value === null) return;
  const parsed = parseMoney(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    alert('Valor invalido para meta.');
    return;
  }
  settings.budget = parsed;
  saveSettings();
  toast(parsed ? 'Meta atualizada!' : 'Meta removida.', 'success');
  const currentMonth = monthPicker?.value;
  if (currentMonth) {
    triggeredAlerts.delete(`budget:${currentMonth}`);
  }
  render();
}

function applyWidgetState() {
  const collapsed = !!settings.widgetCollapsed;
  if (dailyWidget) {
    if (collapsed) {
      dailyWidget.hidden = true;
    } else {
      dailyWidget.hidden = false;
      // Limpa qualquer animação de saída anterior
      dailyWidget.style.animation = '';
    }
    dailyWidget.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
  }
  if (dailyWidgetOpen) {
    dailyWidgetOpen.hidden = !collapsed;
    dailyWidgetOpen.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    dailyWidgetOpen.setAttribute('aria-hidden', collapsed ? 'false' : 'true');
  }
}

function openInsightsModal() {
  if (!insightsModal) return;
  insightsLastFocus = document.activeElement;
  insightsModal.style.display = 'flex';
  insightsChartsDirty = true;
  renderInsightsCharts();
  insightsChartsDirty = false;
  requestAnimationFrame(() => {
    trendChartInstance?.resize();
    categoryChartInstance?.resize();
  });
  setTimeout(() => insightsClose?.focus(), 0);
}

function closeInsightsModal() {
  if (!insightsModal) return;
  insightsModal.style.display = 'none';
  if (insightsLastFocus && typeof insightsLastFocus.focus === 'function') {
    insightsLastFocus.focus();
  }
}

// ===== Render =====
function render() {
  const month = monthPicker.value; // YYYY-MM
  // atualiza o chip do mes
  try {
    if (monthTextEl && month) {
      const [yy, mm] = month.split('-').map(Number);
      const label = new Date(yy, (mm || 1) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      monthTextEl.textContent = label;
    }
  } catch {}
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
          <div class="editable-field">${dataFmt}</div>
          <div class="editable-field">${i.descricao || '<span style="color:#6e7796">—</span>'}</div>
          <div class="editable-field"><span class="chip">${i.categoria}</span></div>
          <div class="editable-field">${i.tipo}</div>
          <div class="editable-field value ${valueClass}">${sign} ${fmtMoney(i.valor)}</div>
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
          <div class="editable-field">${dataFmt}</div>
          <div class="editable-field">${i.descricao || '<span style="color:#6e7796">—</span>'}</div>
          <div class="editable-field"><span class="chip">${i.categoria}</span></div>
          <div class="editable-field">${i.tipo}</div>
          <div class="editable-field value ${valueClass}">${sign} ${fmtMoney(i.valor)}</div>
          <div class="actions">
            <button class="btn small" data-act="edit" data-id="${i.id}">editar</button>
            <button class="btn small red" data-act="del" data-id="${i.id}">excluir</button>
          </div>
        `;

      modalTbody.appendChild(row);
    }
  }

  // ligar ações nos dois lugares
  refreshAnalytics(month, monthItems);

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

// ===== Logout =====
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn?.addEventListener('click', () => {
  if (confirm('Deseja sair da aplicação?')) {
    localStorage.removeItem('onegroup_current_user');
    window.location.href = 'login.html';
  }
});

// ===== Calendário customizado =====
const calendarPicker = document.getElementById('calendarPicker');
const calendarTrigger = document.getElementById('calendarTrigger');
const calendarDropdown = document.getElementById('calendarDropdown');
const calendarLabel = document.getElementById('calendarLabel');
const calendarTitle = document.getElementById('calendarTitle');
const calendarDays = document.getElementById('calendarDays');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');

let currentCalendarDate = new Date();
let selectedMonth = null;

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const monthNamesShort = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

function updateCalendarLabel() {
  if (!selectedMonth) {
    selectedMonth = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
  }
  const monthName = monthNamesShort[selectedMonth.getMonth()];
  const year = selectedMonth.getFullYear();
  calendarLabel.textContent = `${monthName} ${year}`;
  
  // Atualiza o input hidden para manter compatibilidade
  monthPicker.value = `${year}-${pad(selectedMonth.getMonth() + 1)}`;
}

function updateCalendarTitle() {
  const monthName = monthNames[currentCalendarDate.getMonth()];
  const year = currentCalendarDate.getFullYear();
  calendarTitle.textContent = `${monthName} ${year}`;
}

function renderCalendarDays() {
  calendarDays.innerHTML = '';
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  // Primeiro dia do mês
  const firstDay = new Date(year, month, 1);
  // Último dia do mês
  const lastDay = new Date(year, month + 1, 0);
  
  // Primeiro domingo da primeira semana (pode ser do mês anterior)
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
  // Data de hoje
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  
  // Mês selecionado
  const selectedMonthStr = selectedMonth ? `${selectedMonth.getFullYear()}-${pad(selectedMonth.getMonth() + 1)}` : null;
  
  // Gerar 42 dias (6 semanas x 7 dias)
  const currentDate = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = currentDate.getDate();
    
    const dateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
    const monthStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}`;
    
    // Marcar dias de outros meses
    if (currentDate.getMonth() !== month) {
      dayElement.classList.add('other-month');
    }
    
    // Marcar dia de hoje
    if (dateStr === todayStr) {
      dayElement.classList.add('today');
    }
    
    // Marcar mês selecionado
    if (monthStr === selectedMonthStr) {
      dayElement.classList.add('current');
    }
    
    // Adicionar evento de clique apenas para dias do mês atual
    if (currentDate.getMonth() === month) {
      dayElement.addEventListener('click', () => {
        selectedMonth = new Date(year, month, 1);
        updateCalendarLabel();
        closeCalendar();
        
        // Trigger event for render
        const event = new Event('change', { bubbles: true });
        monthPicker.dispatchEvent(event);
      });
    }
    
    calendarDays.appendChild(dayElement);
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

function openCalendar() {
  calendarDropdown.classList.add('open');
  updateCalendarTitle();
  renderCalendarDays();
  
  // Focus management
  setTimeout(() => {
    const currentDay = calendarDays.querySelector('.current');
    if (currentDay) {
      currentDay.focus();
    } else {
      prevMonth.focus();
    }
  }, 0);
}

function closeCalendar() {
  calendarDropdown.classList.remove('open');
  calendarTrigger.focus();
}

// Event listeners
calendarTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  if (calendarDropdown.classList.contains('open')) {
    closeCalendar();
  } else {
    openCalendar();
  }
});

prevMonth.addEventListener('click', () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  updateCalendarTitle();
  renderCalendarDays();
});

nextMonth.addEventListener('click', () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  updateCalendarTitle();
  renderCalendarDays();
});

// Fechar calendário ao clicar fora
document.addEventListener('click', (e) => {
  if (!calendarPicker.contains(e.target) && calendarDropdown.classList.contains('open')) {
    closeCalendar();
  }
});

// Keyboard navigation
calendarDropdown.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCalendar();
  }
});

// Melhor acessibilidade
calendarTrigger.setAttribute('aria-expanded', 'false');
calendarDropdown.setAttribute('aria-hidden', 'true');

const originalOpenCalendar = openCalendar;
const originalCloseCalendar = closeCalendar;

openCalendar = function() {
  originalOpenCalendar();
  calendarTrigger.setAttribute('aria-expanded', 'true');
  calendarDropdown.setAttribute('aria-hidden', 'false');
};

closeCalendar = function() {
  originalCloseCalendar();
  calendarTrigger.setAttribute('aria-expanded', 'false');
  calendarDropdown.setAttribute('aria-hidden', 'true');
};

// Inicializar calendário com mês atual
selectedMonth = new Date(now.getFullYear(), now.getMonth(), 1);
currentCalendarDate = new Date(selectedMonth);
updateCalendarLabel();

// ===== Custom Select Dropdowns =====
class CustomSelect {
  constructor(wrapperId) {
    this.wrapper = document.getElementById(wrapperId);
    if (!this.wrapper) return;
    
    this.trigger = this.wrapper.querySelector('.custom-select-trigger');
    this.dropdown = this.wrapper.querySelector('.custom-select-dropdown');
    this.valueElement = this.wrapper.querySelector('.custom-select-value');
    this.hiddenSelect = this.wrapper.parentElement.querySelector('select');
    this.options = Array.from(this.wrapper.querySelectorAll('.custom-select-option:not(.placeholder-option)'));
    this.allOptions = Array.from(this.wrapper.querySelectorAll('.custom-select-option'));
    this.currentFocusIndex = -1;
    
    this.init();
  }
  
  init() {
    // Event listeners
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    
    this.allOptions.forEach(option => {
      if (!option.classList.contains('placeholder-option')) {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectOption(option);
        });
        
        // Hover for keyboard navigation
        option.addEventListener('mouseenter', () => {
          this.clearFocus();
          option.classList.add('focused');
          this.currentFocusIndex = this.options.indexOf(option);
        });
      }
    });
    
    // Keyboard navigation
    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!this.isOpen()) {
          this.open();
        } else {
          this.focusNext();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (this.isOpen()) {
          this.focusPrevious();
        }
      } else if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'Enter' && this.isOpen()) {
        e.preventDefault();
        const focusedOption = this.options[this.currentFocusIndex];
        if (focusedOption) {
          this.selectOption(focusedOption);
        }
      }
    });
    
    this.dropdown.addEventListener('keydown', (e) => {
      e.preventDefault();
      if (e.key === 'Escape') {
        this.close();
        this.trigger.focus();
      } else if (e.key === 'ArrowDown') {
        this.focusNext();
      } else if (e.key === 'ArrowUp') {
        this.focusPrevious();
      } else if (e.key === 'Enter') {
        const focusedOption = this.options[this.currentFocusIndex];
        if (focusedOption) {
          this.selectOption(focusedOption);
        }
      } else if (e.key === 'Tab') {
        this.close();
      }
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target) && this.isOpen()) {
        this.close();
      }
    });
    
    // Sync with hidden select initial state
    this.syncFromHiddenSelect();
  }
  
  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    // Close other custom selects
    document.querySelectorAll('.custom-select-dropdown.open').forEach(dropdown => {
      if (dropdown !== this.dropdown) {
        dropdown.classList.remove('open');
        dropdown.parentElement.querySelector('.custom-select-trigger').classList.remove('open');
      }
    });
    
    this.dropdown.classList.add('open');
    this.trigger.classList.add('open');
    this.trigger.setAttribute('aria-expanded', 'true');
    
    // Set focus to selected item or first item
    const selectedIndex = this.options.findIndex(opt => opt.classList.contains('selected'));
    this.currentFocusIndex = selectedIndex >= 0 ? selectedIndex : 0;
    this.updateFocus();
    
    // Focus dropdown for keyboard navigation
    setTimeout(() => {
      this.dropdown.focus();
    }, 100);
  }
  
  close() {
    this.dropdown.classList.remove('open');
    this.trigger.classList.remove('open');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.clearFocus();
    this.currentFocusIndex = -1;
  }
  
  isOpen() {
    return this.dropdown.classList.contains('open');
  }
  
  focusNext() {
    if (this.currentFocusIndex < this.options.length - 1) {
      this.currentFocusIndex++;
    } else {
      this.currentFocusIndex = 0; // Loop to first
    }
    this.updateFocus();
  }
  
  focusPrevious() {
    if (this.currentFocusIndex > 0) {
      this.currentFocusIndex--;
    } else {
      this.currentFocusIndex = this.options.length - 1; // Loop to last
    }
    this.updateFocus();
  }
  
  updateFocus() {
    this.clearFocus();
    if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.options.length) {
      const focusedOption = this.options[this.currentFocusIndex];
      focusedOption.classList.add('focused');
      focusedOption.scrollIntoView({ block: 'nearest' });
    }
  }
  
  clearFocus() {
    this.options.forEach(opt => opt.classList.remove('focused'));
  }
  
  selectOption(option) {
    const value = option.getAttribute('data-value');
    const text = option.textContent.trim();
    
    // Update visual state
    this.options.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    
    // Update value display
    this.valueElement.textContent = text;
    this.valueElement.classList.toggle('placeholder', !value);
    
    // Update hidden select
    this.hiddenSelect.value = value;
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true });
    this.hiddenSelect.dispatchEvent(changeEvent);
    
    // Close dropdown and return focus
    this.close();
    this.trigger.focus();
  }
  
  syncFromHiddenSelect() {
    const hiddenValue = this.hiddenSelect.value;
    const matchingOption = this.options.find(opt => opt.getAttribute('data-value') === hiddenValue);
    
    if (matchingOption) {
      this.options.forEach(opt => opt.classList.remove('selected'));
      matchingOption.classList.add('selected');
      this.valueElement.textContent = matchingOption.textContent.trim();
      this.valueElement.classList.toggle('placeholder', !hiddenValue);
    }
  }
  
  setValue(value) {
    const matchingOption = this.options.find(opt => opt.getAttribute('data-value') === value);
    if (matchingOption) {
      this.selectOption(matchingOption);
    } else {
      // Reset to placeholder
      this.options.forEach(opt => opt.classList.remove('selected'));
      const placeholderOption = this.allOptions.find(opt => opt.classList.contains('placeholder-option'));
      if (placeholderOption) {
        this.valueElement.textContent = placeholderOption.textContent.trim();
        this.valueElement.classList.add('placeholder');
      }
      this.hiddenSelect.value = '';
    }
  }
}

// Inicializar custom selects
const tipoSelect = new CustomSelect('tipoWrapper');
const categoriaSelect = new CustomSelect('categoriaWrapper');
const filtroCategoriaSelect = new CustomSelect('filtroCategoriaWrapper');

render();