# Mapeamento das planilhas

## Planilha principal

- Spreadsheet ID: `1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc`
- URL fornecida: `https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/edit`
- Título observado: `Controle de Implantação`
- Aba aberta pelo usuário: GID `0`, nome `Onboarding`
- Abas visíveis: `Onboarding`, `ongoing`, `ausente`, `Projetos/ Negócios`, `correção`, `Migração`, `CHURNS`, `Histórico Migrado`, `Agendas`, `KPI's`, `Tarefas`, `Histórico` e `Tatty`.
- A planilha abriu em modo somente leitura no navegador sem login.

## Planilha secundária

- Spreadsheet ID: `1PYxRbfNVXWoOG9dJaQwb_GSqYhp8WgKF-KjUtYouuS4`
- URL fornecida: `https://docs.google.com/spreadsheets/d/1PYxRbfNVXWoOG9dJaQwb_GSqYhp8WgKF-KjUtYouuS4/edit?gid=1250838098#gid=1250838098`
- O navegador redirecionou para login do Google ao abrir a URL de edição; o GID fornecido é `1250838098`.

## Mapeamento confirmado por API

A conta de serviço conseguiu acessar as duas planilhas.

### Planilha principal — Controle de Implantação

|          GID | Aba                | Uso previsto                                           |
| -----------: | ------------------ | ------------------------------------------------------ |
|          `0` | Onboarding         | Marcos, cobertura de onboarding e dados de implantação |
| `1152476970` | ongoing            | Ongoing e cobertura de clientes                        |
| `1222935512` | ausente            | Clientes ausentes                                      |
| `1491886839` | Projetos/ Negócios | Projetos e negócios                                    |
| `1684171977` | correção           | Correções                                              |
|  `146618493` | Migração           | Atualização de migrações                               |
| `1060737054` | CHURNS             | Churns                                                 |
|  `185060895` | Histórico Migrado  | Histórico de migrações                                 |
| `1655169262` | Agendas            | Gravação de atendimentos                               |
| `1590626518` | KPI's              | Indicadores de onboarding, migração e geral            |
| `1831685689` | Tarefas            | Tarefas                                                |
| `2036645961` | Histórico          | Histórico                                              |
|  `202474765` | Tatty              | Aba auxiliar                                           |
| `1742663352` | Beta               | Aba oculta                                             |

### Planilha secundária — Dashboard

|          GID | Aba             | Uso previsto                        |
| -----------: | --------------- | ----------------------------------- |
| `1370129040` | Dashboard       | Dashboard consolidado               |
| `1250838098` | D               | Evolução de URs e análise histórica |
| `1969284070` | ontem para hoje | Perdas diárias de URs               |
| `1287852344` | atualizados     | Dados atualizados                   |
| `1955320503` | financeiro      | Financeiro                          |
| `1261156549` | Financeiroo     | Financeiro auxiliar                 |
|  `272467759` | financeiro 2    | Financeiro auxiliar 2               |
| `2031715151` | Migrações GS    | Migrações auxiliares                |
|  `624812345` | gsweb           | Dados auxiliares                    |
| `1303480727` | Dados           | Aba oculta                          |

A integração antiga usava URLs públicas `2PACX...` e referências cruzadas. O novo projeto deve substituir essas URLs por chamadas autenticadas aos dois IDs fornecidos, mantendo os GIDs acima e sem editar dados das planilhas.
