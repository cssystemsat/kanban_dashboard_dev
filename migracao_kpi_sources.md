# Fontes dos KPI’s de Migração

Fonte auditada: [Controle de Implantação — aba Migração](https://docs.google.com/spreadsheets/d/1EJnd8R_3dSSBn9ERl3nRcYcBZWJJiI16tkuaT026Hhc/edit?gid=146618493#gid=146618493), GID `146618493`.

A exportação atual tem 27 colunas. O cabeçalho observado confirma que a coluna C é `Fim`, a coluna D é `Duração (Dias)`, a coluna E é `Cliente com link da planilha` e a coluna T é `Situação atual`. Portanto, o nome exibido nos modais deve vir da coluna E, apesar de o status solicitado estar na coluna T.

Na auditoria atual foram identificados 58 registros com `T = Em andamento`. Foram encontrados 157 valores numéricos em D; entre as linhas com C preenchida, existem 86 valores numéricos. A média de D somente nessas 86 linhas é `115,88372093023256` dias. Foram identificadas 16 migrações com D maior que 365, que devem compor o KPI Atrasadas conforme a regra solicitada.

O valor de Concluídas deve permanecer em `0` temporariamente, com o rótulo atualizado para `Concluídas`. A integração deve usar o proxy server-side existente e o GID `146618493`.
