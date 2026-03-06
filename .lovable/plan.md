

## Plano: Adicionar área de anotações em todas as fichas de personagem

### Resumo
Adicionar um campo de texto editável "Anotações" no final de todas as fichas de personagem dos 3 sistemas (Heróis Marcados, Vampiro e Lobisomem), com persistência no banco de dados e atualização em tempo real.

### 1. Migração de banco de dados
Adicionar coluna `notes` (text, nullable) na tabela `characters`:
```sql
ALTER TABLE public.characters ADD COLUMN notes text DEFAULT '';
```

### 2. i18n (translations.ts)
Adicionar chaves para ambos os idiomas:
- `characterSheet.notes` → "Anotações" / "Notes"
- `characterSheet.notesPlaceholder` → "Escreva suas anotações aqui..." / "Write your notes here..."
- `characterSheet.notesSaved` → "Anotações salvas" / "Notes saved"

### 3. Componente reutilizável `CharacterNotes`
Criar `src/components/character/CharacterNotes.tsx`:
- Recebe `characterId`, `initialNotes`, `readOnly`
- Textarea com auto-save (debounce ~1s) ao digitar
- Salva via `supabase.update` na tabela `characters`
- Toast de confirmação ao salvar
- Ícone `StickyNote` + título i18n
- Realtime: subscribe a mudanças na coluna `notes` do personagem

### 4. Integração em cada ficha

**Heróis Marcados** — `CharacterSheetModal.tsx`:
- Adicionar `<CharacterNotes>` após a seção de Marcas (Tabs), antes do fechamento do ScrollArea
- `readOnly` quando visualizado pelo narrador (não é dono do personagem)

**Vampiro** — `VampiroCharacterSheet.tsx`:
- Adicionar `<CharacterNotes>` após o Card de XP Log
- Usar prop `readOnly` existente

**Lobisomem** — `LobisomemCharacterSheet.tsx`:
- Adicionar `<CharacterNotes>` após o Card de XP Log
- Usar prop `readOnly` existente

**Página de ficha** — `CharacterSheet.tsx`:
- Adicionar `<CharacterNotes>` no final da ficha do sistema Heróis Marcados (seção standalone)

### 5. Detalhes técnicos
- O narrador pode ver as anotações mas não editá-las (readOnly baseado em `character.user_id !== auth.uid()`)
- Auto-save com debounce para evitar chamadas excessivas
- Realtime subscription para sincronizar entre abas/dispositivos

