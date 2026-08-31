# Validação visual da correção dos KPI’s

A aba `/?page=kpis&from_webdev=1` foi validada no preview após a correção. Como a Semana Retrasada está zerada, todos os cards da Semana Passada exibem `—` no lugar de tendências antigas como `+4`, `+2` ou percentuais herdados. Isso confirma que não há comparação artificial contra outro período.

O card `Clientes ativos` exibiu `156`. O card `Concluídos` exibiu `0`, e seu modal informou `Nenhum cliente encontrado para este período.`.

A auditoria dos dados reais da aba KPI’s mostrou 22 registros preenchidos em AK/AM, todos com data `26/07/2026`. Como a semana passada do ambiente é `24/08/2026` a `30/08/2026`, o resultado correto pela regra solicitada é zero. Não foram inventados nomes nem reaproveitados os 23 do resumo AB.
