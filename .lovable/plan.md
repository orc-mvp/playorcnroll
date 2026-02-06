
# Plano: Reformulação do Modal "Configurar Teste" para Vampiro

## Objetivo
Redesenhar o modal de configuração de teste para melhor usabilidade em desktop e mobile, tornando-o mais amplo, organizado e fácil de usar sem rolagem.

---

## Mudanças Propostas

### 1. Layout Geral do Modal

**Desktop:**
- Aumentar largura de `max-w-md` (448px) para `max-w-2xl` (672px)
- Distribuir elementos em colunas para aproveitar espaço horizontal
- Eliminar necessidade de rolagem na maioria dos casos

**Mobile:**
- Manter layout vertical responsivo
- Botões de atributos/habilidades com tamanho touch-friendly (min 44px altura)

---

### 2. Seleção de Atributos (Nova Abordagem)

**Antes:** Dropdown com grupos categorizados (Físico, Social, Mental)

**Depois:** Grid de botões diretos sem categoria visível
- 9 botões em grid 3x3 (desktop) ou 3 colunas (mobile)
- Apenas os nomes: Força, Destreza, Vigor, Carisma, etc.
- Sem labels "Físico", "Social", "Mental"
- Botão selecionado com destaque visual (borda colorida + fundo)

```
┌─────────┬─────────────┬────────┐
│  Força  │  Destreza   │ Vigor  │
├─────────┼─────────────┼────────┤
│ Carisma │ Manipulação │Aparênc.│
├─────────┼─────────────┼────────┤
│Percepção│Inteligência │Racioc. │
└─────────┴─────────────┴────────┘
```

---

### 3. Seleção de Habilidades (Nova Abordagem)

**Antes:** Dropdown com grupos (Talentos, Perícias, Conhecimentos)

**Depois:** Grid de botões compactos sem categoria
- 30 botões em grid responsivo (5-6 por linha desktop, 3 por linha mobile)
- Apenas nomes traduzidos
- Botões menores para caber na tela
- Scroll horizontal interno se necessário (apenas mobile)

---

### 4. Campo de Contexto (Colapsável)

**Antes:** Textarea sempre visível com 2 linhas

**Depois:** 
- Seção colapsável iniciando fechada
- Clique para expandir e digitar contexto
- Ícone + texto "Adicionar contexto (opcional)"
- Quando expandido, mostra textarea

---

### 5. Nova Estrutura do Modal

```
┌─────────────────────────────────────────────────────────────┐
│  🎲 Configurar Teste                               [X]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Atributo + Habilidade ▼] [Vontade] [Humanidade] [Virtude] │
│                                                             │
│  ┌── Atributo ──────────────────────────────────────────┐  │
│  │ [Força] [Destreza] [Vigor]                           │  │
│  │ [Carisma] [Manipulação] [Aparência]                  │  │
│  │ [Percepção] [Inteligência] [Raciocínio]              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌── Habilidade ────────────────────────────────────────┐  │
│  │ [Prontidão] [Esportes] [Briga] [Empatia] [Expressão] │  │
│  │ [Intimidação] [Liderança] [Manha] [Lábia] [Emp.Anim] │  │
│  │ [Ofícios] [Condução] [Etiqueta] [Armas Fogo] [...]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Dificuldade: [6] ─────────────────────────────────────────│
│                                                             │
│  ▶ Adicionar contexto (opcional)                           │
│                                                             │
│  ┌─ Opções ─────────────────────────────────────────────┐  │
│  │ 🔒 Teste Privado         ☐  │  💀 Penalidade    ☐    │  │
│  │ ⭐ Especialização        ☐  │                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Jogadores: [✓ Todos (3)]  ou  [ ] Nome1  [ ] Nome2        │
│                                                             │
│  [Cancelar]                              [🎲 Solicitar]    │
└─────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Arquivo a modificar
`src/components/session/vampire/VampireTestRequestModal.tsx`

### Componentes utilizados
- `Button` com variantes para toggle selection
- `Collapsible` para campo de contexto
- `ToggleGroup` (opcional) para tipo de teste

### Classes Tailwind principais
- Grid: `grid grid-cols-3 gap-2` (atributos)
- Grid: `grid grid-cols-5 gap-1.5 md:grid-cols-6` (habilidades)
- Botões touch: `min-h-[44px]` no mobile
- Modal: `max-w-2xl` no desktop

### Estados visuais dos botões
- Normal: `bg-muted/50 border-border`
- Selecionado: `bg-destructive/20 border-destructive text-destructive`
- Hover: `hover:bg-muted`

---

## Fluxo de Implementação

1. Atualizar DialogContent com nova largura responsiva
2. Substituir Select de atributos por grid de botões
3. Substituir Select de habilidades por grid de botões
4. Converter campo de contexto para Collapsible
5. Reorganizar switches de opções em layout compacto de 2 colunas
6. Ajustar seleção de jogadores para formato inline
7. Testar responsividade em diferentes tamanhos de tela

---

## Resultado Esperado
- Modal mais intuitivo e rápido de usar
- Menos cliques para configurar um teste
- Visibilidade completa sem rolagem (desktop)
- Botões grandes e fáceis de tocar (mobile)
- Contexto opcional não ocupa espaço visual desnecessário
