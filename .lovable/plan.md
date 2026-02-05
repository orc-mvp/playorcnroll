
# Plano: Padronização de Cores de Texto para Fundos Claros

## Problema Identificado
O texto "Teatro da Mente Online" na página Auth está com cor clara (`text-primary-foreground`) que não funciona sobre o fundo claro `bg-parchment`. Textos como "Bem-vindo de Volta" funcionam porque estão dentro do card escuro usando `text-foreground`.

## Cores Definidas para Texto em Fundos Claros
- **Verde da logo**: `#00642c`
- **Marrom escuro**: `#211f1c`

## Estratégia
Criar uma classe utilitária no sistema de design para textos em fundos claros e aplicar consistentemente.

---

## Alterações Técnicas

### 1. Adicionar variáveis de cor no CSS (`src/index.css`)

Adicionar duas novas variáveis CSS para textos em fundos claros:
```css
--text-on-light: 147 100% 20%; /* #00642c convertido para HSL */
--text-on-light-alt: 30 6% 11%; /* #211f1c convertido para HSL */
```

### 2. Adicionar cores no Tailwind (`tailwind.config.ts`)

Registrar as novas cores no tema:
```typescript
"on-light": {
  DEFAULT: "hsl(var(--text-on-light))",
  alt: "hsl(var(--text-on-light-alt))",
},
```

### 3. Corrigir Auth.tsx (`src/pages/Auth.tsx`)

- Linha 156: Mudar `text-primary-foreground` para `text-[#211f1c]` (ou a nova classe `text-on-light-alt`)

### 4. Corrigir Index.tsx (`src/pages/Index.tsx`)

Verificar os textos sobre fundo claro (`bg-muted`):
- Linha 73-74: "Orc & Roll" - usa `text-foreground` (precisa mudar para escuro)
- Linha 76-80: "Teatro da Mente Online" - usa `text-muted-foreground` (precisa mudar)
- Linha 230: Footer "Orc & Roll" - usa `text-foreground` (precisa mudar)
- Linha 231-235: Footer "Teatro da Mente Online" - usa `text-muted-foreground` (precisa mudar)

---

## Regra de Design Consolidada

| Contexto | Classe de Texto |
|----------|----------------|
| Fundo escuro (`bg-background`, `bg-card`) | `text-foreground`, `text-muted-foreground` |
| Fundo claro (`bg-parchment`, `bg-muted`) | `text-[#00642c]` ou `text-[#211f1c]` |

## Arquivos Afetados
1. `src/index.css` - Adicionar variáveis CSS
2. `tailwind.config.ts` - Registrar cores
3. `src/pages/Auth.tsx` - Corrigir texto do subtítulo
4. `src/pages/Index.tsx` - Corrigir textos no Hero e Footer
