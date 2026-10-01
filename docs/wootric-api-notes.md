# Wootric — notas de integração

Fontes oficiais consultadas em 2026-10-01:

- REST API: https://docs.wootric.com/api/
- Outgoing Webhooks: https://docs.wootric.com/webhooks/
- Suporte a webhooks: https://help.wootric.com/en/articles/979577-does-wootric-support-webhooks

## API

- Ambientes: US (`api.wootric.com`), EU (`api.wootric.eu`) e AU (`api.wootric.au`). O ambiente pode ser identificado pelo prefixo do account token (`NPS-EU` ou `NPS-AU`).
- OAuth `client_credentials`: `POST /oauth/token`, usando `grant_type`, `client_id` e `client_secret` em multipart/form-data.
- Access token expira em 7200 segundos.
- Requests autenticados usam `Authorization: Bearer <access_token>`.
- Respostas: `GET /v1/responses`, com filtros `created[gt]`, `created[gte]`, `created[lt]`, `created[lte]`, paginação até 30 e `per_page` até 50.
- A API pode responder HTTP 429; observar `X-Rate-Limit-*`.

## Outgoing Webhooks

- URL configurada em Wootric Settings > Outgoing Webhooks precisa ser publicamente acessível.
- Eventos relevantes: `Response created` e opcionalmente `Response updated`.
- Payload JSON de resposta inclui `response.id`, `email`, `external_id`, `score`, `text`, `end_user_id`, `end_user_properties`, `survey_id`, `created_at`, `updated_at`, `excluded_from_calculations`, além de `event_name`, `timestamp`, `account_token` e `survey_mode`.
- Wootric envia `POST`.
- Segurança: cabeçalho `X-WOOTRIC-SIGNATURE`, HMAC-SHA1 do corpo original usando o secret token da página Outgoing Webhooks.
- O webhook secret é diferente das credenciais OAuth/API mostradas na tela de integrações e será necessário para ativar validação do webhook.

## Decisão de arquitetura

- Usar webhook para tempo real quando o secret da página Outgoing Webhooks estiver disponível.
- Usar API REST com `client_credentials` para autenticação, carga inicial e sincronização de contingência.
- Deduplicar por `response.id`.
