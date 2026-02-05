

# Plano: Etapa 4 de 5 - Virtudes, Humanidade/Trilha e Força de Vontade

## Objetivo
Criar a quarta etapa de criação de personagem Vampiro contendo Virtudes, Humanidade/Trilha e Força de Vontade. Também ajustar o total de etapas de 4 para 5.

## Regras do Sistema

### Virtudes (1-5 pontos cada, mínimo 1)
1. **Consciência** OU **Convicção** - escolha exclusiva
2. **Autocontrole** OU **Instinto** - escolha exclusiva  
3. **Coragem** - sempre presente

### Humanidade/Trilha
- Escolha entre **Humanidade** ou **Trilha**
- Se Trilha: campo de texto para especificar qual trilha
- Valor inicial = (Consciência/Convicção) + (Autocontrole/Instinto)
- Range: 2-10 pontos (já que cada virtude começa com mínimo 1)

### Força de Vontade
- Valor inicial = Coragem
- Range: 1-10 pontos

## Layout da Etapa

```text
┌─────────────────────────────────────────────────┐
│              VIRTUDES                           │
├─────────────────────────────────────────────────┤
│ ○ Consciência / ○ Convicção    ●●●○○           │
│ ○ Autocontrole / ○ Instinto    ●●○○○           │
│ Coragem                         ●●●●○           │
├─────────────────────────────────────────────────┤
│         HUMANIDADE / TRILHA                     │
├─────────────────────────────────────────────────┤
│ ○ Humanidade  ○ Trilha                          │
│ [Se Trilha: Campo de texto___________]          │
│                                                 │
│ Humanidade/Trilha:  ●●●●●○○○○○ (auto: 5)       │
├─────────────────────────────────────────────────┤
│         FORÇA DE VONTADE                        │
├─────────────────────────────────────────────────┤
│ Força de Vontade:   ●●●●○○○○○○ (auto: 4)       │
└─────────────────────────────────────────────────┘
```

## Estrutura de Dados

```text
VampiroFormData (campos adicionais):
├── virtues
│   ├── virtueType1: 'conscience' | 'conviction'
│   ├── virtueValue1: number (1-5, mínimo 1)
│   ├── virtueType2: 'selfControl' | 'instinct'
│   ├── virtueValue2: number (1-5, mínimo 1)
│   └── courage: number (1-5, mínimo 1)
├── moralityType: 'humanity' | 'path'
├── pathName: string
├── humanity: number (2-10)
└── willpower: number (1-10)
```

---

## Arquivos a Criar

### `src/components/character/vampiro/StepVampiroVirtues.tsx`
- Card de Virtudes com RadioGroup para escolhas exclusivas
- DotRating com `maxValue={5}` e `minValue={1}` para virtudes
- Card de Humanidade/Trilha com toggle e campo condicional
- DotRating com `maxValue={10}` e `minValue={1}` para Humanidade e Força de Vontade
- Cálculo automático reativo quando virtudes mudam

## Arquivos a Modificar

### 1. `src/components/character/vampiro/StepVampiroBasicInfo.tsx`
Expandir `VampiroFormData` com:
- `virtues` object
- `moralityType`, `pathName`
- `humanity`, `willpower`

### 2. `src/pages/CreateCharacter.tsx`
- `totalSteps`: 4 → 5
- Valores iniciais das virtudes (todos = 1)
- `humanity` inicial = 2 (1+1)
- `willpower` inicial = 1
- Renderizar `StepVampiroVirtues` no step 3
- Mover placeholder para step 4

## Valores Iniciais

```typescript
virtues: {
  virtueType1: 'conscience',
  virtueValue1: 1,
  virtueType2: 'selfControl',
  virtueValue2: 1,
  courage: 1,
},
moralityType: 'humanity',
pathName: '',
humanity: 2,  // virtueValue1 + virtueValue2
willpower: 1, // courage
```

