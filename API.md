# Documentação da API - SIPA Votação

Esta API segue os princípios REST e retorna dados em formato JSON.

## Base URL
Por padrão: `http://localhost:3002`

## Autenticação
A maioria dos endpoints requer autenticação via sessão (Cookie `connect.sid`).

---

## 🔐 Autenticação (Auth)

### Login de Eleitor
Inicia uma sessão de votação para um colaborador.
- **Endpoint**: `POST /api/login`
- **Body**:
  ```json
  {
    "cpf": "123.456.789-00",
    "senha": "ddmmaaaa"
  }
  ```
- **Respostas**:
  - `200 OK`: Login com sucesso.
  - `401 Unauthorized`: CPF não encontrado ou senha incorreta.
  - `403 Forbidden`: Usuário já votou.

### Login de Admin
Acesso ao painel administrativo.
- **Endpoint**: `POST /api/admin-login`
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "..."
  }
  ```

---

## 🗳️ Votação

### Listar Candidatos
Retorna a lista de candidatos disponíveis para votação.
- **Endpoint**: `GET /api/candidatos`
- **Auth**: Requer Login Eleitor
- **Resposta**: Array de objetos candidato (inclui foto, cargo, nome).

### Registrar Voto
Computa o voto do usuário logado.
- **Endpoint**: `POST /api/votar`
- **Auth**: Requer Login Eleitor
- **Body**:
  ```json
  {
    "numcad": "12345" // ou "NULO"
  }
  ```
- **Resposta**:
  ```json
  {
    "success": true,
    "message": "Voto registrado...",
    "candidato_votado": "NOME DO CANDIDATO"
  }
  ```

### Verificar Status do Voto
Checa se o usuário atual já votou.
- **Endpoint**: `GET /api/verificar-voto`
- **Resposta**: `{ "ja_votou": true/false }`

---

## ⚙️ Administração

### Dashboard de Resultados
Dados para o gráfico em tempo real.
- **Endpoint**: `GET /api/admin/resultados`
- **Auth**: Requer Login Admin
- **Resposta**: Lista ordenada de candidatos por votos.

### Gestão de Candidatos
- **Listar**: `GET /api/admin/candidates`
- **Adicionar**: `POST /api/admin/candidates` (Body: dados do candidato)
- **Remover**: `DELETE /api/admin/candidates/:numcad`

### Exportação
Exporta todos os dados da votação para auditoria.
- **Endpoint**: `GET /api/exportar/resultados`
- **Resposta**: JSON completo com metadata, contagem e detalhes.

### Limpeza de Dados (Reset)
Zera a votação. **Ação Destrutiva**.
- **Endpoint**: `POST /api/limpar/dados`
- **Body**: `{ "confirmacao": "LIMPAR_TUDO_COM_CUIDADO" }`
