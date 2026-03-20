# Civic Auth Demo

Direct Civic Auth integration with Civic MCP -- the simplest path to connecting an AI assistant to Civic tools.

## How it works

This app uses [`@civic/auth`](https://docs.civic.com/auth) as the identity provider. Unlike the federated auth demos ([next-auth-demo](../next-auth-demo), [google-auth-demo](../google-auth-demo), [better-auth-demo](../better-auth-demo)), **no token exchange is needed** -- Civic Auth tokens are directly valid for the Civic MCP endpoint.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │     │   Civic Auth    │     │   Civic         │
│   (@civic/auth) │     │                 │     │   (MCP Hub)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. User Login        │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │  2. Access Token      │                       │
         │<──────────────────────│                       │
         │     (directly valid)  │                       │
         │                       │                       │
         │  3. MCP Request with Civic Token              │
         │──────────────────────────────────────────────>│
         │                       │                       │
         │  4. MCP Tools Response                        │
         │<──────────────────────────────────────────────│
```

Compare this to the federated demos, which require an additional token exchange step and custom JWT infrastructure (RS256 keys, JWKS endpoint, issuer/audience config).

## Prerequisites

- A Civic account at [app.civic.com](https://app.civic.com) with Integration configured (see [Integration docs](https://docs.civic.com/civic/developers/integration/apps))
  - When configuring, choose **Civic Auth** as the auth provider (not third-party)
- An Anthropic API key

> **No token exchange configuration needed** — since Civic Auth is the identity provider, the tokens it issues are directly valid for the Civic MCP endpoint. No issuer, JWKS, or audience setup required.

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env` from the example:

   ```bash
   cp .env.example .env
   ```

3. Fill in your environment variables:

   - `CIVIC_CLIENT_ID` -- your Civic Auth client ID
   - `ANTHROPIC_API_KEY` -- your Anthropic API key

4. Run the dev server:

   ```bash
   pnpm dev
   ```

## Implementation Details

### Using @civic/mcp-client

Because Civic Auth tokens are directly valid, the MCP client setup is simpler than the federated demos -- just pass the token directly:

```typescript
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";
import { getTokens } from "@civic/auth/nextjs";

const tokens = await getTokens();

const client = new CivicMcpClient({
  auth: {
    token: tokens.accessToken,  // No token exchange needed
  },
});

const tools = await client.getTools(vercelAIAdapter());
```

Compare this to the federated demos, which require `auth.tokenExchange` with `clientId`, `clientSecret`, and `subjectToken`.

## Port

This app runs on port **3024**.
