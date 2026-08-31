# Validação visual da integração de Onboarding

A rota `/?page=kpis&from_webdev=1` foi aberta no preview autenticado. O card **Clientes ativos** da coluna Semana Passada exibiu `156`, e o modal exibiu a lista de clientes da aba Marcos, iniciando por `ALPHA TECNOLOGIA`, `ALTOTRAK`, `CONTROL ON/ TOMI 567`, `DAFEL` e `ELITE RASTREIO`.

O card **Concluídos** exibiu `0` para a semana passada porque, na extração atual, nenhum registro com nome em `AK` possui data em `AM` dentro de `24/08/2026` a `30/08/2026`. A integração retornou a janela correta e a lista vazia sem inventar dados.

A interface dos demais KPI’s e o modal continuam renderizando. O valor dinâmico veio da nova procedure tRPC `kpis.getOnboardingKpiMetrics`, que lê as abas `Marcos` (gid 0) e `KPI's` (gid 1590626518) da planilha principal.
