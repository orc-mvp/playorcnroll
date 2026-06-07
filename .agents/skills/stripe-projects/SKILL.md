---
name: stripe-projects
description: Build AI agents and apps that call the Stripe API using Stripe's official AI toolkits (agent-toolkit, ai-sdk, token-meter) and the Stripe MCP server. Use when the user wants to give an LLM/agent the ability to create customers, products, prices, payment links, invoices, or subscriptions through Stripe, or to meter token usage for billing. Sourced from github.com/stripe/ai.
---

# Stripe for AI Projects

One-stop reference for adding Stripe to AI agents / LLM apps. Three layers — pick the one that matches the use case:

| Layer | Package | When to use |
| --- | --- | --- |
| Function-calling tools for agent frameworks (OpenAI Agents SDK, LangChain, CrewAI, Vercel AI SDK) | `@stripe/agent-toolkit` (TS) / `stripe-agent-toolkit` (Py) | Give an LLM the ability to call Stripe API methods as tools |
| Billing helpers for Vercel `ai` / `@ai-sdk` | `@stripe/ai-sdk` | Charge / meter usage inside a Vercel AI SDK app |
| Token-based billing for raw OpenAI / Anthropic / Gemini SDKs | `@stripe/token-meter` | Meter LLM token usage and bill via Stripe without a framework |
| Drop-in tools via MCP | Stripe MCP (`https://mcp.stripe.com` remote, or `npx -y @stripe/mcp` local) | Any MCP-capable client (Claude Desktop, Cursor, IDE agents) |

## Key rules

1. **Always use a Restricted API Key (`rk_…`)**, never a full `sk_…`, when handing keys to an LLM/agent. Tool availability is scoped by the RAK permissions — create one at https://dashboard.stripe.com/apikeys.
2. **`await toolkit.close()`** when done — both Python and TS toolkits hold resources.
3. **Connected accounts:** pass `configuration.context.account: "acct_…"` to act on behalf of a connected account.
4. **Pinned API version:** the Lovable codebase pins `apiVersion: "2024-06-20"` in edge functions; do not change unless asked.
5. **Lovable Cloud projects already have `STRIPE_SECRET_KEY` available as a secret in edge functions** — no need to add it again. Add `STRIPE_RESTRICTED_KEY` only if the user wants to expose Stripe tools to an agent.

## Quick start — TypeScript (Vercel AI SDK / LangChain)

```bash
npm install @stripe/agent-toolkit
```

```ts
import { createStripeAgentToolkit } from "@stripe/agent-toolkit/langchain";
// or "@stripe/agent-toolkit/ai-sdk"

const toolkit = await createStripeAgentToolkit({
  secretKey: process.env.STRIPE_RESTRICTED_KEY!,
  configuration: { /* context: { account: "acct_…" } */ },
});

const tools = toolkit.getTools();
// pass `tools` to your agent / LLM call
await toolkit.close();
```

## Quick start — Python (OpenAI Agents SDK / LangChain / CrewAI)

```bash
pip install stripe-agent-toolkit   # Python 3.11+
```

```py
from stripe_agent_toolkit.openai.toolkit import create_stripe_agent_toolkit
from agents import Agent

toolkit = await create_stripe_agent_toolkit(secret_key="rk_test_…")
agent = Agent(
    name="Stripe Agent",
    instructions="You are an expert at integrating with Stripe",
    tools=toolkit.get_tools(),
)
# … run agent …
await toolkit.close()
```

## Stripe MCP

Remote (OAuth, recommended for desktop clients):
```
https://mcp.stripe.com
```

Local (good for sandboxed agents / CI):
```sh
npx -y @stripe/mcp --api-key=rk_test_…
```

Docs: https://docs.stripe.com/mcp

## When NOT to use this skill

- Plain server-side checkout / webhook flows for a regular web app — use the standard Stripe SDK directly (see this project's `supabase/functions/create-checkout` and `stripe-webhook` for a reference implementation). The agent toolkit is overkill there.
- Per-request payment processing inside an edge function where the LLM is not the caller.

## References

- Repo: https://github.com/stripe/agent-toolkit (aka `stripe/ai`)
- Supported API methods: https://docs.stripe.com/mcp
- Restricted keys: https://docs.stripe.com/keys#create-restricted-api-keys
- Connect: https://docs.stripe.com/connect/authentication
