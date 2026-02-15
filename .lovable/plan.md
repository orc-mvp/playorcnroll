# Plano: Corrigir Vinculação de Personagem para Jogadores Sem Personagem na Sessão

## Problema

Quando um jogador deleta seu personagem enquanto está vinculado a uma sessão, ele fica "preso":

- O `session_participants` ainda existe com `character_id` apontando para um personagem deletado (ou null)
- Ao tentar entrar novamente via JoinSession, o sistema encontra o participante existente e redireciona direto para a sala, sem permitir escolher um novo personagem
- Dentro da sala, o jogador não tem personagem e não consegue usar trackers, testes, etc.

## Solução

Três correções complementares:

### 1. JoinSession: Permitir Atualizar Personagem de Participante Existente

Quando o sistema detecta que o jogador já é participante mas seleciona um personagem diferente, em vez de apenas redirecionar, atualizar o `character_id` no registro existente. Mas somente se o narrador permitiu que a ficha fosse editada, caso esteja sem permissão do narrador o jogador recebe um toast de aviso que o narrador não está autorizando.

**Arquivo**: `src/pages/JoinSession.tsx`

- Quando `existingParticipant` for encontrado E `selectedCharacterId` estiver preenchido, fazer um UPDATE no `character_id` do participante antes de redirecionar
- Recalcular os valores iniciais de Blood Pool e Willpower para o novo personagem

### 2. ManagePlayersModal: Narrador Pode Remover Jogador

Adicionar um botão de "Remover" no modal de gerenciamento para que o narrador possa remover participantes problemáticos. O narrador pode permitir ou ou bloquear permanentemente o usuário na sala, o bloqueio deve ter dupla confirmação.

**Arquivo**: `src/components/session/vampire/ManagePlayersModal.tsx`

- Adicionar botão de remover participante (com confirmação)
- Exibir indicação visual quando o participante não tem personagem vinculado

### 3. Sessão Vampiro: Mostrar Estado "Sem Personagem" ao Jogador

Quando o jogador está na sala mas sem personagem vinculado, exibir uma mensagem orientando-o a sair e reentrar com um novo personagem.

**Arquivo**: `src/pages/VampireSession.tsx`

- Detectar `myParticipant` sem `character` e exibir um card informativo
- Incluir botão para ir à página de Join Session com o código de convite preenchido

### 4. Novas Chaves i18n

**Arquivo**: `src/lib/i18n/translations.ts`

```
managePlayers.removePlayer = "Remover Jogador" / "Remove Player"
managePlayers.removeConfirm = "Tem certeza que deseja remover este jogador?" / "Are you sure you want to remove this player?"
managePlayers.playerRemoved = "Jogador removido da sessão" / "Player removed from session"
managePlayers.noCharacterWarning = "Sem personagem vinculado" / "No character linked"
session.noCharacterInSession = "Você não tem um personagem vinculado a esta sessão." / "You don't have a character linked to this session."
session.rejoinWithCharacter = "Reentrar com personagem" / "Rejoin with character"
session.characterUpdated = "Personagem atualizado na sessão" / "Character updated in session"
```

## Detalhes Técnicos

### Fluxo Corrigido no JoinSession

```text
Jogador entra com código de convite
  -> Valida código
  -> Seleciona personagem
  -> Clica "Entrar"
  -> Verifica existingParticipant
     -> Se existe E selectedCharacterId preenchido:
        UPDATE session_participants SET character_id = novo, blood_pool = X, willpower = Y
        -> Redireciona para sala
     -> Se não existe:
        INSERT (fluxo atual)
```

### Fluxo do Narrador (Remover Jogador)

```text
ManagePlayersModal
  -> Jogador sem personagem exibe badge "Sem personagem"
  -> Botão "Remover" disponível para qualquer participante
  -> Ao clicar: confirmação -> DELETE session_participants WHERE id = X
  -> Jogador removido pode reentrar normalmente com novo personagem
```

## Arquivos Modificados


| Arquivo                                                 | Mudança                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/pages/JoinSession.tsx`                             | UPDATE character_id quando participante existente seleciona novo personagem |
| `src/components/session/vampire/ManagePlayersModal.tsx` | Botão remover jogador + badge "sem personagem"                              |
| `src/pages/VampireSession.tsx`                          | Card informativo quando jogador está sem personagem                         |
| `src/lib/i18n/translations.ts`                          | Novas chaves para os cenários acima                                         |
