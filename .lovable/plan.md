
# Analise de Cobertura i18n por Rota

## Resumo Geral

O projeto possui 14 rotas e utiliza um sistema centralizado de i18n com suporte a PT-BR e EN. A cobertura atual e **irregular**: algumas paginas usam bem o sistema `t.*`, enquanto outras possuem dezenas de strings hardcoded ou usam o padrao `language === 'pt-BR' ? ... : ...` em vez de chaves centralizadas.

---

## Analise por Rota

### 1. `/` - Index (Landing Page)
**Cobertura: ~30%**
- Usa `t.*`: `t.auth.login`, `t.auth.signup`
- Hardcoded com ternario inline (nao centralizado):
  - "Teatro da Mente Online" / "Online Theater of the Mind" (3x)
  - "Jogar" / "Play"
  - "Recursos da Plataforma" / "Platform Features"
  - "Dados 3D" / "3D Dice"
  - "Role dados com animacoes 3D..." / "Roll dice with..."
  - "Tempo Real" / "Real-time"
  - "Sincronizacao instantanea..." / "Instant synchronization..."
  - "Sessoes Gerenciadas" / "Managed Sessions"
  - "O narrador controla testes..." / "The narrator controls..."

### 2. `/auth` - Autenticacao
**Cobertura: ~90%**
- Usa extensivamente `t.auth.*`, `t.common.*`
- Hardcoded com ternario:
  - "Teatro da Mente Online" / "Online Theater of the Mind"

### 3. `/dashboard` - Dashboard
**Cobertura: ~95%**
- Quase tudo via `t.*`
- Problema menor: texto de boas-vindas usa `.replace('Back', '')`

### 4. `/character/create` - Criar Personagem
**Cobertura: ~85%**
- Usa `t.character.*`, `t.common.*`
- Depende dos sub-componentes (Steps) que precisam verificacao individual

### 5. `/characters` - Meus Personagens
**Cobertura: ~70%**
- Usa `t.*` para titulos principais
- Hardcoded com ternario:
  - "Nenhum personagem" / "No characters"
  - "Crie seu primeiro heroi..." / "Create your first hero..."
  - "Excluir Personagem?" / "Delete Character?"
  - Texto completo de confirmacao de exclusao
  - "Personagem excluido" / "Character deleted"
  - "Erro ao excluir" / "Error deleting"
- Hardcoded apenas PT-BR:
  - "Novo" (botao mobile)

### 6. `/character/:id` - Ficha do Personagem
**Cobertura: ~60%**
- Muitos ternarios inline ao inves de chaves i18n
- Strings como "Nenhuma marca menor", "Ativas", "Historico", etc

### 7. `/session/create` - Criar Sessao
**Cobertura: ~40%**
- Usa `t.session.*` para labels basicos
- Hardcoded apenas PT-BR:
  - "Nova Aventura"
  - "Configure sua sessao e convide jogadores"
  - "Sistema de Jogo" (usa ternario)
  - "Erro" (titulo de toasts)
  - "Nome da sessao e obrigatorio"
  - "Sessao criada!"
  - "Erro ao criar sessao"
  - "Tente novamente"
  - Placeholders: "Ex: A Queda do Rei Sombrio", "Uma breve descricao da aventura"

### 8. `/sessions` - Minhas Sessoes
**Cobertura: ~50%**
- Alguns campos com ternario inline
- Hardcoded com ternario: "Excluir Sessao", "Cancelar", "Excluindo...", "jogador(es)"
- Diversos textos de status e toasts

### 9. `/join` - Entrar na Sessao
**Cobertura: ~20%** (pior cobertura)
- Usa `t.*` apenas para titulo e inviteCode
- Hardcoded APENAS em PT-BR (sem ingles):
  - "Codigo invalido"
  - "Digite o codigo de convite completo"
  - "Sessao nao encontrada com este codigo"
  - "Sessao encontrada!"
  - "Erro ao validar codigo"
  - "Verifique o codigo e tente novamente"
  - "Valide o codigo primeiro"
  - "Selecione um personagem"
  - "Entrou na sessao!"
  - "Aguardando o Narrador iniciar..."
  - "Erro ao entrar na sessao"
  - "Minhas Aventuras"
  - "Sessoes que voce ja participou"
  - "Entrar na Aventura"
  - "Digite o codigo de convite e escolha seu personagem"
  - "Verificar"
  - "Nenhuma aventura ainda"
  - "Entre em uma sessao para comecar"
  - "Entrando..."
  - "Como:" (prefixo personagem)
  - "Ativa", "Aguardando", "Encerrada" (badges de status)
  - "Selecione um personagem" (placeholder)
  - "Voce nao tem personagens do sistema..."
  - "Criar Personagem de..."
  - "Sem personagem"
  - "Sistema:"

### 10. `/session/:id/lobby` - Lobby da Sessao
**Cobertura: ~30%**
- Usa `t.*` para poucos campos
- Hardcoded APENAS em PT-BR:
  - "Convide Jogadores"
  - "Compartilhe o codigo ou link com seus jogadores"
  - "jogador(es) conectado(s)"
  - "Aguardando jogadores..."
  - "Compartilhe o codigo de convite"
  - "Sem personagem"
  - "Jogador"
  - "Sessao nao encontrada"
  - "copiado!" / "Erro ao copiar"
  - "Erro ao iniciar sessao"
  - "Iniciando..." / "Reiniciar Sessao" / "Reiniciando..."
  - "Esta sessao foi encerrada"
  - "Esta sessao foi encerrada pelo Narrador"

### 11. `/session/:id` - Sessao (Herois Marcados)
**Cobertura: ~70%**
- Componentes internos usam bastante `t.*`
- Sidebar do narrador tem strings hardcoded

### 12. `/session/vampire/:id` - Sessao Vampiro
**Cobertura: ~75%**
- Usa extensivamente `t.vampiro.*` e `t.vampiroTests.*`
- Alguns hardcoded em componentes internos

### 13. `/marks` - Marcas Personalizadas
**Cobertura: ~60%**
- Hardcoded com ternario: "Nenhuma marca personalizada" / "No custom marks"

### 14. `/*` - Not Found (404)
**Cobertura: 0%**
- Totalmente hardcoded em ingles:
  - "Oops! Page not found"
  - "Return to Home"

---

## Componentes com Problemas Significativos

| Componente | Strings hardcoded (aprox.) |
|---|---|
| `CharacterOptionsModal` | 2 (ternarios inline) |
| `MarksModal` | 4 (apenas PT-BR) |
| `NarratorSidebar` | 1 (apenas PT-BR) |
| `VampireTrackers` | 1 (apenas PT-BR) |
| `EditVampiroCharacterModal` | 6 (ternarios inline) |

---

## Resumo de Cobertura

| Rota | Cobertura | Padroes usados |
|---|---|---|
| `/` (Index) | ~30% | Ternarios inline |
| `/auth` | ~90% | `t.*` |
| `/dashboard` | ~95% | `t.*` |
| `/character/create` | ~85% | `t.*` |
| `/characters` | ~70% | Misto |
| `/character/:id` | ~60% | Misto |
| `/session/create` | ~40% | Hardcoded PT-BR |
| `/sessions` | ~50% | Misto |
| `/join` | ~20% | Hardcoded PT-BR |
| `/session/:id/lobby` | ~30% | Hardcoded PT-BR |
| `/session/:id` | ~70% | `t.*` |
| `/session/vampire/:id` | ~75% | `t.*` |
| `/marks` | ~60% | Misto |
| `/*` (404) | 0% | Hardcoded EN |

**Media geral estimada: ~55%**

---

## Plano de Correcao

### Fase 1 - Paginas criticas (mais usadas, pior cobertura)
1. **JoinSession** (~40 strings) - adicionar chaves i18n
2. **SessionLobby** (~20 strings) - adicionar chaves i18n
3. **CreateSession** (~15 strings) - adicionar chaves i18n

### Fase 2 - Paginas secundarias
4. **Index** (~15 strings) - centralizar ternarios em chaves
5. **NotFound** (3 strings) - adicionar chaves i18n
6. **MyCharacters** (~10 strings) - centralizar ternarios
7. **MySessions** (~10 strings) - centralizar ternarios

### Fase 3 - Componentes
8. **CharacterSheet** (~15 strings inline)
9. **EditVampiroCharacterModal** (~6 strings)
10. **MarksModal**, **NarratorSidebar**, **VampireTrackers** (~6 strings)

### Detalhes Tecnicos
- Adicionar ~120 novas chaves ao arquivo `translations.ts` (tanto PT-BR quanto EN)
- Substituir todos os padroes `language === 'pt-BR' ? '...' : '...'` por chaves `t.*`
- Substituir todas as strings hardcoded apenas em PT-BR por chaves `t.*`
- Manter a estrutura existente de namespaces (`common`, `auth`, `session`, `character`, etc.)
- Criar novos namespaces conforme necessario: `lobby`, `joinSession`, `landing`, `notFound`
