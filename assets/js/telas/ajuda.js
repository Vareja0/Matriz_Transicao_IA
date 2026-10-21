// telas/ajuda.js
// Guia de aplicação: conteúdo da aba Guia da planilha (passos, escalas, competências e regras).

V.ajuda = {
  render(root) {
    put(root, cabecalho('Guia de aplicação', 'Matriz integrada de transição de competências para IA. Versão 2.0 das regras. Tudo roda neste arquivo, sem instalação, internet ou envio de dados.'));
    const tabela = (cab, linhas) => h('div', { class: 'scroll' }, h('table', {},
      h('thead', {}, h('tr', {}, cab.map(c => h('th', {}, c)))),
      h('tbody', {}, linhas.map(l => h('tr', {}, l.map(c => h('td', {}, c)))))));

    put(root, h('section', { class: 'block' }, h('h2', { style: 'margin-bottom:12px' }, 'Passos'), tabela(['Passo', 'Onde', 'O que fazer'], [
      ['1', 'Negócio', 'Defina horas de participantes, custos, limite de ações e maturidade.'],
      ['2', 'Formulário individual', 'Aplique a autoavaliação na Equipe ou baixe o formulário do colaborador. O resultado exporta competências e faixa, sem respostas de prontidão.'],
      ['3', 'Equipe', 'Importe ou aplique o resultado. Confira as 6 competências, a função e se a pessoa é gestora.'],
      ['4', 'Tarefas', 'Revise as tarefas e as 8 perguntas guiadas.'],
      ['5', 'Diagnóstico', 'Uma linha por pessoa, tarefa e competência. Informe meta futura, criticidade e andamento.'],
      ['6', 'Plano', 'As ações são ordenadas automaticamente. Leia o motivo de cada adiamento.'],
      ['7', 'Execução', 'Confirme colega tutor e agenda. Registre andamento e evidência pelo ID.'],
      ['8', 'Reavaliação', 'Salve uma cópia datada antes de alterar entradas. Aos 90 dias, repita a coleta e atualize metas.']
    ])));

    put(root, h('section', { class: 'block' }, h('h2', { style: 'margin-bottom:12px' }, 'Escalas'), tabela(['Nível', 'Competência atual ou futura', 'Criticidade da competência'], [
      ['0', 'Não utiliza', 'Não aplicável'], ['1', 'Executa com apoio', 'Baixa: efeito limitado'],
      ['2', 'Executa com autonomia', 'Média: afeta a rotina'], ['3', 'Executa com autonomia e ensina', 'Alta: essencial à operação']
    ])));

    put(root, h('section', { class: 'block' }, h('h2', { style: 'margin-bottom:12px' }, 'Competências'), tabela(['Código', 'Competência', 'Grupo'], COMPS.map(c => [c[0], c[1], c[2]]))));

    put(root, h('section', { class: 'block' }, h('h2', { style: 'margin-bottom:12px' }, 'Regras'), tabela(['Regra', 'Cálculo ou decisão', 'Condição / limite'], [
      ['Meta do ciclo', 'Mínimo entre meta futura e teto da maturidade', 'A meta futura e a lacuna total continuam visíveis.'],
      ['Lacuna', 'Máximo entre zero e meta do ciclo menos nível atual', 'Prioridade = lacuna do ciclo × criticidade (0-9).'],
      ['Prontidão', 'Baixa com lacuna: preparação cultural no lugar do treino técnico, uma por pessoa (em grupo quando houver mais de uma). Baixa sem lacuna e risco alto: preservação.', 'Ao concluir a preparação, reaplicar o formulário; se a faixa subir, o treino volta ao plano.'],
      ['Agrupamento', 'Uma ação de treino por pessoa e competência', 'Diagnósticos da mesma competência em tarefas diferentes viram uma ação; as tarefas são contexto de prática.'],
      ['Intervenção', 'Menor custo entre ações compatíveis. Empate: pares, redesenho, experimentação e tutor. Apoio externo quando nenhuma é compatível.', 'Pares: colega nível 3 (com limite de aprendizes por colega); redesenho: automação; experimentação: lacuna ≥ 2 ou prontidão moderada; tutor: prontidão alta e C01 ≥ 1, com lacuna 1 ou sem colega.'],
      ['Risco', 'Preservação obrigatória quando risco alto, mesmo sem lacuna', 'Documentar rotina e praticar sem IA; somar horas. Não ocupa vaga de ação simultânea; prioridade = criticidade.'],
      ['Maturidade', 'Quando o teto zera a lacuna de alguém (ou o teto é 1), entra a ação da loja "Elevar maturidade digital"', 'O diagnóstico bloqueado mostra "Bloqueado pela maturidade digital".'],
      ['Ordem', 'Prioridade; preparação cultural só desempata; depois gestor, risco, custo e código (numérico)', 'Critérios operacionais provisórios da versão 2.'],
      ['Viabilidade', 'Admissão sequencial por horas, orçamento, limite de ações e aprendizes por colega', 'Ao não caber, tenta a ação seguinte com o saldo restante. Custo único: cobrado uma vez no ciclo.'],
      ['Autoavaliação', 'Média dos 8 itens (5 e 6 invertidos)', 'Itens de ansiedade e medo no máximo: faixa baixa; um deles no máximo: até moderada. Respostas todas iguais geram alerta.'],
      ['Prazo', 'CULT: preparação; até 4 semanas: 0-30 dias; demais: 31-90 dias', 'Reserva semanal conservadora, sem otimizar a agenda por semana.'],
      ['Limite', 'Demonstração funcional com dados simulados', 'Não é avaliação empírica, escala psicométrica ou decisão de emprego.']
    ])));

    put(root, h('section', { class: 'block' }, h('h2', {}, 'Intervenções'),
      INTERV_CODES.map(k => h('div', { style: 'margin:12px 0' }, h('b', {}, k + ' · ' + INTERVENCAO_TXT[k][0]), h('div', { class: 'muted' }, INTERVENCAO_TXT[k][1])))));

    put(root, h('section', { class: 'block' }, h('h2', {}, 'Dados e limites'),
      h('ul', { class: 'help-list' },
        h('li', {}, 'Os dados ficam salvos neste navegador, neste computador. Use “Salvar cópia datada” para backup ou para levar a outro computador.'),
        h('li', {}, 'O formulário inicia com faixas < 1 (baixa), < 2 (moderada), ≥ 2 (alta). Os formulários gerados usam os limites definidos em Negócio.'),
        h('li', {}, 'As respostas de prontidão não são salvas; só a faixa resultante vai para a Equipe.'),
        h('li', {}, 'Concluída remove a ação do plano. Atualize também o nível demonstrado e a evidência.'),
        h('li', {}, 'Não presuma aprendizagem: o nível atual só muda com nova autoavaliação e conferência.'),
        h('li', {}, 'Mentoria por IA é uma ação recomendada; a ferramenta não executa conversas com um modelo.'),
        h('li', {}, 'Os dados do Mercado Aurora são fictícios.'),
        h('li', {}, 'Cenários de teste: a pasta “cenarios” tem lojas fictícias em .json. Use “Importar cenário (.json)” no Início para abrir uma; o Início e o Plano mostram o que observar.'))));
  }
};
