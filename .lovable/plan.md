
# Plano: Expandir Lista de Disciplinas com Organização por Livro

## Objetivo
Reorganizar a seção de disciplinas para:
1. Mostrar primeiro as 3 disciplinas do clã selecionado (destacadas)
2. Depois listar TODAS as disciplinas disponíveis organizadas por livro de origem
3. Permitir valores de 0 a 10 para todas as disciplinas (igual às habilidades)

## Layout Visual Proposto

```text
┌─────────────────────────────────────────────────────┐
│                   DISCIPLINAS                       │
├─────────────────────────────────────────────────────┤
│ ★ Disciplinas do Clã (Brujah)                      │
│   Celeridade                     ●●●○○○○○○○         │
│   Potência                       ●●○○○○○○○○         │
│   Presença                       ●○○○○○○○○○         │
├─────────────────────────────────────────────────────┤
│ ▸ Vampire: The Masquerade Revised Edition          │
│   Animalismo                     ○○○○○○○○○○         │
│   Auspícios                      ○○○○○○○○○○         │
│   Demência                       ○○○○○○○○○○         │
│   ...                                               │
├─────────────────────────────────────────────────────┤
│ ▸ Guide to the Camarilla                           │
│   Voo de Gárgula                 ○○○○○○○○○○         │
│   Visceratika                    ○○○○○○○○○○         │
└─────────────────────────────────────────────────────┘
```

## Estrutura de Dados

Nova constante `DISCIPLINES_BY_BOOK`:

| Livro | Disciplinas |
|-------|-------------|
| Vampire: The Masquerade Revised Edition | Animalism, Auspex, Celerity, Chimerstry, Dementation, Dominate, Fortitude, Necromancy, Obfuscate, Obtenebration, Potence, Presence, Protean, Quietus, Serpentis, Thaumaturgy, Vicissitude |
| Guide to the Camarilla | Gargoyle Flight, Visceratika |
| Vampire Storytellers Handbook Revised | Daimoinon, Temporis |
| Storytellers Handbook to the Sabbat | Mytherceria, Spiritus |
| Guide to the Sabbat | Sanguinus |
| Clanbook: Salubri | Valeren |
| Blood Magic: Secrets of Thaumaturgy | Koldunic Sorcery |
| Dirty Secrets of the Black Hand | Nihilistics |
| Vampire Storytellers Companion | Obeah, Melpominee, Thanatosis |

## Alterações no Arquivo

### `src/components/character/vampiro/StepVampiroDisciplines.tsx`

1. **Adicionar constante `DISCIPLINES_BY_BOOK`** com todas as disciplinas organizadas por livro, incluindo labels em português e inglês

2. **Atualizar mapeamento `CLAN_DISCIPLINES`** para usar as keys das disciplinas (para matching)

3. **Reestruturar o card de Disciplinas**:
   - Seção destacada "Disciplinas do Clã" com as 3 disciplinas do clã (ou mais para Caitiff)
   - Accordion colapsável com todas as outras disciplinas organizadas por livro
   - Usar `ScrollArea` para gerenciar a altura

4. **Atualizar DotRating para disciplinas**: `maxValue={10}` (já suportado pelo componente)

5. **Filtrar disciplinas duplicadas**: As disciplinas do clã não devem aparecer novamente na lista por livro, ou podem aparecer marcadas como "já incluída no clã"

## Considerações Técnicas

- **Keys únicas**: Usar identificadores consistentes (ex: `animalism`, `auspex`, `celerity`)
- **maxValue=10**: Disciplinas terão range de 0-10 como habilidades
- **Destaque visual**: Disciplinas do clã terão seção separada com ícone de estrela ou cor diferenciada
- **Performance**: ScrollArea com altura máxima para lista extensa
- **i18n**: Labels em português e inglês para cada disciplina
