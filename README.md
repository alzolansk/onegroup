<<<<<<< HEAD
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
=======
"receita ou despesa)  ? Editar inline diretamente na tabela (bot�o editar  salvar)  ? Excluir movimenta��es  ? Resumo autom�tico de Receitas, Despesas e Saldo  ? Filtro por categoria e busca por descri��o  ? Sele��o de m�s (visualiz a��o apenas das movimenta��es daquele m�s)  ? Listagem limitada a 3 itens na tela (sem scroll infinito)  ? Bot�o "Ver todos"  abre modal mostrando todas as movimenta��es do m�s  ? Persist�ncia local (LocalStorage do navegador)  ?? Dem nstra��o  ? Tela principal exibe:  Cart�es de Receitas, Despesas e Saldo (com cores verde/vermelho).  Formul�rio de nova movimenta��o.  Bloco de filtros.  Tabela responsiva de lan�amentos.  Modal para exibir todas as movimenta��es do m�s .  ?? Tecnologias Utilizadas  HTML5  estrutura do sistema  CSS3  estiliza��o dark mode  JavaScript (ES6)  regras de neg�cio e manipula��o da DOM  LocalStorage  persist�ncia dos dados  ? Estrutura de Arquivos /index.html   -> Estrutur  da p�gina /style.css    -> Estilos e layout /script.js    -> L�gicas do sistema (CRUD, filtros, renderiza��o, modal)  ? Fluxo de Funcionamento  Usu�rio adiciona uma movimenta��o.  O sistema salva no localStorage.  O m�todo render() � chamado  recalcula totais e redesenha a tabela.  Caso existam mais de 3 movimenta��es no m�s  aparece o bot�o "Ver todos".  A edi��o � feita inline: a linha vira inputs, bot�o vira "salvar" e, ao salvar, os dados s�o persistidos.  ? Como Executar  Baixe ou clone o reposit�rio.  Abra o arquivo index.html no navegador.  Comece a cadastrar suas receitas e despesas!  ? Observa��es Acad�micas  Projeto desenvolvido para fins de aprendizado em desenvolvimento front-end.  C�digo cocutar  Baixe ou clone o reposit�rio.  Abra o arquivo index.html n omecutar  Baixe ou clone o reposit�rio.  Abra o arquivo index.html no navegador.  Comece a cadastrar suas receitas e despesas!  ? Observa��es Acad�micas  Projeto desenvolvido para fins de aprendizado em desenvolvimento front-end.  C�digo comentado e dividido em camadas l�gicas (helpers, estado, renderiza��o, intera��es).  Demonstra conceitos de CRUD em mem�ria + persist ecutar  Baixe ou clone o reposit�rio.  Abra o arquivo index.html no navegador.  Comece a cadastrar suas receitas e despesas!  ? Obse va��es Acad�micas  Projeto desenvolvido para fins de aprendizado em desenvolvimento front-end.  C�digo comentado e dividido em camadas l�gicas (helpers, estado, renderiza��o, intera��es).  Demonstra conceitos de CRUD em mem�ria + persist" 
>>>>>>> origin/master
