

# Plano: Papel Contextual por Sessao (Remover Role Fixo)

## Resumo

Remover o conceito de "narrador" ou "jogador" como tipo fixo de usuario. Qualquer usuario pode criar sessoes (tornando-se narrador daquela sessao) ou entrar em sessoes (como jogador). O papel e determinado pelo contexto da sessao.

Como o sistema nao esta em uso, dados existentes podem ser descartados sem preocupacao.

## Mudancas

### 1. Banco de Dados

- Remover a coluna `role` da tabela `profiles`
- Remover a funcao `is_narrator(uuid)` (nao e usada em nenhuma politica RLS)
- Remover a funcao `get_user_role(uuid)` (idem)
- Atualizar o trigger `handle_new_user()` para nao inserir `role`

### 2. Tela de Cadastro (Auth.tsx)

- Remover a selecao de papel (narrador/jogador) no signup
- Formulario fica: nome de exibicao, email, senha, confirmar senha
- Remover validacao de `role` no formulario

### 3. Hook useAuth

- Remover `role` do tipo `Profile`
- Remover parametro `role` da funcao `signUp()`
- Nao enviar `role` no metadata do Supabase Auth

### 4. Dashboard Unificado (Dashboard.tsx)

- Todos os usuarios veem os mesmos cards:
  - Criar Sessao
  - Minhas Sessoes
  - Entrar em Sessao
  - Personagens (abre modal com opcoes criar/ver)
  - Gerenciar Marcas
- Remover badge "Narrador"/"Jogador" do header
- Remover logica `isNarrator` que bifurca a UI
- Atualizar mensagem de boas-vindas para ser generica

### 5. Minhas Sessoes (MySessions.tsx)

- Buscar em paralelo: sessoes onde o usuario e `narrator_id` E sessoes onde e participante
- Combinar e ordenar por `updated_at`
- Exibir badge contextual em cada sessao ("Narrador" ou "Jogador")
- Mostrar invite code e botao excluir apenas nas sessoes onde e narrador
- Botao "Criar Sessao" visivel para todos

### 6. Atividade Recente (RecentActivity.tsx)

- Remover parametro `isNarrator`
- Buscar ambos: sessoes criadas pelo usuario + sessoes onde participa + personagens + rolagens
- Unificar tudo em uma unica lista ordenada

### 7. Custom Marks (CustomMarks.tsx)

- Remover guard que redireciona se nao for narrador
- Qualquer usuario autenticado pode criar/gerenciar marcas

### 8. Criar Sessao (CreateSession.tsx)

- Remover guard `profile?.role !== 'narrator'`
- Qualquer usuario autenticado pode criar sessao

### 9. Traducoes (i18n)

- Remover chaves: `auth.selectRole`, `auth.narrator`, `auth.player`, `auth.narratorDesc`, `auth.playerDesc`, `auth.roleRequired`
- Manter `roles.narrator` e `roles.player` (usados como badges contextuais nas sessoes)
- Atualizar `dashboard.welcomeNarrator`/`welcomePlayer` para mensagem unica
- Adicionar novas chaves para badges contextuais

## Secao Tecnica

### Migracao SQL

```text
-- Remover funcoes nao utilizadas em RLS
DROP FUNCTION IF EXISTS public.is_narrator(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Remover coluna role de profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Atualizar trigger para nao inserir role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_language TEXT;
  v_display_name TEXT;
BEGIN
  v_language := COALESCE(NEW.raw_user_meta_data->>'language', 'pt-BR');
  IF v_language NOT IN ('pt-BR', 'en') THEN
    v_language := 'pt-BR';
  END IF;
  v_display_name := LEFT(NEW.raw_user_meta_data->>'display_name', 100);

  INSERT INTO public.profiles (user_id, display_name, language)
  VALUES (NEW.id, v_display_name, v_language);
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
END;
$$;
```

### Impacto em RLS

Nenhuma politica RLS usa `is_narrator()` ou `get_user_role()`. Todas usam `is_session_narrator()` e `sessions.narrator_id`, que permanecem intactos. Nenhuma alteracao em RLS e necessaria.

### Arquivos Modificados

| Arquivo | Tipo de Mudanca |
|---|---|
| Migracao SQL | Drop column, drop functions, update trigger |
| `src/hooks/useAuth.tsx` | Remover `role` do tipo e do `signUp()` |
| `src/pages/Auth.tsx` | Remover selecao de papel |
| `src/pages/Dashboard.tsx` | Dashboard unificado |
| `src/pages/MySessions.tsx` | Query unificada com badges contextuais |
| `src/pages/CreateSession.tsx` | Remover guard de role |
| `src/pages/CustomMarks.tsx` | Remover guard de role |
| `src/components/dashboard/RecentActivity.tsx` | Remover parametro `isNarrator`, query unificada |
| `src/lib/i18n/translations.ts` | Atualizar/remover chaves de role |

