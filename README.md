# Matriz integrada de transição de competências para IA (versão web)

Artefato de apoio à decisão sobre capacitação de equipes de pequeno varejo para o uso de IA.
Versão web da planilha `Matriz_Transicao_IA_v1.xlsx`, com a mesma terminologia e interface em cartões e janelas guiadas.
A partir da versão 2 das regras, o plano deixa de reproduzir exatamente a planilha v1: as mudanças
(agrupamento por pessoa, preparação cultural, apoio externo, maturidade, carga do colega etc.) estão descritas
no Guia (tela "Guia") e em `diagnostico.txt`, Parte 3. A versão 1 está guardada em `../Matriz_Transicao_IA_v1_backup`.

## Como usar

1. Mantenha a pasta inteira junta.
2. Dê dois cliques em **`Abrir_Matriz.html`**. Não precisa instalar nada nem ter internet.
3. Na tela de Início, clique em **Continuar** e siga as 5 etapas:
   Negócio → Equipe e autoavaliação → Tarefas → Diagnóstico → Plano.

A ferramenta abre com o cenário fictício Mercado Aurora. Para usar com outra loja,
clique em **Começar do zero** na tela de Início.

Os dados são salvos automaticamente neste navegador. Para backup, reavaliação ou outro computador:
**Mais opções → Salvar cópia datada (.json)**.

## Cenários de teste

A pasta `cenarios/` tem um arquivo `.json` para cada loja fictícia usada nos testes (`diagnostico.txt`):
o exemplo Mercado Aurora (A00), a Padaria Pão Quente (C03), os casos K01–K10 e K12 e os extremos K13–K15.
Para abrir: **Início → Importar cenário (.json)** (ou **Mais opções → Importar cenário (.json)**).
O Início e o Plano mostram o título do cenário e a lista "O que observar". O formato está em `cenarios/LEIA-ME.txt`;
cópias salvas comuns também são aceitas pelo botão.

## Autoavaliação individual

Em **Equipe e autoavaliação**, cada cartão tem:
- **Aplicar autoavaliação**: preencher na própria tela, junto com a pessoa, e aplicar na Equipe.
- **Baixar formulário do colaborador**: gera `Formulario_Colaborador_Nome.html` com código, nome e limites de
  prontidão da loja. A pessoa responde offline e devolve `Resposta_Nome.json`; o gestor usa **Importar resultado (.json)**.

O resultado contém apenas o código, a faixa de prontidão, os níveis de competências e eventuais alertas
(ex.: respostas todas iguais); as oito respostas de prontidão não são salvas. `colaborador/Formulario_Colaborador.html` é a versão genérica, que pede o nome.

## Estrutura (para quem for manter o projeto)

```
Abrir_Matriz.html               página principal
assets/css/estilo.css           visual
assets/js/motor.js              cálculos (equivalentes às fórmulas da planilha); não depende da tela
assets/js/textos.js             rótulos da tela (terminologia da planilha)
assets/js/util.js               peças da interface (botões de escolha, contador, janelas)
assets/js/estado.js             salvar, carregar, cópias de segurança, andamento das etapas
assets/js/formulario.js         autoavaliação (tela do gestor e formulário do colaborador)
assets/js/modelo-formulario.js  gerado: modelo do formulário do colaborador
assets/js/telas/*.js            uma tela por etapa
assets/js/app.js                menu e inicialização
colaborador/                    formulário do colaborador genérico
cenarios/                       lojas fictícias dos testes, em .json, para Importar cenário
testes/Executar_Testes.html     abre no navegador e confere os cálculos (71 verificações, regras v2)
ferramentas/                    script que regenera o formulário do colaborador
```

Os scripts são clássicos (não módulos) porque os navegadores bloqueiam módulos em arquivos abertos direto do disco.
Ao alterar `estilo.css`, `motor.js`, `textos.js`, `util.js` ou `formulario.js`, rode
`python ferramentas/gerar_formulario_colaborador.py`.

## Limites

As faixas, escalas, durações e o catálogo são parâmetros experimentais, e os dados do Mercado Aurora são fictícios.
Não é avaliação empírica, escala psicométrica ou decisão de emprego. Mentoria por IA é uma intervenção
recomendada; a ferramenta não executa conversas com um modelo.
