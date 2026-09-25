<div align="center">

<img src="assets/icon.png" width="96" alt="Ícone do Ford Service Pulse" />

# Ford Service Pulse

### Retenção no pós-venda guiada por dados e por veículos conectados

**Ford × FIAP · Desafio 2 — Impulsionando o VIN Share na América do Sul**
**Sprint 3 · Mobile Development & IoT — Versão final do app com Design System**

[![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![SQLite](https://img.shields.io/badge/expo--sqlite-offline--first-003B57?style=flat&logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Testes](https://img.shields.io/badge/testes-22%20passando-0B7A53?style=flat)](#-testes)

**[⬇️ Baixar APK](#-apk)** · **[▶️ Vídeo de demonstração](#-vídeo)** · **[📱 Telas](#-telas)** · **[🧱 Arquitetura](#-arquitetura)**

</div>

---

## 👨‍💻 Integrantes

| Nome | RM |
|---|---|
| Felipe Braunstein e Silva | RM554483 |
| Felipe do Nascimento Fernandes | RM554598 |
| Henrique Ignacio Bartalo | RM555274 |
| Gustavo Henrique Martins | RM556956 |

**Instituição:** FIAP · **Curso:** Análise e Desenvolvimento de Sistemas · **Disciplina:** Mobile Development & IoT

---

## 🎯 O desafio Ford escolhido

Reter clientes no pós-venda é essencial para o negócio da Ford. O indicador-chave é o **VIN Share**: a porcentagem de veículos Ford que usam a **rede oficial** para manutenção. Quando o cliente some da oficina, a Ford perde receita recorrente e o relacionamento.

O desafio pede ferramentas para as concessionárias:

| Pilar do desafio | Como o app resolve |
|---|---|
| **Análise e visualização de dados** | Painel com Service Share, fluxo mensal de oficina, share por modelo e por concessionária, comparativo loja × rede |
| **Geração de leads e modelagem preditiva** | Fila de leads com **score de risco de evasão explicável** + **leads preditivos gerados por telemetria IoT** |
| **Otimização da jornada do cliente** | Mensagem personalizada por motivo do lead, registro de contato, agendamento na oficina e confirmação da retenção (visão 360° do cliente e do veículo) |

## ✨ Funcionalidades

**Fluxo principal (retenção de um cliente, do alerta ao VIN recuperado):**

```
Alerta IoT / score alto → Fila de leads → Detalhe (por que este cliente?) → Mensagem personalizada
→ Registrar contato → Agendar serviço → Cliente compareceu → VIN retido na rede Ford
```

- **Onboarding com perfil** — Consultor de serviço (vê a fila da sua concessionária) ou Gestor Ford (vê a rede toda).
- **Painel de retenção** — Service Share de 12 meses, funil da carteira (Novo → Em contato → Agendado → Retido), conversão, KPIs da rede, fluxo mensal de OS, share por modelo e leituras rápidas.
- **Fila de leads** — busca, filtros por prioridade e por status, escopo "Minha loja / Rede toda"; leads com alerta IoT sobem para o topo.
- **Detalhe do lead** — score explicável fator a fator (tempo sem serviço, histórico, rodagem, garantia, agenda digital), visão 360° do veículo, mensagem pronta para WhatsApp/e-mail/SMS e linha do tempo do relacionamento.
- **Registrar contato** — canal, resultado e observações; abre o WhatsApp/e-mail com a mensagem pronta.
- **Agendamento** — tipo de serviço (sugerido pelo alerta IoT), data (sem domingos), horário com bloqueio de horários ocupados e resumo.
- **Agenda da oficina** — próximos serviços agrupados por dia, "Cliente compareceu" (lead vira **Retido**) ou "Cancelar", histórico e taxa de comparecimento.
- **Veículo conectado (IoT)** — telemetria ao vivo em **3 modos de conexão** (Simulado, HTTP, WebSocket), saúde do veículo, sensores (óleo, bateria, motor, revisão), pressão dos pneus, códigos DTC, motor de regras que gera **leads preditivos**, **acelerômetro do celular** para estilo de condução e **vibração (atuador)** a cada alerta.
- **Rede Ford** — ranking de concessionárias (volume, menor share, mais leads), detalhe da loja com comparativo × rede e ação sugerida, playbook de retenção, funil de risco e modelos com mais risco.
- **Ajustes** — perfil, fonte de dados (base embarcada ou API), teste de conexão, sincronização e dados locais do SQLite.
- **Estados de interface em todas as telas** — carregamento (skeleton), vazio, erro com "tentar de novo" e sucesso (toast).

---

## 📱 Telas

> Capturas geradas a partir do próprio app (build web, viewport 390 × 844). O fluxo mostrado é o mesmo do vídeo.

### Onboarding e painel

| Boas-vindas | Perfil | Painel | Indicadores |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/01-boas-vindas.png" width="200"/> | <img src="docs/screenshots/02-perfil.png" width="200"/> | <img src="docs/screenshots/03-painel.png" width="200"/> | <img src="docs/screenshots/03b-painel-indicadores.png" width="200"/> |

| Share por modelo | Painel com alertas IoT | Painel com API ao vivo |
|:---:|:---:|:---:|
| <img src="docs/screenshots/03c-painel-modelos.png" width="200"/> | <img src="docs/screenshots/18-painel-com-alertas.png" width="200"/> | <img src="docs/screenshots/23-painel-api-ao-vivo.png" width="200"/> |

### Leads e jornada do cliente

| Fila (rede) | Fila (minha loja) | Detalhe do lead | Score explicável |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/04-leads.png" width="200"/> | <img src="docs/screenshots/19-leads-minha-loja.png" width="200"/> | <img src="docs/screenshots/05-lead-detalhe.png" width="200"/> | <img src="docs/screenshots/06-lead-score-360.png" width="200"/> |

| Mensagem personalizada | Registrar contato | Agendar serviço | Agendado (sucesso) |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/06b-lead-mensagem.png" width="200"/> | <img src="docs/screenshots/07-registrar-contato.png" width="200"/> | <img src="docs/screenshots/08-agendamento.png" width="200"/> | <img src="docs/screenshots/08b-agendado-toast.png" width="200"/> |

| Histórico do lead | Agenda da oficina |
|:---:|:---:|
| <img src="docs/screenshots/08c-lead-historico.png" width="200"/> | <img src="docs/screenshots/13-agenda.png" width="200"/> |

### Veículo conectado (IoT)

| Telemetria (simulado) | Sensores | Alertas → lead preditivo | Pneus |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/09-conectado.png" width="200"/> | <img src="docs/screenshots/10-conectado-sensores.png" width="200"/> | <img src="docs/screenshots/11-conectado-alertas.png" width="200"/> | <img src="docs/screenshots/12b-conectado-pneus.png" width="200"/> |

| Acelerômetro + atuação remota | Modo WebSocket | Falha injetada via WebSocket |
|:---:|:---:|:---:|
| <img src="docs/screenshots/12-conectado-celular.png" width="200"/> | <img src="docs/screenshots/21-conectado-websocket.png" width="200"/> | <img src="docs/screenshots/22-conectado-websocket-falha.png" width="200"/> |

### Rede e ajustes

| Concessionárias | Playbook | Ações do playbook | Detalhe da concessionária |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/14-rede.png" width="200"/> | <img src="docs/screenshots/15-playbook.png" width="200"/> | <img src="docs/screenshots/15b-playbook-acoes.png" width="200"/> | <img src="docs/screenshots/16-concessionaria.png" width="200"/> |

| Ajustes (offline) | Ajustes (API conectada) |
|:---:|:---:|
| <img src="docs/screenshots/17-ajustes.png" width="200"/> | <img src="docs/screenshots/20-ajustes-api-conectada.png" width="200"/> |

---

## 📦 APK

| | |
|---|---|
| **Download do APK** | **👉 `COLE_AQUI_O_LINK_DO_APK`** (GitHub Releases ou Google Drive) |
| Pacote Android | `br.com.fiap.fordservicepulse` |
| Versão | 1.3.0 (versionCode 3) |
| Requisitos | Android 7.0+ · funciona **sem internet** (base embarcada + SQLite) |

> O APK não é versionado no repositório (binários ficam fora do Git). Ele é publicado em **Releases** / Drive.

### Como gerar o APK (Expo EAS Build)

```bash
npm install
npm install -g eas-cli
eas login                    # conta Expo do grupo
eas init                     # vincula o projeto (só na primeira vez)
npm run build:apk            # = eas build --platform android --profile preview
```

O perfil `preview` do [`eas.json`](eas.json) gera um **`.apk` instalável** (`buildType: apk`). Ao final, o EAS mostra o link de download; publique o arquivo em **GitHub → Releases → Draft a new release** e cole o link acima.

## ▶️ Vídeo

**👉 `COLE_AQUI_O_LINK_DO_YOUTUBE`** (não listado, até 2 minutos) — roteiro sugerido: boas-vindas → painel → lead → contato → agendamento → agenda "cliente compareceu" → aba Conectado (falha simulada + vibração).

---

## 🧱 Arquitetura

```mermaid
flowchart LR
  subgraph App["📱 App (Expo / React Native)"]
    UI["Telas (expo-router)<br/>app/"] --> DS["Design System<br/>src/design-system"]
    UI --> ST["Estado global<br/>AppProvider (Context)"]
    ST --> DOM["Regras de negócio puras<br/>src/domain"]
    ST --> DB[("SQLite local<br/>expo-sqlite")]
    ST --> SEED["Base embarcada<br/>vin-share-summary.json"]
    UI --> IOT["IoT hooks<br/>useTelemetry · useDrivingSensor"]
    IOT --> SENS["Acelerômetro<br/>expo-sensors"]
    IOT --> ACT["Vibração (atuador)<br/>expo-haptics"]
  end
  subgraph API["🖥️ API Node.js (opcional)"]
    REST["REST<br/>/api/snapshot · /api/vehicles/:vin/telemetry"]
    WS["WebSocket<br/>/ws/telemetry"]
    SIM["Simulador OBD-II por VIN"]
    REST --> SIM
    WS --> SIM
  end
  XLSX["vin_share_Desafio_02.xlsx<br/>(600 mil OS)"] -->|scripts/build-service-summary.py| SEED
  ST -. sincronização .-> REST
  IOT -. HTTP polling .-> REST
  IOT -. push em tempo real .-> WS
```

```
app/                      # Rotas (expo-router): 1 arquivo = 1 tela
  (tabs)/                 # Painel · Leads · Conectado · Agenda · Rede
  lead/[id].tsx           # Detalhe do lead
  contact/[id].tsx        # Modal: registrar contato
  schedule/[id].tsx       # Modal: agendar serviço
  dealer/[code].tsx       # Detalhe da concessionária
  welcome.tsx · settings.tsx
src/
  design-system/          # tokens.ts + 20 componentes reutilizáveis
  domain/                 # Regras puras e testadas (score, telemetria, agenda, condução)
  data/store/             # Repositório local: crmStore.ts (SQLite) · crmStore.web.ts
  state/                  # AppProvider (Context) + seletores
  iot/                    # useTelemetry (3 modos), useDrivingSensor, actuators
  api/client.ts           # Cliente HTTP com timeout e erros tipados
  ui/                     # Componentes de produto (LeadCard, ProfileButton, StickyFooter)
api/                      # API Node (REST + WebSocket) e simulador de telemetria
tests/                    # Testes de domínio e da API (node:test)
docs/screenshots/         # Prints de todas as telas
```

## 🎨 Design System

A identidade visual segue a Ford: **azul Ford profundo** (`#00095B`) como cor de marca, **azul de interação** (`#066FEF`) para ações e um fundo neutro claro. Tudo sai de [`src/design-system/tokens.ts`](src/design-system/tokens.ts). As telas nunca usam cor, fonte ou espaçamento soltos.

| Token | Valores |
|---|---|
| **Cores de marca** | `brand #00095B` · `brandDeep #00052E` · `accent #066FEF` · `sky #2D96CD` |
| **Semânticas** | `success #0B7A53` · `warning #B86B00` · `danger #C8231A` · `info #066FEF` · `iot #5B3CC4` |
| **Tipografia** | Barlow (títulos e números, visual automotivo) + Inter (texto). Escala: `displayXL 40` → `caption 12` |
| **Espaçamento** | Escala de 4 pt: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48` |
| **Raios** | `6 · 10 · 14 · 20 · 28 · pill` |
| **Elevação** | `sm · md · lg` (sombra azulada da marca) |

**Componentes:** `AppText`, `Button` (primary/secondary/ghost/danger/onBrand + loading/disabled), `Card` (tocável com feedback), `Badge`, `StatusDot`, `Chip`/`ChipRow`, `SegmentedControl`, `SearchField`/`TextField`, `KpiTile`/`KpiGrid`, `MetricRow`, `ListRow`, `ProgressBar`, `RingGauge` (SVG), `BarChart`, `Sparkline` (SVG), `Hero` (cabeçalho com gradiente), `Screen`, `Section`, `IconTile`, `Skeleton`/`LoadingState`, `EmptyState`, `ErrorState`, `Banner`, `Toast`.

**Estados de interação padronizados:** *loading* (skeleton pulsante) · *vazio* (ilustração + ação) · *erro* (mensagem + tentar de novo) · *sucesso* (toast + vibração). Alvos de toque de no mínimo 44 pt e `accessibilityRole`/`accessibilityLabel` nos componentes interativos.

## 📡 IoT: sensores, atuadores e 3 modos de conexão

| Elemento | Implementação |
|---|---|
| **Sensor do veículo** | Módulo OBD-II/TCU simulado: velocidade, rotação, odômetro, vida do óleo, bateria, temperatura do motor, pressão dos 4 pneus e códigos DTC ([`src/domain/telemetry.ts`](src/domain/telemetry.ts)) |
| **Sensor do celular** | Acelerômetro (`expo-sensors`, 5 Hz) com filtro passa-alta que remove a gravidade e detecta frenagens/arrancadas bruscas ([`src/domain/driving.ts`](src/domain/driving.ts)) |
| **Atuador** | Motor de vibração (`expo-haptics`): padrão de erro para alerta crítico, aviso para atenção |
| **Atuação remota** | "Simular falha no motor" envia o DTC `P0301` ao veículo pelo mesmo canal da telemetria |
| **Modo 1 · Simulado** | Gerador local no app: funciona no APK sem servidor e sem internet |
| **Modo 2 · HTTP** | Polling REST a cada 2 s em `GET /api/vehicles/:vin/telemetry` (mostra a latência) |
| **Modo 3 · WebSocket** | Stream push em `ws://HOST:3333/ws/telemetry`, 1 leitura/s, com comando de falha bidirecional |

**Motor de regras → lead preditivo:** óleo ≤ 15 %, alternador < 13,2 V, pneu < 30 psi, motor ≥ 108 °C, qualquer DTC ou 3 eventos de condução agressiva geram um alerta. O alerta é salvo no SQLite, o celular vibra, o lead ganha a marca **⚡ IoT**, sobe para o topo da fila, e o agendamento já sugere o serviço certo (ex.: óleo → "Troca de óleo e filtros").

## 🗄️ Dados e persistência (offline-first)

- **Base embarcada:** o app já vem com o resumo gerado da planilha do Desafio 2 (`vin_share_Desafio_02.xlsx`, mais de 600 mil ordens de serviço), então **o APK funciona sem API e sem internet**.
- **SQLite (`expo-sqlite`)** com migrações versionadas (`PRAGMA user_version`) e as tabelas `settings`, `lead_status`, `interactions`, `appointments` e `iot_alerts`.
- **Repositório com contrato único** (`CrmStore`): `crmStore.ts` (SQLite, Android/iOS) e `crmStore.web.ts` (localStorage, só para a pré-visualização web). O Metro escolhe o arquivo pela extensão de plataforma.
- **API opcional:** em *Ajustes* é possível informar a URL da API; o app testa `/health`, sincroniza `/api/snapshot` e, se falhar, continua com a base embarcada.
- **Privacidade (LGPD):** VINs mascarados (`E275F2...E738`), nenhum dado pessoal do cliente e permissões Android mínimas (armazenamento externo e microfone bloqueados).

## ▶️ Como rodar

```bash
npm install
npm start              # Expo (Expo Go / emulador / web)
npm run web            # pré-visualização no navegador
```

**API opcional (modos HTTP/WebSocket e sincronização):**

```bash
npm run api            # http://localhost:3333  ·  ws://localhost:3333/ws/telemetry
```

No app, abra **Ajustes → URL da API** e informe `http://SEU_IP_LOCAL:3333` (celular e computador na mesma rede). No emulador Android use `http://10.0.2.2:3333`. Também é possível fixar a URL no build: `EXPO_PUBLIC_API_URL=http://SEU_IP:3333`.

**Endpoints:** `GET /health` · `GET /api/snapshot` · `GET /api/overview` · `GET /api/dealers[/:code]` · `GET /api/leads[/:id]` · `GET /api/models` · `GET /api/strategy` · `GET /api/vehicles/:vin/telemetry` · `POST /api/vehicles/:vin/faults` · `WS /ws/telemetry`. Erros seguem o formato `{ "error": { "code", "message" } }` com status HTTP coerente (400, 404, 500).

**Regenerar a base a partir da planilha:** `npm run build:data` (requer `data/vin_share_Desafio_02.xlsx`, que não é versionada).

## 🧪 Testes

```bash
npm test          # 22 testes (node:test + tsx)
npm run typecheck # TypeScript estrito
```

| Suíte | O que valida |
|---|---|
| Score explicável | Os fatores reconstroem **exatamente** o score do pipeline de dados (conferido nos 160 leads) e marcam dados ausentes como "não disponível" |
| Jornada do cliente | Mensagem personalizada, prioridade de leads com alerta IoT e taxa de conversão do funil |
| Agenda | Sem domingos e serviço sugerido a partir do código do alerta |
| Regras IoT | Veículo saudável sem alertas, detecção de óleo, pneu, temperatura e DTC, simulação determinística e injeção de falha |
| Acelerômetro | Repouso ≈ 0 g e contagem de frenagens bruscas com debounce |
| Formatação | Números compactos em pt-BR ("175,6 mil") e busca sem acento |
| API REST + WebSocket | Health, snapshot, filtros, 404 padronizado, telemetria, validação de DTC (400/202) e stream com comando de falha |

## 🧭 Decisões técnicas

1. **Offline-first com base embarcada + SQLite.** Um APK que depende de um servidor em `localhost` não abre dados no celular do avaliador. A API passou a ser opcional, e o SQLite guarda o que o consultor produz (status, contatos, agenda, alertas).
2. **Design System próprio em vez de uma biblioteca de UI.** Tokens em 3 níveis (paleta → semântico → componente) garantem consistência entre as telas e facilitam o *handoff* do Figma.
3. **Regras de negócio puras em `src/domain`.** Score, regras de telemetria, agenda e condução não dependem de React, por isso são testáveis em Node e reaproveitadas pela API.
4. **Score explicável, não caixa-preta.** O consultor vê quanto cada fator somou; isso gera confiança e orienta a abordagem ao cliente.
5. **IoT com 3 modos de conexão atrás de um único hook.** A tela não sabe se os dados vêm do simulador, de polling HTTP ou de WebSocket; trocar o transporte não muda a interface.
6. **Expo Router + rotas tipadas**, modais para ações curtas (contato e agendamento) e abas para as áreas principais.
7. **Barlow + Inter** via `@expo-google-fonts`, carregadas antes de esconder a splash para evitar "pulo" de fonte.
8. **Sem `react-native-reanimated`.** A dependência não era usada e aumentava o risco no build nativo; as animações usam a API `Animated`.

## 🚀 Próximos passos

- Integrar telemetria real (Ford Pro / FordPass Connect ou dongle OBD-II via Bluetooth LE).
- Sincronização bidirecional do CRM (Supabase/Postgres) com autenticação por concessionária.
- Notificações push de lembrete de revisão para o cliente final.
- Modelo de ML (sprint de IA) para substituir o score por regras por uma probabilidade de evasão.
- Modo escuro e internacionalização (es-AR, es-CL) para a América do Sul.

## 📚 Metodologia dos indicadores

```
Service Share estimado = VINs únicos com serviço pago nos últimos 12 meses / VINs únicos observados na base
```

Score de risco (0–100): tempo sem serviço (até 45) + histórico na rede (até 16) + rodagem estimada (até 12) + fase da garantia (até 10) + ausência de agenda digital (10). Prioridade **Alta ≥ 70**, **Média ≥ 45**.

---

<div align="center">Feito com 💙 por alunos da FIAP para a Ford</div>
