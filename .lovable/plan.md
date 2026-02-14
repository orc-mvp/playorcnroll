

# Plano: Bloqueio de Fichas, XP e Correções de UI no Modal de Edição

## Resumo

Este plano aborda 4 frentes:
1. Corrigir a rolagem (scroll) no modal de edição do personagem Vampiro
2. Adicionar sistema de bloqueio/desbloqueio de fichas pelo Narrador
3. Tornar o contador de jogadores clicável para abrir o painel de gerenciamento
4. Adicionar campo de experiência (XP) por jogador, armazenado em banco

---

## 1. Correção de UI: Scroll no Modal de Edição Vampiro

**Problema**: O `ScrollArea` envolve todos os `TabsContent`, mas os `TabsContent` ficam dentro do `ScrollArea` que não renderiza o conteúdo da aba ativa corretamente -- as abas de Habilidades e Virtudes ficam cortadas sem barra de rolagem visível.

**Solução**: Mover o `ScrollArea` para dentro de cada `TabsContent` individualmente, garantindo que cada aba tenha sua própria área de rolagem com altura controlada (`max-h-[50vh]`).

---

## 2. Toast de Ficha Bloqueada

**Problema**: Quando o personagem está em uma sessão ativa, clicar em "Editar" deveria exibir um toast informando que a ficha está bloqueada. Isso não acontece atualmente.

**Solução**: Adicionar uma coluna `sheet_locked` na tabela `session_participants` (default `true`). Na página `CharacterSheet.tsx`, verificar se o personagem participa de uma sessão ativa com `sheet_locked = true`. Se sim, ao clicar em "Editar", exibir um toast e bloquear a abertura do modal.

---

## 3. Painel de Gerenciamento de Jogadores (Narrador)

**Onde**: No header da sala Vampiro, o contador de jogadores (`{participants.length} Jogadores`) será transformado em um botão clicável (somente para o Narrador).

**Modal**: Ao clicar, abre um modal "Gerenciar Jogadores" com uma lista de cada participante mostrando:
- Nome do jogador e personagem
- Toggle de bloqueio/desbloqueio de ficha (ativo/inativo)
- Campo numérico de XP (com botoes +/-)

---

## 4. Banco de Dados

### Migração SQL

```sql
-- Adicionar coluna de bloqueio de ficha (default: bloqueada durante sessão)
ALTER TABLE public.session_participants 
ADD COLUMN sheet_locked boolean NOT NULL DEFAULT true;

-- Adicionar coluna de experiência
ALTER TABLE public.session_participants 
ADD COLUMN experience_points integer NOT NULL DEFAULT 0;
```

### Política RLS

O Narrador já pode atualizar `session_participants` via a política existente de narrador. Verificaremos se a política existente cobre UPDATE para o narrador; caso contrário, adicionaremos uma política específica.

---

## Detalhes Técnicos

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/session/vampire/ManagePlayersModal.tsx` | Modal com lista de jogadores, toggles de bloqueio e controle de XP |

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/character/vampiro/EditVampiroCharacterModal.tsx` | Mover `ScrollArea` para dentro de cada `TabsContent` |
| `src/pages/CharacterSheet.tsx` | Verificar `sheet_locked` antes de abrir modal de edição; exibir toast se bloqueado |
| `src/pages/VampireSession.tsx` | Tornar contador de jogadores clicável, integrar `ManagePlayersModal`, passar dados de participantes |
| `src/lib/i18n/translations.ts` | Adicionar chaves para bloqueio de fichas, XP, gerenciamento de jogadores |

### Novas Chaves i18n

```text
managePlayers.title = "Gerenciar Jogadores" / "Manage Players"
managePlayers.sheetLocked = "Ficha Bloqueada" / "Sheet Locked"
managePlayers.sheetUnlocked = "Ficha Desbloqueada" / "Sheet Unlocked"
managePlayers.experience = "Experiência" / "Experience"
managePlayers.lockSheet = "Bloquear Ficha" / "Lock Sheet"
managePlayers.unlockSheet = "Desbloquear Ficha" / "Unlock Sheet"
character.sheetLockedToast = "Esta ficha está bloqueada pelo Narrador durante a sessão" / "This sheet is locked by the Narrator during the session"
```

### Fluxo de Bloqueio

```text
CharacterSheet.tsx (ao clicar Editar)
  -> Consulta session_participants WHERE character_id = X AND sheet_locked = true
     JOIN sessions WHERE status = 'active'
  -> Se encontrar: toast de bloqueio, não abre modal
  -> Se não: abre modal normalmente
```

### Fluxo do Modal de Gerenciamento

```text
Narrador clica no contador de jogadores
  -> Abre ManagePlayersModal
  -> Lista todos os participantes
  -> Toggle de bloqueio: UPDATE session_participants SET sheet_locked = !current
  -> Input de XP: UPDATE session_participants SET experience_points = valor
  -> Mudanças sincronizadas em tempo real (já existe subscription)
```

