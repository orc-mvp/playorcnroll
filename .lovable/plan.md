
# Plano: Melhorias na Sidebar do Narrador Vampiro

## Objetivo
Implementar 5 mudanças na interface de sessão de Vampiro:
1. Remover card "Nova Cena" da sidebar esquerda
2. Implementar i18n nas disciplinas da Coterie
3. Ordenar disciplinas por nível mais alto primeiro
4. Alterar texto "Configurar Teste" para "Testar"
5. Alterar texto do botão de teste para incluir nomes de personagens
6. remover o contador de personagens na Coterie.

---

## Mudanças Detalhadas

### 1. Remover Card "Nova Cena" (VampireNarratorSidebar)

**Localização:** Linhas 535-587 do `VampireNarratorSidebar.tsx`

O card de gerenciamento de cenas será removido da sidebar do Narrador. O gerenciamento de cenas já existe no painel central (`VampireScenePanel`), então esta duplicação é desnecessária.

**Ação:** Deletar o bloco de código do card "Scene Management"

---

### 2. Implementar i18n nas Disciplinas da Coterie

**Localização:** Linhas 408-421 do `VampireNarratorSidebar.tsx`

**Problema Atual:**
```typescript
{t.vampiro[key as keyof typeof t.vampiro] || key}: {value}
```
Isso falha porque as disciplinas (animalism, auspex, etc.) NÃO existem no objeto `t.vampiro`.

**Solução:**
Criar um mapa de disciplinas bilíngue similar ao usado em `StepVampiroDisciplines.tsx`:

```typescript
const DISCIPLINE_LABELS: Record<string, { pt: string; en: string }> = {
  animalism: { pt: 'Animalismo', en: 'Animalism' },
  auspex: { pt: 'Auspícios', en: 'Auspex' },
  celerity: { pt: 'Celeridade', en: 'Celerity' },
  // ... todas as disciplinas
};

const getDisciplineLabel = (key: string, lang: string) => {
  const label = DISCIPLINE_LABELS[key];
  return label ? (lang === 'pt-BR' ? label.pt : label.en) : key;
};
```

---

### 3. Ordenar Disciplinas por Nível (Mais Alto Primeiro)

**Localização:** Linhas 408-421 do `VampireNarratorSidebar.tsx`

**Código Atual:**
```typescript
Object.entries(vampData.disciplines)
  .filter(([, v]) => v > 0)
  .slice(0, 3)
```

**Código Novo:**
```typescript
Object.entries(vampData.disciplines)
  .filter(([, v]) => v > 0)
  .sort(([, a], [, b]) => b - a)  // Ordenar por valor decrescente
  .slice(0, 3)
```

---

### 4. Alterar "Configurar Teste" para "Testar"

**Localização:** Linha 339 do `VampireNarratorSidebar.tsx`

**De:** `{t.vampiroTests.configureTest}` ("Configurar Teste")
**Para:** Nova chave `{t.vampiroTests.test}` ("Testar")

**Alteração em translations.ts:**
```typescript
// PT-BR
vampiroTests: {
  test: 'Testar',
  // ...
}

// EN
vampiroTests: {
  test: 'Test',
  // ...
}
```

---

### 5. Alterar Texto do Botão "Pedir Teste"

**Localização:** `VampireTestRequestModal.tsx` linha 392

**Comportamento Atual:** "Pedir Teste" (estático)

**Comportamento Novo:**
- 1 jogador selecionado: "[Nome] faça um teste de [tipo]"
- Múltiplos jogadores: "[Nome, Nome] testem [tipo]"
- Todos selecionados: "Todos testem [tipo]"

**Implementação:**
```typescript
const getButtonLabel = () => {
  const targetNames = selectAll 
    ? [language === 'pt-BR' ? 'Todos' : 'Everyone']
    : selectedPlayers.map(id => 
        playersWithCharacters.find(p => p.character_id === id)?.character?.name || ''
      );
  
  const testLabel = getTestTypeLabel(); // Atributo + Habilidade, Vontade, etc.
  
  if (targetNames.length === 1) {
    return language === 'pt-BR' 
      ? `${targetNames[0]} faça um teste de ${testLabel}`
      : `${targetNames[0]} make a ${testLabel} test`;
  }
  
  return language === 'pt-BR'
    ? `${targetNames.join(', ')} testem ${testLabel}`
    : `${targetNames.join(', ')} test ${testLabel}`;
};
```

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/components/session/vampire/VampireNarratorSidebar.tsx` | Remover card de cena, adicionar mapa de disciplinas, ordenar disciplinas, trocar texto do botão |
| `src/components/session/vampire/VampireTestRequestModal.tsx` | Alterar texto do botão de "Pedir Teste" para frase dinâmica |
| `src/lib/i18n/translations.ts` | Adicionar chave `vampiroTests.test` |

---

## Mapa de Disciplinas (Referência)

```text
┌─────────────────────────────────────────────────────────┐
│  Disciplina        │  PT-BR           │  EN             │
├─────────────────────────────────────────────────────────┤
│  animalism         │  Animalismo      │  Animalism      │
│  auspex            │  Auspícios       │  Auspex         │
│  celerity          │  Celeridade      │  Celerity       │
│  chimerstry        │  Quimerismo      │  Chimerstry     │
│  dementation       │  Demência        │  Dementation    │
│  dominate          │  Dominação       │  Dominate       │
│  fortitude         │  Fortitude       │  Fortitude      │
│  necromancy        │  Necromancia     │  Necromancy     │
│  obfuscate         │  Ofuscação       │  Obfuscate      │
│  obtenebration     │  Obtenebração    │  Obtenebration  │
│  potence           │  Potência        │  Potence        │
│  presence          │  Presença        │  Presence       │
│  protean           │  Metamorfose     │  Protean        │
│  quietus           │  Quietus         │  Quietus        │
│  serpentis         │  Serpentis       │  Serpentis      │
│  thaumaturgy       │  Taumaturgia     │  Thaumaturgy    │
│  vicissitude       │  Vicissitude     │  Vicissitude    │
│  + outras 12 disciplinas menores...                     │
└─────────────────────────────────────────────────────────┘
```

---

## Resultado Visual Esperado

**Antes (Coterie):**
```
🌙 Marcus
   Brujah • 10ª Geração
   [celerity: 3] [potence: 2] [presence: 1]
```

**Depois (Coterie):**
```
🌙 Marcus
   Brujah • 10ª Geração
   [Celeridade: 3] [Potência: 2] [Presença: 1]
```

**Antes (Botão de Teste):**
```
[Pedir Teste]
```

**Depois (Botão de Teste):**
```
[Marcus faça um teste de Força + Briga]
ou
[Marcus e Elena testem Força de Vontade]
ou
[Marcus, José e Elena testem Força de Vontade]
```
