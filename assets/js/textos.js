// textos.js
// Rótulos exibidos na tela, com a terminologia da planilha Matriz_Transicao_IA_v1.xlsx
// (abas Guia, Negocio, Equipe, Tarefas, Diagnostico e Plano) e do formulário do colaborador.

// Escala de competência (Guia!A16:B19)
const NIVEIS_TXT = [
  ['0 · Não utiliza', ''],
  ['1 · Executa com apoio', ''],
  ['2 · Executa com autonomia', ''],
  ['3 · Executa com autonomia e ensina', '']
];

// Competências C01 a C06 (Guia!A22:C27): nome e grupo
const HABILIDADES = Object.fromEntries(COMPS.map(c => [c[0], [c[0] + ' · ' + c[1], c[2]]]));

// Faixas de prontidão e orientação do formulário original
const PRONTIDAO_TXT = {
  Baixa: ['Prontidão baixa', 'Antes do treino técnico, combine uma conversa e uma demonstração com um colega. Repita a coleta depois da preparação.'],
  Moderada: ['Prontidão moderada', 'Comece com apoio e prática acompanhada. Combine dúvidas e expectativas com a liderança.'],
  Alta: ['Prontidão alta', 'A faixa permite iniciar aprendizagem planejada, conforme as lacunas e o tempo disponível.']
};

// Criticidade (Guia!C16:C19)
const IMPORTANCIA_TXT = { 1: ['1 · Baixa', 'Efeito limitado'], 2: ['2 · Média', 'Afeta a rotina'], 3: ['3 · Alta', 'Essencial à operação'] };

// Classe final da tarefa (Tarefas!N)
const CLASSE_TXT = {
  'Humana': ['Humana', 'Q1 ou Q2: a tarefa permanece humana e não gera capacitação para IA.'],
  'Automação': ['Automação', 'Regras claras e decisão delegável (Q3 + Q4).'],
  'Aumento': ['Aumento', 'IA apoia, pessoa decide.'],
  'Colaboração': ['Colaboração', 'Pessoa e IA refinam sugestões em conjunto.']
};

// Catálogo de intervenções (Negocio!A30:B35)
const INTERVENCAO_TXT = {
  CULT: ['Preparação cultural', 'Conversa e demonstração com um colega antes do treino técnico, uma por pessoa (em grupo quando houver mais de uma). Reaplicar o formulário de prontidão depois da preparação.'],
  PARES: ['Aprendizagem entre pares', 'Colega com nível 3 na competência, prontidão moderada ou alta, ensina na rotina.'],
  EXP: ['Experimentação assistida', 'Prática acompanhada com a ferramenta; compatível com lacuna do ciclo ≥ 2 ou prontidão moderada.'],
  TUTOR: ['Mentoria por IA', 'Aprendizagem com assistente de IA; para prontidão alta e quem já usa IA (C01 ≥ 1), com lacuna 1 ou sem colega apto.'],
  RED: ['Redesenho gradual', 'Transição gradual de tarefa classificada como Automação.'],
  PRES: ['Preservação de competências', 'Documentar a rotina e praticar sem IA; obrigatória com risco alto, mesmo sem lacuna. Não ocupa vaga de ação simultânea.'],
  EXT: ['Apoio externo', 'Curso, fornecedor da ferramenta ou instituição de apoio (ex.: Sebrae) quando nenhuma opção interna é compatível (sem colega nível 3 e mentoria por IA não indicada).'],
  MAT: ['Elevar maturidade digital', 'Ação da loja: organizar registros, equipamentos, rotinas de conferência e apoio à aprendizagem. Indicada quando a maturidade bloqueia o desenvolvimento.']
};

const ANDAMENTO_TXT = { 'Não iniciada': 'Não iniciada', 'Em andamento': 'Em andamento', 'Concluída': 'Concluída' };
const PRAZO_TXT = { 'Preparação cultural': 'Preparação cultural', '0-30 dias': '0-30 dias', '31-90 dias': '31-90 dias', 'Próximo ciclo': 'Próximo ciclo' };
const MOTIVO_TXT = {
  'Horas semanais insuficientes': 'Horas semanais insuficientes',
  'Orçamento insuficiente': 'Orçamento insuficiente',
  'Limite de ações simultâneas': 'Limite de ações simultâneas'
};
// Justificativas (Diagnostico!AG) exibidas sem alteração
const PROXIMO_PASSO_TXT = {};

// Perguntas guiadas (Tarefas!C6:K6)
const PERGUNTAS_TAREFA = [
  ['ativa', 'Ativa?', 'A tarefa faz parte da rotina atual?'],
  ['q1', 'Q1 · Exige presença física?', ''],
  ['q2', 'Q2 · Exige empatia ou negociação?', ''],
  ['q3', 'Q3 · Segue regras claras?', ''],
  ['q4', 'Q4 · A decisão pode ser delegada?', ''],
  ['q5', 'Q5 · Há troca de ideias com a IA?', ''],
  ['r1', 'R1 · O saber está concentrado em poucas pessoas?', ''],
  ['r2', 'R2 · Um erro causa prejuízo?', ''],
  ['r3', 'R3 · A equipe pratica a tarefa sem IA?', '']
];

const SUGESTOES_TAREFAS = [
  'Responder dúvidas no WhatsApp', 'Planejar pedido ao fornecedor', 'Criar conteúdo para redes sociais',
  'Conferir lançamentos do caixa', 'Negociar reclamação sensível', 'Analisar indicadores de vendas',
  'Preparar roteiro de capacitação', 'Conferir produtos na prateleira', 'Controlar estoque', 'Definir preços e promoções'
];

// Maturidade digital (Negocio!A13:A17)
const MATURIDADE_PERGUNTAS = [
  ['Registros digitais organizados'],
  ['Equipamentos e acesso disponíveis'],
  ['Rotinas de conferência de dados'],
  ['Apoio à aprendizagem na rotina']
];
const MATURIDADE_ESCALA = [['0 · Ausente', ''], ['1 · Inicial', ''], ['2 · Regular', ''], ['3 · Consolidada', '']];

// Escala de prontidão do formulário
const QUESTIONARIO_ESCALA = ['0 · Discordo totalmente', '1 · Discordo', '2 · Concordo', '3 · Concordo totalmente'];
