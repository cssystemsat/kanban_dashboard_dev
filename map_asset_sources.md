# Fonte do mapa do Brasil

- Fonte do SVG: https://simplemaps.com/static/svg/country/br/admin1/br.svg
- Página de referência: https://simplemaps.com/svg/country/br
- Licença informada pela fonte: uso comercial e pessoal gratuito; atribuição apreciada.
- O SVG contém a camada `label_points` com círculos de centro para cada UF (`BRSP`, `BRRJ`, etc.). Esses centros foram convertidos para percentuais do `viewBox="0 0 1000 912"` e usados no overlay dinâmico de valores.
- Asset armazenado no WebDev: `/manus-storage/brasil-estados_2f2eb889.svg`
- Motivo da troca: o asset anterior em CloudFront retornava HTTP 403 e o mapa não era renderizado.
