

# Fase Final i18n - Cobertura 100%

Ainda existem aproximadamente **80+ strings** espalhadas em **~20 arquivos** que usam ternarios inline (`language === 'pt-BR' ? ... : ...`) ou strings hardcoded em PT-BR. Abaixo esta o inventario completo e o plano para resolver.

---

## Arquivos Restantes por Categoria

### A. Componentes de Sessao (~30 strings)

| Arquivo | Strings faltantes |
|---|---|
| `EventFeed.tsx` | "eventos/events", "Nenhum evento ainda/No events yet", "Anterior/Previous", "Proximo/Next" |
| `VampireEventFeed.tsx` | "PERMANENTE/PERMANENT", "Alterado pelo Narrador/Changed by Narrator", "Sangue Esgotado!/Blood Depleted!", "Vontade Exaurida!/Willpower Depleted!", "entrou na sessao/joined the session", "eventos/events", "Nenhum evento ainda/No events yet", "Anterior/Previous", "Proximo/Next" |
| `EndSessionModal.tsx` | "Sessao encerrada!/Session ended!", "Erro ao encerrar/Error ending session" |
| `ScenePanel.tsx` | `dateLocale` (aceitavel - nao e string de UI) |
| `VampireNarratorSidebar.tsx` | "Erro ao criar cena", "Erro ao trocar cena", "Erro ao salvar", "Alteracao salva" |

### B. Paginas (~25 strings)

| Arquivo | Strings faltantes |
|---|---|
| `VampireSession.tsx` | "jogadores/players", "Link copiado!/Link copied!", "Copiar link de convite/Copy invite link", "Encerrar/End Session", "Sair/Leave", "Cena criada!/Scene created!", "Erro ao criar cena", "Erro ao trocar cena", "Cena Atual/Current Scene", "Nova Cena/New Scene", "Nenhuma cena ativa/No active scene", "Nome da cena/Scene name", "Descricao (opcional)/Description (optional)", "Cenas Anteriores/Previous Scenes", "Nenhum personagem selecionado/No character selected", "Ver Ficha Completa/View Full Sheet", "Minha Ficha/My Character Sheet" |
| `Session.tsx` | "Erro ao criar cena" |
| `Auth.tsx` | "Teatro da Mente Online/Online Theater of the Mind" (1 string) |
| `CustomMarks.tsx` | "Erro ao salvar/Error saving", "Erro ao excluir/Error deleting" |

### C. Componentes de Personagem (~15 strings)

| Arquivo | Strings faltantes |
|---|---|
| `StepVampiroVirtues.tsx` | "Virtudes/Virtues", "Consciencia/Conscience", "Conviccao/Conviction", "Autocontrole/Self-Control", "Instinto/Instinct", "Coragem/Courage", "Humanidade/Trilha / Humanity/Path", "Nome da Trilha/Path Name", "Forca de Vontade/Willpower" |
| `EditCharacterModal.tsx` | "Erro ao salvar/Error saving" |
| `CharacterOptionsModal.tsx` | "Criar novo personagem/Create new character", "Ver personagens criados/View created characters" |

### D. Componentes de Complicacoes (~10 strings)

| Arquivo | Strings faltantes |
|---|---|
| `CreateComplicationModal.tsx` | "Descricao e obrigatoria", "Erro ao criar complicacao", "Complicacao criada!", "Criar complicacao para", "Descreva a complicacao..." |
| `EditComplicationModal.tsx` | "Complicacao atualizada!", "Erro ao atualizar complicacao", "Editar Complicacao", "Personagem:", "Descreva a complicacao...", "O jogador pode ver/Apenas o narrador pode ver", "Cancelar", "Salvando...", "Salvar" |
| `ManifestComplicationModal.tsx` | "Erro ao manifestar complicacao", "Resolver narrativamente a complicacao de", "Como a complicacao se manifestou na narrativa..." |

### E. Componentes de Dados/Testes (~5 strings)

| Arquivo | Strings faltantes |
|---|---|
| `TestRequestModal.tsx` | "Erro ao salvar rolagem" |
| `HeroicMoveModal.tsx` | "Erro ao usar movimento heroico" |

---

## Plano Tecnico

### 1. Adicionar ~80 novas chaves em `translations.ts`

Novos namespaces e expansao dos existentes:

- **`eventFeed`**: eventos, noEvents, previous, next, permanent, changedByNarrator, bloodDepleted, willpowerDepleted, joinedSession
- **`vampireSession`**: players, linkCopied, copyInviteLink, endSession, leave, sceneCreated, currentScene, newScene, noActiveScene, sceneName, descriptionOptional, previousScenes, noCharacterSelected, viewFullSheet, myCharacterSheet
- **`complications`** (expandir): descriptionRequired, complicationCreated, errorCreating, createFor, describePlaceholder, complicationUpdated, errorUpdating, editComplication, character, playerCanSee, onlyNarratorCanSee, errorManifesting, resolveNarratively, manifestPlaceholder
- **`common`** (expandir): errorSaving, errorDeleting, saving, save
- **`virtues`** (novo): virtues, conscience, conviction, selfControl, instinct, courage, humanityPath, humanity, path, pathName, pathNamePlaceholder, willpower
- **`landing`** (expandir): tagline (para Auth.tsx tambem)

### 2. Atualizar ~20 arquivos

Substituir todos os `language === 'pt-BR' ? ... : ...` e strings hardcoded PT-BR por chamadas `t.*`.

### 3. Manter usos aceitaveis de `language`

Os seguintes usos de `language` sao **aceitaveis** e nao precisam ser alterados:
- `dateLocale = language === 'pt-BR' ? ptBR : enUS` (locale de data do date-fns)
- Botoes de troca de idioma (`language === 'pt-BR' ? 'default' : 'outline'`)

### Resultado Esperado

Cobertura de **100%** em todas as rotas e componentes, com todas as strings de interface centralizadas no arquivo de traducoes.

