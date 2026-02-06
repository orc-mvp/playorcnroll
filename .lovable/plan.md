
# Plano: Unificar VampireEventFeed com a Estrutura do EventFeed

## Objetivo
Refatorar o VampireEventFeed para usar a mesma estrutura e padrões do EventFeed de Heróis Marcados, mantendo as adaptações visuais (cores vermelhas/góticas) e regras específicas do Vampiro.

---

## Estrutura Atual vs Nova

### EventFeed (Heróis Marcados) - Padrão a Seguir
- Paginação com 10 itens por página (max 100 eventos)
- Objeto `eventConfig` com padrão { icon, color, label }
- Contador de eventos no header
- Formatação de data com date-fns e locale
- Estado vazio com ícone centralizado
- Layout flex com overflow handling
- Botões de navegação "Anterior/Próximo"

### VampireEventFeed (Atual)
- Sem paginação
- Switch/case para cada tipo de evento
- Sem contador de eventos
- Formatação básica de hora
- ScrollArea fixa de 300px

---

## Mudanças a Implementar

### 1. Estrutura do Componente

```text
┌─────────────────────────────────────────────────────────────┐
│  📜 Crônica                                   23 eventos    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Evento ────────────────────────────────────────────┐   │
│  │ 🎲 [Nome] testou Força + Briga (Dif. 6)             │   │
│  │    [3] [5] [7] [8] [10]  → 3 Sucessos               │   │
│  │    📖 Nome da Cena               14:32:05           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Evento ────────────────────────────────────────────┐   │
│  │ 💧 Marcus • Sangue: 15 → 12 (-3)                    │   │
│  │    📖 Cena Noturna               14:30:12           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [◀ Anterior]              1 / 3              [Próximo ▶]   │
└─────────────────────────────────────────────────────────────┘
```

---

### 2. Objeto eventConfig Vampiro

Converter o switch/case para um objeto de configuração:

```typescript
const vampireEventConfig = {
  scene_started: {
    icon: BookOpen,
    color: 'text-destructive',
    bgClass: 'bg-destructive/10 border-destructive/30',
  },
  scene_changed: {
    icon: BookOpen,
    color: 'text-destructive',
    bgClass: 'bg-destructive/10 border-destructive/30',
  },
  vampire_test_requested: {
    icon: Dices,
    color: 'text-amber-500',
    bgClass: 'bg-muted/30',
  },
  vampire_test_result: {
    icon: Dices,  // dinâmico baseado em resultado
    color: 'text-green-500',  // dinâmico
    bgClass: 'bg-muted/30',  // dinâmico baseado em botch/exceptional
  },
  tracker_change: {
    icon: null,  // dinâmico baseado no tipo de tracker
    color: 'text-destructive',  // dinâmico
    bgClass: 'bg-muted/30',
  },
  critical_state: {
    icon: Skull,
    color: 'text-destructive',
    bgClass: 'bg-destructive/20 border-destructive/40',
  },
  player_joined: {
    icon: UserPlus,
    color: 'text-green-500',
    bgClass: 'bg-muted/30',
  },
};
```

---

### 3. Cores Temáticas do Vampiro

| Elemento | Heróis Marcados | Vampiro |
|----------|-----------------|---------|
| Header Icon | text-primary (verde) | text-destructive (vermelho) |
| Cenas | text-blue-500 | text-destructive |
| Sucesso | text-green-500 | text-green-500 |
| Falha/Botch | text-red-500 | text-destructive |
| Excepcional | text-yellow-400 | text-yellow-500 |
| Tracker Sangue | - | text-destructive |
| Tracker Vontade | - | text-foreground |
| Tracker Saúde | - | text-destructive |
| Tracker Humanidade | - | text-foreground |

---

### 4. Funcionalidades a Adicionar

1. **Paginação**
   - ITEMS_PER_PAGE = 10
   - MAX_EVENTS = 100
   - Botões Anterior/Próximo com ChevronLeft/ChevronRight
   - Indicador "página X de Y"

2. **Contador de eventos**
   - Exibir total no header: "23 eventos"

3. **Formatação de data**
   - Usar date-fns com format e locale (ptBR/enUS)
   - Exibir como "HH:mm:ss"

4. **Layout responsivo**
   - flex-col com overflow-hidden no CardContent
   - ScrollArea flex-1
   - Paginação com border-t

5. **Badge de cena**
   - Exibir nome da cena em cada evento (se disponível)

---

### 5. Mapeamento de Labels

```typescript
// Scene events
scene_started: (data, lang) => data.scene_name

// Test requested
vampire_test_requested: (data, lang) => 
  `${lang === 'pt-BR' ? 'Teste de' : 'Test of'} ${getTestLabel(data)}`

// Test result
vampire_test_result: (data, lang) => {
  const result = data.is_botch ? t.vampiroTests.botch
    : data.is_exceptional ? t.vampiroTests.exceptional
    : data.final_successes > 0 ? `${data.final_successes} ${t.vampiroTests.successes}`
    : t.vampiroTests.failure;
  return `${data.character_name}: ${getTestLabel(data.test_config)} → ${result}`;
}

// Tracker change
tracker_change: (data, lang) => 
  `${data.character_name} • ${getTrackerLabel(data.tracker_type)}: ${data.old_value} → ${data.new_value}`

// Critical state
critical_state: (data, lang) =>
  `${data.character_name} - ${data.type === 'blood_depleted' ? 'Sangue Esgotado!' : 'Vontade Exaurida!'}`
```

---

## Arquivo a Modificar

`src/components/session/vampire/VampireEventFeed.tsx`

---

## Estrutura do Código Refatorado

```typescript
import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
// ... outros imports

const ITEMS_PER_PAGE = 10;
const MAX_EVENTS = 100;

// Funções helper para labels
const getTestLabel = (config, t) => { ... };
const getTrackerIcon = (type) => { ... };
const getTrackerLabel = (type, t) => { ... };

// Configuração de eventos (icon base, color, bgClass)
const getVampireEventConfig = (t) => ({ ... });

// Componente principal com paginação
export function VampireEventFeed({ events, currentUserId, isNarrator }) {
  const { t, language } = useI18n();
  const dateLocale = language === 'pt-BR' ? ptBR : enUS;
  const [currentPage, setCurrentPage] = useState(0);
  
  const eventConfig = useMemo(() => getVampireEventConfig(t), [t]);
  
  // Filtrar e limitar eventos
  const filteredEvents = useMemo(() => events.slice(0, MAX_EVENTS), [events]);
  
  // Paginação
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );
  
  // Renderização com estrutura similar ao EventFeed
  return (
    <Card className="medieval-card border-destructive/20 h-full flex flex-col">
      <CardHeader>
        {/* Header com contador */}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 px-6">
          {/* Lista de eventos */}
        </ScrollArea>
        {/* Paginação */}
      </CardContent>
    </Card>
  );
}
```

---

## Resultado Esperado

1. **Consistência visual** - Ambos os feeds seguem a mesma estrutura
2. **Paginação funcional** - Navegação entre páginas de eventos
3. **Contador informativo** - Usuário sabe quantos eventos existem
4. **Temática vampírica** - Cores vermelhas/góticas mantidas
5. **Melhor formatação de data** - Usando date-fns com locale
6. **Layout responsivo** - Funciona bem em desktop e mobile
7. **Performance** - Limitado a 100 eventos máximos
