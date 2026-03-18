# Federated Auth Demo

This demo application shows how to integrate a custom authentication system with Civic Nexus using OAuth 2.0 Token Exchange ([RFC 8693](https://datatracker.ietf.org/doc/html/rfc8693)). It allows you to use your own identity provider (IdP) while still accessing Civic MCP tools and services.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │     │   Your IdP      │     │   Civic Auth    │     │   Civic Nexus   │
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

### Step 1: Create a Civic Auth Application

1. Go to [auth.civic.com](https://auth.civic.com) and sign up or log in
2. Create a new application to get your **Client ID** and **Client Secret**
3. See the [Civic Auth documentation](https://docs.civic.com/auth) for detailed instructions

### Step 2: Configure Token Exchange in Civic Auth

In your Civic Auth application settings, configure the Token Exchange feature:

1. Navigate to **Setup > Token Exchange > Add Provider**
2. Select **Custom** provider and configure:

| Field | Value | Notes |
|-------|-------|-------|
| **Issuer URL** | `https://localhost:3000` | Must match the `ISSUER` constant in `app/lib/auth/jwt.ts` |
| **Audience** | `civic-mcp` | Must match the `AUDIENCE` constant in `app/lib/auth/jwt.ts` |
| **Algorithm** | `RS256` | |
| **JWKS URL** | `http://localhost:3023/api/keys/.well-known/jwks.json` | Exposed by the app (see `app/api/keys/.well-known/jwks.json/route.ts`) |

Alternatively, instead of the JWKS URL, you can paste your **public key PEM** directly (the value of `JWT_PUBLIC_KEY` from your `.env`).

> **Note**: The issuer and audience values are hardcoded in `app/lib/auth/jwt.ts`. If you change them, you must also update the Civic Auth token exchange configuration to match.

### Step 3: Create a Civic Nexus Organization

1. Go to [nexus.civic.com](https://nexus.civic.com) and log in
2. Create a new organization dedicated to your application
3. Note the **Account ID** of your new organization (you'll need this for the next step)

### Step 4: Link Your Civic Auth Account to Nexus

Contact a Civic representative with:
- Your **Civic Auth Client ID**
- Your **Nexus Organization Account ID**

They will link your Civic Auth application to your Nexus organization and configure the necessary internal settings.

### Step 5: Run the Demo

1. Clone this repository and install dependencies:

```bash
pnpm install
```

2. Generate RSA keys for JWT signing:

```bash
pnpm tsx scripts/generate-keys.ts
```

3. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

4. Start the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) and log in with:
   - Email: `demo@example.com`
   - Password: `demo123`

## Implementation Details

### Token Exchange

The token exchange follows [RFC 8693](https://datatracker.ietf.org/doc/html/rfc8693) to swap your app's JWT for a Civic access token. See `app/lib/token-exchange.ts`:

```typescript
import { exchangeTokenForCivic } from "@/lib/token-exchange";

// Exchange your app's JWT for a Civic access token
const civicToken = await exchangeTokenForCivic(sessionToken);
// Returns: { accessToken, tokenType, expiresIn, expiresAt }
```

The exchange makes a POST request to Civic Auth's `/token` endpoint:

```
POST https://auth.civic.com/oauth/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(clientId:clientSecret)>

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=<your-jwt>
&scope=openid profile email
```

### Using @civic/nexus-client

This demo uses `@civic/nexus-client` to connect to Civic Nexus MCP. The client handles the MCP protocol and provides tools that can be used with AI SDKs.

```typescript
import { NexusClient } from "@civic/nexus-client";
import { vercelAIAdapter } from "@civic/nexus-client/adapters/vercel-ai";

// Create a Nexus client with the exchanged Civic token
const client = new NexusClient({
  url: process.env.MCP_SERVER_URL,
  auth: {
    token: civicToken.accessToken,
  },
  headers: {
    "x-civic-profile": "default",  // Required for federated auth
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

The `x-civic-profile` header is required for federated authentication to lock users to a specific profile within your Nexus organization.

### Client Caching

The demo caches `NexusClient` instances per user to avoid repeated token exchanges. Clients are automatically refreshed when the Civic token expires and cleaned up after 60 minutes of inactivity. See `app/lib/ai/mcp.ts` for the full implementation.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | URL where your app runs |
| `NEXTAUTH_SECRET` | Secret for encrypting cookies (generate with `openssl rand -base64 32`) |
| `JWT_PUBLIC_KEY` | RSA public key for JWT verification |
| `JWT_PRIVATE_KEY` | RSA private key for JWT signing |
| `CIVIC_AUTH_URL` | Civic Auth endpoint (default: `https://auth.civic.com/oauth`) |
| `CIVIC_AUTH_CLIENT_ID` | Your Civic Auth client ID |
| `CIVIC_AUTH_CLIENT_SECRET` | Your Civic Auth client secret |
| `MCP_SERVER_URL` | Civic Nexus MCP endpoint (default: `https://nexus.civic.com/mcp`) |
| `ANTHROPIC_API_KEY` | API key for Anthropic (Claude) |
| `OPENAI_API_KEY` | API key for OpenAI (alternative LLM) |

## JWT Requirements

Your JWT must include these claims:

| Claim | Required | Description |
|-------|----------|-------------|
| `iss` | Yes | Issuer URL (must match Civic Auth config) |
| `aud` | Yes | Audience (must be `civic-mcp`) |
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
| `app/lib/token-exchange.ts` | Civic token exchange service |
| `app/lib/ai/mcp.ts` | MCP client setup |
| `app/api/keys/.well-known/jwks.json/route.ts` | JWKS endpoint |
| `app/api/keys/public/route.ts` | PEM public key endpoint |
| `scripts/generate-keys.ts` | RSA key pair generator |

## Troubleshooting

### Token Exchange Fails with `invalid_grant`

- Verify your issuer URL matches exactly what's configured in Civic Auth
- Check that your JWKS endpoint is publicly accessible
- Ensure the JWT is signed with the correct private key
- Verify the `aud` claim is set to `civic-mcp`

### MCP Connection Fails with 401

- Ensure your Nexus organization is linked to your Civic Auth client
- Check that your organization has the required MCP servers installed
- Verify the access token is being passed correctly
