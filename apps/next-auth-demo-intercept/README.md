# Next Auth Demo (Intercept)

Like the Next Auth Demo but with transparent OAuth2 auth interception for tools. Uses Auth.js (NextAuth v5) with custom JWT signing and Civic MCP integration, adding `civic:rest-auth` capability to automatically handle OAuth2 authorization flows when tools require user consent.

## How It Works

The base authentication and token exchange flow is identical to the Next Auth Demo:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │     │   Your IdP      │     │   Civic Auth    │     │   Civic         │
│   (Auth.js)     │     │   (JWT Issuer)  │     │   (Exchange)    │     │   (MCP Hub)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │                       │
         │  1. User Login        │                       │                       │
         │──────────────────────>│                       │                       │
         │                       │                       │                       │
         │  2. Issue JWT         │                       │                       │
         │<──────────────────────│                       │                       │
         │     (RS256 signed)    │                       │                       │
         │                       │                       │                       │
         │  3. Token Exchange Request                    │                       │
         │──────────────────────────────────────────────>│                       │
         │     (your JWT as subject_token)               │                       │
         │                       │                       │                       │
         │  4. Civic Access Token                        │                       │
         │<──────────────────────────────────────────────│                       │
         │                       │                       │                       │
         │  5. MCP Request with Civic Token                                      │
         │──────────────────────────────────────────────────────────────────────>│
         │                       │                       │                       │
         │  6. MCP Tools Response                                                │
         │<──────────────────────────────────────────────────────────────────────│
```

## Auth Interception (`civic:rest-auth`)

Some MCP tools connect to third-party services that require their own OAuth2 authorization (e.g. connecting a user's Google Drive or GitHub account). Normally the LLM would receive a raw auth URL and have to ask the user to visit it. This demo intercepts that flow transparently.

### How it works

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐
│  LLM     │     │  Server  │     │  MCP Hub │     │  3rd-Party   │
│          │     │ (wrapper) │     │          │     │  OAuth       │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └──────┬───────┘
     │                │                │                   │
     │  call tool     │                │                   │
     │───────────────>│                │                   │
     │                │  call tool     │                   │
     │                │───────────────>│                   │
     │                │                │                   │
     │                │  auth required │                   │
     │                │  (pollingEndpoint, continueJobId)  │
     │                │<───────────────│                   │
     │                │                │                   │
     │                │  GET pollingEndpoint → authUrl     │
     │                │───────────────────────────────────>│
     │                │                │                   │
     │                │  store pending auth for client     │
     │                │──┐                                 │
     │                │<─┘                                 │
     │                │                │                   │
     │                │  poll HEAD (2s intervals, 15s max) │
     │                │───────────────────────────────────>│
     │                │                202 (pending)       │
     │                │<──────────────────────────────────│
     │                │                │                   │
     │    Meanwhile: client polls /api/civic-auth/pending  │
     │    and opens auth popup for user                    │
     │                │                │                   │
     │                │  poll HEAD     │                   │
     │                │───────────────────────────────────>│
     │                │                200 (approved!)     │
     │                │<──────────────────────────────────│
     │                │                │                   │
     │                │  continue_job  │                   │
     │                │───────────────>│                   │
     │                │  final result  │                   │
     │                │<───────────────│                   │
     │                │                │                   │
     │  tool result   │                │                   │
     │  (transparent) │                │                   │
     │<───────────────│                │                   │
```

1. The client advertises `civic:rest-auth` capability when connecting to MCP Hub
2. When a tool requires third-party OAuth, the Hub returns `auth_polling_endpoint` and `continue_job_id` instead of a result
3. The server-side wrapper (`wrapToolsWithCivicAuth`) intercepts this response before the LLM sees it
4. It fetches the auth URL, stores it as pending, and polls for user approval (up to 15s)
5. The client polls `/api/civic-auth/pending` and opens a popup for the user to authorize
6. Once approved, the wrapper calls `continue_job` to resume the operation
7. The final result is returned to the LLM transparently — it never sees the auth flow

If the user doesn't authorize within 15 seconds, the wrapper falls back to returning the auth URL to the LLM so it can ask the user directly.

### Key files

| File | Purpose |
|------|---------|
| `app/lib/ai/civic-rest-auth.ts` | Auth interception logic — detects auth responses, polls, calls `continue_job` |
| `app/lib/ai/mcp.ts` | MCP client with `civic:rest-auth` capability enabled |
| `app/api/civic-auth/pending/route.ts` | Client-facing endpoint to check for pending auth popups |
| `app/api/chat/route.ts` | Chat route that wraps tools with `wrapToolsWithCivicAuth` |

## Setup Guide

### Step 1: Configure Integration in Civic

1. Go to [app.civic.com](https://app.civic.com) and sign up or log in
2. Navigate to **Settings > Integration** to set up your app connection
3. Follow the guided setup (see [Integration docs](https://docs.civic.com/civic/developers/integration/apps)):
   - **Connect authentication** — create a new auth connection or link an existing Civic Auth app
   - **Configure auth provider** — select **Third-party provider > Custom** and configure:
     - **Issuer URL** — must match the `ISSUER` env var (used in `app/lib/auth/jwt.ts`)
     - **JWKS URL** or **Public Key** — either your app's JWKS endpoint or paste the PEM directly
     - **Audience** — must match the `AUDIENCE` env var
   - **Configure access** — enable public access so new users can join automatically
4. Copy your **CIVIC_CLIENT_ID** and **CIVIC_CLIENT_SECRET** from the Integration page

### Step 2: Run the Demo

1. Clone this repository and install dependencies:

```bash
pnpm install
```

2. Generate RSA keys for JWT signing:

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
openssl pkey -in private.pem -pubout -out public.pem
```

3. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

4. Start the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3021](http://localhost:3021) and log in with:
   - Email: `demo@example.com`
   - Password: `demo123`

## Implementation Details

### Using @civic/mcp-client

This demo uses `@civic/mcp-client` to connect to Civic MCP. The client handles token exchange (RFC 8693) and the MCP protocol automatically, providing tools that can be used with AI SDKs.

```typescript
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";

// Create a client with built-in token exchange and auth interception
const client = new CivicMcpClient({
  auth: {
    tokenExchange: {
      clientId: process.env.CIVIC_CLIENT_ID,
      clientSecret: process.env.CIVIC_CLIENT_SECRET,
      subjectToken: getSessionToken, // async function returning your JWT
    },
  },
  civicProfile: process.env.CIVIC_PROFILE_ID,
  capabilities: {
    experimental: {
      "civic:rest-auth": { version: "1.0" },
    },
  },
});

// Get tools adapted for Vercel AI SDK
const tools = await client.getTools(vercelAIAdapter());

// Use with your AI model
const result = await generateText({
  model: yourModel,
  tools,
  prompt: "...",
});

// Clean up when done
await client.close();
```

### Client Caching

The demo caches `CivicMcpClient` instances per user to avoid repeated connections. Clients are automatically cleaned up after 60 minutes of inactivity. See `app/lib/ai/mcp.ts` for the full implementation.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | URL where your app runs |
| `NEXTAUTH_SECRET` | Secret for encrypting cookies (generate with `openssl rand -base64 32`) |
| `JWT_PUBLIC_KEY` | RSA public key for JWT verification |
| `JWT_PRIVATE_KEY` | RSA private key for JWT signing |
| `CIVIC_CLIENT_ID` | Your Civic client ID (from **Settings > Integration** at [app.civic.com](https://app.civic.com)) |
| `CIVIC_CLIENT_SECRET` | Your Civic client secret |
| `ANTHROPIC_API_KEY` | API key for Anthropic (Claude) |

## JWT Requirements

Your JWT must include these claims:

| Claim | Required | Description |
|-------|----------|-------------|
| `iss` | Yes | Issuer URL (must match Civic Auth config) |
| `aud` | Yes | Audience (must match Civic Integration config) |
| `sub` | Yes | Subject (user ID) |
| `iat` | Yes | Issued at timestamp |
| `exp` | Yes | Expiration timestamp |
| `email` | No | User's email address |
| `name` | No | User's display name |

## Project Structure

| File | Purpose |
|------|---------|
| `auth.ts` | Auth.js configuration with custom JWT signing |
| `app/lib/auth/jwt.ts` | JWT encode/decode with RS256 |
| `app/lib/auth/keys.ts` | RSA key management |
| `app/lib/ai/mcp.ts` | MCP client setup with built-in token exchange |
| `app/api/keys/.well-known/jwks.json/route.ts` | JWKS endpoint |
| `app/api/keys/public/route.ts` | PEM public key endpoint |

## Troubleshooting

### Token Exchange Fails with `invalid_grant`

- Verify your issuer URL matches exactly what's configured in your Civic Integration settings at [app.civic.com](https://app.civic.com)
- Check that your JWKS endpoint is publicly accessible (or use a static public key)
- Ensure the JWT is signed with the correct private key
- Verify the `aud` claim matches what's configured in your auth provider settings

### MCP Connection Fails with 401

- Check your Integration setup at [app.civic.com](https://app.civic.com) → **Settings > Integration**
- Ensure public access is enabled or the user has been invited
- Verify the access token is being passed correctly

## Port

This app runs on port **3021**.
