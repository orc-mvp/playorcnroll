
# Plano: Etapa 2 de 4 - Atributos e Habilidades do Vampiro

## Objetivo
Criar a segunda etapa de criação de personagem Vampiro contendo Atributos (Físicos, Sociais, Mentais) e Habilidades (Talentos, Perícias, Conhecimentos) com sistema de "bolinhas" clicáveis em pilha.

## Regras do Sistema
1. **Atributos**: 1-10 pontos, primeira bolinha vem preenchida (mínimo 1)
2. **Habilidades**: 0-10 pontos, nenhuma bolinha preenchida inicialmente
3. **Mecânica de Pilha**: Clicar na bolinha X preenche todas de 1 até X
4. **Especialização**: Quando uma habilidade atinge 4+, aparece um campo de texto para especialização

## Mecânica das Bolinhas (Pilha)

```text
Clicar na 5ª bolinha:
Antes: ○ ○ ○ ○ ○ ○ ○ ○ ○ ○
Depois: ● ● ● ● ● ○ ○ ○ ○ ○

Clicar na 3ª bolinha (quando estava em 5):
Antes: ● ● ● ● ● ○ ○ ○ ○ ○
Depois: ● ● ● ○ ○ ○ ○ ○ ○ ○

Clicar na bolinha atual (toggle off até mínimo):
Atributo (min 1): Clicar em ● quando value=1 → mantém 1
Habilidade (min 0): Clicar em ● quando value=1 → vai para 0
```

## Layout Responsivo

```text
Desktop (lg+):
┌─────────────────────────────────────────────────┐
│           ATRIBUTOS                             │
├───────────────┬───────────────┬─────────────────┤
│   FÍSICOS     │   SOCIAIS     │   MENTAIS       │
│ Força    ●○○○ │ Carisma  ●○○○ │ Percepção  ●○○○ │
│ Destreza ●○○○ │ Manip.   ●○○○ │ Intelig.   ●○○○ │
│ Vigor    ●○○○ │ Aparência●○○○ │ Raciocínio ●○○○ │
├─────────────────────────────────────────────────┤
│           HABILIDADES                           │
├───────────────┬───────────────┬─────────────────┤
│   TALENTOS    │   PERÍCIAS    │  CONHECIMENTOS  │
│ Prontidão ○○○ │ Emp.Animais○○ │ Acadêmicos ○○○○ │
│ Esportes  ○○○ │ Ofícios    ○○ │ Computador ○○○○ │
│ Briga ●●●●○○○ │ Condução   ○○ │ Finanças   ○○○○ │
│ [Especial___] │              │                  │
└─────────────────────────────────────────────────┘

Mobile (1 coluna):
┌───────────────────────┐
│    ATRIBUTOS          │
├───────────────────────┤
│       FÍSICOS         │
│ Força      ●○○○○○○○○○ │
│ Destreza   ●○○○○○○○○○ │
│ Vigor      ●○○○○○○○○○ │
├───────────────────────┤
│       SOCIAIS         │
│ ...                   │
└───────────────────────┘
```

## Dados de Atributos e Habilidades

### Atributos (todos começam com 1)
- **Físicos**: Força, Destreza, Vigor
- **Sociais**: Carisma, Manipulação, Aparência
- **Mentais**: Percepção, Inteligência, Raciocínio

### Habilidades (todos começam com 0)
- **Talentos**: Prontidão, Esportes, Briga, Esquiva, Empatia, Expressão, Intimidação, Liderança, Manha, Lábia
- **Perícias**: Emp. c/Animais, Ofícios, Condução, Etiqueta, Armas de Fogo, Armas Brancas, Performance, Segurança, Furtividade, Sobrevivência
- **Conhecimentos**: Acadêmicos, Computador, Finanças, Investigação, Direito, Linguística, Medicina, Ocultismo, Política, Ciências

---

## Arquivos a Criar

### 1. `src/components/character/vampiro/DotRating.tsx`
Componente reutilizável de bolinhas com mecânica de pilha:
- Props: `value`, `onChange`, `maxValue` (default 10), `minValue` (default 0)
- Renderiza 10 círculos clicáveis
- Clicar em posição X → preenche 1 até X
- Clicar na posição atual → diminui para posição-1 (respeitando minValue)
- Visual: círculos preenchidos (●) e vazios (○)

### 2. `src/components/character/vampiro/StepVampiroAttributes.tsx`
Nova etapa com:
- Card de Atributos (3 colunas em desktop)
- Card de Habilidades (3 colunas em desktop)
- Campos de especialização que aparecem quando habilidade >= 4
- Seções colapsáveis em mobile para melhor navegação

## Arquivos a Modificar

### 1. `src/components/character/vampiro/StepVampiroBasicInfo.tsx`
Expandir a interface `VampiroFormData` para incluir:
```typescript
attributes: {
  physical: { strength: number; dexterity: number; stamina: number };
  social: { charisma: number; manipulation: number; appearance: number };
  mental: { perception: number; intelligence: number; wits: number };
};
abilities: {
  talents: Record<string, number>;
  skills: Record<string, number>;
  knowledges: Record<string, number>;
};
specializations: Record<string, string>;
```

### 2. `src/pages/CreateCharacter.tsx`
- Atualizar `initialVampiroFormData` com valores padrão (atributos = 1, habilidades = 0)
- Importar e renderizar `StepVampiroAttributes` no step 2
- Atualizar validação do step 2 (sempre válido ou verificar se algum atributo foi alterado)

## Componente DotRating - Detalhes

```typescript
interface DotRatingProps {
  value: number;
  onChange: (value: number) => void;
  maxValue?: number; // default 10
  minValue?: number; // default 0
}

// Comportamento:
// - Clicar em índice i → onChange(i + 1)
// - Clicar em índice i quando value === i + 1 → onChange(max(minValue, i))
// - Bolinhas 0 até value-1 são preenchidas
// - Bolinhas value até maxValue-1 são vazias
```

## Campo de Especialização

- Aparece abaixo do nome da habilidade quando valor >= 4
- Input pequeno com placeholder "Especialização..."
- Animação suave de entrada (fade + slide)
- Armazenado em `specializations[abilityKey]`
