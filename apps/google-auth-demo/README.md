# Google Auth Demo

Google OAuth + Civic Auth token exchange demo -- the simplest token exchange flow, requiring no custom JWT signing.

## How It Works

1. User signs in with Google via NextAuth v5
2. Google issues a standard RS256 ID token
3. The app exchanges the Google ID token for a Civic Auth access token via OAuth 2.0 Token Exchange (RFC 8693)
4. The Civic Auth token is used to connect to Civic MCP

## Prerequisites

- Node.js 18+
- A **Google Cloud project** with OAuth 2.0 credentials (see Step 1 below)
- A **Civic Auth app** (from [auth.civic.com](https://auth.civic.com)) with token exchange configured (see Step 2 below)
- A Civic organization linked to your Civic Auth app
- An **Anthropic API key**

## Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services > Credentials** (or search "Credentials" in the top search bar)
4. Click **+ CREATE CREDENTIALS > OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - Choose **External** user type
   - Fill in the app name (e.g., "Civic Google Auth Demo") and your email
   - You can skip scopes and test users for now
   - Click through to finish
6. Back on **Create OAuth client ID**:
   - **Application type:** Web application
   - **Name:** anything (e.g., "Civic Google Auth Demo")
   - **Authorized JavaScript origins:** `http://localhost:3025`
   - **Authorized redirect URIs:** `http://localhost:3025/api/auth/callback/google`
   - Click **Create**
7. Copy the **Client ID** (looks like `123456789-xxxxx.apps.googleusercontent.com`) and **Client Secret**

### Step 2: Configure Token Exchange in Civic Auth

In your Civic Auth application settings:

1. Navigate to **Setup > Token Exchange > Add Provider**
2. Select the **Google** preset -- this auto-fills the Issuer URL and JWKS URI fields
3. Fill in the **Audience** field with your Google OAuth Client ID from Step 1
4. Click **Save provider**

| Field | Value | Notes |
|-------|-------|-------|
| **Issuer URL** | `https://accounts.google.com` | Auto-filled by Google preset |
| **JWKS URI** | `https://www.googleapis.com/oauth2/v3/certs` | Auto-filled by Google preset |
| **Audience** | Your `GOOGLE_CLIENT_ID` | The Client ID from Step 1 |
| **Algorithm** | `RS256` | Default |

> **Note**: No custom signing or JWKS hosting is needed -- Google's ID tokens are standard RS256 JWTs verified against Google's public JWKS endpoint.

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in the values:

   ```
   NEXTAUTH_URL=http://localhost:3025
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

   GOOGLE_CLIENT_ID=<your Google client ID from Step 1>
   GOOGLE_CLIENT_SECRET=<your Google client secret from Step 1>

   CIVIC_CLIENT_ID=<your Civic Auth client ID>
   CIVIC_CLIENT_SECRET=<your Civic Auth client secret>

   ANTHROPIC_API_KEY=<your Anthropic API key>
   ```

   Optional env vars:
   - `CIVIC_PROFILE` — lock the client to a specific Civic profile UUID
   - `MCP_SERVER_URL` — override the default MCP hub URL (for staging/testing)

### Step 4: Install and Run

```bash
pnpm install
pnpm dev:google-auth
```

Open [http://localhost:3025](http://localhost:3025) and click "Sign in with Google".

## Port

This app runs on port **3025**.
