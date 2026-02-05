
# Plano: Sistema de Design Padronizado para Orc & Roll

## Objetivo
Criar um sistema de design documentado e consistente para toda a aplicação, usando a home page como referência base, garantindo legibilidade e coerência visual em todas as páginas.

---

## Análise do Estado Atual

### Problemas Identificados

| Problema | Onde Ocorre |
|----------|-------------|
| Texto redundante "Orc & Roll" sob a logo | Index.tsx (Hero e Footer) |
| Cards de sistema ilegíveis | Index.tsx (Vampiro usa opacity-75) |
| Descrições sem pontuação correta | gameSystems.ts |
| Sistema Vampiro desabilitado | gameSystems.ts (`available: false`) |
| Falta de documentação de padrões de cor | Nenhum arquivo de referência |

### Páginas que Precisam de Revisão
1. `Index.tsx` - Landing page (prioridade alta)
2. `Auth.tsx` - Já corrigido
3. `Dashboard.tsx` - Usa fundo escuro (ok)
4. `MyCharacters.tsx` - Usa fundo escuro (ok)
5. `MySessions.tsx` - Usa fundo escuro (ok)
6. `CreateCharacter.tsx` - Usa fundo escuro (ok)
7. `Session.tsx` - Usa fundo escuro (ok)

---

## Sistema de Design Proposto

### 1. Regras de Cores para Texto

```text
┌─────────────────────────────────────────────────────────────┐
│                    PADRÃO DE CORES                          │
├─────────────────────────────────────────────────────────────┤
│ FUNDO ESCURO (bg-background, bg-card, bg-card/50)          │
│   ├─ Títulos: text-foreground                              │
│   ├─ Subtítulos: text-muted-foreground                     │
│   └─ Destaque: text-primary                                │
├─────────────────────────────────────────────────────────────┤
│ FUNDO CLARO (bg-parchment)                                 │
│   ├─ Títulos: text-on-light (#00642c)                      │
│   ├─ Subtítulos: text-on-light-alt (#211f1c)               │
│   └─ Destaque: text-primary                                │
└─────────────────────────────────────────────────────────────┘
```

### 2. Hierarquia Tipográfica

| Elemento | Font | Classe |
|----------|------|--------|
| Títulos principais (H1-H3) | Cinzel | `font-medieval` |
| Corpo de texto | Crimson Text | `font-body` |
| Botões | Cinzel | `font-medieval` |
| Labels e badges | Crimson Text | `font-body` |

### 3. Uso de Logos

| Logo | Uso | Observação |
|------|-----|------------|
| `logo-orcnroll-large.webp` | Hero, Auth, páginas de entrada | Centralizada, sem texto duplicado |
| `logo-orcnroll-lateral.webp` | Headers internos (Dashboard) | Alinhada à esquerda |
| `logo-orcnroll.svg` | Favicon, ícones pequenos | Versão vetorial |

**Regra crítica**: Nunca adicionar texto "Orc & Roll" sob a logo pois já está escrito nela.

### 4. Cards de Sistema de Jogo

Todos os cards devem usar:
- `bg-card` (fundo escuro consistente)
- `border-primary` (borda verde)
- `text-foreground` para títulos
- `text-muted-foreground` para descrições
- Sem `opacity-75` ou variações condicionais

---

## Alterações Técnicas

### Arquivo 1: `src/lib/gameSystems.ts`

**Linha 22** - Corrigir descrição Heróis Marcados:
```typescript
'pt-BR': 'Um RPG narrativista de fantasia medieval épica.'
```

**Linha 24** - Corrigir versão em inglês:
```typescript
'en': 'A narrativist epic medieval fantasy RPG.'
```

**Linha 34** - Corrigir descrição Vampiro:
```typescript
'pt-BR': 'Horror pessoal no Mundo das Trevas.'
```

**Linha 36** - Corrigir versão em inglês:
```typescript
'en': 'Personal horror in the World of Darkness.'
```

**Linha 38** - Habilitar sistema:
```typescript
available: true
```

### Arquivo 2: `src/pages/Index.tsx`

**Hero Section (linhas 68-80)** - Remover texto redundante:
```tsx
{/* Tagline - SEM "Orc & Roll" */}
<p className="text-xl md:text-2xl text-on-light-alt font-body mb-12 text-center">
  {language === 'pt-BR' 
    ? 'Teatro da Mente Online'
    : 'Online Theater of the Mind'
  }
</p>
```

**Cards de Sistema (linhas 85-149)** - Simplificar e uniformizar:
```tsx
{GAME_SYSTEMS.map((system) => {
  const description = system.description[language as 'pt-BR' | 'en'] || system.description['pt-BR'];
  
  return (
    <div
      key={system.id}
      className="relative flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-primary bg-card hover:border-primary/80 transition-all"
    >
      {/* Remover badge "Em breve" - não há mais sistemas indisponíveis */}
      
      <div className={`p-4 rounded-full ${
        system.color === 'primary'
          ? 'bg-primary/20 text-primary'
          : 'bg-destructive/20 text-destructive'
      }`}>
        {systemIcons[system.id]}
      </div>

      <div className="text-center">
        <h3 className="font-medieval text-xl font-semibold mb-1 text-foreground">
          {system.name}
        </h3>
        <p className="text-xs text-muted-foreground font-body">
          {system.shortName}
        </p>
      </div>

      <p className="text-sm text-muted-foreground font-body text-center">
        {description}
      </p>

      <div className="flex flex-wrap justify-center gap-1">
        {system.features.slice(0, 3).map((feature) => (
          <Badge key={feature} variant="outline" className="text-xs">
            {feature}
          </Badge>
        ))}
      </div>

      <Link to="/auth" className="w-full">
        <Button className="w-full font-medieval">
          {language === 'pt-BR' ? 'Jogar' : 'Play'}
        </Button>
      </Link>
    </div>
  );
})}
```

**Footer (linhas 222-238)** - Remover texto redundante:
```tsx
<footer className="py-8 px-4 border-t border-border bg-parchment">
  <div className="container mx-auto text-center">
    <img
      src={logoLarge}
      alt="Orc and Roll"
      className="w-12 h-12 mx-auto mb-4 object-contain"
    />
    {/* Remover <p> com "Orc & Roll" */}
    <p className="text-sm text-on-light-alt font-body">
      {language === 'pt-BR' 
        ? 'Teatro da Mente Online'
        : 'Online Theater of the Mind'
      }
    </p>
  </div>
</footer>
```

### Arquivo 3: Documentação do Sistema de Design

Criar ou atualizar a memória do projeto com as regras de design estabelecidas para referência futura.

---

## Arquivos Afetados

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/lib/gameSystems.ts` | Corrigir textos e habilitar Vampiro |
| `src/pages/Index.tsx` | Remover redundâncias, uniformizar cards |
| Memory do projeto | Documentar padrões de cor |

---

## Benefícios

1. **Legibilidade**: Contraste adequado em todos os contextos
2. **Consistência**: Regras claras para escolha de cores de texto
3. **Manutenibilidade**: Documentação de padrões facilita futuras alterações
4. **UX**: Cards uniformes e legíveis em qualquer sistema
5. **Branding**: Uso correto das logos sem redundância
