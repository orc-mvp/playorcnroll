

# Heróis Marcados Digital - Plano de Implementação

## Visão Geral do Projeto
Aplicação web completa para jogar o RPG narrativo "Heróis Marcados", com interface visual medieval rústica, dados 3D animados, e sincronização em tempo real entre Narrador e Jogadores.

---

## Fase 1: Fundação e Autenticação

### 1.1 Design System Medieval
- Paleta de cores sóbrios de preto e branco com detalhes em cinza e dourado
- Tipografia gótica/medieval para títulos, legível para textos
- Texturas sutis de papel/couro nos backgrounds
- Ícones temáticos (espadas, escudos, pergaminhos, chamas, gelo)

### 1.2 Configuração do Backend (Lovable Cloud)
- Banco de dados com tabelas para usuários, personagens, sessões, cenas
- Sistema de autenticação com email/senha
- Configuração de Realtime para sincronização instantânea

### 1.3 Sistema de Autenticação
- Página de login/cadastro com visual medieval
- Seleção de papel ao criar conta: Narrador ou Jogador
- Sistema de tradução (PT-BR / EN) persistente por usuário

---

## Fase 2: Gestão de Personagens

### 2.1 Criação de Personagem (Wizard em 3 Passos)
- **Passo 1**: Nome e conceito do personagem
- **Passo 2**: Distribuição de atributos com interface drag-and-drop visual (2 Fortes, 1 Neutro, 2 Fracos)
- **Passo 3**: Seleção de 2 Marcas Menores com filtros e visualização de detalhes

### 2.2 Ficha do Personagem
- Visualização completa com indicadores visuais por tipo de atributo
- Seções para Marcas (Menores, Maiores, Épicas)
- Área de progresso de novas Marcas
- Lista de Complicações Penduradas ativas
- Narrativas Estendidas (NPCs aliados, reputações, recursos)
- Contador de Movimentos Heroicos armazenados

### 2.3 Biblioteca de Marcas Menores
- Lista pré-definida do sistema original
- Interface para Narradores adicionarem Marcas customizadas por campanha
- Cada Marca com: nome, atributo associado, descrição, efeito mecânico

---

## Fase 3: Sistema de Sessões

### 3.1 Criação e Gerenciamento de Sessões (Narrador)
- Criar nova sessão com nome e descrição
- Gerar código de convite E link compartilhável
- Lista de sessões anteriores do Narrador

### 3.2 Lobby Pré-Sessão
- Narrador vê jogadores conectados com avatares e nomes
- Visualização resumida das fichas de cada personagem
- Botão "Iniciar Sessão" exclusivo para Narrador
- Jogadores veem "Aguardando início..." até Narrador começar

### 3.3 Interface Durante Sessão
- **Painel Central**: Nome da cena, descrição, feed de eventos em tempo real
- **Painel Lateral Narrador**: Controles de cena, botão solicitar teste, complicações
- **Painel Lateral Jogador**: Ficha resumida, movimentos armazenados, complicações ativas
- Layout responsivo que adapta para mobile (abas ao invés de painéis)

---

## Fase 4: Sistema de Testes e Dados

### 4.1 Animação de Dados 3D
- Dois dados 3D realistas usando React Three Fiber
- Animação de rolagem física (2-3 segundos)
- Números claramente visíveis ao parar
- Efeitos visuais de extremos (borda dourada pulsante para positivo, vermelha para negativo)

### 4.2 Fluxo de Solicitação de Teste (Narrador)
- Modal para configurar: tipo (individual/grupo), jogadores, atributo, dificuldade
- Escala de dificuldade visual: Muito Fácil (-2) até Quase Impossível (+3)
- Campo opcional de contexto narrativo

### 4.3 Fluxo de Rolagem (Jogador)
- Notificação visual quando teste é solicitado
- Botão "Rolar Dados" que dispara animação 3D
- Cálculo automático de extremos baseado na tabela do sistema
- Exibição do resultado: dados, modificadores, total, sucesso/parcial/falha
- Detecção e destaque de Extremos (positivo ou negativo)

### 4.4 Sistema de Extremos
- Tabela programada para cada tipo de atributo (Fraco/Neutro/Forte)
- Verificação automática do par de dados antes de somar
- Feedback visual imediato quando extremo ativa

---

## Fase 5: Testes em Grupo

### 5.1 Rolagem Simultânea
- Sistema aguarda todos os jogadores selecionados rolarem
- Indicador de status: quem já rolou (resultado oculto), quem está aguardando
- Resultados revelados apenas quando todos completam

### 5.2 Cálculo Coletivo
- Contagem automática de sucessos totais, parciais e falhas
- Determinação do resultado do grupo pela maioria
- Opção "Puxar o Grupo" para quem teve Extremo Positivo

---

## Fase 6: Movimentos Heroicos

### 6.1 Modal de Escolha (4 Opções)
- **A - Marca Maior Temporária**: Criar marca que dura até fim da sessão
- **B - Acumular para Marca Menor**: +1 ponto em tema (3 = nova Marca Menor)
- **C - Narrativa Estendida**: Criar NPC aliado, reputação, ou recurso
- **D - Puxar o Grupo**: (só em testes de grupo) +1 sucesso coletivo

### 6.2 Fluxos Específicos
- Criação de Marca Maior Temporária com aprovação do Narrador
- Sistema de progresso visual (●●○) para acumulação de pontos
- Notificação quando jogador atinge 3/3 para nova Marca Menor
- Registro de Narrativas Estendidas na ficha

---

## Fase 7: Sistema de Complicações

### 7.1 Gestão pelo Narrador
- Criação de Complicação ao ocorrer Extremo Negativo
- Tipos: Reputacional, Rastreamento, Traição, Dívida, Maldição Menor
- Opção: visível ou oculta para o jogador

### 7.2 Painel de Complicações
- Lista organizada por jogador com contador (X/3)
- Botão "Manifestar" para resolver complicação narrativamente
- Alerta vermelho quando jogador atinge 3 complicações

### 7.3 Marca Negativa
- Sistema automático quando jogador excede limite de complicações
- Condensação de complicações em Marca Negativa permanente

---

## Fase 8: Gestão de Cenas e Encerramento

### 8.1 Controle de Cenas (Narrador)
- Criar nova cena com nome e descrição
- Histórico de cenas anteriores na sessão
- Feed de eventos atualizado em tempo real

### 8.2 Encerramento de Sessão
- Resumo de Marcas Maiores Temporárias com opção de tornar permanentes
- Alerta sobre Movimentos Heroicos não usados (expiram)
- Salvamento automático de todo progresso
- Complicações Penduradas mantidas para próxima sessão

---

## Recursos Técnicos Essenciais

- **Tempo Real**: Sincronização instantânea entre Narrador e Jogadores via Supabase Realtime
- **Responsividade**: Interface adaptável para desktop, tablet e mobile
- **Internacionalização**: PT-BR e EN com troca a qualquer momento
- **Persistência**: Todo progresso salvo automaticamente no banco de dados
- **Notificações**: Alertas visuais e sonoros para eventos importantes

