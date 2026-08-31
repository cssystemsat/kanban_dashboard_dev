# Validação visual final do bugfix

Após a correção, o preview da aba KPI’s mostrou a Semana Retrasada com zeros e os cards da Semana Passada com `—` nas comparações, sem os valores manuais antigos. O card Clientes ativos exibiu `156` e o modal listou os nomes da aba Marcos.

O card Concluídos exibiu `0` e o modal informou que nenhum cliente foi encontrado no período. A auditoria dos dados reais identificou 22 nomes em AK, todos com AM = `26/07/2026`; como a semana passada auditada é `24/08/2026`–`30/08/2026`, o zero é o resultado correto pela regra solicitada, não uma falha de leitura.
