
# Plano Atualizado: Plataforma Multi-Sistema Orc & Roll

## Visão Geral

Transformar a aplicação "Heróis Marcados" na plataforma **Orc & Roll** - um hub de RPGs online em modo teatro da mente gerenciado. A plataforma suportará múltiplos sistemas de jogo, iniciando com:

- **Heróis Marcados** (PBTA - Powered by the Apocalypse)
- **Vampiro 3ª Edição** (World of Darkness - projeto de fãs)

---

## Assets - Logos do Orc & Roll

### Arquivos a Copiar

| Origem | Destino | Uso |
|--------|---------|-----|
| `user-uploads://Logotipo_SVG_Puro.svg` | `src/assets/logo-orcnroll.svg` | Favicon + logo versátil (qualquer fundo) |
| `user-uploads://web-small-logo-transparent.webp` | `src/assets/logo-orcnroll-large.webp` | Logo grande centralizada (Auth, Index) |
| `user-uploads://Logotipo_Orc_Roll_-_Lateral_-_Copia.webp` | `src/assets/logo-orcnroll-lateral.webp` | Header canto superior esquerdo (Dashboard) |

### Diretrizes de Uso

- **Favicon**: Usar `logo-orcnroll.svg` no `index.html`
- **Páginas de login/landing**: Usar `logo-orcnroll-large.webp` centralizada
- **Header do Dashboard**: Usar `logo-orcnroll-lateral.webp` no canto superior esquerdo
- **Alt text**: Sempre usar "Orc and Roll" (com "and" escrito)

---

## Alterações no Banco de Dados

### Migração SQL

```sql
-- Adicionar game_system nas sessões
ALTER TABLE sessions 
ADD COLUMN game_system text NOT NULL DEFAULT 'herois_marcados';

-- Adicionar game_system nos personagens
ALTER TABLE characters 
ADD COLUMN game_system text NOT NULL DEFAULT 'herois_marcados';
```

Valores possíveis: `herois_marcados`, `vampiro_v3`

---

## Arquivos a Criar

### 1. `src/lib/gameSystems.ts`

Definição centralizada dos sistemas de jogo:

```typescript
export type GameSystemId = 'herois_marcados' | 'vampiro_v3';

export interface GameSystem {
  id: GameSystemId;
  name: string;
  shortName: string;
  description: {
    'pt-BR': string;
    'en': string;
  };
  color: string;
  available: boolean;
  features: string[];
}

export const GAME_SYSTEMS: GameSystem[] = [
  {
    id: 'herois_marcados',
    name: 'Heróis Marcados',
    shortName: 'PBTA',
    description: {
      'pt-BR': 'Um RPG narrativo de fantasia medieval épica',
      'en': 'A narrative epic medieval fantasy RPG'
    },
    color: 'primary', // dourado
    available: true,
    features: ['Sistema 2d6', 'Extremos', 'Marcas', 'Movimentos Heroicos']
  },
  {
    id: 'vampiro_v3',
    name: 'Vampiro 3ª Edição',
    shortName: 'V3',
    description: {
      'pt-BR': 'Horror pessoal no Mundo das Trevas',
      'en': 'Personal horror in the World of Darkness'
    },
    color: 'red', // vermelho
    available: false, // Em desenvolvimento
    features: ['Pool de d10', 'Fome', 'Humanidade', 'Disciplinas']
  }
];
```

### 2. `src/components/GameSystemSelector.tsx`

Componente reutilizável para seleção de sistema com cards visuais:

```text
┌─────────────────────────────────────┐
│  Escolha o Sistema de Jogo          │
│                                     │
│  ┌─────────────┐  ┌─────────────┐   │
│  │  [Ícone]    │  │  [Ícone]    │   │
│  │  Heróis     │  │  Vampiro    │   │
│  │  Marcados   │  │  3ª Edição  │   │
│  │  ● PBTA     │  │  ○ V3       │   │
│  │             │  │  Em breve   │   │
│  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────┘
```

---

## Arquivos a Modificar

### 1. `index.html`

- Atualizar título para "Orc & Roll - Teatro da Mente Online"
- Atualizar meta descriptions
- Adicionar favicon usando `logo-orcnroll.svg` (copiado para `public/`)

### 2. `src/pages/Index.tsx` - Redesign Completo

Transformar em landing page do Orc & Roll:

**Estrutura:**
```text
┌────────────────────────────────────────────────────┐
│  [PT] [EN]                           [Login]       │
├────────────────────────────────────────────────────┤
│                                                    │
│         [Logo Grande Centralizada]                 │
│         Orc & Roll                                 │
│         Teatro da Mente Online                     │
│                                                    │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │  ⚔️              │  │  🌙              │        │
│  │  Heróis Marcados │  │  Vampiro 3ed     │        │
│  │  PBTA            │  │  Em breve...     │        │
│  │  [Jogar]         │  │  [Aguardar]      │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                    │
│  [Recursos da Plataforma]                          │
│  - Dados 3D  - Tempo Real  - Gerenciamento         │
│                                                    │
├────────────────────────────────────────────────────┤
│  Footer: Orc & Roll                                │
└────────────────────────────────────────────────────┘
```

**Elementos principais:**
- Logo `logo-orcnroll-large.webp` centralizada no hero
- Cards dos sistemas de jogo com ícones temáticos
- Heróis Marcados: ícone Sword, cor dourada
- Vampiro 3ed: ícone Moon, cor vermelha, badge "Em breve"
- Features da plataforma (dados 3D, tempo real, multiplayer)
- CTA para login/cadastro

### 3. `src/pages/Auth.tsx`

- Substituir header "Heróis Marcados" pela logo `logo-orcnroll-large.webp`
- Manter formulário de login/signup existente
- Atualizar subtítulo para "Teatro da Mente Online"

### 4. `src/pages/Dashboard.tsx`

- Substituir ícone Sword + texto por logo `logo-orcnroll-lateral.webp` no header
- Manter funcionalidade existente
- Quick actions continuam iguais

### 5. `src/pages/CreateSession.tsx`

Adicionar seletor de sistema antes do formulário:

```text
┌─────────────────────────────────────┐
│ [← Voltar]   Criar Sessão           │
├─────────────────────────────────────┤
│                                     │
│  Sistema de Jogo *                  │
│  [GameSystemSelector]               │
│                                     │
│  Nome da Sessão *                   │
│  [________________________]         │
│                                     │
│  Descrição                          │
│  [________________________]         │
│                                     │
│  [    Criar Sessão    ]             │
└─────────────────────────────────────┘
```

- Integrar `GameSystemSelector`
- Salvar `game_system` no banco ao criar sessão
- Vampiro 3ed desabilitado (available: false)

### 6. `src/pages/CreateCharacter.tsx`

Adicionar Step 0 para seleção de sistema:

**Novo fluxo:**
- Step 0: Seleção de Sistema (GameSystemSelector)
- Step 1: Informações Básicas
- Step 2: Atributos
- Step 3: Marcas

**Comportamento:**
- Heróis Marcados: fluxo completo existente
- Vampiro 3ed: mostrar placeholder "Em desenvolvimento - Aguarde!"

---

## Resumo de Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `public/favicon.svg` | Copiar | Favicon do Orc & Roll |
| `src/assets/logo-orcnroll.svg` | Copiar | Logo versátil |
| `src/assets/logo-orcnroll-large.webp` | Copiar | Logo grande centralizada |
| `src/assets/logo-orcnroll-lateral.webp` | Copiar | Logo lateral para header |
| `index.html` | Modificar | Título, meta tags, favicon |
| `src/lib/gameSystems.ts` | Criar | Definição de sistemas |
| `src/components/GameSystemSelector.tsx` | Criar | Componente seletor |
| `src/pages/Index.tsx` | Redesign | Landing page Orc & Roll |
| `src/pages/Auth.tsx` | Modificar | Usar logo grande |
| `src/pages/Dashboard.tsx` | Modificar | Usar logo lateral no header |
| `src/pages/CreateSession.tsx` | Modificar | Adicionar seletor de sistema |
| `src/pages/CreateCharacter.tsx` | Modificar | Adicionar Step 0 |

---

## Resultado Esperado

1. Landing page mostra "Orc & Roll" como hub de jogos
2. 2 sistemas visíveis: Heróis Marcados (disponível) e Vampiro 3ed (em breve)
3. Favicon e logos atualizados em toda aplicação
4. Criar sessão permite escolher sistema
5. Criar personagem permite escolher sistema
6. Dados existentes mantidos (default: herois_marcados)
7. Vampiro 3ed mostra "Em desenvolvimento" quando selecionado
