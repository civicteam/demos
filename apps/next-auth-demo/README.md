# Next Auth Demo

Auth.js (NextAuth v5) with custom JWT signing and Civic MCP integration. Uses OAuth 2.0 Token Exchange ([RFC 8693](https://datatracker.ietf.org/doc/html/rfc8693)) to exchange your app's JWTs for Civic access tokens, enabling AI chat with Civic MCP tools.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │     │   Your IdP      │     │   Civic Auth    │     │   Civic   │
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

5. Open [http://localhost:3020](http://localhost:3020) and log in with:
   - Email: `demo@example.com`
   - Password: `demo123`

## Implementation Details

### Using @civic/mcp-client

This demo uses `@civic/mcp-client` to connect to Civic MCP. The client handles token exchange (RFC 8693) and the MCP protocol automatically, providing tools that can be used with AI SDKs.

```typescript
import { CivicMcpClient } from "@civic/mcp-client";
import { vercelAIAdapter } from "@civic/mcp-client/adapters/vercel-ai";

// Create a client with built-in token exchange
const client = new CivicMcpClient({
  auth: {
    tokenExchange: {
      clientId: process.env.CIVIC_CLIENT_ID,
      clientSecret: process.env.CIVIC_CLIENT_SECRET,
      subjectToken: getSessionToken, // async function returning your JWT
    },
  },
  civicProfile: process.env.CIVIC_PROFILE_ID,
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

This app runs on port **3020**.
