

## Plano: Renomes alternativos para Dançarinos da Espiral Negra

### Resumo
Quando a tribo do personagem for "Black Spiral Dancers", os rótulos de renome mudam:
- Glória → Astúcia (Cunning)
- Honra → Poder (Power)  
- Sabedoria → Infâmia (Infamy)

Os dados internos continuam usando `glory`, `honor`, `wisdom` como chaves — apenas os **labels exibidos** mudam.

### 1. i18n (translations.ts)
Adicionar 3 novas chaves no namespace `lobisomem`:
- `bsd_glory` → "Astúcia" / "Cunning"
- `bsd_honor` → "Poder" / "Power"
- `bsd_wisdom` → "Infâmia" / "Infamy"

### 2. Helper para labels de renome
Criar uma função utilitária `getRenownLabels(tribe, t)` que retorna os 3 labels corretos baseado na tribo. Pode ser inline ou exportada de um arquivo compartilhado. Será usada em todos os pontos abaixo.

### 3. Arquivos a alterar

**Ficha de personagem** — `LobisomemCharacterSheet.tsx` (linhas ~719-729):
- A tribo está em `data.tribe`. Usar para decidir os labels.

**Edição de personagem** — `EditLobisomemCharacterModal.tsx` (linhas ~396-407):
- A tribo está em `lobData.tribe`. Usar para decidir os labels.

**Criação de personagem** — `StepLobisomemBackgrounds.tsx` (linhas ~97-119):
- A tribo está em `formData.tribe`. Usar para decidir os labels.

**Sala de sessão (sidebar)** — `WerewolfSession.tsx` (linhas ~797-801):
- A tribo está nos dados do personagem (`lobData.tribe`). Usar para decidir os labels.

**Trackers na sessão** — `WerewolfNarratorSidebar.tsx` e qualquer outro local que exiba renome.

### 4. Lógica
```typescript
const isBSD = tribe === 'Black Spiral Dancers';
const gloryLabel = isBSD ? t.lobisomem.bsd_glory : t.lobisomem.glory;
const honorLabel = isBSD ? t.lobisomem.bsd_honor : t.lobisomem.honor;
const wisdomLabel = isBSD ? t.lobisomem.bsd_wisdom : t.lobisomem.wisdom;
```

