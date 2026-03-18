# Better Auth Demo

A Next.js app demonstrating [Better Auth](https://www.better-auth.com/) with JWT + OIDC Provider plugins for token exchange with Civic Auth, connecting to Civic Nexus MCP for AI chat.

## How It Works

1. Users sign up / sign in with email + password via Better Auth
2. Better Auth's JWT plugin exposes a JWKS endpoint at `/api/auth/jwks`
3. The app exchanges the Better Auth JWT for a Civic access token using OAuth 2.0 Token Exchange (RFC 8693)
4. The Civic access token is used to connect to Civic Nexus MCP for AI-powered tool calling

## Prerequisites

- Node.js 18+
- A Civic Auth app (from [auth.civic.com](https://auth.civic.com)) with token exchange configured (see below)
- A Civic Nexus organization linked to your Civic Auth app
- An Anthropic API key

### Configure Token Exchange in Civic Auth

In your Civic Auth application settings:

1. Navigate to **Setup > Token Exchange > Add Provider**
2. Select **Custom** provider and configure:

| Field | Value | Notes |
|-------|-------|-------|
| **Issuer URL** | `http://localhost:3023` | Matches `BETTER_AUTH_URL` — Better Auth uses the app URL as the JWT `iss` claim |
| **Audience** | `http://localhost:3023` | Better Auth defaults the `aud` claim to the app URL |
| **Algorithm** | `RS256` | |
| **JWKS URL** | `http://localhost:3023/api/auth/jwks` | Exposed automatically by Better Auth's JWT plugin |

> **Note**: Better Auth's JWT plugin manages key generation and rotation automatically. The JWKS endpoint publishes the public keys — no manual key management needed.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   - `BETTER_AUTH_SECRET` - A random 32+ character secret for Better Auth
   - `BETTER_AUTH_URL` - `http://localhost:3023`
   - `CIVIC_AUTH_CLIENT_ID` - Your Civic Auth client ID
   - `CIVIC_AUTH_CLIENT_SECRET` - Your Civic Auth client secret
   - `MCP_SERVER_URL` - Civic Nexus MCP server URL
   - `ANTHROPIC_API_KEY` - Your Anthropic API key

3. Generate the database tables:

   ```bash
   npx @better-auth/cli generate
   npx @better-auth/cli migrate
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3023](http://localhost:3023) and sign up with the default credentials (`demo@example.com` / `demo123`), or create your own account.

## Port

This app runs on port **3023**.
