# Better Auth Demo

A Next.js app demonstrating [Better Auth](https://www.better-auth.com/) with JWT + OIDC Provider plugins for token exchange with Civic, connecting to Civic MCP for AI chat.

## How It Works

1. Users sign up / sign in with email + password via Better Auth
2. Better Auth's JWT plugin issues RS256-signed JWTs and exposes a JWKS endpoint at `/api/auth/jwks`
3. `@civic/mcp-client` exchanges the Better Auth JWT for a Civic access token via built-in token exchange (RFC 8693)
4. The Civic access token is used to connect to Civic MCP for AI-powered tool calling

> **Note**: This demo runs over HTTPS locally (via Next.js `--experimental-https`) so that the issuer URL matches Civic's HTTPS requirement. Better Auth uses a local SQLite database to store users, sessions, and JWKS keys.

## Prerequisites

- Node.js 18+
- A **Civic account** at [app.civic.com](https://app.civic.com) with Integration configured (see [Integration docs](https://docs.civic.com/civic/developers/integration/apps))
- An **Anthropic API key**

## Setup

### Step 1: Install and Configure Environment

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

3. Fill in your values:

   ```
   BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
   BETTER_AUTH_URL=https://localhost:3023

   CIVIC_CLIENT_ID=<from Settings > Integration at app.civic.com>
   CIVIC_CLIENT_SECRET=<from Settings > Integration at app.civic.com>

   ANTHROPIC_API_KEY=<your Anthropic API key>
   ```

### Step 2: Create Database, Seed, and Start the App

Better Auth stores users and sessions in a local SQLite database. Run the migration to create tables, seed the demo user, then start the app:

```bash
npx @better-auth/cli migrate --config ./app/lib/auth/server.ts -y
npx tsx scripts/seed.ts
pnpm dev
```

The app starts at **https://localhost:3023** (accept the self-signed cert warning in your browser).

### Step 3: Export the Public Key

Better Auth generates its RS256 signing keys automatically on first run (stored in the SQLite database). To configure Civic's token exchange, you need to export the public key:

1. Make sure the app is running (`pnpm dev`)
2. Open `https://localhost:3023/api/keys/public` in your browser (accept the self-signed cert warning)
3. Copy the entire PEM key — it looks like:
   ```
   -----BEGIN PUBLIC KEY-----
   MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
   -----END PUBLIC KEY-----
   ```

### Step 4: Configure Integration in Civic

1. Go to [app.civic.com](https://app.civic.com) → **Settings > Integration**
2. Follow the guided setup (see [Integration docs](https://docs.civic.com/civic/developers/integration/apps)):
   - **Connect authentication** — create a new auth connection or link an existing one
   - **Configure auth provider** — select **Third-party provider > Custom** and configure:
     - **Issuer URL** — `https://localhost:3023` (must match `BETTER_AUTH_URL`)
     - **Public Key** — paste the PEM from Step 3 (Civic can't reach localhost JWKS)
     - **Audience** — `https://localhost:3023` (Better Auth defaults `aud` to the app URL)
   - **Configure access** — enable public access so new users can join automatically
3. Copy your **CIVIC_CLIENT_ID** and **CIVIC_CLIENT_SECRET** into your `.env`

> **Note**: Better Auth's JWT plugin manages key generation and rotation automatically. For production deployments with a public URL, you can use the JWKS URI (`https://your-domain.com/api/auth/jwks`) instead of a static key.

### Step 5: Sign In

1. Open **https://localhost:3023** (accept the self-signed cert warning)
2. Sign in with the seeded demo credentials: `demo@example.com` / `demo12345`
3. You'll be redirected to the chat page

You can also create additional accounts via the **"Need an account? Sign up"** link.

## Port

This app runs on port **3023** over HTTPS.
