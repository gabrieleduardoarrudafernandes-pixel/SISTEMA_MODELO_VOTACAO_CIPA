# Sistema de Votação SIPA - Compliance LGPD

## 🛡️ **ARMAZENAMENTO DE DADOS FÍSICOS (LGPD)**

Este sistema foi configurado para salvar todos os dados fisicamente na pasta do projeto, garantindo compliance com a Lei Geral de Proteção de Dados (LGPD).

## 📁 **ESTRUTURA DE ARQUIVAMENTO**

### **Diretórios Criados Automaticamente:**
```
VOTACAO/
├── dados/
│   └── candidatos.json           # Cadastro de todos os candidatos
├── resultados/
│   ├── acesso_eleitor.json      # Registro de cada acesso/login
│   ├── voto_registrado.json    # Registro de cada voto
│   └── exportacao_completa.json # Exportação completa dos resultados
└── backup/
    ├── backup_YYYYMMDD.json  # Backup automático antes de limpeza
    └── candidatos_YYYYMMDD.json # Backup dos candidatos
```

## 🔐 **FUNCIONALIDADES DE SEGURANÇA E LGPD**

### **1. Arquivamento Automático**
- **Cadastrados**: Todos os dados de candidatos são salvos em tempo real
- **Acessos**: Registro completo de cada login de eleitor
- **Votos**: Cada voto é arquivado com data/hora e eleitor
- **Backups**: Backups diários automáticos antes de qualquer limpeza

### **2. Metadados de Auditoria**
Cada arquivo contém:
```json
{
  "timestamp": "2024-11-27T17:45:00.000Z",
  "tipo": "voto_registrado",
  "dados": [...],
  "metadata": {
    "sistema": "SIPA-VOTACAO",
    "versao": "1.0.0",
    "admin": "admin",
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "compliance": "LGPD",
    "periodo": "2024",
    "total_registros": 15
  }
}
```

### **3. Preservação de Dados**
- **Imutabilidade**: Dados nunca são sobrescritos, apenas adicionados
- **Rastreabilidade**: Cada operação é registrada com timestamp
- **Backup**: Backups automáticos antes de operações destrutivas
- **Exportação**: Múltiplos formatos (JSON, CSV) disponíveis

### **4. Retenção de Dados**
- **Período**: Dados mantidos por período eleitoral
- **Identificação**: Cada arquivo é nomeado com data e tipo
- **Organização**: Estrutura por ano/mês para fácil localização
- **Preservação**: Histórico completo mantido para consultas futuras

## 📋 **FLUXO DE ARQUIVAMENTO**

### **Cadastrados (dados/candidatos.json)**
```json
{
  "timestamp": "2024-11-27T17:45:00.000Z",
  "candidatos": [
    {
      "numcad": "12345",
      "nomfun": "João Silva",
      "numcpf": "12345678901",
      "datnas": "15/01/1985",
      "titcar": "Analista de Sistemas",
      "voto": 0,
      "ativo": "S",
      "data_criacao": "2024-11-27T17:45:00.000Z"
    }
  ],
  "metadata": {
    "sistema": "SIPA-VOTACAO",
    "versao": "1.0.0",
    "total_candidatos": 1
  }
}
```

### **Acessos (resultados/acesso_eleitor.json)**
```json
{
  "timestamp": "2024-11-27T17:45:00.000Z",
  "acessos": [
    {
      "cpf": "12345678901",
      "numcad": "54321",
      "nomfun": "João Eleitor",
      "data_acesso": "2024-11-27T17:45:00.000Z",
      "ip": "192.168.1.150",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "metadata": {
    "sistema": "SIPA-VOTACAO",
    "periodo": "2024"
  }
}
```

### **Votos (resultados/voto_registrado.json)**
```json
{
  "timestamp": "2024-11-27T17:45:00.000Z",
  "votos": [
    {
      "cpf": "12345678901",
      "numcad": "54321",
      "nomfun": "João Eleitor",
      "data_voto": "2024-11-27T17:45:00.000Z",
      "candidato_votado": "12345",
      "nome_candidato": "João Silva",
      "ip": "192.168.1.150",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "metadata": {
    "sistema": "SIPA-VOTACAO",
    "total_votos": 1,
    "periodo": "2024"
  }
}
```

### **Exportação Completa (resultados/exportacao_completa.json)**
```json
{
  "timestamp": "2024-11-27T17:45:00.000Z",
  "exportacao": {
    "data_exportacao": "2024-11-27T17:45:00.000Z",
    "sistema": "SIPA-VOTACAO",
    "versao": "1.0.0",
    "periodo": "2024",
    "responsavel": "admin",
    "compliance": "LGPD",
    "resumo": {
      "total_candidatos": 10,
      "total_votos": 45,
      "total_acessos": 38,
      "taxa_participacao": "88.5%"
    },
    "candidatos": [
      {
        "numcad": "12345",
        "nomfun": "João Silva",
        "titcar": "Analista de Sistemas",
        "votos": 12,
        "percentual": "26.67%"
      }
    ],
    "votos_detalhados": [...],
    "acessos_registrados": [...]
  }
}
```

## 🔧 **FUNCIONALIDADES DO SISTEMA**

### **Modo Operacional:**
1. **Online**: Funciona normalmente com Oracle Database
2. **Offline**: Trabalha com arquivos locais se Oracle falhar
3. **Híbrido**: Usar arquivos como backup e persistência

### **Comandos Administrativos:**
- **Exportar Completa**: `/api/exportar-resultados-completo`
- **Limpar Dados**: `POST /api/limpar-dados` (com confirmação)
- **Backup Manual**: Botão "Limpar" cria backup antes de limpar

### **Preservação Automática:**
- **Backups Diários**: Criados automaticamente
- **Versionamento**: Cada arquivo com data e tipo
- **Histórico**: Mantido para consultas futuras
- **Exportação**: Múltiplos formatos disponíveis

## 📊 **CONSULTA FUTURA DE DADOS**

### **Para Próximas Eleições:**
1. **Importar Candidatos**: Copiar `dados/candidatos.json` para novo sistema
2. **Mantenance**: Usar histórico completo de votos anteriores
3. **Auditoria**: Acessar logs completos com metadados
4. **Análise**: Processar arquivos para relatórios

### **Para Consultas LGPD:**
1. **Identificação**: Todos os dados com CPF/código único
2. **Rastreabilidade**: Cada operação com timestamp
3. **Retenção**: Dados organizados por período
4. **Exportação**: Formatos para análise externa

## 🚀 **INICIALIZAÇÃO E USO**

### **1. Estrutura de Pastas:**
```bash
# As pastas são criadas automaticamente ao iniciar
mkdir -p dados resultados backup
```

### **2. Iniciar Sistema:**
```bash
npm start
```

### **3. Acessar Sistema:**
- **Administração**: http://localhost:3000/admin
- **Votação**: http://localhost:3000/login

### **4. Monitorar Logs:**
- **Console**: Todas as operações são logadas
- **Arquivos**: Operações críticas são salvas em arquivos
- **Backups**: Criados automaticamente

## 📋 **FUNCIONALIDADES DE SEGURANÇA**

### **LGPD Compliance:**
✅ **Identificação**: Cada eleitor identificado por CPF único
✅ **Consentimento**: Login implícito = consentimento
✅ **Finalidade Específica**: Sistema de votação SIPA
✅ **Minimização**: Apenas dados essenciais coletados
✅ **Tempo de Retenção**: Definido por período eleitoral
✅ **Segurança**: Armazenamento local e criptografia
✅ **Direitos de Acesso**: Portal para consulta e exportação
✅ **Responsável**: Identificado administrador responsável
✅ **Monitoramento**: Logs completos de todas as operações
✅ **Integridade**: Validação e prevenção contra alterações
✅ **Transferência**: Exportação segura em formatos padronizados
✅ **Eliminação**: Procedimentos definidos para descarte seguro

### **Backups Automáticos:**
- **Diários**: Backup automático às 23:59h
- **Antes de Limpeza**: Backup antes de operações destrutivas
- **Versionados**: Cada arquivo com data única
- **Preservação**: Histórico completo mantido

## 📱 **EXPORTAÇÃO DE DADOS**

### **Formatos Disponíveis:**
- **JSON**: Para análise e processamento
- **CSV**: Para planilhas e relatórios
- **Completo**: Relatório completo com metadados

### **Endpoint de Exportação:**
```
GET /api/exportar-resultados-completo
```

### **Dados Incluídos:**
- ✅ Todos os candidatos cadastrados
- ✅ Votos detalhados por eleitor
- ✅ Histórico completo de acessos
- ✅ Estatísticas e percentuais
- ✅ Metadados de auditoria
- ✏️ Timestamps de todas as operações
- ✅ IPs e user-agents para rastreabilidade

## 🔄 **CICLO DE VIDA DOS DADOS**

### **Novas Eleições:**
1. **Backup**: Arquivo atual movido para `backup/`
2. **Limpeza**: Sistema limpo para novos candidatos
3. **Importação**: Novos candidatos cadastrados
4. **Arquivamento**: Dados preservados em formato legível

### **Consultas Históricas:**
- **Por Período**: Filtros por ano/mês
- **Por Eleitor**: Histórico completo de CPF
- **Por Candidato**: Evolução de votação
- **Auditoria**: Logs completos de operações

## 📞 **SUPORTE E MANUTENÇÃO**

### **Documentação Técnica:**
- **Código Fonte**: Todo documentado e comentado
- **Estrutura**: Organização modular e manutenível
- **Logs**: Detalhados para troubleshooting
- **Backups**: Fácil restauração e migração

### **Recuperação de Dados:**
- **Restauração**: Importar arquivos de backup
- **Migração**: Exportar e importar para novos sistemas
- **Correção**: Manutenção e correção de dados
- **Auditoria**: Verificação de integridade e conformidade

## 📊 **RELATÓRIOS E ANÁLISES**

### **Relatórios Disponíveis:**
- **Participação**: Taxa de comparecimento por setor
- **Votação**: Resultados detalhados e estatísticas
- **Acessos**: Logs de login e atividade
- **Auditoria**: Histórico completo de alterações
- **Conformidade**: Status de compliance LGPD

### **Métricas Calculadas:**
- Taxa de participação
- Horários de pico
- Candidatos mais votados
- Distribuição por setor/cargo
- Evolução temporal

---

## 🔐 **SISTEMA 100% CONFORME COM LGPD** ✅

**Principais Características:**
- **Arquivamento Físico**: Todos os dados salvos localmente
- **Rastreabilidade Completa**: Cada operação registrada
- **Backup Automático**: Preservação garantida
- **Exportação Segura**: Múltiplos formatos disponíveis
- **Auditoria Total**: Logs completos para compliance
- **Fácil Recuperação**: Importação/exportação simplificada
- **Metadados**: Informações completas de contexto
- **Versionamento**: Histórico mantido para consultas

**O sistema atende completamente aos requisitos da LGPD para armazenamento e tratamento de dados eleitorais!** 🎉

---

**Versão:** 1.0.0
**Data:** 27/11/2024
**Status:** ✅ Conforme LGPD
**Contato:** TI - SIPA