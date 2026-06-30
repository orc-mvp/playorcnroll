## Problema

Em `play.orcnroll.com/`, ao dar refresh logado, a landing (`Index.tsx`) renderiza por completo (logo, hero, sistemas, features, footer) e só depois o `useEffect` chama `navigate('/dashboard')`. Isso causa o "piscar" — a raiz não é tratada como rota protegida, é tratada como landing pública com redirect tardio.

## Solução

Tornar `/` ciente do estado de auth antes de pintar conteúdo:

1. Em `src/pages/Index.tsx`:
   - Enquanto `loading === true`, renderizar apenas um loader minimalista (mesmo padrão do Dashboard: `bg-background` + texto pulsante), sem montar a landing.
   - Quando `user` existir, retornar `<Navigate to="/dashboard" replace />` em vez de depender de `useEffect` + render da landing.
   - Só renderizar a landing real quando `!loading && !user`.
   - Remover o `useEffect` de redirect (substituído pelo `<Navigate>` declarativo, que roda antes do paint).

Nenhuma outra rota é afetada — `/dashboard`, `/characters`, etc. já têm seus próprios guards. O alvo é só eliminar o flash na raiz.

## Fora do escopo

- Não mexer em `useAuth` nem na hidratação da sessão Supabase.
- Não criar componente `ProtectedRoute` global (mudança maior, sem ganho imediato para o bug relatado).
- Sem i18n novo (loader usa string já existente `t.common.loading`).