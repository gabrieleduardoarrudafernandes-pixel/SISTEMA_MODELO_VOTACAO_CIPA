# Manual Funcional do Sistema 📘

Este documento detalha o funcionamento de cada tela do Sistema de Votação SIPA, explicando "mastigadinho" o que cada botão e campo faz.

---

## 1. Tela de Login (Acesso do Eleitor)
**Objetivo**: Garantir que apenas colaboradores autorizados e ATIVOS possam votar, e apenas uma única vez.

### O que o eleitor vê:
- **Campo "CPF"**: Onde o colaborador digita seu CPF.
  - *Detalhe*: O sistema aplica uma máscara automática (pontos e traço) para facilitar.
- **Campo "Data de Nascimento"**: Funciona como a "senha" do eleitor.
  - *Formato*: Deve ser digitado apenas números (ex: 01011990).
- **Botão "Entrar"**: Envia os dados para validação.

### O que acontece nos bastidores:
1. O sistema verifica no Banco de Dados (RH) se o CPF existe.
2. Verifica se a Data de Nascimento confere.
3. **Checagem de Voto Único**: O sistema olha na lista de "Votos Registrados". Se essa pessoa já votou, o login é bloqueado e aparece um aviso: *"Você já realizou seu voto anteriormente"*.

---

## 2. Tela de Votação (A Urna Virtual)
**Objetivo**: Permitir que o eleitor escolha seu candidato de forma clara e segura.

### Componentes da Tela:
- **Cabeçalho**: Mostra o nome do eleitor logado e um botão "Sair".
- **Lista de Candidatos**:
  - Cada candidato é um "Cartão" (Card) na tela.
  - **Foto**: Mostra a foto do colaborador (se houver no sistema).
  - **Nome e Cargo**: Dados oficiais extraídos do RH.
  - **Botão "VOTAR"**: Verde e destacado em cada cartão.
- **Opção "NULO"**:
  - Um cartão especial no final ou início da lista para quem deseja anular o voto.

### Como Votar (Passo a Passo):
1. O eleitor clica no botão **"VOTAR"** no cartão do candidato desejado.
2. **Confirmação (Pop-up)**: Uma janela aparece perguntando: *"Confirma o voto em [NOME DO CANDIDATO]?"*.
   - Tem os botões "CANCELAR" (volta para a lista) e "CONFIRMAR" (registra o voto).
3. Ao confirmar, o sistema:
   - Registra +1 voto para o candidato.
   - Marca o CPF do eleitor como "JÁ VOTOU".
   - Desloga automaticamente e volta para o login.

---

## 3. Painel Administrativo (Visão do Admin)
**Objetivo**: Acompanhar a eleição em tempo real e gerenciar o processo.

### Acesso:
- Requer login e senha específicos de administrador (diferente do login de eleitor).

### Funcionalidades da Tela:
1. **Gráfico de Apuração (Tempo Real)**:
   - Um gráfico de barras mostra visualmente quem está na frente.
   - Atualiza automaticamente a cada poucos segundos sem precisar recarregar a página.
   
2. **Tabela de Detalhamento**:
   - Lista todos os candidatos.
   - Colunas: Nome, Cargo, Quantidade de Votos e Percentual (%).
   - Ordenada do mais votado para o menos votado.

3. **Gestão de Eleitores (Rodapé ou Aba)**:
   - Permite verificar se um eleitor específico já votou.
   - Lista quem votou (apenas nomes, o voto é secreto!).

4. **Botões de Ação**:
   - **Exportar Resultados**: Baixa um relatório completo.
   - **Zerar Urna (Perigo)**: Botão protegido para resetar a votação (usar apenas antes de começar a valer).

---

## Resumo do Fluxo

1. **RH** -> Cadastra o funcionário no sistema.
2. **Eleitor** -> Loga, Escolhe, Confirma.
3. **Admin** -> Monitora, Audita, Encerra.
