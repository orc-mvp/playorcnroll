## Diagnóstico

Conferi no banco e no Stripe:

- Stripe: existe **1 cliente** com email `robmmcosta@gmail.com` → `cus_UkKAbRROYQV810`.
- Banco: existe **1 linha** em `public.subscriptions`, vinculada a esse mesmo `stripe_customer_id`, com `status=active` e `current_period_end = 2026-07-21` (futuro).
- O `user_id` dessa assinatura é `b86bb6b2-…` cujo `profiles.display_name` é **"Robson "** (com espaço no final).

A lógica de premium (`usePremium`) considera premium quando `current_period_end > now()`, então **para esse `user_id` ele já deveria estar liberando personagens ilimitados**. Como ele relata que não libera, a causa mais provável é uma das duas:

1. **Ele está logado em outra conta** (segundo cadastro com email diferente, ex.: login Google vs email/senha). Esse outro `user_id` não tem linha em `subscriptions`, então cai no limite de 3.
2. **Cache/estado obsoleto no client** — `usePremium` só refaz fetch em mudança de usuário ou via Realtime do canal de `subscriptions`. Se a linha foi criada antes do canal subir, e ele nunca recarregou, o estado fica `isPremium=false`.

## O que proponho fazer

### 1. Confirmar a conta com o usuário

Antes de qualquer alteração, perguntar a ele com qual email/método de login ele entra no app hoje (Google? email/senha?) e o nome que aparece no menu do canto superior direito. Se for diferente de "Robson", existe conta duplicada — nesse caso a correção é mover a assinatura para o `user_id` correto (`UPDATE subscriptions SET user_id = <novo> WHERE stripe_customer_id = 'cus_UkKAbRROYQV810'`). Faço isso por migration de dados quando ele responder.

- confirmei com o cliente e ele está usando esse email com login e senha normais (que é a unica opção de login hoje)

### 2. Tornar o sistema resiliente (independente do caso dele)

**Adicionar uma edge function `sync-subscription**` que:

- Recebe o JWT do usuário logado, descobre o email.
- Consulta o Stripe (`customers.list` por email → `subscriptions.list` por customer).
- Faz `upsert` em `public.subscriptions` com o `user_id` do JWT, `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`, `cancel_at_period_end`.
- Retorna `{ subscribed, current_period_end }`.

**Plugar essa função em dois lugares:**

- `usePremium.tsx`: chamar `sync-subscription` uma vez ao montar (quando há `user`) antes do `fetchAll`, e expor um `refresh()` que também chama. Isso garante que qualquer divergência com o Stripe se autocorrige no próximo login/refresh.
- `Upgrade.tsx`: botão "Atualizar status da assinatura" que invoca a função e dá um toast com o resultado — caminho manual para o usuário se desbloquear sem suporte.

Esse padrão é o recomendado pela skill `stripe-implementation-subscriptions` (função `check-subscription`) e elimina a dependência exclusiva do webhook, que pode falhar silenciosamente.

### 3. Não mudar gating

Mantenho `canCreate = isPremium || characters.length < 3` em `MyCharacters` e `CreateCharacter` — eles já reagem corretamente quando `isPremium` vira `true`.

## Detalhes técnicos

- Nova função: `supabase/functions/sync-subscription/index.ts`, `verify_jwt = false` (valida JWT em código via `supabase.auth.getUser(token)`), CORS padrão, usa `SUPABASE_SERVICE_ROLE_KEY` para o upsert e `STRIPE_SECRET_KEY` já existente.
- `usePremium`: adicionar `await supabase.functions.invoke('sync-subscription')` antes do `fetchAll` no `useEffect` inicial e dentro do `refresh()`. Ignorar erro silenciosamente (não bloqueia UI).
- `Upgrade.tsx`: botão chamando `refresh()` do `usePremium`.
- Nenhuma migration de schema. Só uma migration de dados pontual se o caso dele for "conta duplicada" — feita após confirmação.

## Pergunta antes de implementar

Antes de eu mexer no código, você consegue confirmar com o Robson: **qual email ele usa para entrar no app** e **se o nome que aparece no topo é "Robson"**? Se for outro email/nome, é conta duplicada e eu corrijo o vínculo direto no banco junto com a implementação acima.  
  
confirmado, ele usa o email [robmmcosta@gmail.com](mailto:robmmcosta@gmail.com)