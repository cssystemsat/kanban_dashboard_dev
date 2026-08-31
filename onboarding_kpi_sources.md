# Auditoria das fontes de Onboarding

## Fontes consultadas

- Planilha principal: https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/edit?gid=0#gid=0
- Aba KPI’s da mesma planilha: https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/edit?gid=1590626518#gid=1590626518

## Evidências observadas

A aba com gid `0` aparece como `Onboarding` no Google Sheets e contém os registros de clientes. A exportação CSV dessa aba retornou 156 linhas totais, incluindo o cabeçalho, portanto 155 linhas após o cabeçalho. O painel atual do projeto considera a coluna B como nome do cliente e a coluna D como data de entrada; o hook também usa a aba para montar os dados de Marcos.

A aba com gid `1590626518` aparece como `KPI's`. Na exportação CSV, `AK` é o índice zero-based 36 e `AM` é o índice zero-based 38. Os dados visíveis em `AK`/`AM` começam na linha 2 da exportação, com nomes de clientes e datas de implantação, por exemplo `BVTRACKER` / `26/07/2026`, `Fênix Sat` / `26/07/2026` e `FORT SERVIÇOS` / `26/07/2026`. A área de indicadores usa `AA`/`AB`, incluindo `AA = Clientes ativos no onboarding` e `AB = 156`, além de `AA = Concluídos na semana` e `AB = 23`; porém a regra solicitada para o novo fluxo é contar diretamente os registros de `AK` e filtrar a data em `AM` pela semana passada.

A página atual ainda usa valores manuais, mas a implementação deverá substituir apenas os dois indicadores de Onboarding solicitados. A consulta deve ignorar linhas sem nome em `AK`, interpretar datas brasileiras em `AM` e retornar também os nomes para os modais.

## Auditoria de 31/08/2026

A exportação real da aba `KPI’s` contém 22 registros com nome em `AK`; todos têm `AM = 26/07/2026`. A semana passada calculada para o ambiente é `24/08/2026` a `30/08/2026`, portanto o indicador `Concluídos` retorna `0` e o modal fica vazio pela regra solicitada.

A célula de resumo `AB3` exibe `23`, mas ela não é usada para o indicador atualizado: a fonte operacional definida é o nome em `AK` combinado com a data de implantação em `AM`. Quando a planilha receber registros com `AM` dentro da semana passada, eles serão contados automaticamente e seus nomes aparecerão no modal.

## Auditoria dos novos indicadores em 31/08/2026

Na aba `Marcos` da planilha principal, usando os cinco marcos em `AK:AO` e a mesma semântica do Painel (`OK` ou data ainda não vencida = sem marco atrasado), foram identificados 156 clientes: 94 atrasados, 57 em situação válida e 5 pendentes. Como a regra solicitada é “sem estar com marco atrasado”, o card `Dentro do prazo` deve considerar 62 clientes e exibir 39,74% (arredondado visualmente para 40%).

Na aba `KPI’s`, a coluna `AL` contém 23 valores numéricos de tempo em dias para os registros nomeados em `AK`. A média aritmética atual é 521,6521739 dias, exibida no card como `521,7d` quando formatada com uma casa decimal. A fonte é a coluna `AL`, não o valor de resumo em outra coluna.
