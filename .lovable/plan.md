
# Plano Revisado: Melhorias Mobile para Sala de Vampiro (Jogador)

## Hierarquia de Z-Index Corrigida

A ordem de empilhamento no projeto é:

```
z-40   FAB (teste pendente)
z-50   Modais, Drawers, Dialogs, Popovers
z-[100] Toasts (notificações)
```

Isso garante:
- FAB fica abaixo de modais (some quando um modal abre)
- Modais ficam abaixo de toasts (notificações sempre visíveis)
- Nenhum conflito visual entre camadas

---

## Mudancas Propostas

### 1. VampireSession.tsx - Navegacao e FAB Mobile

**FAB de Teste Pendente** (apenas mobile, bottom-left, z-40):
- Renderizado apenas quando `isMobile === true`
- Posicionado em `bottom-6 left-6` para nao competir com toasts (bottom-right)
- `z-40` para ficar abaixo de modais e toasts
- Pulsa para chamar atencao do jogador
- Auto-abre drawer quando teste pendente chega

**Tabs reorganizadas** (apenas mobile):
- 3 abas: Feed, Trackers, Info (Cena + Panel do jogador)
- Desktop continua com layout de 3 colunas inalterado

### 2. VampireTrackers.tsx - Alvos de Toque Maiores

Todas as mudancas usam breakpoint `md:` para afetar apenas mobile:

| Elemento | Mobile (< 768px) | Desktop (>= 768px) |
|----------|-------------------|---------------------|
| Blood Pool celulas | w-5 h-5 | w-3 h-3 (atual) |
| Willpower/Humanity botoes | w-6 h-6 | w-4 h-4 (atual) |
| Health levels | p-2.5 | p-1.5 (atual) |
| Gaps entre elementos | gap-2 | gap-1 (atual) |

### 3. VampirePendingTest.tsx - Dados e Botoes Maiores

| Elemento | Mobile | Desktop |
|----------|--------|---------|
| Dados (resultado) | w-12 h-12 | w-8 h-8 (atual) |
| Botao de rolagem | h-14 | h-10 (atual) |

### 4. Novo: MobilePendingTestDrawer.tsx

Componente wrapper que usa Drawer (slide-up) para exibir teste pendente no mobile. Impede fechamento acidental (sem fechar ao clicar fora).

### 5. translations.ts

Adicionar chaves i18n para novos textos mobile (titulo do drawer, labels das abas).

---

## Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `VampireSession.tsx` | FAB bottom-left z-40, drawer condicional, tabs mobile reorganizadas |
| `VampireTrackers.tsx` | Tamanhos responsivos `md:` breakpoint |
| `VampirePendingTest.tsx` | Tamanhos responsivos `md:` breakpoint |
| `MobilePendingTestDrawer.tsx` | Novo componente |
| `translations.ts` | Chaves i18n |

## Garantia de Nao-Impacto no Desktop

- FAB: renderizado apenas com `isMobile`
- Tabs: condicional `isMobile`
- Tamanhos: mobile-first com `md:` override para valores desktop originais
- Drawer: apenas mobile; desktop usa fluxo atual
