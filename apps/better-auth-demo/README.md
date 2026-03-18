# Better Auth Demo

A Next.js app demonstrating [Better Auth](https://www.better-auth.com/) with JWT + OIDC Provider plugins for token exchange with Civic Auth, connecting to Civic Nexus MCP for AI chat.

## How It Works

1. Users sign up / sign in with email + password via Better Auth
2. Better Auth's JWT plugin issues RS256-signed JWTs and exposes a JWKS endpoint at `/api/auth/jwks`
3. The app exchanges the Better Auth JWT for a Civic access token using OAuth 2.0 Token Exchange (RFC 8693)
4. Civic Auth verifies the JWT against Better Auth's JWKS endpoint
5. The Civic access token is used to connect to Civic Nexus MCP for AI-powered tool calling

## Prerequisites

- Node.js 18+
- A **Civic Auth app** (from [auth.civic.com](https://auth.civic.com))
- A Civic Nexus organization linked to your Civic Auth app
- An **Anthropic API key**

## Setup

### Step 1: Configure Token Exchange in Civic Auth

In your Civic Auth application settings:

1. Navigate to **Setup > Token Exchange > Add Provider**
2. Select **Custom** provider
3. Fill in the following values:

| Field | Value | Notes |
|-------|-------|-------|
| **Issuer URL** | `http://localhost:3023` | Better Auth uses the app URL as the JWT `iss` claim |
| **Verification method** | JWKS URI | |
| **JWKS URI** | `http://localhost:3023/api/auth/jwks` | Exposed automatically by Better Auth's JWT plugin |
| **Audience** | `http://localhost:3023` | Better Auth defaults the `aud` claim to the app URL |

4. Click **Save provider**

> **Note**: Better Auth's JWT plugin manages RS256 key generation and rotation automatically. The JWKS endpoint publishes the public keys -- no manual key management needed. This is simpler than the federated-auth-demo which requires generating RSA keys manually.

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in the values:

   ```
   BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
   BETTER_AUTH_URL=http://localhost:3023

   CIVIC_AUTH_URL=https://auth.civic.com/oauth
   CIVIC_AUTH_CLIENT_ID=<your Civic Auth client ID>
   CIVIC_AUTH_CLIENT_SECRET=<your Civic Auth client secret>

   MCP_SERVER_URL=https://nexus.civic.com/mcp
   ANTHROPIC_API_KEY=<your Anthropic API key>
   ```

### Step 3: Create the Database

Better Auth requires a database (this demo uses SQLite). Generate the tables:

```bash
npx @better-auth/cli migrate
```

This creates an `auth.db` file in the app directory (already gitignored).

### Step 4: Install and Run

```bash
pnpm install
pnpm dev:better-auth
```

Open [http://localhost:3023](http://localhost:3023).

### Step 5: Create an Account

Unlike the federated-auth-demo which has hardcoded demo users, Better Auth uses a real database. On first run:

1. Click **"Need an account? Sign up"**
2. Enter a name, email and password (e.g., `demo@example.com` / `demo123`)
3. Click **Sign Up**
4. You'll be redirected to the chat page

On subsequent visits, use **Sign In** with the same credentials.

## Port

This app runs on port **3023**.
