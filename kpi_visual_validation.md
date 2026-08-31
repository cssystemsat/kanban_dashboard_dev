# Validação visual dos KPI’s

A rota `/?page=kpis&from_webdev=1` foi aberta no preview em 1280×720. A coluna **Semana Retrasada** exibiu valor `0` em todos os indicadores de Onboarding, Ongoing e Migração, com estado neutro. A coluna **Semana Passada** manteve os valores manuais editáveis. O layout em três categorias, os cabeçalhos das duas semanas e o modal de detalhes permaneceram presentes; não houve erro de renderização visual observado.

A validação de TypeScript foi aprovada e os testes específicos de KPI’s, Performance e contratos do ranking passaram. O teste completo do projeto continua sujeito ao limite temporário de quota da API do Google Sheets (`429 Read requests per minute`), sem relação com a lógica de snapshot.
