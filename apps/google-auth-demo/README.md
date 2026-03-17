# Google Auth Demo

Google OAuth + Civic Auth token exchange demo -- the simplest token exchange flow, requiring no custom JWT signing.

## How It Works

1. User signs in with Google via NextAuth v5
2. Google issues a standard RS256 ID token
3. The app exchanges the Google ID token for a Civic Auth access token via OAuth 2.0 Token Exchange (RFC 8693)
4. The Civic Auth token is used to connect to Civic Nexus MCP

## Prerequisites

- **Google Cloud project** with OAuth 2.0 credentials (Web application type)
  - Authorized redirect URI: `http://localhost:3025/api/auth/callback/google`
- **Civic Auth app** configured with a Google token exchange preset:
  - Issuer: `https://accounts.google.com`
  - JWKS URL: `https://www.googleapis.com/oauth2/v3/certs`
  - Audience: Your Google OAuth client ID
- **Anthropic API key** for the AI chat functionality

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
