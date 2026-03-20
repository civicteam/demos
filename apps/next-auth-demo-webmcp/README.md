# Next Auth WebMCP Demo

A bare-bones WebMCP demo using Auth.js (NextAuth v5) with federated token exchange. This app handles authentication and token exchange only -- a third-party WebMCP-compatible chat client connects to Civic MCP using the exchanged access token.

## How It Works

1. User signs in with email + password via Auth.js
2. Auth.js issues an RS256-signed JWT
3. The app exchanges the JWT for a Civic access token via OAuth 2.0 Token Exchange (RFC 8693)
4. The `/api/auth/token` endpoint exposes the access token and MCP URL for WebMCP clients

## Prerequisites

- Node.js 18+
- A **Civic account** at [app.civic.com](https://app.civic.com) with Integration configured (see [Integration docs](https://docs.civic.com/civic/developers/integration/apps))

## Setup

### Step 1: Configure Integration in Civic

1. Go to [app.civic.com](https://app.civic.com) → **Settings > Integration**
2. Follow the guided setup:
   - **Connect authentication** — create a new auth connection or link an existing one
   - **Configure auth provider** — select **Third-party provider > Custom** and configure:
     - **Issuer URL** — must match the `ISSUER` env var
     - **JWKS URL** or **Public Key** — either your app's JWKS endpoint (`/api/keys/.well-known/jwks.json`) or paste the PEM directly
     - **Audience** — must match the `AUDIENCE` env var
   - **Configure access** — enable public access so new users can join automatically
3. Copy your **CIVIC_CLIENT_ID** and **CIVIC_CLIENT_SECRET** from the Integration page

### Step 2: Run the Demo

1. Install dependencies:

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

5. Open [http://localhost:3022](http://localhost:3022) and log in with:
   - Email: `demo@example.com`
   - Password: `demo123`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/auth/token` | Returns Civic access token and MCP URL for WebMCP clients |
| `GET /api/mcp/status` | Token exchange status check |
| `GET /api/keys/.well-known/jwks.json` | JWKS endpoint for token verification |
| `GET /api/keys/public` | Public key in PEM format |

## Port

This app runs on port **3022**.
