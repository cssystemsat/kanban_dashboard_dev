# Kanban Dashboard Dev - TODO

- [x] Clonar repositório GitHub e analisar estrutura
- [x] Integrar schema do banco de dados (tabelas Kanban)
- [x] Integrar routers tRPC do Kanban (incluindo analyzeWithLLM)
- [x] Integrar componentes e páginas do frontend
- [x] Instalar dependências adicionais necessárias (nenhuma extra necessária)
- [x] Executar migração do banco de dados (schema sem alterações necessárias)
- [x] Ajustar App.tsx com rotas do Kanban
- [x] Escrever/atualizar testes vitest (3 testes passando)
- [x] Verificar build e funcionamento (TypeScript sem erros, servidor rodando)
- [x] Salvar checkpoint e publicar
- [x] Alterar título da aba do navegador para "Painel de Controle do CS"
- [x] Upload da logo Systemsat para CDN
- [x] Configurar logo como favicon na aba do navegador
- [x] Exibir logo no menu lateral (SideMenu)
- [x] Inverter ordenação dos clientes na aba Marcos (mais antigo para mais novo)
- [x] Renomear "Presets" para "Filtro 1" e "Presets 2 - Dias de Contrato" para "Filtro 2"
- [x] Adicionar opção "Últimos 60 dias" no Filtro 1
- [x] Adicionar opção "7+ dias de contrato" no Filtro 2
- [x] Corrigir cor do % desatualizado nos cards da aba Marcos (vermelho apenas acima de 30%)
- [x] Corrigir duplicação: clientes 100% implantados não devem aparecer nos marcos numerados
- [x] Criar hook useAgendaData para buscar última atualização operacional da aba Agendas
- [x] Exibir última atualização operacional no modal do cliente (aba Marcos), acima do gráfico de URs
- [x] Adicionar indicador visual de alerta no card e modal quando cliente sem atualização há mais de 30 dias
- [x] Remover "Sem registro operacional" do card (manter apenas no modal)
- [x] Atualizar hook useAgendaData para retornar todos os registros do cliente
- [x] Adicionar botão "Histórico" no modal com menu suspenso de registros por data (decrescente)
- [x] Configurar credenciais Google Sheets API como secret no projeto
- [x] Criar endpoint tRPC para gravar atendimento na aba Agendas (gid=1655169262)
- [x] Transformar indicadores No Prazo/Atrasado em círculos verde/vermelho no card
- [x] Adicionar botão Atendimento azul no card
- [x] Criar modal AtendimentoModal com formulário de lançamento
- [x] Adicionar campo "Razão" no modal de atendimento (coluna G na planilha)
- [x] Tornar campo Resumo opcional no modal (fallback "sem resumo" na planilha)
- [x] Adicionar botão Atendimento na aba Ongoing
- [x] Adicionar "Operacional (migração)" nas opções de Situação
- [x] Renomear "Tipo de atendimento" para "Origem do atendimento"
- [x] Renomear "Razão" para "Tópico"
- [x] Alterar origem dos registros operacionais no modal: de gid=1655169262 para gid=1831685689
- [x] Atualizar coluna O (flag) nos hooks: de checkbox para texto com 3 níveis (Red Flag, Yellow Flag, Black Flag)
- [x] Atualizar coluna Q (estrela) nos hooks: checkbox booleano, só exibir se houver flag
- [x] Atualizar ClientCard (Marcos): canto superior direito com estrela + flag colorida + No prazo/Atrasado
- [x] Atualizar OngoingCard: canto superior direito com estrela + flag colorida
- [x] Restaurar texto "No prazo"/"Atrasado" no lugar dos círculos nos cards
- [x] Atualizar filtros de flag em Marcos e Ongoing para os 3 novos níveis
- [x] Substituir badges de texto de flag por ícones de bandeira coloridos nos cards
- [x] Otimizar layout dos cards para não cortar o nome dos clientes
- [x] Exibir ícone de bandeira + nome da flag em linha abaixo do nome do cliente nos cards
- [x] Remover alerta "Sem atualiz. há Xd" dos cards Marcos e Ongoing
- [x] Mover ganho/perda de URs para o canto superior direito do card Marcos (ao lado do nome)
- [x] Corrigir contraste do botão Black Flag nos filtros (fundo branco com texto/borda preta)
- [x] Compactar painéis de métricas em linha única horizontal no Home.tsx e Ongoing.tsx
- [x] Aumentar e esticar barra de métricas para cobrir toda a largura em linha única
- [x] Remover filtro de objetivos do Home.tsx
- [x] Mover botão Atualizar para o canto superior direito do header
- [x] Subir painel de métricas para reduzir espaço entre header e cards
- [x] Criar tabela allowed_emails no banco com CRUD via tRPC
- [x] Criar página Configurações com gerenciamento de e-mails permitidos (só admins)
- [x] Verificar permissão no botão de lançamento de atendimento (mostrar "Acesso negado" se não autorizado)
- [x] Adicionar aba Configurações no sidebar (visível só para agendamento.cs@ e joao.pedro@)
- [x] Adicionar botão de login/logout no sidebar
- [x] Seed inicial com e-mails admins na tabela allowed_emails
- [x] Adicionar coluna allowedPages em allowed_emails (abas permitidas por usuário)
- [x] Criar tabelas checklists, checklist_items e checklist_completions no banco
- [x] Criar procedures tRPC para CRUD de checklists, itens e completions
- [x] Criar página Ferramentas com sub-página Checklists
- [x] Atualizar Configurações: seleção de abas permitidas por usuário
- [x] Atualizar SideMenu: aba Ferramentas, restrição de abas por usuário
- [x] Implementar reset diário automático dos checklists (meia-noite)
- [x] Corrigir erro de query: aplicar coluna allowedPages ao banco de produção
- [x] Criar botão flutuante de checklist com painel lateral deslizante para preenchimento rápido
- [x] Pré-definir Origem do atendimento como "Whatsapp grupo" no AtendimentoModal
- [x] Adicionar opção "Personalizado" na duração com seletor de minutos (+/−) no AtendimentoModal
- [x] Remover botão "Personalizado" e exibir seletor +/− de minutos sempre visível no AtendimentoModal
- [x] Criar tabelas de rastreamento no banco: user_sessions, page_views, user_actions
- [x] Criar procedures tRPC para rastreamento e consulta de estatísticas
- [x] Criar página Painel (pública, em construção)
- [x] Criar página Estatísticas com dashboard completo de uso por usuário
- [x] Atualizar SideMenu: Painel público, Estatísticas só admins, restrição sem login
- [x] Integrar rastreamento automático de sessão e navegação no App.tsx
- [x] Adicionar coluna canLaunch na tabela allowed_emails e atualizar permissão de lançamento de atendimento
- [x] Atualizar Configurações com checkbox de permissão de lançamento por usuário
- [x] Criar hook usePainelData para cobertura semanal por CSM (col C=CSM, col L=último contato)
- [x] Construir página Painel com tabela de cobertura por analista (Onboarding + Ongoing + totais + meta 25%)
- [x] Atualizar hook usePainelData para incluir lista de clientes contatados com nome e flag
- [x] Adicionar tooltip nos contatos do Painel com lista de clientes coloridos por flag
- [x] Adicionar acumulado mensal (clientes únicos no mês) por CSM no hook usePainelData
- [x] Aumentar fonte das tabelas e adicionar coluna Acumulado Mês no Painel
- [x] Ajustar tabelas do Painel: números maiores, cabeçalhos compactos, sem "(hover)", acumulado em %, sem overflow
- [x] Corrigir z-index do tooltip de clientes no Painel (aparece por baixo dos painéis)
- [x] Corrigir tooltip para aparecer abaixo quando perto do topo da tela
- [x] Adicionar tabela de clientes por Marco (1-5, até 90 dias) no lado direito do Painel
- [x] Otimizar layout horizontal do Painel (tabelas mais largas, sem overflow, melhor uso da tela)
- [x] Adicionar card "Migrados no ano" ao lado do Painel Geral (placeholder)
- [x] Adicionar tabela de Migração no Painel (Qtd em migração, Qtd migrado no dia, Qtd migrado no mês, Migrações finalizadas)
- [x] Colocar 4 tabelas (Onboarding, Ongoing, Marcos, Migração) em uma única linha horizontal no Painel
- [x] Reequilibrar proporções das 4 tabelas do Painel e aumentar tamanho dos números
- [x] Remover ícone de checklist flutuante apenas da página Painel
- [x] Adicionar coluna de data de entrada (coluna D, gid=1152476970) na página Ongoing
- [x] Corrigir mapeamento Decisor (col AE=30) e Contato do Decisor (col AF=31) no Ongoing e exibir no card
- [x] Tooltip na coluna Motivo da aba Churn: exibir motivo declarado (col P) e análise interna (col Q) do gid=1060737054
- [x] Filtro de Delta Consumo negativo na aba Ongoing (≤ valor informado pelo usuário)
- [x] Filtro de Diferença negativa na aba Marcos (≤ valor informado pelo usuário)
- [x] Integrar dados reais de migração no Painel: G4=Migrado hoje, I4=No mês (gid=1590626518)
- [x] Card "Migrados no Ano" no Painel: integrar célula G5 da aba gid=1590626518
- [x] Gravar usuário Google logado na coluna I ao lançar atendimento (Marcos e Ongoing)
- [x] Ajustar timer do modal de atendimento de 1 em 1 min para 5 em 5 minutos
- [x] Corrigir Ongoing: incluir todos os clientes da planilha, excluindo apenas os com "Churn" na coluna V (gid=1152476970)
- [x] Integrar G6=Em migração e I3=Finalizadas da aba gid=1590626518 na tabela de Migração do Painel
- [x] Corrigir erro NotFoundError no modal de atendimento (problema com createPortal e container DOM)
- [x] Trocar ícone lucide por caractere ASCII simples (-/+) no modal de atendimento para compatibilidade com todas as fontes
- [x] Corrigir z-index e overflow do menu suspenso de clientes no Painel para aparecer por cima
- [x] Ajustar tooltip de clientes para fixed positioning próximo do mouse (em vez de absolute distante)
- [x] Melhorar tooltip: não desaparecer ao scrollar (adicionar delay ou hover area maior)
- [x] Popup ao clicar em CONT. TOTAL: mostrar clientes sem contato na semana com data do último contato (col L, ordem decrescente)
- [x] Remover tooltip ao passar o mouse do ContatosCell e SemContatoCell (apenas popup ao clicar)
- [x] Adicionar filtro por flags nos popups de ContatosCell e SemContatoCell
- [x] Remover scroll duplo dos popups (deixar apenas um)
- [x] Corrigir valor de Migrados no Ano (G5) que estava exibindo -11921 (corrigido índice de coluna para [6])

## Aba Migração (em desenvolvimento)

- [x] Criar hook useMigracaoListData para buscar dados da aba Migração (gid=146618493)
- [x] Criar componente Kanban com colunas por status (Em andamento, Finalizada, etc.)
- [x] Implementar filtros: por atendente, por plataforma de origem, por tempo de migração
- [x] Estilizar cards com: nome da empresa, data de início, duração, plataforma, migrados/total
- [x] Integrar aba Migração no App.tsx
- [x] Testar funcionalidade completa e fazer ajustes visuais se necessário
- [x] Adicionar botão de atualizar dados
- [x] Adicionar pesquisa por cliente
- [x] Corrigir lógica do Kanban com condições exatas (L, P, T)
- [x] Adicionar menus suspensos para colunas L, P, T (para editar na planilha)
- [x] Compactar cards do Kanban para aparecer todos os status na tela de uma vez
- [x] Mudar ícone da aba Migração no SideMenu para ArrowRight
- [x] Reorganizar colunas Kanban por etapas (Não iniciado, Levantamento, Envio, Cancelada, Paralisada, Finalizada)
- [x] Adicionar modal ao clicar no card para mostrar Status (coluna H)
- [x] Mudar fundo do modal de preto para transparente
- [x] Adicionar responsável e status da etapa no card compacto

## Tela Atendimentos (em desenvolvimento)

- [x] Criar hook useAtendimentosData para buscar dados da aba Atendimentos (gid=1655169262)
- [x] Criar componente Atendimentos com estatísticas (clientes mais atendidos, assuntos, origem, tipo, tempo médio)
- [x] Criar página AtendimentosPage.tsx como aba separada
- [x] Adicionar rota e ícone (Phone) no SideMenu
- [x] Adicionar botão de atualizar dados
- [ ] Corrigir formato de tempo na planilha para sempre ser em minutos (números apenas)
- [x] Corrigir formato de tempo em AtendimentoModal para ser sempre em minutos (números apenas)
- [x] Criar tabela interativa de atendimentos com hover detalhado
- [x] Adicionar filtros na aba Atendimentos (cliente, origem, tipo, assunto, atendente)
- [x] Adicionar ordenação por colunas na tabela
- [x] Remover botão de atualizar duplicado do componente Atendimentos
- [x] Mostrar todos os atendentes em vez de top 5
- [x] Adicionar modal com fundo transparente para clientes e assuntos únicos
- [x] Adicionar restrição de acesso à aba Atendimentos (apenas admin)
- [x] Adicionar coluna Faturamento (F) nos modais de contatos da Cobertura Semanal (Onboarding e Ongoing)
- [x] Remover Cidade/Estado dos modais da Cobertura Semanal
- [x] Adicionar Cidade/Estado nos cards da aba Marcos (pequeno em baixo do nome)
- [x] Adicionar Cidade/Estado nos cards da aba Ongoing (pequeno em baixo do nome)

## Mapas do Brasil no Painel

- [x] Criar componente BrazilMapPainel com SVG interativo dos estados
- [x] Criar hook useEstadosData para buscar dados de clientes por estado (Onboarding gid=0, Ongoing gid=1152476970, coluna AJ)
- [x] Integrar 3 mapas na aba Painel (Onboarding, Ongoing, Geral)
- [x] Adicionar modal com fundo transparente ao clicar no número (Nome, Faturamento, Atendente)

## Melhoria de Filtros

- [x] Melhorar estética e alinhamento dos filtros em todas as abas (Marcos, Dashboard, Ongoing, Migração, Churns)
- [x] Mover filtros da aba Marcos para a mesma linha do título (à direita de "Dashboard do CS")
- [x] Melhorar cores do gráfico Top Motivos de Cancelamento (cores vivas com bom contraste)
- [x] Adicionar tooltip com lista de clientes ao hover no gráfico de motivos de cancelamento
- [x] Reformular aba Atendimentos para exibir detalhes inline na tabela, logo abaixo do nome do cliente
- [x] Melhorar mapa na aba Painel: aumentar números, adicionar círculos com gradiente de cores por densidade, ajustar posicionamento
- [x] Ajustar posicionamento dos círculos dentro de cada estado, com setas para estados pequenos (RN, PB, PE, AL, SE)
- [x] Mapa abre no "Geral" por padrão (em vez de Onboarding)
- [x] Corrigir posicionamento de SC, CE e MA
- [x] Remover setas e deixar círculos dos estados pequenos fora do mapa com setas vermelhas apontando
- [x] Adicionar auto-refresh a cada 10 minutos na aba Painel (mantendo botão manual)
- [x] Adicionar cronômetro regressivo sutil ao lado do botão Atualizar (conta de 10 min até 0)
- [x] Exibir todos os estados na aba Painel (remover limitação dos 10 maiores)
- [x] Adicionar botão para exportar tabela de estados (CSV/Excel)
- [x] Adicionar campo "Comercial" (coluna X) no modal de clientes por região
- [x] Incluir clientes no arquivo CSV exportado com todas as informações
- [x] Mostrar seção de mapas apenas quando usuário está logado na aba Painel
- [x] BUG: Cronômetro na aba Painel conta negativamente após chegar a zero (deveria reiniciar em 10 min)
- [x] Criar painel de Evolução de UR's (substituir conteúdo da aba Dashboard)
- [x] Gráfico de evolução de UR's nos últimos 30 dias (colunas X e Y da aba D)
- [x] Tabela "Piores clientes no Mês" (coluna A + G negativos, Delta % relativo coluna E)
- [x] Tabela "Melhores clientes no Mês" (coluna A + G positivos, Delta % relativo coluna E)
- [x] Tabela "Câmeras cadastradas no mês" (coluna AP + AQ, exceto AirTag PB703 e webtag)
- [x] Tabela "Tags cadastradas no mês" (coluna AP + AQ, apenas AirTag PB703 e webtag)
- [x] Atualizar navegação para "Evolução de UR's" no menu lateral
- [x] Botões de ordenação (Qtd e %) nas tabelas de piores/melhores clientes
- [x] Botão de comentário em cada cliente (piores/melhores) com persistência no banco
- [x] Clientes com comentários ficam com nome sublinhado
- [x] Ao clicar no cliente com comentário, exibir o comentário
- [x] Reduzir altura do gráfico de evolução (mais compacto verticalmente)
- [x] Corrigir cálculo de delta: soma de todos valores da coluna G por cliente no mês
- [x] Filtrar câmeras/tags por mês usando coluna AU (formato dd/mm/aaaa)
- [x] Corrigir piores/melhores clientes: usar colunas AA (cliente), AD (delta mês) e AE (%) diretamente
- [x] Remover fundo colorido de ambas as tabelas piores/melhores
- [x] Título da aba: "Controle de UR's, Câmeras e Tags no mês de [Mês]" (dinâmico)
- [x] Botão de screenshot que captura a tela e copia para clipboard
- [x] BUG: Screenshot falha com erro oklch - substituir html2canvas por modern-screenshot
- [x] Otimizar tabelas para evitar scroll horizontal (reduzir padding, fontes, espaçamento)
- [x] Reduzir altura do gráfico um pouco mais verticalmente
- [x] Adicionar botão para copiar comentários em formato "Empresa -> comentário"
- [x] Reorganizar layout Dashboard: Piores/Melhores grandes lado a lado, Câmeras/Tags pequenas lado a lado (apenas nome + qtd)

## Gráfico de Churns por CSM (em desenvolvimento)

- [x] Adicionar "Estatísticas" à lista ADMIN_ONLY_ITEMS no SideMenu
- [x] Criar hook useChurnsByCsmData para agregar churns por CSM com lista de empresas
- [x] Criar procedimento tRPC para agregar churns por CSM
- [x] Implementar gráfico comparativo com Recharts (BarChart horizontal)
- [x] Adicionar tooltip customizado com lista de empresas
- [x] Testar feature e criar checkpoint
- [x] Mover percentual antes do nome do CSM no gráfico (ex: "25% - Lucas")
- [x] Adicionar fundo colorido ao tooltip da lista de empresas
- [x] Transformar lista de empresas em modal ao clicar na barra do gráfico

## Filtros Top Boleto e Top Volume na aba Marcos

- [ ] Criar filtros "Top Boleto" e "Top Volume" lado a lado no topo direito
- [ ] Implementar lógica de filtro por boleto atual (maior valor)
- [ ] Implementar lógica de filtro por volume de placas (quantidade total)
- [ ] Integrar filtros com a exibição dos cards de marcos
- [ ] Testar e criar checkpoint

## Filtros Top Boleto e Top Volume

- [x] Adicionar tipos ClienteMarcoDetalhado ao hook usePainelData
- [x] Extrair dados de boleto (coluna F) e URs (coluna G) da planilha
- [x] Criar filtros Top Boleto e Top Volume na aba Marcos
- [x] Implementar lógica de filtro que recalcula marcos baseado nos clientes selecionados

## Filtros Top Boleto e Top Volume na aba Ongoing

- [x] Adicionar filtros Top Boletos e Top Volume na aba Ongoing
- [x] Implementar lógica de filtro que recalcula cards baseado nos clientes selecionados

## Modal de Comentários com Histórico

- [x] Criar estrutura de dados para comentários com histórico de versões
- [x] Implementar modal que mostra comentário, usuário, data e histórico
- [x] Integrar modal nas seções Piores e Melhores clientes
- [x] Recuperar comentários anteriores do localStorage
- [x] Restaurar tamanhos originais do gráfico e tabelas
- [x] Testar feature e criar checkpoint

## Tipo de Reset "Única" com Data Limite no Checklist

- [x] Atualizar schema do banco para suportar data limite e tipo "Única"
- [x] Adicionar campo de data limite no modal de edição de checklist
- [x] Implementar lógica de desaparecimento ao marcar concluída
- [x] Adicionar visualização de dias para vencer com alerta visual (vermelho quando vencida)
- [x] Testar feature e criar checkpoint
