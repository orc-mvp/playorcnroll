
# Plano: Organizar Antecedentes por Livros de Origem

## Objetivo
Reorganizar a lista de antecedentes na etapa 5 de criação de personagem Vampiro, agrupando-os por livro de origem com títulos visuais para cada seção.

## Estrutura de Dados Proposta

```text
BACKGROUNDS_BY_BOOK = [
  {
    book: "Vampiro: A Máscara (Revised / 3ª edição)",
    backgrounds: [
      { key: 'allies', labelPt: 'Aliados', labelEn: 'Allies' },
      { key: 'contacts', labelPt: 'Contatos', labelEn: 'Contacts' },
      { key: 'fame', labelPt: 'Fama', labelEn: 'Fame' },
      { key: 'generation', labelPt: 'Geração', labelEn: 'Generation' },
      { key: 'herd', labelPt: 'Rebanho', labelEn: 'Herd' },
      { key: 'influence', labelPt: 'Influência', labelEn: 'Influence' },
      { key: 'mentor', labelPt: 'Mentor', labelEn: 'Mentor' },
      { key: 'resources', labelPt: 'Recursos', labelEn: 'Resources' },
      { key: 'retainers', labelPt: 'Lacaios', labelEn: 'Retainers' },
      { key: 'status', labelPt: 'Status', labelEn: 'Status' },
      { key: 'elysium', labelPt: 'Elysium', labelEn: 'Elysium' },
      { key: 'age', labelPt: 'Idade', labelEn: 'Age' },
      { key: 'elder_status', labelPt: 'Status de Ancião', labelEn: 'Elder Status' },
      { key: 'elder_generation', labelPt: 'Geração de Ancião', labelEn: 'Elder Generation' },
      { key: 'military_force', labelPt: 'Força Militar', labelEn: 'Military Force' },
    ]
  },
  {
    book: "Vampire Storytellers Handbook (Revised)",
    backgrounds: [
      { key: 'age_vsh', labelPt: 'Idade', labelEn: 'Age' },
      { key: 'arcane', labelPt: 'Arcano', labelEn: 'Arcane' },
      { key: 'military_force_vsh', labelPt: 'Força Militar', labelEn: 'Military Force' },
    ]
  },
  // ... demais livros
]
```

## Layout Visual

```text
┌─────────────────────────────────────────────────────┐
│                   ANTECEDENTES                      │
├─────────────────────────────────────────────────────┤
│ ▸ Vampiro: A Máscara (Revised / 3ª edição)         │
│   Aliados                        ●●○○○              │
│   Contatos                       ●○○○○              │
│   Fama                           ○○○○○              │
│   ...                                               │
├─────────────────────────────────────────────────────┤
│ ▸ Vampire Storytellers Handbook (Revised)          │
│   Idade                          ○○○○○              │
│   Arcano                         ○○○○○              │
│   Força Militar                  ○○○○○              │
├─────────────────────────────────────────────────────┤
│ ▸ Guide to the Sabbat                              │
│   Identidade Alternativa         ○○○○○              │
│   Filiação à Mão Negra           ○○○○○              │
│   ...                                               │
└─────────────────────────────────────────────────────┘
```

## Arquivo a Modificar

### `src/components/character/vampiro/StepVampiroDisciplines.tsx`

**Alterações:**

1. **Substituir** a constante `BACKGROUNDS` por `BACKGROUNDS_BY_BOOK` contendo todos os 11 livros:
   - Vampiro: A Máscara (Revised / 3ª edição) - 15 antecedentes
   - Vampire Storytellers Handbook (Revised) - 3 antecedentes
   - Dirty Secrets of the Black Hand - 1 antecedente
   - Guide to the Sabbat - 4 antecedentes
   - The Players Guide to the Sabbat - 3 antecedentes
   - Ghouls: Fatal Addiction - 1 antecedente
   - Clanbook: Nosferatu (Revised) - 1 antecedente
   - Time of Thin Blood - 1 antecedente
   - Inquisition - 2 antecedentes
   - Blood Magic: Secrets of Thaumaturgy - 1 antecedente
   - The Hunters Hunted - 1 antecedente
   - Clanbook: Giovanni (Revised) - 1 antecedente

2. **Adicionar** componente `Collapsible` para cada livro (ou usar acordeão simples)

3. **Renderizar** os antecedentes agrupados por livro com:
   - Título do livro em destaque (usando `Separator` ou estilo diferenciado)
   - Lista de antecedentes do livro abaixo do título
   - `DotRating` para cada antecedente

4. **Usar keys únicas** para antecedentes que aparecem em múltiplos livros (ex: `age_vsh` vs `age`)

## Lista Completa de Antecedentes por Livro

| Livro | Antecedentes |
|-------|--------------|
| Vampiro: A Máscara (Revised) | Aliados, Contatos, Fama, Geração, Rebanho, Influência, Mentor, Recursos, Lacaios, Status, Elysium, Idade, Status de Ancião, Geração de Ancião, Força Militar |
| Vampire Storytellers Handbook | Idade, Arcano, Força Militar |
| Dirty Secrets of the Black Hand | Idade |
| Guide to the Sabbat | Identidade Alternativa, Filiação à Mão Negra, Rituais, Status no Sabbat |
| The Players Guide to the Sabbat | Identidade Alternativa, Filiação à Mão Negra, Reconhecimento de Bando |
| Ghouls: Fatal Addiction | Domitor |
| Clanbook: Nosferatu (Revised) | Rede de Informações |
| Time of Thin Blood | Insight |
| Inquisition | Turba, Relíquia |
| Blood Magic: Secrets of Thaumaturgy | Biblioteca Oculta |
| The Hunters Hunted | Reputação |
| Clanbook: Giovanni (Revised) | Escravos Espirituais |

## Considerações Técnicas

- **Scroll**: O card de antecedentes pode ficar grande. Considerar usar `ScrollArea` com altura máxima ou manter colapsável
- **Estado colapsado**: Por padrão, mostrar apenas o livro base expandido para não sobrecarregar a tela
- **Keys duplicadas**: Usar prefixo do livro para antecedentes repetidos (ex: `vsh_age`, `dsbh_age`)
