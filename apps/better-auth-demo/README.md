# Better Auth Demo

A Next.js app demonstrating [Better Auth](https://www.better-auth.com/) with JWT + OIDC Provider plugins for token exchange with Civic Auth, connecting to Civic Nexus MCP for AI chat.

## How It Works

1. Users sign up / sign in with email + password via Better Auth
2. Better Auth's JWT plugin issues RS256-signed JWTs and exposes a JWKS endpoint at `/api/auth/jwks`
3. The app exchanges the Better Auth JWT for a Civic access token using OAuth 2.0 Token Exchange (RFC 8693)
4. Civic Auth verifies the JWT against the public key
5. The Civic access token is used to connect to Civic Nexus MCP for AI-powered tool calling

> **Note**: This demo runs over HTTPS locally (via Next.js `--experimental-https`) so that the issuer URL matches Civic Auth's HTTPS requirement.

## Prerequisites

- Node.js 18+
- A **Civic Auth app** (from [auth.civic.com](https://auth.civic.com))
- A Civic Nexus organization linked to your Civic Auth app
- An **Anthropic API key**

## Setup

### Step 1: Install, Create Database, and Start the App

```bash
pnpm install
npx @better-auth/cli migrate --config ./app/lib/auth/server.ts -y
pnpm dev:better-auth
```

The app starts at **https://localhost:3023** (accept the self-signed cert warning in your browser).

### Step 2: Export the Public Key

Better Auth generates its RS256 keys on first run. To get the public key for Civic Auth:

1. Visit `https://localhost:3023/api/keys/public` in your browser
2. Copy the entire PEM key (including the `-----BEGIN PUBLIC KEY-----` and `-----END PUBLIC KEY-----` lines)

### Step 3: Configure Token Exchange in Civic Auth

In your Civic Auth application settings:

1. Navigate to **Setup > Token Exchange > Add Provider**
2. Select **Custom** provider
3. Fill in the following values:

| Field | Value | Notes |
|-------|-------|-------|
| **Issuer URL** | `https://localhost:3023` | Must match `BETTER_AUTH_URL` |
| **Verification method** | Static public key | Civic Auth can't reach localhost JWKS, so use the PEM from Step 2 |
| **Public Key** | *(paste PEM from Step 2)* | The RS256 public key exported from Better Auth |
| **Audience** | `https://localhost:3023` | Better Auth defaults the `aud` claim to the app URL |

4. Click **Save provider**

> **Note**: Better Auth's JWT plugin manages key generation and rotation automatically. For production deployments with a public URL, you can use the JWKS URI (`https://your-domain.com/api/auth/jwks`) instead of a static key.

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in the values:

   ```
   BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
   BETTER_AUTH_URL=https://localhost:3023

   CIVIC_AUTH_URL=https://auth.civic.com/oauth
   CIVIC_CLIENT_ID=<your Civic Auth client ID>
   CIVIC_CLIENT_SECRET=<your Civic Auth client secret>

   MCP_SERVER_URL=https://nexus.civic.com/mcp
   ANTHROPIC_API_KEY=<your Anthropic API key>
   ```

### Step 5: Create an Account

1. Open **https://localhost:3023** (accept the self-signed cert warning)
2. Click **"Need an account? Sign up"**
3. Enter a name, email and password (e.g., `demo@example.com` / `demo123`)
4. Click **Sign Up**
5. You'll be redirected to the chat page

On subsequent visits, use **Sign In** with the same credentials.

## Port

This app runs on port **3023** over HTTPS.
