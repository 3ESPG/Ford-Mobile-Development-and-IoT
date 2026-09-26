<div align="center">

<img src="assets/icon.png" width="96" alt="Ícone do Ford Service Pulse" />

# Ford Service Pulse

### Retenção no pós-venda guiada por dados e por veículos conectados

**Ford × FIAP · Desafio 2 — Impulsionando o VIN Share na América do Sul**
**Sprint 3 · Mobile Development & IoT — Versão final do app com Design System**

[![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![SQLite](https://img.shields.io/badge/expo--sqlite-offline--first-003B57?style=flat&logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![Testes](https://img.shields.io/badge/testes-36%20passando-0B7A53?style=flat)](#testes)

**[⬇️ Baixar APK](#apk)** · **[▶️ Vídeo](#video)** · **[📱 Telas](#telas)** · **[🔐 Usuários de teste](#usuarios)** · **[🎨 Design System](#design-system)**

</div>

---

## 1. 👨‍💻 Integrantes

| Nome | RM |
|---|---|
| Felipe Braunstein e Silva | RM554483 |
| Felipe do Nascimento Fernandes | RM554598 |
| Henrique Ignacio Bartalo | RM555274 |
| Gustavo Henrique Martins | RM556956 |

**Instituição:** FIAP · **Curso:** Análise e Desenvolvimento de Sistemas · **Disciplina:** Mobile Development & IoT

---

## 2. 🎯 O desafio Ford (Desafio 02)

O **Service Share** (VIN Share) é a porcentagem de clientes que fizeram, no último ano, um **serviço pago** numa concessionária Ford. Ele é alto nos carros novos, mas **despenca a partir de ~4 anos de uso**, e o parque antigo ainda é cerca de 70% da frota. Cliente que some da oficina é receita recorrente e relacionamento perdidos.

A Ford pede três frentes para a América do Sul:

| Pilar do desafio | Como o app resolve |
|---|---|
| **1. Análise e visualização** do Service Share por concessionária, modelo, idade do veículo e tipo de serviço | Painel com Service Share da loja × rede, clientes em risco por **idade do veículo**, fluxo mensal de OS, share por modelo e ranking de concessionárias |
| **2. Leads e modelagem preditiva** de veículos em risco de sair da rede | Carteira segmentada em **4 perfis** (Fiel, Abandono, Esquecido e Econômico) com **score de risco explicável**, mais **leads preditivos gerados por telemetria IoT** |
| **3. Jornada do cliente**: lembretes, ofertas e visão 360° | **Visão 360° do cliente**, **ação recomendada por perfil**, mensagem pronta para WhatsApp, agendamento com observação e **lembretes por notificação local** |

Público do app: **consultores e gestores de concessionárias Ford** (e administradores da Ford).

---

## 3. ✨ A solução e as funcionalidades

**Fluxo principal (do risco ao VIN retido):**

```
Login → Painel → Cliente em risco (perfil + score) → Ação recomendada → WhatsApp / ligação
→ Agendar serviço (com observação) → lembrete automático → "Cliente compareceu" → VIN retido na rede
```

| Área | O que faz |
|---|---|
| **Login** | E-mail e senha com validação por campo, erro amigável, **sessão persistida** (token no `expo-secure-store`), logout e **logout automático em 401** |
| **Controle de acesso** | Perfis **ADMIN**, **GESTOR_CONCESSIONARIA** e **CONSULTOR**, com escopo de dados por concessionária e aba **Rede** só para quem pode (ver tabela abaixo) |
| **Painel** | Gestor/Admin: Service Share da loja × rede, **clientes em risco, leads abertos, agendados e taxa de conversão**, gráfico de **clientes em risco por idade do veículo**, funil, fluxo de oficina e share por modelo. Consultor: painel resumido **"Meu dia"** com os próprios leads |
| **Clientes** | Busca (nome, modelo, VIN, telefone), **filtro por perfil** com contadores, ordenação por risco ou tempo fora da rede, badge de perfil e barra de score |
| **Cliente 360°** | Dados de contato, veículo (VIN, modelo, ano, **idade**, km, garantia), **histórico de serviços**, **perfil previsto** com confiança, **ação recomendada por perfil**, lembretes e atalhos para ligar, WhatsApp e agendar |
| **Leads** | Fila por status (**Novo → Em contato → Agendado → Retido / Perdido**), filtros, score explicável fator a fator, mensagem personalizada, **ligar/WhatsApp** e registro de contato |
| **Agendar serviço** | Tipo de serviço, data (sem domingos), horário com bloqueio de ocupados, **observação** e resumo com o horário do lembrete; feedback de sucesso (toast + vibração) |
| **Agenda** | Próximos serviços por dia, observação, "Cliente compareceu" (lead vira **Retido**) ou "Cancelar" (cancela o lembrete) |
| **Perfil** | Dados do usuário, papel na API, concessionária, **próximos lembretes**, versão do app, equipe e **logout** |
| **IoT (veículo conectado)** | Telemetria em 3 modos (Simulado, HTTP, WebSocket), sensores, regras que geram **leads preditivos**, acelerômetro do celular e vibração como atuador |
| **Dados (admin)** | URL da API, teste de conexão, sincronização e dados locais do SQLite |

### ⭐ "Algo a mais": lembretes de serviço com notificações locais

Atende direto o item **"lembretes de serviço"** do desafio Ford, sem depender de servidor de push:

- **Ao agendar um serviço**, o app agenda uma notificação para a **véspera às 9h** (ou 2h antes, se a véspera já passou). Se o agendamento for cancelado ou concluído, o lembrete é cancelado.
- **Clientes "Esquecido"** têm como ação recomendada **Criar lembrete**: o consultor escolhe *em 1 minuto (demo)*, *amanhã às 9h* ou *em 7 dias às 9h*.
- **Tocar na notificação abre a ficha do cliente**, inclusive com o app fechado.
- Canal Android próprio ("Lembretes de serviço"), ícone monocromático e permissão `POST_NOTIFICATIONS` pedida em tempo de execução (Android 13+).

Somado a isso, o app entrega a camada **IoT** (telemetria, sensores do celular e atuador), que gera leads preditivos antes de o cliente sumir.

<a id="usuarios"></a>

### 🔐 Usuários de teste e controle de acesso

Senha de todos: **`ford@2026`** (na tela de login, toque no perfil para preencher).

| Usuário | Perfil (API) | Concessionária | O que vê |
|---|---|---|---|
| `admin@ford.com` | `ADMIN` | Rede toda | Painel completo da rede, todos os clientes e leads, aba Rede e **Dados e sincronização** |
| `gestor@ford.com` | `GESTOR_CONCESSIONARIA` | Dealer 4192 | Painel completo da **sua loja** × rede, clientes e leads da loja, aba Rede (sem ver clientes de outras lojas) |
| `consultor@ford.com` | `CONSULTOR` | Dealer 4146 | Painel resumido **"Meu dia"**, clientes e leads da loja; **sem** aba Rede (acesso direto mostra "Acesso restrito") |

### 🧠 Perfis de cliente

| Perfil | Quem é | Ação recomendada no app |
|---|---|---|
| 🟢 **Fiel** | Faz as revisões na rede com regularidade | Agendar a próxima revisão com benefício de fidelidade |
| 🔴 **Abandono** | Passou uma única vez pela rede e não voltou | **Ligar**: check-up de retorno gratuito e condição na primeira OS |
| 🟠 **Esquecido** | Tinha rotina de revisões, mas perdeu o prazo | **Criar lembrete** + mensagem de WhatsApp com horários |
| 🔵 **Econômico** | Roda muito e é sensível a preço | **WhatsApp** com pacote de revisão de preço fechado (peças Motorcraft) |

Na sprint de IA, a equipe classifica os clientes nesses 4 perfis com um modelo **Random Forest**. No app, a classificação embarcada (`src/domain/customers.ts`) usa as mesmas variáveis (**recência, frequência na rede e rodagem**), mostra a confiança e **é substituída pela predição da API** (`GET /clientes/{id}/perfil`) quando ela estiver disponível.

> A base da Ford é **anonimizada (LGPD)**: nomes e telefones dos clientes são **fictícios e determinísticos** no modo demo. Os clientes "Fiel" de exemplo completam a carteira, porque a amostra da base só traz veículos em risco.

---

<a id="telas"></a>

## 4. 📱 Telas

> Capturas da versão final (build web do próprio app, viewport 390 × 844, mesmo fluxo do vídeo). Pasta: [`docs/screenshots`](docs/screenshots).

### Login e controle de acesso

| Boas-vindas | Login | Validação dos campos | Erro de login |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/01-boas-vindas.png" width="190"/> | <img src="docs/screenshots/02-login.png" width="190"/> | <img src="docs/screenshots/02b-login-validacao.png" width="190"/> | <img src="docs/screenshots/02c-login-erro.png" width="190"/> |

### Painel (Home)

| Gestor: Service Share loja × rede | KPIs e funil | Risco por idade do veículo | Indicadores da rede |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/03-painel-gestor.png" width="190"/> | <img src="docs/screenshots/03b-painel-indicadores.png" width="190"/> | <img src="docs/screenshots/03c-painel-idade.png" width="190"/> | <img src="docs/screenshots/03d-painel-rede.png" width="190"/> |

| Consultor: "Meu dia" | Consultor: próximos leads | Admin: rede toda | Admin: API ao vivo |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/13-painel-consultor.png" width="190"/> | <img src="docs/screenshots/13b-painel-consultor-leads.png" width="190"/> | <img src="docs/screenshots/15-painel-admin.png" width="190"/> | <img src="docs/screenshots/17-painel-api-ao-vivo.png" width="190"/> |

### Clientes e visão 360°

| Clientes por perfil | Filtro "Esquecido" | Carteira do consultor | Cliente 360°: ação recomendada |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/04-clientes.png" width="190"/> | <img src="docs/screenshots/04b-clientes-filtro.png" width="190"/> | <img src="docs/screenshots/13c-clientes-consultor.png" width="190"/> | <img src="docs/screenshots/05-cliente-360.png" width="190"/> |

| Veículo | Histórico e perfil previsto | Criar lembrete | Lembrete salvo |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/05b-cliente-veiculo.png" width="190"/> | <img src="docs/screenshots/05c-cliente-historico.png" width="190"/> | <img src="docs/screenshots/06-lembrete.png" width="190"/> | <img src="docs/screenshots/06b-lembrete-salvo.png" width="190"/> |

| Lembretes na ficha |
|:---:|
| <img src="docs/screenshots/06c-cliente-lembretes.png" width="190"/> |

### Leads, agendamento e agenda

| Fila de leads | Detalhe do lead | Ligar / WhatsApp | Score explicável |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/07-leads.png" width="190"/> | <img src="docs/screenshots/08-lead-detalhe.png" width="190"/> | <img src="docs/screenshots/08b-lead-cliente.png" width="190"/> | <img src="docs/screenshots/08c-lead-score.png" width="190"/> |

| Mensagem personalizada | Registrar contato | Histórico do lead | Agendar serviço |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/08d-lead-mensagem.png" width="190"/> | <img src="docs/screenshots/08e-registrar-contato.png" width="190"/> | <img src="docs/screenshots/08f-lead-historico.png" width="190"/> | <img src="docs/screenshots/09-agendar.png" width="190"/> |

| Observação e lembrete | Agendado (sucesso) | Agenda da oficina |
|:---:|:---:|:---:|
| <img src="docs/screenshots/09b-agendar-observacao.png" width="190"/> | <img src="docs/screenshots/09c-agendado.png" width="190"/> | <img src="docs/screenshots/10-agenda.png" width="190"/> |

### Perfil, rede e dados

| Perfil | Perfil: lembretes e sair | Rede Ford | Concessionária |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/11-perfil.png" width="190"/> | <img src="docs/screenshots/11b-perfil-sair.png" width="190"/> | <img src="docs/screenshots/12-rede.png" width="190"/> | <img src="docs/screenshots/12b-concessionaria.png" width="190"/> |

| Consultor: acesso restrito | Dados (admin) | API conectada |
|:---:|:---:|:---:|
| <img src="docs/screenshots/14-rede-bloqueada.png" width="190"/> | <img src="docs/screenshots/16-dados-admin.png" width="190"/> | <img src="docs/screenshots/16b-dados-api-conectada.png" width="190"/> |

### Veículo conectado (IoT)

| Telemetria (simulado) | Sensores e pneus | Atuação remota e alertas | Acelerômetro | WebSocket |
|:---:|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/18-iot.png" width="150"/> | <img src="docs/screenshots/18b-iot-sensores.png" width="150"/> | <img src="docs/screenshots/18c-iot-alertas.png" width="150"/> | <img src="docs/screenshots/18d-iot-celular.png" width="150"/> | <img src="docs/screenshots/19-iot-websocket.png" width="150"/> |

---

<a id="apk"></a>

## 5. 📦 APK e instalação

| | |
|---|---|
| **Download do APK** | **👉 [Instalar pela Expo (EAS Build)](https://expo.dev/accounts/felipe3103/projects/ford-service-pulse/builds/7679a472-7fb1-476e-860f-443b5ea0c126)**: abra no celular e toque em *Install*, ou escaneie o QR code |
| Alternativa | [ford-service-pulse-v1.4.0.apk no GitHub Releases](https://github.com/3ESPG/Ford-Mobile-Development-and-IoT/releases/download/v1.4.0/ford-service-pulse-v1.4.0.apk) |
| Pacote Android | `br.com.fiap.fordservicepulse` |
| Versão | 1.4.0 (versionCode 4) |
| Requisitos | Android 7.0+ · funciona **sem internet** (modo demo + base embarcada + SQLite) |

**Como instalar no celular:**

1. Abra o link do APK no celular e baixe o arquivo `.apk`.
2. Toque no arquivo baixado. Se o Android pedir, permita **"Instalar apps desconhecidos"** para o navegador ou gerenciador de arquivos.
3. Abra o **Ford Service Pulse**, toque em **Começar** e entre com um dos [usuários de teste](#usuarios).
4. Quando o app pedir, **permita notificações** para receber os lembretes de serviço.

> O APK **não é versionado** no Git (`*.apk` está no `.gitignore`). Ele é publicado em **GitHub → Releases**.

### Como gerar e publicar o APK (Expo EAS Build)

```bash
npm install
npm install -g eas-cli
eas login                         # conta Expo do projeto (owner: felipe3103)
eas build:configure               # só na primeira vez (o projeto já tem eas.json e projectId)
eas build -p android --profile preview   # = npm run build:apk
```

O perfil `preview` do [`eas.json`](eas.json) gera um **`.apk` instalável** (`"buildType": "apk"`). Ao final, o EAS mostra o link de download. Para publicar:

1. Baixe o `.apk` pelo link do EAS.
2. No GitHub, vá em **Releases → Draft a new release**, crie a tag `v1.4.0`, anexe o `.apk` e publique.
3. Copie o link do arquivo na release e cole acima e no [`ENTREGA_SPRINT3.txt`](ENTREGA_SPRINT3.txt).

Para apontar o APK para uma API publicada, defina a URL no build: `EXPO_PUBLIC_API_URL=https://sua-api eas build -p android --profile preview` (ou configure depois em **Perfil → Dados e sincronização**, como admin).

<a id="video"></a>

## 6. ▶️ Vídeo de demonstração

**👉 `(https://youtu.be/Gjh2fjB-2M0)`**

Roteiro sugerido (~2 min): login como **gestor** → painel (share loja × rede, KPIs, idade do veículo) → **Clientes** → filtro **Esquecido** → cliente 360° → **Criar lembrete "em 1 minuto"** → lead de **Abandono** → WhatsApp → **Agendar** com observação → **Agenda** "Cliente compareceu" → notificação chegando → aba **IoT** "Simular falha" (vibração) → logout e login como **consultor** (painel resumido, sem aba Rede).

---

<a id="design-system"></a>

## 7. 🎨 Design System

A identidade segue a Ford: **azul Ford profundo** (`#00095B`) como marca, **azul de interação** (`#066FEF`) para ações e fundo neutro claro. Tudo sai de [`src/design-system/tokens.ts`](src/design-system/tokens.ts): as telas **não usam cor, fonte ou espaçamento soltos**, só tokens e componentes.

| Token | Valores |
|---|---|
| **Marca** | `brand #00095B` · `brandDeep #00052E` · `accent #066FEF` · `sky #2D96CD` |
| **Semânticas** | `success #0B7A53` · `warning #B86B00` · `danger #C8231A` · `info #066FEF` · `iot #5B3CC4` · `teal #0B7285` |
| **Perfis de cliente** | Fiel → `success` · Abandono → `danger` · Esquecido → `warning` · Econômico → `teal` |
| **Neutros** | `gray25 #F7F8FB` (fundo) · `gray100 #E6EAF2` (bordas) · `gray500 #6B7590` · `gray900 #0B1330` (texto) |
| **Tipografia** | Barlow (títulos e números) + Inter (texto). Escala: `displayXL 40` · `displayL 30` · `displayM 24` · `titleL 20` · `titleM 16` · `body 15` · `bodySm 13` · `caption 12` · `overline 11` · `metric 28` |
| **Espaçamento** | Escala de 4 pt: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48` |
| **Raios** | `6 · 10 · 14 · 20 · 28 · pill` |
| **Elevação** | `sm · md · lg` (sombra azulada da marca) |

**Componentes** ([`src/design-system`](src/design-system)): `AppText`, `Button` (primary/secondary/ghost/danger/onBrand + loading/disabled), **`Input`** (rótulo, ícone, foco, **erro**, dica e senha com mostrar/ocultar), `TextField`, `SearchField`, `Card`, `Badge`/`StatusDot`, `Chip`/`ChipRow`, `SegmentedControl`, `Hero` (cabeçalho), `Screen`, `Section`/`SectionHeader`, `ListRow`, `MetricRow`, `KpiTile`/`KpiGrid`, `ProgressBar`, `RingGauge`, `BarChart`, `Sparkline`, `IconTile`, `Skeleton`/`LoadingState`, `EmptyState`, `ErrorState`, `Banner` e `Toast`.

**Componentes de produto** ([`src/ui`](src/ui)): `CustomerCard`, `ProfileBadge`, `LeadCard`, `ProfileButton`, `StickyFooter` e `AccessDenied`.

**Estados padronizados em toda tela com dados:** *carregando* (skeleton pulsante) · *erro* (mensagem + **Tentar novamente**) · *vazio* (ícone, texto e ação) · *sucesso* (toast + vibração). Alvos de toque de no mínimo 44 pt e `accessibilityRole`/`accessibilityLabel` nos componentes interativos.

**Identidade própria:** ícone, **adaptive icon Android** (fundo `#00095B`), **splash** com a marca e ícone monocromático para as notificações.

---

## 8. 🧭 Decisões técnicas

1. **Expo Router (abas + stack + modais).** Rotas por arquivo, rotas tipadas, abas para as áreas principais e modais para ações curtas (contato, agendamento, lembrete). A aba Rede usa `href: null` para sumir para o consultor.
2. **Autenticação em camadas.** `AuthProvider` (Context) guarda a sessão; `authService` faz `POST /auth/login` e cai para o **modo demo** se a API não responder; o **axios** tem um interceptor que envia `Authorization: Bearer` e outro que, em **401**, limpa a sessão e volta para o login. Um guard no layout raiz protege todas as rotas.
3. **`expo-secure-store` para o token.** Fica no Android Keystore / iOS Keychain, fora do SQLite e do AsyncStorage (que não são criptografados). Na pré-visualização web, `session.web.ts` usa localStorage.
4. **Modo demo por padrão.** Um APK no celular não alcança `localhost`, e app que não abre leva nota zero. Sem API configurada (ou com a API fora do ar), o app usa a base embarcada (resumo real da planilha do Desafio 2, 600 mil OS) e os usuários de teste. A URL vem de `EXPO_PUBLIC_API_URL` ou de **Dados e sincronização**.
5. **Estado com Context API, sem biblioteca extra.** `AppProvider` (dados e CRM) e `AuthProvider` (sessão e permissões), com seletores (`useDealerScope`, `useScopedLeads`, `useScopedCustomers`) que aplicam o escopo por concessionária.
6. **Regras de negócio puras em `src/domain`.** Permissões, perfis de cliente, score, lembretes, agenda e telemetria não dependem de React, por isso são testadas em Node (36 testes).
7. **SQLite com migrações versionadas.** A migração 2 adicionou `note` e `reminder_id` aos agendamentos e a tabela `reminders`, sem perder os dados de quem já tinha o app.
8. **Notificações locais, não push.** Lembretes não precisam de servidor nem de internet: o Android dispara no horário. O `id` da notificação fica salvo para cancelar o lembrete quando o agendamento muda.
9. **Design System próprio** em vez de biblioteca de UI: tokens em 3 níveis (paleta → semântico → componente) garantem consistência total entre as telas.
10. **Gráficos em SVG próprio** (`BarChart`, `RingGauge`, `Sparkline`) sobre `react-native-svg`, sem dependência nativa extra (menos risco no build do APK).

### 🧱 Arquitetura

```mermaid
flowchart LR
  subgraph App["📱 App (Expo / React Native)"]
    UI["Telas (expo-router)<br/>app/"] --> DS["Design System<br/>src/design-system"]
    UI --> AUTH["AuthProvider<br/>sessão + permissões"]
    UI --> ST["AppProvider<br/>dados + CRM"]
    AUTH --> SS[("SecureStore<br/>token JWT")]
    AUTH --> HTTP["axios + interceptors<br/>Bearer / 401 → logout"]
    ST --> DOM["Regras puras<br/>src/domain"]
    ST --> DB[("SQLite<br/>CRM + lembretes")]
    ST --> SEED["Base embarcada<br/>(modo demo)"]
    ST --> NOTIF["expo-notifications<br/>lembretes locais"]
    UI --> IOT["IoT hooks<br/>telemetria · acelerômetro"]
  end
  subgraph API["🖥️ API Node.js (opcional)"]
    AUTHAPI["POST /auth/login · GET /auth/me<br/>JWT HS256"]
    REST["REST /api/*"]
    WS["WebSocket /ws/telemetry"]
  end
  HTTP -. JWT .-> AUTHAPI
  HTTP -. sincronização .-> REST
  IOT -. HTTP / push .-> WS
```

```
app/                        # Rotas (expo-router): 1 arquivo = 1 tela
  login.tsx                 # Boas-vindas + login
  (tabs)/                   # Painel · Clientes · Leads · IoT · Agenda · Rede
  cliente/[id].tsx          # Visão 360° do cliente
  lead/[id].tsx             # Detalhe do lead (score explicável)
  contact/[id].tsx          # Modal: registrar contato
  schedule/[id].tsx         # Modal: agendar serviço (com observação)
  reminder/[id].tsx         # Modal: lembrete de revisão
  perfil.tsx · settings.tsx · dealer/[code].tsx
src/
  design-system/            # tokens.ts + componentes reutilizáveis
  ui/                       # Componentes de produto (CustomerCard, ProfileBadge, LeadCard…)
  domain/                   # Regras puras e testadas (auth, customers, reminders, leads, telemetria)
  auth/                     # authService, sessão (SecureStore / web)
  api/                      # http.ts (axios + interceptors) e client.ts
  notifications/            # Lembretes locais (expo-notifications / web)
  state/                    # AppProvider, AuthProvider e seletores
  data/store/               # CRM local: SQLite (Android/iOS) e localStorage (web)
  iot/                      # useTelemetry, useDrivingSensor, atuadores
api/                        # API Node (REST + JWT + WebSocket) e simulador de telemetria
tests/                      # domain · sprint3 · api (node:test)
docs/screenshots/           # Prints de todas as telas
```

### 📡 IoT: sensores, atuadores e 3 modos de conexão

| Elemento | Implementação |
|---|---|
| **Sensor do veículo** | Módulo OBD-II/TCU simulado: velocidade, rotação, odômetro, óleo, bateria, temperatura, pressão dos pneus e códigos DTC |
| **Sensor do celular** | Acelerômetro (`expo-sensors`, 5 Hz) com filtro passa-alta; detecta frenagens e arrancadas bruscas |
| **Atuador** | Vibração (`expo-haptics`) nos alertas; **notificação local** nos lembretes |
| **Atuação remota** | "Simular falha no motor" envia o DTC `P0301` pelo mesmo canal da telemetria |
| **Modos** | **Simulado** (no app, sem servidor) · **HTTP** (polling a cada 2 s) · **WebSocket** (push, 1 leitura/s) |

Óleo ≤ 15 %, alternador < 13,2 V, pneu < 30 psi, motor ≥ 108 °C, qualquer DTC ou 3 eventos de condução agressiva geram um alerta, que vira **lead preditivo** (⚡ IoT) no topo da fila e sugere o serviço certo no agendamento. Gestor e consultor monitoram os veículos da própria loja.

---

## 9. ▶️ Como rodar localmente

```bash
npm install
npm start              # Expo (Expo Go / emulador / web)
npm run web            # pré-visualização no navegador
```

Entre com `gestor@ford.com` / `ford@2026` (ou toque em um dos usuários de teste).

**API opcional (login JWT, sincronização e IoT HTTP/WebSocket):**

```bash
npm run api            # http://localhost:3333  ·  ws://localhost:3333/ws/telemetry
```

Como admin, abra **Perfil → Dados e sincronização** e informe `http://SEU_IP_LOCAL:3333` (celular e computador na mesma rede; no emulador Android use `http://10.0.2.2:3333`). Também é possível fixar no build com `EXPO_PUBLIC_API_URL`.

**Endpoints:** `POST /auth/login` · `GET /auth/me` · `GET /health` · `GET /api/snapshot` · `GET /api/overview` · `GET /api/dealers[/:code]` · `GET /api/leads[/:id]` · `GET /api/models` · `GET /api/strategy` · `GET /api/vehicles/:vin/telemetry` · `POST /api/vehicles/:vin/faults` · `WS /ws/telemetry`. Erros seguem `{ "error": { "code", "message" } }` com status coerente (400, 401, 404, 500); um token inválido em `/api/*` responde **401** e o app faz logout.

<a id="testes"></a>

### 🧪 Testes

```bash
npm test               # 36 testes (node:test + tsx)
npm run typecheck      # TypeScript estrito
npm run doctor         # expo-doctor (18/18 checagens)
```

| Suíte | O que valida |
|---|---|
| Login e acesso | Validação dos campos, usuários de teste, token JWT (com acentos) e expiração, permissões por perfil |
| Perfis e 360° | Classificação nos 4 perfis, carteira determinística com ids únicos, histórico de serviços, mensagem por perfil, agrupamento por idade |
| Lembretes | Véspera às 9h, fallback de 2h antes, sem lembrete no passado e opções de revisão |
| Score e jornada | Score explicável idêntico ao pipeline, mensagem personalizada, prioridade IoT e conversão |
| IoT | Regras de telemetria, simulação determinística, injeção de falha e acelerômetro |
| API | Health, snapshot, filtros, 404, telemetria, DTC, WebSocket e **login JWT (200/400/401)** |

---

## 10. 🚀 Próximos passos

- Conectar à **API Java/Spring** (`/clientes`, `/veiculos`, `/servicos`, `/leads`, `/clientes/{id}/perfil`, `/concessionarias/{id}/service-share`); o app já envia o JWT e trata o 401.
- Trocar a classificação embarcada pela **predição do modelo Random Forest** servida pela API, exibindo a probabilidade de cada perfil.
- **Login por biometria** (`expo-local-authentication`) para reabrir a sessão salva.
- **Push para o cliente final** (FCM) com a oferta do seu perfil, além dos lembretes locais do consultor.
- Telemetria real (Ford Pro / FordPass Connect ou dongle OBD-II via Bluetooth LE).
- Modo escuro e internacionalização (es-AR, es-CL) para a América do Sul.

## 📚 Metodologia dos indicadores

```
Service Share estimado = VINs únicos com serviço pago nos últimos 12 meses / VINs únicos observados na base
Idade do veículo       = ano da análise − ano-modelo
```

Score de risco (0–100): tempo sem serviço (até 45) + histórico na rede (até 16) + rodagem estimada (até 12) + fase da garantia (até 10) + ausência de agenda digital (10). Prioridade **Alta ≥ 70**, **Média ≥ 45**.

---

<div align="center">Feito com 💙 por alunos da FIAP para a Ford</div>
