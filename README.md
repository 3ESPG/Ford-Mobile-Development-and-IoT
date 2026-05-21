<div align="center">

<img src="https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg" width="80" alt="Ford Logo" />

# Ford Service Pulse

### Aplicativo Mobile de Geração de Leads e Alertas de Serviço

**Parceria Ford + FIAP — Desafio 2: VIN Share na América do Sul**

[![Expo](https://img.shields.io/badge/Expo-51.0-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev)
[![Node.js](https://img.shields.io/badge/Node.js-API-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)

</div>

---

## 👨‍💻 Integrantes

| Nome | RM |
|---|---|
| Felipe Braunstein e Silva | RM554483 |
| Felipe do Nascimento Fernandes | RM554598 |
| Henrique Ignacio Bartalo | RM555274 |
| Gustavo Henrique Martins | RM556956 |

**Instituição:** FIAP — Faculdade de Informática e Administração Paulista
**Curso:** Análise e Desenvolvimento de Sistemas
**Disciplina:** Mobile Development and IoT

---

## Sobre o Projeto

A Ford enfrenta um desafio crítico no pós-venda: uma parte significativa dos veículos vendidos deixa de utilizar a rede oficial de concessionárias para manutenção ao longo do tempo. O indicador que mede isso é o **VIN Share** — a porcentagem de veículos Ford que retornam à rede para serviços pagos. Quanto menor esse número, maior a perda de receita recorrente e o risco de o cliente migrar definitivamente para a concorrência.

O **Ford Service Pulse** é um app mobile que transforma os dados de histórico de manutenção da Ford em ação comercial. A partir de uma base real com mais de 600 mil registros de serviços no Brasil, o app identifica automaticamente quais veículos estão em risco de evasão e gera leads priorizados para que as concessionárias entrem em contato antes que o cliente vá embora.

## O que foi construído

- App Expo + React Native com Expo Router
- API local em Node.js, sem framework externo, servindo os indicadores em JSON
- Pipeline que transforma `data/vin_share_Desafio_02.xlsx` em `api/data/vin-share-summary.json`
- Telas de painel executivo, concessionárias, leads de serviço e plano de ação

As planilhas brutas em `data/` não são versionadas por segurança e tamanho. O app usa o arquivo agregado `api/data/vin-share-summary.json`, que já está incluído no projeto.

## Requisitos atendidos — Mobile Development and IoT

- Aplicativo mobile multiplataforma com Expo
- Navegação por abas usando Expo Router
- Consumo assíncrono de API externa ao app
- Gerenciamento de estado por tela com carregamento, erro, filtros e refresh
- Uso do dataset do Desafio 2 para gerar métricas reais
- Simulação de sinais de veículo conectado nos leads: KM, estimativa de KM/ano, janela de revisão, garantia e dias desde o último serviço

## Como rodar

Instale as dependências:

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

Base local padrão: `http://localhost:3333`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/overview` | Métricas gerais do dashboard |
| GET | `/api/dealers` | VIN Share por concessionária (`?sort=volume\|share\|leads`) |
| GET | `/api/leads` | Lista de leads (`?q=&priority=Alta\|Media`) |
| GET | `/api/models` | VIN Share por modelo |
| GET | `/api/strategy` | Plano de ação |

No Android Emulator, o app usa `http://10.0.2.2:3333`. Em celular físico, defina o IP da sua máquina antes de iniciar o Expo:

```bash
# Windows
$env:EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3333"
npm run start

# macOS / Linux
EXPO_PUBLIC_API_URL="http://SEU_IP_LOCAL:3333" npm run start
```

## Metodologia dos indicadores

Como a base fornecida contém histórico de manutenções na rede, o app usa um proxy operacional:

```
Service Share estimado = VINs únicos com serviço pago nos últimos 12 meses / VINs únicos observados na base
```

Os leads são priorizados por recência do último serviço, quantidade de passagens, uso de agenda digital, estimativa de rodagem anual e janela de garantia.

---

<div align="center">Feito com 💙 por alunos da FIAP para a Ford</div>
