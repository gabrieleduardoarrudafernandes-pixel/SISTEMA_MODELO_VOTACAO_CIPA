# Arquitetura do Sistema - SIPA Votação

Este documento descreve a arquitetura técnica, decisões de design e fluxo de dados do Sistema de Votação SIPA.

## 🏗️ Visão Geral da Arquitetura

O sistema segue uma arquitetura **MVC (Model-View-Controller)** adaptada para microsserviços monolíticos em Node.js. A característica mais marcante é sua **Arquitetura de Dados Híbrida**, projetada para tolerância a falhas.

```mermaid
graph TD
    User[Eleitor/Admin] -->|HTTP/HTTPS| Server[Node.js Express Server]
    
    subgraph "Backend Services"
        Server --> Auth[Auth Middleware]
        Server --> VotoService[Serviço de Votação]
        Server --> CandService[Serviço de Candidatos]
    end
    
    subgraph "Data Layer (Híbrida)"
        VotoService -->|Principal| Oracle[(Oracle Database)]
        VotoService -->|Fallback/Cache| JSONFiles[(JSON Filesystem)]
        
        CandService -->|Leitura/Escrita| JSONFiles
        Auth -->|Validação RH| Oracle
    end
    
    subgraph "Frontend"
        Public[Arquivos Estáticos (public/)]
        Admin[Dashboard Admin]
        Votacao[Interface Votação]
    end
```

## 🔌 Camadas do Sistema

### 1. Backend (Node.js/Express)
O núcleo da aplicação.
- **Entrypoint**: `app.js` configura o servidor, middlewares (CORS, Body Parser, Session) e rotas.
- **Rotas (`routes/`)**: Segregação clara entre `auth` (autenticação), `admin` (gestão) e `votacao` (eleitores).
- **Serviços (`services/`)**: Contêm a regra de negócios.
    - `oracleService.js`: Gerencia o pool de conexões Oracle e queries SQL.
    - `fileLockService.js`: Implementa mecanismos de "Mutex" para garantir que a escrita em arquivos JSON (concorrência) não corrompa os dados.

### 2. Camada de Dados (Híbrida)
O sistema opera com dois fontes de verdade para garantir que a votação nunca pare.

#### A. Oracle Database (Primário - VETORH)
- Utilizado para **autenticação** de colaboradores (Tabela `R034FUN`).
- Fonte autoritativa de dados cadastrais (Nome, Cargo, Setor).
- Se o Oracle cair, o sistema entra em modo **Offline/Fallback**.

#### B. JSON Filesystem (Secundário/Local)
- Armazena o **estado da votação** (`dados/candidatos.json`).
- Armazena o **registro de votos** (`dados/votos_registrados.json`).
- **Por que JSON?** Garante performance de latência zero para leitura de parciais e funciona mesmo sem rede externa.

### 3. Frontend
- Feito em **Vanilla JS, HTML5 e CSS3**. Sem frameworks pesados (React/Angular) para garantir leveza e compatibilidade total.
- **Client-Side rendering**: O JS consome a API REST para montar a tela de votação dinamicamente.

## 🔄 Fluxo de Dados Críticos

### Fluxo de Autenticação
1. Usuário envia CPF e Data de Nascimento.
2. Backend consulta Oracle (`oracleService`).
3. Se sucesso: Cria sessão (`req.session`).
4. Se erro no Oracle: (Pendente de implementação de cache local para auth offline).

### Fluxo de Votação (Alta Concorrência)
1. Usuário confirma voto.
2. Backend valida sessão e unicidade do voto.
3. **Lock de Arquivo**: Backend adquire trava exclusiva no `candidatos.json`.
4. **Registro**:
    - Incrementa contador do candidato.
    - Registra comprovante em `votos_registrados.json`.
    - Gera Log de Auditoria em `resultados/`.
5. **Debouncer/Release**: Libera a trava do arquivo.

## 🛡️ Segurança e Compliance

- **LGPD**: Dados sensíveis nos logs de auditoria são anonimizados ou segregados.
- **File Locking**: Previne "Race Conditions" onde dois votos simultâneos poderiam sobrescrever um ao outro em arquivos locais.
- **Auditoria**: Cada ação gera um arquivo JSON imutável na pasta `resultados/` com timestamp, IP e User-Agent.
