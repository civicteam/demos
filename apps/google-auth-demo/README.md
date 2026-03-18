# Google Auth Demo

Google OAuth + Civic Auth token exchange demo -- the simplest token exchange flow, requiring no custom JWT signing.

## How It Works

1. User signs in with Google via NextAuth v5
2. Google issues a standard RS256 ID token
3. The app exchanges the Google ID token for a Civic Auth access token via OAuth 2.0 Token Exchange (RFC 8693)
4. The Civic Auth token is used to connect to Civic Nexus MCP

## Prerequisites

- Node.js 18+
- A **Google Cloud project** with OAuth 2.0 credentials (Web application type)
  - Authorized redirect URI: `http://localhost:3025/api/auth/callback/google`
- A **Civic Auth app** (from [auth.civic.com](https://auth.civic.com)) with token exchange configured (see below)
- A Civic Nexus organization linked to your Civic Auth app
- An **Anthropic API key**

### Configure Token Exchange in Civic Auth

In your Civic Auth application settings:

1. Navigate to **Setup > Token Exchange > Add Provider**
2. Select the **Google** preset — this auto-fills the issuer and JWKS fields:

| Field | Value | Notes |
|-------|-------|-------|
| **Issuer URL** | `https://accounts.google.com` | Auto-filled by Google preset |
| **JWKS URL** | `https://www.googleapis.com/oauth2/v3/certs` | Auto-filled by Google preset |
| **Audience** | Your `GOOGLE_CLIENT_ID` | Must match the Google OAuth client ID used by this app |
| **Algorithm** | `RS256` | |

> **Note**: No custom signing or JWKS hosting is needed — Google's ID tokens are standard RS256 JWTs verified against Google's public JWKS endpoint.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

The app runs on **port 3025**: [http://localhost:3025](http://localhost:3025)
