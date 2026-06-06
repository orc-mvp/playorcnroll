# Assinatura Premium R$4,90/mês + Superadmin + Paywall de Personagens

## 1. Stripe (sua conta — BYOK)

Integração via `enable_stripe` (bring-your-own-key). Você vai precisar fornecer:

- `STRIPE_SECRET_KEY` (sk_live_… ou sk_test_…)
- `STRIPE_WEBHOOK_SECRET` (gerado quando você cadastrar o endpoint do webhook no dashboard Stripe)

Configuração no seu dashboard Stripe (você faz, eu te oriento):

- 1 Produto: "Apoiador - Orc & Roll"
- 1 Price recorrente: R$ 4,90 BRL por mês no cartão. R$ 49,90 BRL  por 1 ano no pix (2 meses grátis) ou R$ 26,46 BRL por 6 meses (10% de desconto).
- Habilitar PIX e Cartão como métodos de pagamento na conta
- Criar webhook endpoint apontando para a URL da edge function `stripe-webhook` (eu te passo a URL após o deploy)

**Cartão (recorrente automático):** assinatura Stripe — renova sozinho, cancela pelo Customer perfil do usuário.

**PIX (manual mensal):** Stripe não faz PIX recorrente no Brasil. Cada PIX é cobrança avulsa referente ao período que estende validade premium em **+6 meses ou +12 meses** a partir do `current_period_end` atual (ou de hoje, o que for maior). Usuário paga de novo antes de vencer; banner volta 1 dia após vencimento.

## 2. Banco de dados

### Roles (tabela separada — exigência de segurança)

```sql
create type app_role as enum ('superadmin', 'admin', 'user');

create table user_roles (
  id uuid pk, user_id uuid, role app_role,
  unique(user_id, role)
);
-- + grants, RLS, has_role() security definer
```

Seed: `jordao@jordaobevilaqua.com` recebe `superadmin` (lookup em `auth.users`; se ainda não tiver conta, `handle_new_user` atribui automaticamente quando o email se cadastrar).

`has_role()` substitui/generaliza o admin atual hardcoded (`8b192f50-…`).

### Subscriptions

```sql
create table subscriptions (
  user_id uuid pk,
  status text,                    -- active | past_due | canceled | none
  payment_method text,            -- card | pix
  stripe_customer_id text,
  stripe_subscription_id text,    -- só card
  current_period_end timestamptz, -- premium ativo enquanto > now()
  cancel_at_period_end boolean,
  ...
);
```

RLS: usuário lê só a própria; superadmin lê todas; escrita apenas via edge functions (service role).

Helper `is_premium(uid)` → `current_period_end > now()` OU `has_role(uid,'superadmin')` OU `has_role(uid,'admin')`.

## 3. Edge Functions

- `**create-checkout**` — body `{ method: 'card' | 'pix' }`. Cria/recupera Stripe Customer por email, retorna URL:
  - card → Checkout `mode: subscription`, price R$4,90/mês
  - pix → Checkout `mode: payment`, R$4,90, `payment_method_types: ['pix']`
- `**stripe-webhook**` (`verify_jwt = false`, valida signature com `STRIPE_WEBHOOK_SECRET`):
  - `customer.subscription.created/updated` → upsert (card)
  - `invoice.payment_succeeded` (card) → atualiza `current_period_end`
  - `invoice.payment_failed` / `subscription.deleted` → `past_due`/`canceled`
  - `checkout.session.completed` modo `payment` (PIX) → estende `current_period_end += 30 dias`
- `**customer-portal**` — abre portal Stripe (cancelar/atualizar cartão; só faz sentido para card).
- `**check-subscription**` — opcional; força refresh após retorno do checkout.

## 4. Frontend

### Hook `usePremium()`

Lê `subscriptions` + roles do usuário logado; retorna `{ isPremium, daysUntilExpiry, paymentMethod, status }`. Realtime na tabela.

### Banner global (`UpgradeBanner.tsx`)

Faixa fina logo abaixo da logo no header que pode ser fechada, mas sempre abre novamente a cada refresh de página, fundo dourado-rústico:

> "Faça upgrade para ter personagens ilimitados, retirar essa barra e contribuir com o desenvolvimento"

Botão "Fazer upgrade" → `/upgrade`. Some quando `isPremium`. Volta automaticamente 1 dia após vencimento.

### Página `/upgrade`

- Card R$4,90/mês.
- "Pagar com Cartão (recorrente)" e "Pagar com PIX (mensal)".
- PIX: texto explicando que é manual e precisa renovar antes de vencer.
- Se já premium: status, data de vencimento, "Gerenciar" (portal, só card) ou "Renovar com PIX".

### Paywall de personagens

- Se `count >= 3 && !isPremium` → bloqueia botão "Criar" e abre `UpgradeRequiredModal`:
  > "Fazer upgrade para liberar mais de 3 personagens e apoiar o Orc & Roll"
  > Botões: "Fazer upgrade" | "Gerenciar personagens"
- Usuários com > 3 personagens hoje **mantêm acesso a todos** — só não criam novos sem upgrade.
- Superadmin/admin: bypass.

## 5. i18n

Strings novas em pt-BR + en (banner, modal, página /upgrade, mensagens PIX/cartão).

## Arquivos afetados

**Novos**

- `supabase/migrations/<ts>_roles_and_subscriptions.sql`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/customer-portal/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `src/hooks/usePremium.ts`
- `src/components/UpgradeBanner.tsx`
- `src/components/UpgradeRequiredModal.tsx`
- `src/pages/Upgrade.tsx`

**Editados**

- `src/App.tsx` (rota /upgrade + banner global)
- header/layout principal (montar banner)
- `src/pages/MyCharacters.tsx` / `CreateCharacter.tsx` (paywall)
- `src/lib/i18n/translations.ts`
- `supabase/config.toml` (`stripe-webhook` com `verify_jwt = false`)

## Fora de escopo

- Painel admin de gestão de assinaturas (você pediu "só bypass").
- PIX automático recorrente (limitação Stripe BR).
- Email de aviso de vencimento.

## Ordem de execução

1. Migração (roles + subscriptions + has_role + is_premium + seed superadmin).
2. `enable_stripe` (BYOK) — você cola sua `STRIPE_SECRET_KEY`.
3. Deploy das 4 edge functions.
4. Eu te passo a URL do webhook; você cadastra no Stripe e me devolve o `STRIPE_WEBHOOK_SECRET`.
5. Frontend (hook, banner, página /upgrade, paywall).