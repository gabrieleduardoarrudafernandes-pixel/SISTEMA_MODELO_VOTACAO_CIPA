# Guia de Manutenção e Operação 🛠️

Este guia destina-se aos administradores do sistema SIPA Votação. Ele cobre procedimentos de rotina, reinicialização de eleições e resolução de problemas comuns.

## 🚨 Reset da Votação (Zerar Urna)

Para iniciar uma nova eleição, é necessário zerar todos os votos acumulados.
**CUIDADO**: Este procedimento é irreversível.

### Método 1: Via Script (Recomendado)
Use o script automatizado que preserva os candidatos e limpa apenas os votos.

1. Pare o servidor (`Ctrl+C` no terminal).
2. Execute o script de reset:
   ```bash
   node reset_data.js
   ```
3. O script irá:
   - Fazer backup automático dos dados atuais em `backup/`.
   - Zerar contadores de votos em `dados/candidatos.json`.
   - Limpar a lista de quem já votou (`dados/votos_registrados.json`).
   - Remover logs da pasta `resultados/`.
4. Reinicie o servidor:
   ```bash
   npm start
   ```

### Método 2: Via Painel Admin
O painel administrativo possui uma função de limpeza, mas o script é mais seguro para reset completo (Clean Slate).

---

## 💾 Backups

O sistema salva dados em tempo real em arquivos JSON. Recomenda-se backup periódico da pasta `dados/`.

### Localização dos Dados Críticos
- `dados/candidatos.json`: Contém a lista de candidatos e a contagem de votos. **(CRÍTICO)**
- `dados/votos_registrados.json`: Lista de eleitores que compareceram (audit trail).
- `resultados/`: Logs individuais de cada voto (Auditoria detalhada).

### Restaurando um Backup
1. Pare o servidor.
2. Copie os arquivos `.json` de um backup válido (ex: `backup/pre_reset_.../`) para a pasta `dados/`.
3. Inicie o servidor.

---

## ❓ Troubleshooting (Solução de Problemas)

### Erro: "File Locked" ou Lentidão nos Votos
Se houver muitos votos simultâneos, o sistema usa travas de arquivo.
**Solução**: O sistema resolve automaticamente. Se travar permanentemente, reinicie o processo Node.js para liberar os handles de arquivo.

### Erro: Conexão Oracle
Se a autenticação falhar:
1. Verifique se o Oracle está online.
2. Confirme as credenciais em `consulta.env`.
3. O sistema continuará permitindo votação, mas novos logins podem falhar se a tabela VETORH estiver inacessível.

### Candidatos não aparecem ou "NULO" duplicado
1. Verifique `dados/candidatos.json`.
2. Certifique-se de que só existe um objeto com `"numcad": "NULO"`.
3. Use o script `reset_data.js` para corrigir inconsistências básicas.
