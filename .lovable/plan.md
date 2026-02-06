
# Plano: Correções de Vitalidade e Melhorias nos Trackers de Vampiro

## Resumo das Mudanças

### 1. Inverter a Semântica de Vitalidade
O sistema de Vampiro usa um modelo de "dano acumulado" onde:
- **0 dano** = Saudável (sem ferimentos)
- **7 dano** = Incapacitado (criticamente ferido)

**Problema Atual**: O modal de confirmação e o feed de eventos mostram os valores de dano diretamente (ex: "Vitalidade: 2 → 3"), o que é confuso porque parece que a vitalidade está aumentando quando na verdade o personagem está recebendo mais dano.

**Solução**: Inverter a exibição para mostrar "níveis de saúde restantes":
- Modal mostrará: `Vitalidade: 5 → 4` (ficou mais ferido)
- Feed mostrará a mesma lógica invertida
- Internamente continua armazenando níveis de dano

### 2. Adicionar Botões +/- nos Modais do Narrador
Na visão da Coterie, ao clicar em um tracker, abrir um modal com controles +/- do lado direito para ajuste rápido.

**Arquivos afetados**:
- `VampireNarratorSidebar.tsx` - Adicionar modal com controles +/- para Blood, Willpower e Health

**Design proposto**:
```
┌─────────────────────────────────────────┐
│ [Icon] Ajustar Sangue de Marcus         │
├─────────────────────────────────────────┤
│                                         │
│    [ - ]     15     [ + ]               │
│                                         │
│    ← Perder      Recuperar →            │
│                                         │
├─────────────────────────────────────────┤
│          [Cancelar]  [Confirmar]        │
└─────────────────────────────────────────┘
```

### 3. Simplificar Humanidade na Visão do Jogador
Remover da seção de Humanidade em `VampireTrackers.tsx`:
- A badge "PERMANENTE" no header
- O texto "Clique para alterar (mudança permanente)"
- A box de exibição deve ficar na coluna da esquerda.

A Humanidade deve aparecer apenas uma vez, de forma limpa, apenas com o modal de confirmação para avisar sobre a permanência.

---

## Detalhes Técnicos

### Arquivo 1: `src/components/session/vampire/TrackerChangeConfirmModal.tsx`

**Mudanças**:
- Para `trackerType === 'health'`, inverter os valores exibidos:
  - `displayedCurrentValue = 7 - currentValue`
  - `displayedNewValue = 7 - newValue`
- A diferença também deve ser invertida para health

### Arquivo 2: `src/components/session/vampire/VampireEventFeed.tsx`

**Mudanças**:
- Na função `renderTrackerChange`, para health:
  - Exibir `7 - oldValue` e `7 - newValue`
  - Inverter o sinal da diferença

### Arquivo 3: `src/components/session/vampire/VampireNarratorSidebar.tsx`

**Mudanças**:
1. Criar um novo estado para controlar o modal de ajuste:
   ```typescript
   const [trackerModal, setTrackerModal] = useState<{
     type: TrackerType;
     participantId: string;
     characterId?: string;
     characterName: string;
     currentValue: number;
     maxValue?: number;
     isPermanent?: boolean;
   } | null>(null);
   ```

2. Substituir os clicks diretos nos trackers por abertura do modal de ajuste

3. Criar novo componente de modal com botões +/- que permitem incrementar/decrementar o valor antes de confirmar

4. O modal terá:
   - Botão `-` para diminuir o valor (perder)
   - Display do valor atual proposto
   - Botão `+` para aumentar o valor (recuperar)
   - Labels: "Perder" à esquerda, "Recuperar" à direita
   - Botões Cancelar e Confirmar

### Arquivo 4: `src/components/session/vampire/VampireTrackers.tsx`

**Mudanças** (linhas 467-503):
- Remover a Badge "PERMANENTE" do CardTitle da Humanidade
- Remover o parágrafo com texto "Clique para alterar (mudança permanente)"
- Manter apenas o título simples com ícone e nome

**Antes**:
```tsx
<CardTitle className="font-medieval text-sm flex items-center gap-2">
  <Moon className="w-4 h-4 text-foreground" />
  {t.vampiro?.humanity || 'Humanidade'}
  <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto border-destructive/40 text-destructive">
    <Zap className="w-3 h-3 mr-0.5" />
    {t.vampiro?.permanent || 'PERMANENTE'}
  </Badge>
</CardTitle>
```

**Depois**:
```tsx
<CardTitle className="font-medieval text-sm flex items-center gap-2">
  <Moon className="w-4 h-4 text-foreground" />
  {t.vampiro?.humanity || 'Humanidade'}
</CardTitle>
```

E remover (linhas 500-502):
```tsx
<p className="text-[10px] text-muted-foreground text-center italic">
  {t.vampiro?.humanityChangeNote || 'Clique para alterar (mudança permanente)'}
</p>
```

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `TrackerChangeConfirmModal.tsx` | Inverter exibição de valores para health |
| `VampireEventFeed.tsx` | Inverter exibição de valores para health no feed |
| `VampireNarratorSidebar.tsx` | Adicionar modal com controles +/- para todos os trackers |
| `VampireTrackers.tsx` | Remover badge "PERMANENTE" e texto explicativo da Humanidade |

---

## Resultado Esperado

**Modal de Confirmação (Health)**:
- Antes: `Vitalidade: 2 → 3` (confuso)
- Depois: `Vitalidade: 5 → 4` (claro: perdeu um nível de saúde)

**Coterie do Narrador (clique em tracker)**:
```
┌────────────────────────────────────┐
│ 🩸 Ajustar Sangue - Marcus         │
├────────────────────────────────────┤
│                                    │
│   [ - ]      12       [ + ]        │
│                                    │
│  Perder ←          → Recuperar     │
│                                    │
│      [Cancelar]   [Confirmar]      │
└────────────────────────────────────┘
```

**Humanidade do Jogador**:
- Antes: Card com badge "PERMANENTE" e texto explicativo
- Depois: Card limpo apenas com título "Humanidade" e os círculos clicáveis
