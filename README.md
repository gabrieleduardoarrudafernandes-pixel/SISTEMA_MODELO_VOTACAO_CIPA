<p align="center">
  <img src="public/4.jpg" alt="Logo Ônix" width="180" style="border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
</p>

<h1 align="center">🗳️ Sistema de Votação CIPA - ÔNIX</h1>

<p align="center">
  <strong>Sistema corporativo de votação para eleições da CIPA</strong><br>
  <em>Alta disponibilidade, segurança, auditoria e conformidade LGPD</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Em%20Produção-brightgreen?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Node.js-v14+-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.x-blue?style=for-the-badge&logo=express" alt="Express">
  <img src="https://img.shields.io/badge/Oracle-Database-red?style=for-the-badge&logo=oracle" alt="Oracle DB">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/LGPD-Conforme-purple?style=for-the-badge" alt="LGPD">
</p>

---

## 📖 Sumario

- [Visao Geral](#-visao-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalacao e Configuracao](#-instalacao-e-configuracao)
- [Interface do Sistema](#-interface-do-sistema)
- [API REST](#-api-rest)
- [Seguranca e LGPD](#-seguranca-e-lgpd)
- [Manutencao e Operacoes](#-manutencao-e-operacoes)
- [Testes](#-testes)
- [Troubleshooting](#-troubleshooting)
- [Equipe e Licenca](#-equipe-e-licenca)

---

## 🔍 Visao Geral

O **Sistema de Votação CIPA - ÔNIX** e uma solucao web completa e robusta para gerenciar eleicoes internas da CIPA (Comissao Interna de Prevencao de Acidentes). Projetado para operar em ambientes corporativos criticos, utiliza uma **arquitetura hibrida de dados** que garante a continuidade da votacao mesmo em caso de falhas no banco de dados principal.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE VOTACAO CIPA                       │
│                                                                   │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐    │
│  │ ELEITORES │───>│  NODE.JS/    │───>│  Oracle Database    │    │
│  │  (Login)  │    │  EXPRESS     │    │  (Principal - RH)   │    │
│  └──────────┘    │  SERVIDOR    │    └─────────────────────┘    │
│                   │              │                                 │
│  ┌──────────┐    │  Porta 3002  │    ┌─────────────────────┐    │
│  │  ADMIN   │───>│              │───>│  JSON (Fallback)    │    │
│  │ (Painel) │    │              │    │  dados/*.json       │    │
│  └──────────┘    └──────────────┘    └─────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND (HTML/CSS/JS)                 │   │
│  │  Login | Votacao | Admin Dashboard | Graficos            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Funcionalidades

### Para Eleitores
| Funcionalidade | Descricao |
|---|---|
| 🔐 **Login Seguro** | Autenticacao via CPF + Data de Nascimento, integrada ao RH |
| 🗳️ **Interface de Votacao** | Cards com fotos, nomes e cargos dos candidatos |
| ✅ **Confirmacao de Voto** | Modal de confirmacao antes de registrar o voto |
| 🔊 **Feedback Sonoro** | Som de confirmacao da urna eletronica |
| 🚫 **Voto Unico** | Bloqueio rigoroso - cada eleitor vota apenas uma vez |
| 📋 **Voto Nulo** | Opcao de voto nulo disponivel |

### Para Administradores
| Funcionalidade | Descricao |
|---|---|
| 📊 **Dashboard em Tempo Real** | Graficos de barras e pizza com resultados |
| ➕ **Cadastro de Candidatos** | Autocomplete integrado ao Oracle (tabela VETORH) |
| 📥 **Exportacao Excel** | Relatorio completo em formato .xlsx |
| 📄 **Exportacao PDF** | Relatorios com marca d'agua CIPA |
| 🔄 **Reset de Votacao** | Limpeza com backup automatico |
| 📈 **Estatisticas** | Total de votos, participacao, ranking |

### Funcionalidades Tecnicas
| Funcionalidade | Descricao |
|---|---|
| 🔄 **Fallback Hibrido** | Oracle indisponivel? Sistema continua com JSON |
| 🔒 **File Locking** | Previne race conditions em votos simultaneos |
| 📝 **Auditoria Completa** | Cada voto gera log imutavel com IP e timestamp |
| 🔒 **Sessao HTTP** | Cookies seguros com expiracao de 30 minutos |
| 📱 **Responsivo** | Funciona em desktops, tablets e smartphones |

---

## 🏗️ Arquitetura do Sistema

### Arquitetura Hibrida de Dados

A caracteristica mais marcante do sistema e sua **tolerancia a falhas**. O Oracle Database e a fonte primaria, mas se ficar indisponivel, o sistema entra automaticamente em modo offline usando arquivos JSON.

```
          ┌─────────────────────────────────────┐
          │         FLUXO DE DADOS               │
          └─────────────────────────────────────┘

   ┌──────────┐        ┌──────────────┐
   │ Requisicao│───────>│  Oracle DB   │  ✅ Online
   │   HTTP    │        │  (Primario)  │
   └──────────┘        └──────┬───────┘
                              │
                         Falha? 
                              │
                         ┌────▼────┐
                         │ Fallback│
                         └────┬────┘
                              │
                    ┌─────────▼─────────┐
                    │  JSON Filesystem  │  ✅ Offline
                    │  (dados/*.json)   │
                    └───────────────────┘
```

### Fluxo de Votacao (Alta Concorrencia)

```
Eleitor           Servidor              Arquivo JSON         Oracle
  │                   │                      │                  │
  │  1. POST /votar   │                      │                  │
  │──────────────────>│                      │                  │
  │                   │  2. Valida sessao     │                  │
  │                   │──────────────────────────────────────>│
  │                   │  3. Verifica unicidade │                  │
  │                   │<──────────────────────────────────────│
  │                   │                      │                  │
  │                   │  4. Lock no arquivo   │                  │
  │                   │══════════════════>│                  │
  │                   │                      │                  │
  │                   │  5. Registra voto     │                  │
  │                   │══════════════════>│                  │
  │                   │                      │                  │
  │                   │  6. Gera log auditoria│                  │
  │                   │  7. Libera lock       │                  │
  │                   │══════════════════>│                  │
  │                   │                      │                  │
  │  8. Resposta OK  │                      │                  │
  │<──────────────────│                      │                  │
  │                   │                      │                  │
```

### Camadas do Sistema

```
┌─────────────────────────────────────────────┐
│              PRESENTATION LAYER              │
│  HTML5 + CSS3 + JavaScript (Vanilla)        │
│  Login | Votacao | Admin Dashboard           │
├─────────────────────────────────────────────┤
│              APPLICATION LAYER               │
│  Node.js + Express.js                       │
│  Rotas: auth, admin, votacao                │
│  Middlewares: auth, votoCheck                │
├─────────────────────────────────────────────┤
│              SERVICE LAYER                   │
│  oracleService  |  candidatoService          │
│  votoService    |  userService               │
│  lgpdArchive    |  fileLockService           │
├─────────────────────────────────────────────┤
│              DATA LAYER                      │
│  Oracle DB (VETORH)  |  JSON (dados/*.json)  │
│  Tabela R034FUN     |  candidatos.json       │
│  Autenticacao RH    |  votos_registrados.json│
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologias Utilizadas

### Backend
| Tecnologia | Versao | Finalidade |
|---|---|---|
| **Node.js** | v14+ | Runtime JavaScript |
| **Express.js** | 4.18.x | Framework web |
| **oracledb** | 5.5.x | Driver Oracle Database |
| **express-session** | 1.18.x | Gerenciamento de sessoes |
| **bcrypt** | 6.0.x | Hash de senhas |
| **dotenv** | 16.3.x | Variaveis de ambiente |

### Frontend
| Tecnologia | Finalidade |
|---|---|
| **HTML5** | Estrutura das paginas |
| **CSS3** | Estilizacao responsiva com CSS Variables |
| **JavaScript Vanilla** | Logica client-side (sem frameworks) |
| **Chart.js** | Graficos de barras e pizza no admin |
| **XLSX.js** | Exportacao para Excel |
| **jsPDF + html2canvas** | Geracao de PDFs |

### Infraestrutura
| Tecnologia | Finalidade |
|---|---|
| **Oracle Database** | Banco de dados principal (tabela R034FUN) |
| **JSON Filesystem** | Cache/fallback para alta disponibilidade |
| **Git** | Controle de versao |

---

## 📁 Estrutura do Projeto

```
SISTEMA_MODELO_VOTACAO_CIPA/
│
├── 📄 app.js                        # Ponto de entrada - Servidor Express
├── 📄 package.json                  # Dependencias e scripts
├── 📄 .env                          # Configuracoes de ambiente (NAO VERSIONAR)
├── 📄 consulta.env                  # Credenciais Oracle (NAO VERSIONAR)
├── 📄 .gitignore                    # Arquivos ignorados pelo Git
│
├── 📂 routes/                       # Rotas da API REST
│   ├── 📄 auth.js                   #   Login eleitor e admin
│   ├── 📄 admin.js                  #   Endpoints administrativos
│   └── 📄 votacao.js               #   Votacao e candidatos
│
├── 📂 services/                     # Logica de negocios
│   ├── 📄 oracleService.js          #   Conexao e queries Oracle
│   ├── 📄 candidatoService.js       #   CRUD de candidatos
│   ├── 📄 votoService.js            #   Registro de votos
│   ├── 📄 userService.js            #   Gestao de usuarios
│   ├── 📄 lgpdArchive.js            #   Arquivamento LGPD
│   └── 📄 fileLockService.js        #   Controle de concorrencia
│
├── 📂 middlewares/                   # Middlewares Express
│   ├── 📄 authMiddleware.js         #   Verificacao de autenticacao
│   └── 📄 votoCheckMiddleware.js    #   Verificacao de voto duplicado
│
├── 📂 public/                       # Frontend estatico
│   ├── 📄 login.html                #   Tela de login do eleitor
│   ├── 📄 admin-login.html          #   Tela de login do admin
│   ├── 📄 votacao.html              #   Tela de votacao
│   ├── 📄 admin-dashboard-enhanced.html  #   Painel administrativo
│   ├── 📄 voto-ja-registrado.html   #   Aviso de voto duplicado
│   ├── 📄 styles.css                #   Estilos globais (1150+ linhas)
│   └── 🖼️ 4.jpg                     #   Logo do sistema
│
├── 📂 dados/                        # Armazenamento local (JSON)
│   ├── 📄 candidatos.json           #   Lista de candidatos e votos
│   └── 📄 votos_registrados.json    #   Registro de eleitores que votaram
│
├── 📂 resultados/                   # Logs de auditoria (LGPD)
│   └── 📄 *.json                    #   Logs individuais por acao
│
├── 📂 backup/                       # Backups automaticos
│
├── 📂 ELEITORES/                    # Fotos dos colaboradores
│   └── 🖼️ *.jpg, *.png             #   Fotos para candidatos
│
├── 📂 som/                          # Audios do sistema
│   └── 📄 som-urna.mp3             #   Som de confirmacao de voto
│
├── 📂 tests/                        # Testes automatizados
│   ├── 📄 votoService.test.js       #   Testes do servico de votos
│   └── 📄 candidatoService.test.js  #   Testes do servico de candidatos
│
├── 📂 docs/                         # Documentacao
│   └── 📄 MANUAL_FUNCIONAL.md       #   Manual funcional detalhado
│
├── 📄 ARCHITECTURE.md               # Documentacao de arquitetura
├── 📄 API.md                        # Documentacao da API REST
├── 📄 MAINTENANCE.md                # Guia de manutencao
├── 📄 README-LGPD.md                # Documentacao de compliance LGPD
└── 📄 reset_data.js                 # Script de reset da votacao
```

---

## ⚙️ Instalacao e Configuracao

### Pre-requisitos

- [Node.js](https://nodejs.org/) v14 ou superior
- [npm](https://www.npmjs.com/) (vem junto com Node.js)
- Acesso ao **Oracle Database** (tabela `VETORH.R034FUN`)
- Navegador moderno (Chrome, Edge, Firefox)

### Passo 1 - Clone o Repositorio

```bash
git clone https://github.com/gabrieleduardoarrudafernandes-pixel/SISTEMA_MODELO_VOTACAO_CIPA.git
cd SISTEMA_MODELO_VOTACAO_CIPA
```

### Passo 2 - Instale as Dependencias

```bash
npm install
```

### Passo 3 - Configure o Ambiente

Crie o arquivo `consulta.env` na raiz do projeto:

```env
# Configuracao Oracle Database
host=SEU_HOST_ORACLE
port=1521
service_name=SEU_SERVICE_NAME
user=SEU_USUARIO
password=SUA_SENHA
```

Crie o arquivo `.env` na raiz do projeto:

```env
# Configuracao do Servidor
SERVER_PORT=3002
```

> ⚠️ **ATENCAO**: Nunca versione os arquivos `.env` e `consulta.env`! Eles contem credenciais sensiveis.

### Passo 4 - Inicie o Servidor

```bash
npm start
```

Ou para desenvolvimento com reload automatico:

```bash
npm run dev
```

### Passo 5 - Acesse o Sistema

| Pagina | URL |
|---|---|
| 🗳️ **Votacao (Eleitor)** | http://localhost:3002/votacao |
| 🛡️ **Painel Administrativo** | http://localhost:3002/admin |

---

## 🎨 Interface do Sistema

### Tela de Login do Eleitor

```
┌─────────────────────────────────────────────────┐
│                                                   │
│              ┌──────────────┐                     │
│              │   LOGO ÔNIX  │                     │
│              └──────────────┘                     │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │                                         │     │
│  │     Sistema de Votação Ônix             │     │
│  │     Bem-vindo! Faça login para          │     │
│  │     acessar o painel.                   │     │
│  │                                         │     │
│  │  ┌─────────────────────────────────┐   │     │
│  │  │ 👤 CPF: ___.___.___-__          │   │     │
│  │  └─────────────────────────────────┘   │     │
│  │                                         │     │
│  │  ┌─────────────────────────────────┐   │     │
│  │  │ 🔒 Senha: ••••••••        👁️  │   │     │
│  │  └─────────────────────────────────┘   │     │
│  │                                         │     │
│  │  ┌─────────────────────────────────┐   │     │
│  │  │     ACESSAR PAINEL              │   │     │
│  │  └─────────────────────────────────┘   │     │
│  │                                         │     │
│  │  ─── Acesso para Administradores ───   │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Tela de Votacao

```
┌──────────────────────────────────────────────────────────────┐
│  [LOGO]  Bem-vindo, João Silva               [SAIR]         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │  │  ┌────┐  │   │
│  │  │ 📷 │  │  │  │ 📷 │  │  │  │ 📷 │  │  │  │ 👤 │  │   │
│  │  └────┘  │  │  └────┘  │  │  └────┘  │  │  └────┘  │   │
│  │  Nome 1  │  │  Nome 2  │  │  Nome 3  │  │VOTO NULO │   │
│  │  Cargo 1 │  │  Cargo 2 │  │  Cargo 3 │  │ Anular   │   │
│  │          │  │          │  │          │  │          │   │
│  │ [VOTAR]  │  │ [VOTAR]  │  │ [VOTAR]  │  │[ANULAR]  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              CONFIRMAR VOTO                          │    │
│  │  Você deseja confirmar seu voto em:                  │    │
│  │                                                       │    │
│  │           NOME DO CANDIDATO                          │    │
│  │                                                       │    │
│  │        [Cancelar]    [CONFIRMAR]                      │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Painel Administrativo

```
┌──────────────────────────────────────────────────────────────┐
│  [LOGO]  Painel Administrativo CIPA    🛡️ ADMIN  [SAIR]    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─── CADASTRAR CANDIDATO ───┐  ┌─── CANDIDATOS ────────┐  │
│  │                            │  │                         │  │
│  │  Colaborador (Matricula):  │  │  ┌─────┬─────┬──────┐ │  │
│  │  ┌────────────────────┐   │  │  │Total│Votos│Ativos│ │  │
│  │  │ Busca com autocomplete│ │  │  │ 10  │ 45  │  8   │ │  │
│  │  └────────────────────┘   │  │  └─────┴─────┴──────┘ │  │
│  │                            │  │                         │  │
│  │  Nome: João Silva (auto)   │  │  [🔄 Atualizar]        │  │
│  │  Cargo: Analista (auto)    │  │  [📥 Exportar ▼]       │  │
│  │                            │  │  [🗑️ Limpar]           │  │
│  │  [🚀 Cadastrar Candidato]  │  │                         │  │
│  └────────────────────────────┘  │  ┌──┬──────┬─────┬──┐ │  │
│                                   │  │# │ Nome │Votos│⚡│ │  │
│  ┌─── VOTACAO EM TEMPO REAL ──┐  │  ├──┼──────┼─────┼──┤ │  │
│  │                             │  │  │1 │ Ana  │ 12  │✅│ │  │
│  │  📊 [Barras] 🥧 [Pizza]    │  │  │2 │ João │  8  │✅│ │  │
│  │                             │  │  │3 │ Maria│  5  │✅│ │  │
│  │  ┌──────────────────────┐  │  │  └──┴──────┴─────┴──┘ │  │
│  │  │  ████  Ana (40%)     │  │  │                         │  │
│  │  │  ███   João (25%)    │  │  └─────────────────────────┘  │
│  │  │  ██    Maria (15%)   │  │                                 │
│  │  └──────────────────────┘  │                                 │
│  └─────────────────────────────┘                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 📡 API REST

### Base URL: `http://localhost:3002`

### Autenticacao

| Endpoint | Metodo | Descricao | Auth |
|---|---|---|---|
| `/api/login` | `POST` | Login do eleitor (CPF + Senha) | - |
| `/api/admin-login` | `POST` | Login do administrador | - |
| `/api/logout` | `POST` | Encerrar sessao | Sessao |
| `/api/user` | `GET` | Obter dados do usuario logado | Sessao |

### Votacao

| Endpoint | Metodo | Descricao | Auth |
|---|---|---|---|
| `/api/candidatos` | `GET` | Listar candidatos disponiveis | Sessao |
| `/api/votar` | `POST` | Registrar voto | Sessao |
| `/api/verificar-voto` | `GET` | Verificar se ja votou | Sessao |
| `/api/votos-eleitor` | `GET` | Obter voto do eleitor atual | Sessao |

### Administracao

| Endpoint | Metodo | Descricao | Auth |
|---|---|---|---|
| `/api/admin/candidates` | `GET` | Listar todos os candidatos | Admin |
| `/api/admin/candidates` | `POST` | Cadastrar novo candidato | Admin |
| `/api/admin/candidates/:id` | `DELETE` | Remover candidato | Admin |
| `/api/admin/resultados` | `GET` | Resultados para graficos | Admin |
| `/api/exportar/resultados` | `GET` | Exportar dados completos | Admin |
| `/api/limpar/dados` | `POST` | Limpar dados (reset) | Admin |
| `/api/search-collaborators` | `GET` | Buscar no Oracle (autocomplete) | Admin |

### Exemplo: Registrar Voto

```bash
# Requisicao
POST /api/votar
Content-Type: application/json
Cookie: connect.sid=sessao_aqui

{
  "numcad": "12345"
}

# Resposta de Sucesso
{
  "success": true,
  "message": "Voto registrado com sucesso!",
  "candidato_votado": "JOAO DA SILVA"
}

# Resposta de Erro (ja votou)
{
  "success": false,
  "error": "Voce ja registrou seu voto nesta eleicao."
}
```

---

## 🔒 Seguranca e LGPD

### Camadas de Seguranca

```
┌─────────────────────────────────────────────────────┐
│                CAMADAS DE SEGURANCA                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1️⃣  AUTENTICACAO                                    │
│     • Login via CPF + Data de Nascimento             │
│     • Validacao contra Oracle (tabela R034FUN)       │
│     • Senhas com hash bcrypt                         │
│                                                      │
│  2️⃣  AUTORIZACAO                                     │
│     • Sessoes HTTP com cookie seguro                 │
│     • Expiracao automatica (30 minutos)              │
│     • Separecao de permissoes (eleitor vs admin)     │
│                                                      │
│  3️⃣  INTEGRIDADE DE DADOS                            │
│     • File Locking para concorrencia                 │
│     • Verificacao de voto unico                      │
│     • Logs imutaveis de auditoria                    │
│                                                      │
│  4️⃣  LGPD COMPLIANCE                                 │
│     • Apenas dados essenciais coletados              │
│     • Anonimizacao em logs publicos                  │
│     • Exportacao para consulta                       │
│     • Backup automatico antes de limpeza             │
│     • Rastreabilidade completa (IP, User-Agent)      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Conformidade LGPD

| Requisito LGPD | Status | Implementacao |
|---|---|---|
| Identificacao do titular | ✅ | CPF unico por eleitor |
| Consentimento | ✅ | Login = consentimento implicito |
| Finalidade especifica | ✅ | Sistema exclusivo para votacao CIPA |
| Minimizacao de dados | ✅ | Apenas dados essenciais (nome, cargo, CPF) |
| Seguranca | ✅ | Sessoes HTTP, validacao Oracle |
| Rastreabilidade | ✅ | Logs com timestamp, IP, User-Agent |
| Retencao de dados | ✅ | Organizado por periodo eleitoral |
| Backup | ✅ | Automatico antes de operacoes destrutivas |

### Estrutura de Arquivos LGPD

```
dados/
├── candidatos.json           # Cadastro de candidatos
└── votos_registrados.json    # Registro de quem votou

resultados/                   # Logs de auditoria
├── acesso_eleitor.json       # Registro de cada login
├── voto_registrado.json      # Registro de cada voto
└── exportacao_completa.json  # Exportacao completa

backup/                       # Backups automaticos
└── pre_reset_YYYYMMDD/      # Backup antes de reset
```

---

## 🛠️ Manutencao e Operacoes

### Reset da Votacao (Nova Eleicao)

```bash
# 1. Pare o servidor (Ctrl+C)
# 2. Execute o script de reset
node reset_data.js

# 3. O script ira:
#    ✅ Criar backup automatico em backup/
#    ✅ Zerar contadores de votos
#    ✅ Limpar registro de eleitores
#    ✅ Limpar logs de auditoria

# 4. Reinicie o servidor
npm start
```

### Backup Manual

```bash
# Copie os dados criticos
xcopy dados\ backup\backup_manual_%date:~-4%%date:~4,2%%date:~7,2%\
```

### Restauracao de Backup

```bash
# 1. Pare o servidor
# 2. Copie os arquivos JSON do backup para dados/
copy backup\pre_reset_...\candidatos.json dados\
copy backup\pre_reset_...\votos_registrados.json dados\
# 3. Reinicie o servidor
npm start
```

---

## 🧪 Testes

### Executar Todos os Testes

```bash
npm test
```

### Tipos de Testes

| Arquivo | O que testa |
|---|---|
| `tests/votoService.test.js` | Registro de votos, unicidade, concorrencia |
| `tests/candidatoService.test.js` | CRUD de candidatos, validacao |

### Testes Manuais (Smoke Test)

1. ✅ Inicie o servidor com `npm start`
2. ✅ Acesse `http://localhost:3002/login`
3. ✅ Faca login com um CPF valido
4. ✅ Registre um voto
5. ✅ Verifique o registro em `dados/votos_registrados.json`
6. ✅ Acesse `http://localhost:3002/admin`
7. ✅ Confirme que o painel renderiza sem erros

---

## ❓ Troubleshooting

### Erro: "File Locked" ou Lentidao

```
Causa: Muitos votos simultaneos gerando concorrencia no arquivo JSON.
Solucao: O sistema resolve automaticamente. Se travar, reinicie o processo:
  taskkill /F /IM node.exe
  npm start
```

### Erro: Conexao Oracle

```
Causa: Oracle Database indisponivel ou credenciais incorretas.
Solucao:
  1. Verifique se o Oracle esta online
  2. Confirme as credenciais em consulta.env
  3. O sistema funciona em modo offline (votacao continua, login pode falhar)
```

### Candidatos Nao Aparecem

```
Causa: Arquivo candidatos.json corrompido ou vazio.
Solucao:
  1. Verifique dados/candidatos.json
  2. Execute node reset_data.js para recriar
  3. Cadastre novos candidatos via painel admin
```

### Porta Ja em Uso

```
Causa: Outra aplicacao usando a porta 3002.
Solucao: Altere a porta no arquivo .env:
  SERVER_PORT=3003
```

---

## 📊 Endpoints Importantes

| Finalidade | Comando |
|---|---|
| Iniciar servidor | `npm start` |
| Desenvolvimento com reload | `npm run dev` |
| Executar testes | `npm test` |
| Reset da votacao | `node reset_data.js` |
| Instalar dependencias | `npm install` |

---

## 👥 Equipe e Licenca

**Desenvolvido por:** GABRIEL EDUARDOA RRUDA FERNANDES - SIPA/ÔNIX

**Ano:** 2024-2026

**Licenca:** MIT License

---

<p align="center">
  <strong>🗳️ Sistema de Votação CIPA - ÔNIX</strong><br>
  <em>Desenvolvido para garantir democracia e transparencia nas eleicoes da CIPA</em><br><br>
  <img src="https://img.shields.io/badge/Feito_com-Node.js-green?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Feito_com-Express-blue?style=flat-square&logo=express" alt="Express">
  <img src="https://img.shields.io/badge/Feito_com-Oracle-red?style=flat-square&logo=oracle" alt="Oracle">
  <img src="https://img.shields.io/badge/Compliance-LGPD-purple?style=flat-square" alt="LGPD">
</p>
