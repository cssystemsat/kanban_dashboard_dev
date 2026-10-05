export type GlobalObjectiveDefinition = {
  name: string;
  subobjectives: string[];
};

export const GLOBAL_OBJECTIVES: GlobalObjectiveDefinition[] = [
  {
    name: "Migração",
    subobjectives: [
      "Receber ou levantar os dados",
      "Importar os dados na base",
      "Enviar comandos para migração",
      "Conferir e reenviar pendentes",
      "Finalizar migração",
    ],
  },
  {
    name: "Videotelemetria",
    subobjectives: [
      "Apontar 1° câmera",
      "Criar regras com eventos de câmera",
      "Ver ao vivo e timeline",
      "Ver mídias enviadas",
    ],
  },
  {
    name: "Rede CAN",
    subobjectives: [
      "Apontar 1° equipamento",
      "Validar dados da CAN chegando",
      "Criar faixa de RPM",
      "Mostrar faixas sendo geradas",
    ],
  },
  {
    name: "Licitação",
    subobjectives: ["Validar edital do projeto", "Traçar passos com cliente"],
  },
  {
    name: "Logistics",
    subobjectives: [
      "Apontar 1° equipamento",
      "Baixar onboard e criar acessos",
      "Pegar lista de clientes",
      "Criar pré-configurações",
      "Criar uma viagem de teste",
      "Validar com cliente viagem",
    ],
  },
  {
    name: "Performance",
    subobjectives: [
      "Apontar 1° equipamento",
      "Identificação de motorista",
      "Criar regras principais",
      "Criar fórmula de avaliação",
      "Validar ranking com cliente",
    ],
  },
  {
    name: "Performance Plus",
    subobjectives: [
      "Apontar 1° equipamento",
      "Validar os dados da CAN",
      "Identificação de motorista",
      "Criar regras principais",
      "Criar fórmula de avaliação",
      "Validar ranking com cliente",
    ],
  },
  {
    name: "Manutenção",
    subobjectives: [
      "Apontar 1° equipamento",
      "Levantar manutenções realizadas",
      "Criar 1° manutenção",
      "Ajustar odômetros",
    ],
  },
  {
    name: "Fretamento",
    subobjectives: [
      "Apontar 1° equipamento",
      "Validar periférico",
      "Validar alguns cartões",
      "Conferir relatório",
    ],
  },
  {
    name: "Jornada de Trabalho",
    subobjectives: [
      "Definir como será jornada",
      "Criar escala",
      "Associar colaboradores",
      "Validar jornada em andamento",
      "Validar relatório",
    ],
  },
  {
    name: "BI",
    subobjectives: [
      "Apontar 1° equipamento",
      "Validar dados importantes",
      "Liberar BI e abas para cliente",
      "Configurações importantes",
      "Validar BI gerado",
    ],
  },
  {
    name: "Gestão de Multa",
    subobjectives: [
      "Cadastrar veículos",
      "Configurar cliente que irá utilizar gestão",
      "Habilitar gestão de multa para veículo",
      "Entrar no Gestão de Multa e validar",
    ],
  },
  {
    name: "Integração",
    subobjectives: [
      "Levantar qual será integração",
      "Orientar cliente na integração",
      "Integração funcionando",
    ],
  },
  {
    name: "Rastreamento básico",
    subobjectives: [
      "Apontar 1° equipamento",
      "Ver veículo no mapa",
      "Testar envio de comando",
      "Ver histórico simples",
      "Ver 1° relatório",
      "Compartilhar rastreamento",
    ],
  },
  {
    name: "Gestão de frota",
    subobjectives: [
      "Apontar 1° equipamento",
      "Identificação de motorista",
      "Ver veículo no mapa",
      "Testar envio de comando",
      "Ver histórico simples",
      "Ver 1° relatório",
      "Compartilhar rastreamento",
      "Ir para produto avançado",
    ],
  },
];

export function normalizeGlobalObjective(value: string | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function getGlobalObjectiveDefinition(name: string | undefined) {
  const normalized = normalizeGlobalObjective(name);
  return GLOBAL_OBJECTIVES.find(
    objective => normalizeGlobalObjective(objective.name) === normalized
  );
}
