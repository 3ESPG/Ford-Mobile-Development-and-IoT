# Ford Service Pulse

Aplicativo mobile do Desafio 2 da parceria Ford + FIAP, focado em pos-venda, Service Share, retencao e geracao de leads para concessionarias.

## O que foi construido

- App Expo + React Native com Expo Router.
- API local em Node.js, sem framework externo, servindo os indicadores em JSON.
- Pipeline que transforma `data/vin_share_Desafio_02.xlsx` em `api/data/vin-share-summary.json`.
- Telas de painel executivo, concessionarias, leads de servico e plano de acao.

As planilhas brutas em `data/` nao sao versionadas por seguranca e tamanho. O app usa o arquivo agregado `api/data/vin-share-summary.json`, que ja esta incluido no projeto.

## Requisitos atendidos de Mobile Development and IoT

- Aplicativo mobile multiplataforma com Expo.
- Navegacao por abas usando Expo Router.
- Consumo assincrono de API externa ao app.
- Gerenciamento de estado por tela com carregamento, erro, filtros e refresh.
- Uso do dataset do Desafio 2 para gerar metricas reais.
- Simulacao de sinais de veiculo conectado nos leads: KM, estimativa de KM/ano, janela de revisao, garantia e dias desde o ultimo servico.

## Como rodar

Instale as dependencias:

```bash
npm install
```

Gere novamente a base agregada, se precisar:

```bash
npm run build:data
```

Esse comando exige que a planilha original `data/vin_share_Desafio_02.xlsx` exista localmente.

Inicie a API:

```bash
npm run api
```

Em outro terminal, inicie o app:

```bash
npm run start
```

Para abrir no navegador:

```bash
npm run web
```

## API

Base local padrao:

```text
http://localhost:3333
```

Endpoints:

- `GET /health`
- `GET /api/overview`
- `GET /api/dealers?q=&sort=volume|share|leads`
- `GET /api/leads?q=&priority=Alta|Media`
- `GET /api/models`
- `GET /api/strategy`

No Android Emulator, o app usa `http://10.0.2.2:3333`. Em celular fisico, defina o IP da sua maquina antes de iniciar o Expo:

```bash
$env:EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3333"
npm run start
```

## Metodologia dos indicadores

Como a base fornecida contem historico de manutencoes na rede, o app usa um proxy operacional:

```text
Service Share estimado = VINs unicos com servico pago nos ultimos 12 meses / VINs unicos observados na base
```

Os leads sao priorizados por recencia do ultimo servico, quantidade de passagens, uso de agenda digital, estimativa de rodagem anual e janela de garantia.
