const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL'});
const fmtMoney = n => BRL.format(n || 0);
const parseMoney = (s) => {
if (!s) return 0;
const clean = String(s).replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',', '.');
const x = Number(clean);
return isFinite(x) ? x : 0;
}
const pad = (n)=> String(n).padStart(2,'0');
const onlyMonth = (iso) => iso?.slice(0,7); // YYYY-MM

const KEY = 'og.ledger.v1';
let items = JSON.parse(localStorage.getItem(KEY) || '[]');

if (!items.length){
const now = new Date();
const y = now.getFullYear();
const m = pad(now.getMonth()+1);
items = [
{ id: crypto.randomUUID(), data: `${y}-${m}-30`, descricao: 'Salário', categoria: 'renda', tipo: 'receita', valor: 5000 },
{ id: crypto.randomUUID(), data: `${y}-${m}-31`, descricao: 'Alimentação', categoria: 'alimentação', tipo: 'despesa', valor: 500 }
];
localStorage.setItem(KEY, JSON.stringify(items));
}

// UI
const monthPicker = document.getElementById('monthPicker');
const sumReceitas = document.getElementById('sumReceitas');
const sumDespesas = document.getElementById('sumDespesas');
const sumSaldo = document.getElementById('sumSaldo');
const grandSaldo = document.getElementById('grandSaldo');
const tbody = document.getElementById('tbody');

const tipo = document.getElementById('tipo');
const descricao = document.getElementById('descricao');
const data = document.getElementById('data');
const categoria = document.getElementById('categoria');
const valor = document.getElementById('valor');
const addBtn = document.getElementById('addBtn');

const filtroCategoria = document.getElementById('filtroCategoria');
const busca = document.getElementById('busca');
const limparFiltros = document.getElementById('limparFiltros');

let editingId = null;

const now = new Date();
monthPicker.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}`;

render();

// Listeners 
monthPicker.addEventListener('change', render);
filtroCategoria.addEventListener('change', render);
busca.addEventListener('input', render);
limparFiltros.addEventListener('click', () =>{
filtroCategoria.value = '';
busca.value = '';
render();
});

// Máscara 
valor.addEventListener('blur', () => {
const v = parseMoney(valor.value);
valor.value = v ? v.toFixed(2).replace('.',',') : '';
});

addBtn.addEventListener('click', () => {
const t = tipo.value;
const d = data.value; // YYYY-MM-DD
const c = categoria.value;
const desc = descricao.value.trim();
const v = parseMoney(valor.value);

// validações
if(!t){return alert('Selecione o tipo.');}
if(!d){return alert('Informe a data.');}
if(!c){return alert('Selecione a categoria.');}
if(!v || v <= 0){return alert('Informe um valor válido.');}

if (editingId){
const idx = items.findIndex(i => i.id === editingId);
if(idx>=0){ items[idx] = { ...items[idx], tipo:t, data:d, categoria:c, descricao:desc, valor:v }; }
editingId = null;
addBtn.textContent = 'adicionar';
} else {
items.unshift({ id: crypto.randomUUID(), tipo:t, data:d, categoria:c, descricao:desc, valor:v });
}

localStorage.setItem(KEY, JSON.stringify(items));
// limpa form
tipo.value = '';
descricao.value = '';
data.value = '';
categoria.value = '';
valor.value = '';

render();
});

// Render 
function render(){
const month = monthPicker.value; // YYYY-MM
const q = busca.value.trim().toLowerCase();
const cat = filtroCategoria.value;

const visible = items.filter(i => {
if (onlyMonth(i.data) !== month) return false;
if (cat && i.categoria !== cat) return false;
if (q && !`${i.descricao}`.toLowerCase().includes(q)) return false;
return true;
});

// Totais
const receitas = visible.filter(i=>i.tipo==='receita').reduce((a,b)=>a+b.valor,0);
const despesas = visible.filter(i=>i.tipo==='despesa').reduce((a,b)=>a+b.valor,0);
const saldo = receitas - despesas;

sumReceitas.textContent = fmtMoney(receitas);
sumDespesas.textContent = fmtMoney(despesas);
sumSaldo.textContent = fmtMoney(saldo);
grandSaldo.textContent = fmtMoney(saldo);

// Tabela
tbody.innerHTML = '';
if (!visible.length){
const empty = document.createElement('div');
empty.className = 'trow';
empty.innerHTML = '<div style="grid-column: 1 / -1; color:#9aa3b2">Sem lançamentos para este mês.</div>';
tbody.appendChild(empty);
return;
}

for (const i of visible){
const row = document.createElement('div');
row.className = 'trow';
const date = new Date(i.data + 'T00:00:00');
const d = `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()}`;
const valueClass = i.tipo==='despesa' ? 'negative' : 'positive';
const sign = i.tipo==='despesa' ? '-' : '+';
row.innerHTML = `
    <div>${d}</div>
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

// actions
tbody.querySelectorAll('button').forEach(btn => {
btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    if (act === 'del') {
    if (confirm('Excluir este lançamento?')){
        items = items.filter(x => x.id !== id);
        localStorage.setItem(KEY, JSON.stringify(items));
        render();
    }
    } else if (act === 'edit'){
    const it = items.find(x => x.id === id);
    if(!it) return;
    tipo.value = it.tipo;
    descricao.value = it.descricao || '';
    data.value = it.data;
    categoria.value = it.categoria;
    valor.value = String(it.valor).replace('.', ',');
    editingId = id;
    addBtn.textContent = 'salvar';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
});
}