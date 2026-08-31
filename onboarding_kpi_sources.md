# Auditoria das fontes de Onboarding

## Fontes consultadas

- Planilha principal: https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/edit?gid=0#gid=0
- Aba KPI’s da mesma planilha: https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/edit?gid=1590626518#gid=1590626518

## Evidências observadas

A aba com gid `0` aparece como `Onboarding` no Google Sheets e contém os registros de clientes. A exportação CSV dessa aba retornou 156 linhas totais, incluindo o cabeçalho, portanto 155 linhas após o cabeçalho. O painel atual do projeto considera a coluna B como nome do cliente e a coluna D como data de entrada; o hook também usa a aba para montar os dados de Marcos.

A aba com gid `1590626518` aparece como `KPI's`. Na exportação CSV, `AK` é o índice zero-based 36 e `AM` é o índice zero-based 38. Os dados visíveis em `AK`/`AM` começam na linha 2 da exportação, com nomes de clientes e datas de implantação, por exemplo `BVTRACKER` / `26/07/2026`, `Fênix Sat` / `26/07/2026` e `FORT SERVIÇOS` / `26/07/2026`. A área de indicadores usa `AA`/`AB`, incluindo `AA = Clientes ativos no onboarding` e `AB = 156`, além de `AA = Concluídos na semana` e `AB = 23`; porém a regra solicitada para o novo fluxo é contar diretamente os registros de `AK` e filtrar a data em `AM` pela semana passada.

A página atual ainda usa valores manuais, mas a implementação deverá substituir apenas os dois indicadores de Onboarding solicitados. A consulta deve ignorar linhas sem nome em `AK`, interpretar datas brasileiras em `AM` e retornar também os nomes para os modais.
