## Objetivo

Eliminar a duplicação entre `VampireSession` (1.141 linhas) e `WerewolfSession` (916 linhas) e seus componentes irmãos (~6.250 linhas duplicadas), unificando tudo numa **única sala Storyteller** que detecta o sistema de cada personagem e renderiza os trackers/sheets corretos. A arquitetura ficará pronta para receber **Mago: A Ascensão (M20)** e **Metaformos (** que estão no livro **Werewolf W20)** apenas adicionando "adapters", sem reescrever a sala.

**Heróis Marcados continua intocado** (sistema 2d6, mecânica completamente diferente).

**Sobre i18n:** mantemos onde já existe; novos strings de termos puramente de regra (Disciplinas, Dons, Esferas, Arcanoi) ficam só em pt-BR para reduzir ruído. Não removemos `useI18n` nem `translations.ts`.

---

## Arquitetura proposta: System Adapter Pattern

Criar um **registry de sistemas WoD** onde cada sistema declara seus trackers, sheet, modais e labels. A sala consome o registry — adicionar Mago = adicionar 1 arquivo no registry.

### Novo arquivo: `src/lib/storyteller/systemRegistry.ts`

```ts
export interface TrackerDef {
  key: 'blood' | 'rage' | 'gnosis' | 'quintessence' | 'paradox' | 'pathos' | 'corpus' | 'willpower' | 'health';
  label: string;          // pt-BR fixo
  icon: LucideIcon;
  color: string;          // tailwind class (ex: 'text-red-500')
  getMax: (charData: any) => number;
  getCurrent: (participant: Participant) => number;
  participantField: keyof Participant; // ex: 'session_blood_pool'
  isHealth?: boolean;
  isPermanent?: boolean;  // ex: humanity, generation
}

export interface SystemAdapter {
  id: 'vampiro_v3' | 'lobisomem_w20' | 'mago_m20' | 'mortos_vivos_w20';
  label: string;
  shortName: string;
  icon: LucideIcon;
  color: string;
  trackers: TrackerDef[];           // ordem de exibição na coterie
  CharacterSheet: React.ComponentType<{ character; isNarrator; ... }>;
  TestRequestModal: React.ComponentType<{ ... }>;
  PendingTest: React.ComponentType<{ ... }>;
  EventFeedFormatter: (event) => ReactNode;  // formata eventos do sistema
}

export const SYSTEM_REGISTRY: Record<string, SystemAdapter> = {
  vampiro_v3: vampiroAdapter,
  lobisomem_w20: lobisomemAdapter,
  // mago_m20: stub a ser preenchido
  // mortos_vivos_w20: stub a ser preenchido
};

export function getSystemAdapter(gameSystem: string): SystemAdapter;
```

### Estrutura de pastas alvo

```
src/
├── pages/
│   ├── StorytellerSession.tsx      ← NOVA (substitui Vampire/Werewolf Session)
│   └── Session.tsx                 ← mantido p/ Heróis Marcados
├── components/session/
│   ├── shared/                     ← NOVA pasta
│   │   ├── StorytellerNarratorSidebar.tsx
│   │   ├── StorytellerEventFeed.tsx
│   │   ├── StorytellerTrackers.tsx
│   │   ├── StorytellerPendingTest.tsx
│   │   ├── StorytellerTestRequestModal.tsx
│   │   ├── ManagePlayersModal.tsx  ← movido de vampire/
│   │   ├── NarratorRollModal.tsx
│   │   ├── NarratorTrackerAdjustModal.tsx
│   │   ├── TrackerChangeConfirmModal.tsx
│   │   └── MobilePendingTestDrawer.tsx
│   ├── vampire/                    ← REDUZIDA: só fica o adapter
│   │   └── adapter.ts
│   ├── werewolf/                   ← REDUZIDA: só fica o adapter + FormChangeModal
│   │   ├── adapter.ts
│   │   └── FormChangeModal.tsx     (específico do sistema)
│   └── (outros arquivos compartilhados existentes)
└── lib/storyteller/
    ├── systemRegistry.ts
    └── adapters/
        ├── vampiroAdapter.ts
        ├── lobisomemAdapter.ts
        ├── magoAdapter.ts          ← stub vazio com tipo só
        └── mortosVivosAdapter.ts   ← stub vazio com tipo só
```

---

## Mudanças concretas

### 1. Roteamento (`src/App.tsx` + `src/lib/sessionRoutes.ts`)

- Substituir `/session/vampire/:id` e `/session/werewolf/:id` por **uma única rota `/session/storyteller/:id**`
- `getSessionRoute()` passa a retornar `/session/storyteller/:id` para `vampiro_v3`, `lobisomem_w20`, futuramente `mago_m20` e `mortos_vivos_w20`. Continua retornando `/session/:id` para `herois_marcados`.
- Manter rotas antigas como **redirects** por 1 release para não quebrar links salvos:
  - `/session/vampire/:id` → `/session/storyteller/:id`
  - `/session/werewolf/:id` → `/session/storyteller/:id`

### 2. Página `StorytellerSession.tsx`

- Estado e fetch idênticos ao atual `VampireSession` (mais completo). Carrega `session`, `participants`, `scenes`, `events`.
- **Não fixa mais o sistema da sala** — cada participante tem seu `character.game_system`.
- Sidebar de narrador: itera participantes, para cada um chama `getSystemAdapter(participant.character.game_system).trackers` e renderiza dinamicamente.
- Sheet do personagem: `<adapter.CharacterSheet character={...} />`.
- Modal de pedir teste: o narrador escolhe o personagem-alvo primeiro; o modal certo é montado via `adapter.TestRequestModal`. Se múltiplos sistemas, abre o modal compatível com o personagem selecionado.
- Pending test (jogador): consulta o `game_system` do próprio personagem e renderiza `adapter.PendingTest`.
- Tema visual da sala: usa cor do **sistema do narrador** se ele tiver personagem, senão neutra (slate). Cards de personagem usam a cor do sistema individual (vampiro = vermelho, lobisomem = esmeralda).

### 3. Trackers genéricos (`StorytellerTrackers.tsx`)

- Componente único que recebe `adapter: SystemAdapter` e `participant`
- Itera `adapter.trackers` e renderiza badges/dots conforme `TrackerDef`
- Lógica de mudança/confirmação (`TrackerChangeConfirmModal`) já é compartilhada hoje — mantida
- Health bar continua igual (7 níveis) porque é compartilhada entre todos os sistemas WoD

### 4. Event feed unificado

- Remove `VampireEventFeed` (653) e `WerewolfEventFeed` (422)
- `StorytellerEventFeed` faz o parsing comum (cena criada, XP, teste, etc.)
- Eventos de tracker delegam formatação para `adapter.EventFeedFormatter` (ex: "Sangue gasto: -2" vs "Fúria gasta: -1")

### 5. Test request

- `StorytellerTestRequestModal`: passo 1 escolhe alvos (personagens da sessão); passo 2 monta o formulário do sistema do **alvo selecionado** via adapter. Se houver alvos de sistemas diferentes selecionados, força criação de testes separados (1 por sistema).
- Aproveita `targetCharacterIds` que já existe no event_data (memory `session-test-notification-targeting`).

### 6. Adapters iniciais

- `vampiroAdapter.ts`: trackers = `[blood, willpower, health, humanity]`. Reusa `VampiroCharacterSheet`, `VampireTestRequestModal`, `VampirePendingTest` existentes (apenas movidos/renomeados para `shared/` quando 100% genéricos, mantidos como `vampire/` quando específicos).
- `lobisomemAdapter.ts`: trackers = `[gnosis, rage, willpower, health]` + form change. Reusa componentes atuais.
- `magoAdapter.ts` e `mortosVivosAdapter.ts`: **stubs** com `available: false` no `GAME_SYSTEMS`, trackers vazios e componentes que renderizam "Em breve". Marcado como "coming soon" no `GameSystemSelector`.

### 7. i18n: limpeza pontual

- **Mantido**: navegação, dashboard, login, customização, mensagens de UI genéricas.
- **Removido (passa a ser hardcoded pt-BR)**: labels de termos de regra que nunca foram traduzidos de verdade — Disciplinas (`getDisciplineLabel`), Dons (já são free-text), backgrounds específicos do Sabbat. Esses ficam num `lib/storyteller/labels.ts` simples.
- Nenhuma string de UI atualmente em `translations.ts` será deletada — só paramos de adicionar tradução para termos de regra novos.
- Atualiza memory `i18n-architecture-safety-fallback` para refletir a nova política.

### 8. Banco de dados

**Nada muda no schema.** Os campos `session_blood_pool`, `session_gnosis`, `session_rage`, `session_form` continuam existindo e são lidos via `participantField` no `TrackerDef`. Quando Mago entrar, criamos uma migration adicionando `session_quintessence`, `session_paradox` etc.

### 9. Arquivos deletados ao final

- `src/pages/VampireSession.tsx` (1.141 linhas)
- `src/pages/WerewolfSession.tsx` (916 linhas)
- `src/components/session/vampire/VampireEventFeed.tsx`
- `src/components/session/vampire/VampireNarratorSidebar.tsx`
- `src/components/session/vampire/VampirePendingTest.tsx`
- `src/components/session/vampire/VampireTestRequestModal.tsx`
- `src/components/session/vampire/VampireTrackers.tsx`
- `src/components/session/werewolf/WerewolfEventFeed.tsx`
- `src/components/session/werewolf/WerewolfNarratorSidebar.tsx`
- `src/components/session/werewolf/WerewolfTestRequestModal.tsx`
- `src/components/session/werewolf/WerewolfTrackers.tsx`

**Total estimado: ~6.000 linhas removidas, ~2.500 linhas adicionadas.** Saldo: -3.500 linhas e arquitetura pronta para 2 sistemas novos.

### 10. Memórias a atualizar/criar

- Nova: `mem://architecture/storyteller-system-adapter` — descreve o registry e como adicionar Mago/Mortos-Vivos
- Atualizar: `session-routing-logic`, `session-header-unificado`, `werewolf-session-room`, `vampire-session-room`, `wod-mobile-ux-patterns` para apontar para a sala unificada
- Atualizar: política de i18n (parar de exigir tradução de termos de regra puros)

---

## Plano de execução (em fases para preservar funcionamento)

Como é uma refatoração de 8.300 linhas, será feito em **3 mensagens** para manter cada passo testável:

**Fase 1 — Fundação (1 mensagem)**

- Cria `systemRegistry.ts` + adapters de Vampiro e Lobisomem (vazios primeiro, depois preenchidos para casar com componentes atuais)
- Cria `StorytellerSession.tsx` com layout idêntico ao Vampire mas consumindo adapter
- Cria componentes `shared/StorytellerTrackers`, `shared/StorytellerEventFeed`, `shared/StorytellerNarratorSidebar`
- Adiciona rota `/session/storyteller/:id` e redirects das antigas
- Atualiza `getSessionRoute` para apontar Vampiro+Lobisomem para a nova rota
- **Critério de aceite:** sessões de Vampiro e Lobisomem existentes funcionam idênticas via nova rota; rotas antigas redirecionam.

**Fase 2 — Limpeza (1 mensagem)**

- Move/deleta arquivos antigos da pasta `vampire/` e `werewolf/`
- Move `ManagePlayersModal`, `NarratorRollModal`, etc. para `shared/`
- Cria `magoAdapter.ts` e `mortosVivosAdapter.ts` como stubs (não disponíveis ainda)
- Atualiza memórias

**Fase 3 — Polimento (1 mensagem, se necessário)**

- Ajustes finos de tema visual misto, modal de teste com alvos de sistemas diferentes, edge cases
- Testes manuais com sessão mista

---

## Riscos e cuidados

1. **Sessões em andamento**: o redirect das rotas antigas garante que ninguém perca o jogo no meio.
2. **Bug recente de notificação direcionada de teste** (`session-test-notification-targeting`): será preservado integralmente no `StorytellerPendingTest`.
3. **Realtime**: subscriptions a `session_events`, `tests`, `session_participants` ficam centralizadas no `StorytellerSession` — comportamento idêntico ao atual.
4. **Locks de ficha, XP, kick de jogadores**: lógica de `ManagePlayersModal` é genérica, só move de pasta.
5. **Mobile (4 tabs)**: padrão `wod-mobile-ux-patterns` é reaproveitado integralmente.

---

## Confirme antes de começar

Se aprovado, executo a **Fase 1** na próxima mensagem. As fases 2 e 3 acontecem em mensagens seguintes para você poder testar entre elas.