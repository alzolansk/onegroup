# Onegroup-bank
# 📘 Controle de Gastos – Projeto Acadêmico

## 📌 Sobre o Projeto

Este sistema foi desenvolvido como parte de um projeto acadêmico, com o objetivo de **gerenciar receitas e despesas pessoais** de forma simples e prática.
Ele funciona 100% no navegador, utilizando **HTML, CSS e JavaScript puro**, com persistência de dados via **LocalStorage** (não precisa de servidor ou banco de dados externo).

---

## ⚙️ Funcionalidades

* ✅ **Adicionar movimentações** (receita ou despesa)
* ✅ **Editar inline** diretamente na tabela (botão **editar → salvar**)
* ✅ **Excluir movimentações**
* ✅ **Resumo automático** de Receitas, Despesas e Saldo
* ✅ **Filtro por categoria e busca por descrição**
* ✅ **Seleção de mês** (visualização apenas das movimentações daquele mês)
* ✅ **Listagem limitada a 3 itens na tela** (sem scroll infinito)
* ✅ **Botão “Ver todos”** → abre **modal** mostrando todas as movimentações do mês
* ✅ **Persistência local** (LocalStorage do navegador)

---

## 🖼️ Demonstração

📊 Tela principal exibe:

* Cartões de **Receitas**, **Despesas** e **Saldo** (com cores verde/vermelho).
* Formulário de **nova movimentação**.
* Bloco de **filtros**.
* **Tabela responsiva** de lançamentos.
* **Modal** para exibir todas as movimentações do mês.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5** → estrutura do sistema
* **CSS3** → estilização dark mode
* **JavaScript (ES6)** → regras de negócio e manipulação da DOM
* **LocalStorage** → persistência dos dados

---

## 📂 Estrutura de Arquivos

```
/index.html   -> Estrutura da página
/style.css    -> Estilos e layout
/script.js    -> Lógicas do sistema (CRUD, filtros, renderização, modal)
```

---

## 📖 Fluxo de Funcionamento

1. Usuário adiciona uma movimentação.
2. O sistema salva no `localStorage`.
3. O método `render()` é chamado → recalcula totais e redesenha a tabela.
4. Caso existam mais de 3 movimentações no mês → aparece o botão “Ver todos”.
5. A edição é feita **inline**: a linha vira inputs, botão vira “salvar” e, ao salvar, os dados são persistidos.

---

## 📚 Observações Acadêmicas

* Projeto desenvolvido para fins de **aprendizado** em **desenvolvimento front-end**.
* Código comentado e dividido em **camadas lógicas** (helpers, estado, renderização, interações).
* Demonstra conceitos de **CRUD em memória + persistência local** sem uso de frameworks.
