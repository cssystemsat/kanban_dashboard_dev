# Origem do campo Comercial

## Marcos

A aba Marcos é lida da planilha principal Systemsat pela exportação CSV com `gid=0`, utilizada pelo hook `client/src/hooks/useKanbanData.ts`. O campo Comercial vem da **coluna X** da planilha, índice zero-based `23`, mapeado por `comercialIdx = 23` e exposto como `client.comercial`.

Fonte da planilha principal: https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/edit?gid=0#gid=0

## Ongoing

A aba Ongoing é lida da mesma planilha principal pela exportação CSV com `gid=1152476970`, utilizada pelo hook `client/src/hooks/useOngoingData.ts`. O campo Comercial também vem da **coluna X**, índice zero-based `23`, mapeado como `const comercial = String(row[23] || "").trim()`.

Fonte da planilha principal: https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/edit?gid=1152476970#gid=1152476970

## Implementação do filtro

As duas páginas filtram o campo já normalizado pelos hooks através de `shared/commercialFilter.ts`. O filtro não cria nomes nem consulta uma fonte paralela: as opções são derivadas dos valores distintos de `client.comercial` presentes em cada aba, ignorando células vazias.
