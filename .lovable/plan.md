
# Plano Atualizado: Sistema de Testes para Vampiro com i18n Completo

## Confirmacao de Integracao i18n

Sim! O plano considera a implementacao completa de i18n. O projeto ja possui uma estrutura robusta de internacionalizacao que sera utilizada:

### Estrutura Existente
- **Hook `useI18n()`**: Fornece `language` e `setLanguage`
- **Hook `useTranslation()`**: Retorna objeto `t` com todas as traducoes
- **Secao `vampiro`**: Ja contem todas as traducoes de atributos, habilidades, virtudes, niveis de vitalidade, etc.

### Novas Traducoes a Adicionar

Sera criada uma nova secao `vampiroTests` dentro do objeto `translations` em ambos os idiomas:

---

## Traducoes Completas para o Sistema de Testes

### Portugues (pt-BR)

```typescript
// Adicionar em translations['pt-BR']
vampiroTests: {
  // Modal do Narrador
  requestTest: 'Pedir Teste',
  configureTest: 'Configurar Teste',
  testType: 'Tipo de Teste',
  attributeAbility: 'Atributo + Habilidade',
  willpowerOnly: 'Forca de Vontade',
  humanityOnly: 'Humanidade',
  virtueOnly: 'Virtude',
  selectAttribute: 'Selecionar Atributo',
  selectAbility: 'Selecionar Habilidade',
  selectVirtue: 'Selecionar Virtude',
  difficulty: 'Dificuldade',
  difficultyDefault: 'Padrao: 6',
  context: 'Contexto',
  contextPlaceholder: 'Descreva a situacao do teste',
  
  // Switches
  privateTest: 'Teste Fechado',
  privateTestDesc: 'Apenas jogador e narrador veem o resultado',
  openTest: 'Teste Aberto',
  applyHealthPenalty: 'Aplicar Penalidade de Vitalidade',
  healthPenaltyDesc: 'Reduz dados baseado no dano atual',
  specializedTest: 'Teste com Especializacao',
  specializedTestDesc: 'Cada 10 gera um dado extra',
  
  // Selecao de jogadores
  selectPlayers: 'Selecionar Jogadores',
  allPlayers: 'Todos os Jogadores',
  
  // Rolagem
  dicePool: 'Pool de Dados',
  baseDice: 'Dados Base',
  extraDice: 'Dados Extras',
  rollDice: 'Rolar Dados',
  rolling: 'Rolando...',
  reroll: 'Rolar Novamente',
  
  // Resultados
  result: 'Resultado',
  successes: 'Sucessos',
  ones: '1s',
  tens: '10s',
  finalResult: 'Resultado Final',
  successCount: '{count} Sucesso(s)',
  
  // Estados de resultado
  botch: 'Falha Critica!',
  botchDesc: 'Nenhum sucesso e pelo menos um 1',
  failure: 'Falha',
  failureDesc: 'Nenhum sucesso obtido',
  partialSuccess: 'Sucesso Parcial',
  success: 'Sucesso',
  exceptional: 'Sucesso Excepcional!',
  exceptionalDesc: '5 ou mais sucessos',
  
  // Penalidades de vitalidade
  healthPenalty: 'Penalidade de Vitalidade',
  noPenalty: 'Sem penalidade',
  penaltyApplied: '-{count} dados',
  
  // Especializacao
  specialization: 'Especializacao',
  hasSpecialization: 'Possui especializacao',
  explosiveTens: '10s explosivos',
  
  // Feed de eventos
  testedWith: 'testou',
  difficultyLabel: 'Dificuldade',
  poolLabel: 'Pool',
  privateResult: 'Resultado Privado',
  onlyNarratorSees: 'Apenas narrador e jogador veem',
},
```

### Ingles (en)

```typescript
// Adicionar em translations['en']
vampiroTests: {
  // Narrator Modal
  requestTest: 'Request Test',
  configureTest: 'Configure Test',
  testType: 'Test Type',
  attributeAbility: 'Attribute + Ability',
  willpowerOnly: 'Willpower Only',
  humanityOnly: 'Humanity Only',
  virtueOnly: 'Virtue Only',
  selectAttribute: 'Select Attribute',
  selectAbility: 'Select Ability',
  selectVirtue: 'Select Virtue',
  difficulty: 'Difficulty',
  difficultyDefault: 'Default: 6',
  context: 'Context',
  contextPlaceholder: 'Describe the test situation',
  
  // Switches
  privateTest: 'Private Test',
  privateTestDesc: 'Only player and narrator see the result',
  openTest: 'Open Test',
  applyHealthPenalty: 'Apply Health Penalty',
  healthPenaltyDesc: 'Reduces dice based on current damage',
  specializedTest: 'Specialized Test',
  specializedTestDesc: 'Each 10 generates an extra die',
  
  // Player selection
  selectPlayers: 'Select Players',
  allPlayers: 'All Players',
  
  // Rolling
  dicePool: 'Dice Pool',
  baseDice: 'Base Dice',
  extraDice: 'Extra Dice',
  rollDice: 'Roll Dice',
  rolling: 'Rolling...',
  reroll: 'Roll Again',
  
  // Results
  result: 'Result',
  successes: 'Successes',
  ones: '1s',
  tens: '10s',
  finalResult: 'Final Result',
  successCount: '{count} Success(es)',
  
  // Result states
  botch: 'Botch!',
  botchDesc: 'No successes and at least one 1',
  failure: 'Failure',
  failureDesc: 'No successes obtained',
  partialSuccess: 'Partial Success',
  success: 'Success',
  exceptional: 'Exceptional Success!',
  exceptionalDesc: '5 or more successes',
  
  // Health penalties
  healthPenalty: 'Health Penalty',
  noPenalty: 'No penalty',
  penaltyApplied: '-{count} dice',
  
  // Specialization
  specialization: 'Specialization',
  hasSpecialization: 'Has specialization',
  explosiveTens: 'Explosive 10s',
  
  // Event feed
  testedWith: 'tested',
  difficultyLabel: 'Difficulty',
  poolLabel: 'Pool',
  privateResult: 'Private Result',
  onlyNarratorSees: 'Only narrator and player can see',
},
```

---

## Uso das Traducoes Existentes

O sistema reutilizara traducoes ja existentes na secao `vampiro`:

| Contexto | Traducoes Existentes |
|----------|---------------------|
| Dropdown de Atributos | `t.vampiro.strength`, `t.vampiro.dexterity`, etc. |
| Dropdown de Habilidades | `t.vampiro.alertness`, `t.vampiro.brawl`, etc. |
| Dropdown de Virtudes | `t.vampiro.conscience`, `t.vampiro.courage`, etc. |
| Niveis de Vitalidade | `t.vampiro.bruised`, `t.vampiro.hurt`, etc. |
| Labels Gerais | `t.vampiro.willpower`, `t.vampiro.humanity` |

---

## Exemplo de Uso nos Componentes

### VampireTestRequestModal.tsx

```tsx
import { useTranslation } from '@/lib/i18n';

export function VampireTestRequestModal() {
  const t = useTranslation();
  
  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>{t.vampiroTests.configureTest}</DialogTitle>
      </DialogHeader>
      
      <Select>
        <SelectTrigger>
          <SelectValue placeholder={t.vampiroTests.selectAttribute} />
        </SelectTrigger>
        <SelectContent>
          {/* Reutiliza traducoes existentes de vampiro */}
          <SelectItem value="strength">{t.vampiro.strength}</SelectItem>
          <SelectItem value="dexterity">{t.vampiro.dexterity}</SelectItem>
          {/* ... */}
        </SelectContent>
      </Select>
      
      <div className="flex items-center gap-2">
        <Switch id="private" />
        <Label htmlFor="private">
          {t.vampiroTests.privateTest}
          <span className="text-muted-foreground text-xs">
            {t.vampiroTests.privateTestDesc}
          </span>
        </Label>
      </div>
    </Dialog>
  );
}
```

### VampireTestResult.tsx (Feed)

```tsx
function VampireTestResult({ event }: { event: TestEvent }) {
  const t = useTranslation();
  
  const attributeLabel = t.vampiro[event.attribute as keyof typeof t.vampiro];
  const abilityLabel = t.vampiro[event.ability as keyof typeof t.vampiro];
  
  return (
    <div>
      <p>
        {event.character_name} {t.vampiroTests.testedWith}{' '}
        {attributeLabel} + {abilityLabel}
      </p>
      <p>{t.vampiroTests.difficultyLabel}: {event.difficulty}</p>
      <p>{t.vampiroTests.successes}: {event.successes}</p>
      {event.isBotch && <Badge variant="destructive">{t.vampiroTests.botch}</Badge>}
    </div>
  );
}
```

---

## Arquivos a Modificar para i18n

| Arquivo | Alteracoes |
|---------|------------|
| `src/lib/i18n/translations.ts` | Adicionar secao `vampiroTests` em pt-BR e en |
| `src/components/session/vampire/VampireTestRequestModal.tsx` | Usar `useTranslation()` para todos os textos |
| `src/components/session/vampire/VampireDiceRoller.tsx` | Usar `useTranslation()` para todos os textos |
| `src/components/session/vampire/VampireTestResult.tsx` | Usar `useTranslation()` para todos os textos |
| `src/pages/VampireSession.tsx` | Usar `useTranslation()` nos componentes de feed |
| `src/components/character/vampiro/VampiroCharacterSheet.tsx` | Adicionar tooltip de especializacao com i18n |

---

## Mapeamento de Chaves para Lookup Dinamico

Para permitir lookup dinamico de atributos e habilidades pelo nome da chave:

```typescript
// src/lib/vampiro/diceUtils.ts

export function getAttributeLabel(
  t: TranslationsType, 
  attributeKey: string
): string {
  const key = attributeKey as keyof typeof t.vampiro;
  return t.vampiro[key] || attributeKey;
}

export function getAbilityLabel(
  t: TranslationsType, 
  abilityKey: string
): string {
  const key = abilityKey as keyof typeof t.vampiro;
  return t.vampiro[key] || abilityKey;
}

// Uso:
const label = getAttributeLabel(t, 'dexterity'); 
// pt-BR: "Destreza" | en: "Dexterity"
```

---

## Sequencia de Implementacao Atualizada

### Fase 1: Traducoes (Primeiro!)
1. Adicionar secao `vampiroTests` em `translations.ts` para pt-BR
2. Adicionar secao `vampiroTests` em `translations.ts` para en
3. Adicionar chave `specialization` na secao `vampiro` existente

### Fase 2: Utilitarios
1. Criar `src/lib/vampiro/diceUtils.ts` com funcoes de calculo
2. Criar funcoes helper para lookup dinamico de labels

### Fase 3: Componentes (todos com i18n desde o inicio)
1. `VampireTestRequestModal.tsx` - usando `useTranslation()`
2. `VampireDiceRoller.tsx` - usando `useTranslation()`
3. `VampireTestResult.tsx` - usando `useTranslation()`

### Fase 4: Integracao
1. Atualizar `VampireSession.tsx` com i18n
2. Atualizar `VampiroCharacterSheet.tsx` com tooltip de especializacao

---

## Checklist de i18n

- [ ] Nenhum texto hardcoded nos componentes
- [ ] Todos os labels de UI vem de `t.vampiroTests.*`
- [ ] Atributos/habilidades usam lookup dinamico de `t.vampiro.*`
- [ ] Mensagens de erro/sucesso traduzidas
- [ ] Tooltips traduzidos
- [ ] Placeholders traduzidos
- [ ] Estados de resultado (Botch, Exceptional) traduzidos
- [ ] Descricoes dos switches traduzidas
