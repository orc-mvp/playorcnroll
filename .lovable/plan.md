

# Corrigir Lista de Habilidades para 3a Edicao Revisada + Contadores de Pontos

## Problema

A tela de **criacao** usa as habilidades corretas da 3a Edicao Revisada (`dodge`, `security`, `linguistics`), mas a **ficha**, o **modal de edicao**, o **i18n** e o **diceUtils** usam chaves erradas da V20 (`awareness`, `larceny`, `technology`). Isso faz com que pontos alocados na criacao nao aparecam na ficha.

## Lista Oficial (3a Edicao Revisada)

| Talentos | Pericias | Conhecimentos |
|----------|----------|---------------|
| Alertness (Prontidao) | Animal Ken (Emp. c/Animais) | Academics (Academicos) |
| Athletics (Esportes) | Crafts (Oficios) | Computer (Computador) |
| Brawl (Briga) | Drive (Conducao) | Finance (Financas) |
| **Dodge (Esquiva)** | Etiquette (Etiqueta) | Investigation (Investigacao) |
| Empathy (Empatia) | Firearms (Armas de Fogo) | Law (Direito) |
| Expression (Expressao) | Melee (Armas Brancas) | **Linguistics (Linguistica)** |
| Intimidation (Intimidacao) | Performance (Performance) | Medicine (Medicina) |
| Leadership (Lideranca) | **Security (Seguranca)** | Occult (Ocultismo) |
| Streetwise (Manha) | Stealth (Furtividade) | Politics (Politica) |
| Subterfuge (Labia) | Survival (Sobrevivencia) | Science (Ciencias) |

## Mudancas

### 1. `src/lib/i18n/translations.ts`
- Substituir `awareness` -> `dodge` com traducoes "Esquiva" / "Dodge"
- Substituir `larceny` -> `security` com traducoes "Seguranca" / "Security"
- Substituir `technology` -> `linguistics` com traducoes "Linguistica" / "Linguistics"
- Aplicar em ambos os idiomas (pt-BR e en-US)

### 2. `src/components/character/vampiro/VampiroCharacterSheet.tsx`
- Corrigir `ABILITY_KEYS`: `awareness` -> `dodge`, `larceny` -> `security`, `technology` -> `linguistics`
- Adicionar contador de pontos ao lado dos titulos de Talentos, Pericias e Conhecimentos (ex: "Talentos (13)")

### 3. `src/components/character/vampiro/EditVampiroCharacterModal.tsx`
- Corrigir `ABILITY_NAMES`: `awareness` -> `dodge`, `larceny` -> `security`, `technology` -> `linguistics`
- Adicionar contador de pontos nos titulos das categorias

### 4. `src/lib/vampiro/diceUtils.ts`
- Corrigir `TALENTS`: `awareness` -> `dodge`
- Corrigir `SKILLS`: `larceny` -> `security`
- Corrigir `KNOWLEDGES`: `technology` -> `linguistics`

### 5. `src/components/character/vampiro/StepVampiroAttributes.tsx`
- Este arquivo ja esta correto (usa `dodge`, `security`, `linguistics`)
- Adicionar contador de pontos nos titulos das categorias (ex: "Talentos (13)")

## Formato do Contador

Exibido ao lado do titulo da categoria:

```
Talentos (13)  |  Pericias (9)  |  Conhecimentos (5)
```

O numero em `text-muted-foreground` para nao competir visualmente com o titulo.

## Dados Existentes

Personagens criados pela tela de criacao ja salvaram com as chaves corretas (`dodge`, `security`, `linguistics`). Personagens editados pelo modal podem ter dados nas chaves erradas (`awareness`, `larceny`, `technology`), mas como o modal passara a usar as chaves corretas, esses pontos especificos precisarao ser re-atribuidos manualmente.

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/lib/i18n/translations.ts` | Corrigir 3 chaves de habilidades (ambos idiomas) |
| `src/components/character/vampiro/VampiroCharacterSheet.tsx` | Corrigir ABILITY_KEYS + adicionar contadores |
| `src/components/character/vampiro/EditVampiroCharacterModal.tsx` | Corrigir ABILITY_NAMES + adicionar contadores |
| `src/lib/vampiro/diceUtils.ts` | Corrigir TALENTS, SKILLS, KNOWLEDGES |
| `src/components/character/vampiro/StepVampiroAttributes.tsx` | Adicionar contadores de pontos |

