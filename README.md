<<<<<<< HEAD
# Onegroup-bank
# ðŸ“˜ Controle de Gastos â€“ Projeto AcadÃªmico

## ðŸ“Œ Sobre o Projeto

Este sistema foi desenvolvido como parte de um projeto acadÃªmico, com o objetivo de **gerenciar receitas e despesas pessoais** de forma simples e prÃ¡tica.
Ele funciona 100% no navegador, utilizando **HTML, CSS e JavaScript puro**, com persistÃªncia de dados via **LocalStorage** (nÃ£o precisa de servidor ou banco de dados externo).

---

## âš™ï¸ Funcionalidades

* âœ… **Adicionar movimentaÃ§Ãµes** (receita ou despesa)
* âœ… **Editar inline** diretamente na tabela (botÃ£o **editar â†’ salvar**)
* âœ… **Excluir movimentaÃ§Ãµes**
* âœ… **Resumo automÃ¡tico** de Receitas, Despesas e Saldo
* âœ… **Filtro por categoria e busca por descriÃ§Ã£o**
* âœ… **SeleÃ§Ã£o de mÃªs** (visualizaÃ§Ã£o apenas das movimentaÃ§Ãµes daquele mÃªs)
* âœ… **Listagem limitada a 3 itens na tela** (sem scroll infinito)
* âœ… **BotÃ£o â€œVer todosâ€** â†’ abre **modal** mostrando todas as movimentaÃ§Ãµes do mÃªs
* âœ… **PersistÃªncia local** (LocalStorage do navegador)

---

## ðŸ–¼ï¸ DemonstraÃ§Ã£o

ðŸ“Š Tela principal exibe:

* CartÃµes de **Receitas**, **Despesas** e **Saldo** (com cores verde/vermelho).
* FormulÃ¡rio de **nova movimentaÃ§Ã£o**.
* Bloco de **filtros**.
* **Tabela responsiva** de lanÃ§amentos.
* **Modal** para exibir todas as movimentaÃ§Ãµes do mÃªs.

---

## ðŸ› ï¸ Tecnologias Utilizadas

* **HTML5** â†’ estrutura do sistema
* **CSS3** â†’ estilizaÃ§Ã£o dark mode
* **JavaScript (ES6)** â†’ regras de negÃ³cio e manipulaÃ§Ã£o da DOM
* **LocalStorage** â†’ persistÃªncia dos dados

---

## ðŸ“‚ Estrutura de Arquivos

```
/index.html   -> Estrutura da pÃ¡gina
/style.css    -> Estilos e layout
/script.js    -> LÃ³gicas do sistema (CRUD, filtros, renderizaÃ§Ã£o, modal)
```

---

## ðŸ“– Fluxo de Funcionamento

1. UsuÃ¡rio adiciona uma movimentaÃ§Ã£o.
2. O sistema salva no `localStorage`.
3. O mÃ©todo `render()` Ã© chamado â†’ recalcula totais e redesenha a tabela.
4. Caso existam mais de 3 movimentaÃ§Ãµes no mÃªs â†’ aparece o botÃ£o â€œVer todosâ€.
5. A ediÃ§Ã£o Ã© feita **inline**: a linha vira inputs, botÃ£o vira â€œsalvarâ€ e, ao salvar, os dados sÃ£o persistidos.

---

## ðŸ“š ObservaÃ§Ãµes AcadÃªmicas

* Projeto desenvolvido para fins de **aprendizado** em **desenvolvimento front-end**.
* CÃ³digo comentado e dividido em **camadas lÃ³gicas** (helpers, estado, renderizaÃ§Ã£o, interaÃ§Ãµes).
* Demonstra conceitos de **CRUD em memÃ³ria + persistÃªncia local** sem uso de frameworks.
=======
"receita ou despesa)  ? Editar inline diretamente na tabela (botÆo editar  salvar)  ? Excluir movimenta‡äes  ? Resumo autom tico de Receitas, Despesas e Saldo  ? Filtro por categoria e busca por descri‡Æo  ? Sele‡Æo de mˆs (visualiz a‡Æo apenas das movimenta‡äes daquele mˆs)  ? Listagem limitada a 3 itens na tela (sem scroll infinito)  ? BotÆo "Ver todos"  abre modal mostrando todas as movimenta‡äes do mˆs  ? Persistˆncia local (LocalStorage do navegador)  ?? Dem nstra‡Æo  ? Tela principal exibe:  Cartäes de Receitas, Despesas e Saldo (com cores verde/vermelho).  Formul rio de nova movimenta‡Æo.  Bloco de filtros.  Tabela responsiva de lan‡amentos.  Modal para exibir todas as movimenta‡äes do mˆs .  ?? Tecnologias Utilizadas  HTML5  estrutura do sistema  CSS3  estiliza‡Æo dark mode  JavaScript (ES6)  regras de neg¢cio e manipula‡Æo da DOM  LocalStorage  persistˆncia dos dados  ? Estrutura de Arquivos /index.html   -> Estrutur  da p gina /style.css    -> Estilos e layout /script.js    -> L¢gicas do sistema (CRUD, filtros, renderiza‡Æo, modal)  ? Fluxo de Funcionamento  Usu rio adiciona uma movimenta‡Æo.  O sistema salva no localStorage.  O m‚todo render() ‚ chamado  recalcula totais e redesenha a tabela.  Caso existam mais de 3 movimenta‡äes no mˆs  aparece o botÆo "Ver todos".  A edi‡Æo ‚ feita inline: a linha vira inputs, botÆo vira "salvar" e, ao salvar, os dados sÆo persistidos.  ? Como Executar  Baixe ou clone o reposit¢rio.  Abra o arquivo index.html no navegador.  Comece a cadastrar suas receitas e despesas!  ? Observa‡äes Acadˆmicas  Projeto desenvolvido para fins de aprendizado em desenvolvimento front-end.  C¢digo cocutar  Baixe ou clone o reposit¢rio.  Abra o arquivo index.html n omecutar  Baixe ou clone o reposit¢rio.  Abra o arquivo index.html no navegador.  Comece a cadastrar suas receitas e despesas!  ? Observa‡äes Acadˆmicas  Projeto desenvolvido para fins de aprendizado em desenvolvimento front-end.  C¢digo comentado e dividido em camadas l¢gicas (helpers, estado, renderiza‡Æo, intera‡äes).  Demonstra conceitos de CRUD em mem¢ria + persist ecutar  Baixe ou clone o reposit¢rio.  Abra o arquivo index.html no navegador.  Comece a cadastrar suas receitas e despesas!  ? Obse va‡äes Acadˆmicas  Projeto desenvolvido para fins de aprendizado em desenvolvimento front-end.  C¢digo comentado e dividido em camadas l¢gicas (helpers, estado, renderiza‡Æo, intera‡äes).  Demonstra conceitos de CRUD em mem¢ria + persist" 
>>>>>>> origin/master
