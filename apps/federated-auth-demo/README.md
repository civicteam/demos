# Federated Auth Demo

This demo application shows how to integrate a custom authentication system with Civic MCP Hub using OAuth 2.0 Token Exchange (RFC 8693). It allows you to use your own identity provider (IdP) while still accessing Civic MCP tools and services.

## Overview

The federated authentication flow works as follows:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │     │   Your IdP      │     │   Civic Auth    │     │   Civic MCP     │
│   (Auth.js)     │     │   (JWT Issuer)  │     │   (Exchange)    │     │   Hub           │
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

## Prerequisites

1. **Civic Auth Client**: You need a Civic Auth client ID and secret configured for token exchange
2. **RSA Key Pair**: Generate an RSA key pair for signing your JWTs
3. **Civic MCP Account**: An organizational account in Civic MCP associated with your client ID

## Implementation Guide

### Step 1: Generate RSA Keys

Generate an RSA key pair for signing your JWTs:

```bash
# Using the provided script
pnpm tsx scripts/generate-keys.ts
```

Or generate manually with OpenSSL:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem
```

Add the keys to your `.env` file (escape newlines):

```env
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIBI...\n-----END PUBLIC KEY-----"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----"
```

### Step 2: Configure Auth.js with Custom JWT Signing

Create a custom JWT encoder that signs tokens with your RSA private key:

```typescript
// app/lib/auth/jwt.ts
import * as jose from "jose";
import type { JWT, JWTEncodeParams, JWTDecodeParams } from "next-auth/jwt";

const ISSUER = "https://your-app.example.com"; // Your app's URL
const AUDIENCE = "civic-mcp";

export async function encodeJwt(params: JWTEncodeParams): Promise<string> {
  const { token, maxAge } = params;

  if (!token) {
    throw new Error("Token is required for encoding");
  }

  const privateKey = await getPrivateKey(); // Load from env
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new jose.SignJWT({
    ...token,
    iat: now,
    exp: now + (maxAge ?? 24 * 60 * 60),
    iss: ISSUER,
    aud: AUDIENCE,
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .sign(privateKey);

  return jwt;
}

export async function decodeJwt(params: JWTDecodeParams): Promise<JWT | null> {
  const { token } = params;

  if (!token) return null;

  try {
    const publicKey = await getPublicKey();
    const { payload } = await jose.jwtVerify(token, publicKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload as JWT;
  } catch (error) {
    console.error("JWT decode error:", error);
    return null;
  }
}
```

Configure Auth.js to use your custom JWT functions:

```typescript
// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { encodeJwt, decodeJwt } from "./app/lib/auth/jwt";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Your authentication logic here
        const user = await validateUser(credentials.email, credentials.password);
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  jwt: {
    encode: encodeJwt,
    decode: decodeJwt,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

### Step 3: Expose Your Public Key

Create endpoints to expose your public key for Civic Auth to verify your JWTs:

**JWKS Endpoint** (`/api/keys/.well-known/jwks.json`):

```typescript
import * as jose from "jose";
import { getPublicKey } from "@/lib/auth/keys";

export async function GET() {
  const publicKey = await getPublicKey();
  const jwk = await jose.exportJWK(publicKey);

  return Response.json({
    keys: [{
      ...jwk,
      kid: "your-key-id",
      use: "sig",
      alg: "RS256",
    }],
  });
}
```

**PEM Endpoint** (`/api/keys/public`):

```typescript
export async function GET() {
  const publicKeyPem = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");
  return new Response(publicKeyPem, {
    headers: { "Content-Type": "application/x-pem-file" },
  });
}
```

### Step 4: Implement Token Exchange

Create a service to exchange your JWT for a Civic access token:

```typescript
// app/lib/token-exchange.ts

interface TokenExchangeResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
}

export async function exchangeTokenForCivic(subjectToken: string): Promise<TokenExchangeResponse> {
  const clientId = process.env.CIVIC_AUTH_CLIENT_ID!;
  const clientSecret = process.env.CIVIC_AUTH_CLIENT_SECRET!;
  const civicAuthUrl = process.env.CIVIC_AUTH_URL || "https://auth.civic.com/oauth";

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    subject_token: subjectToken,
    scope: "openid",
  });

  const response = await fetch(`${civicAuthUrl}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    expiresIn: data.expires_in,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}
```

### Step 5: Create MCP Client with Token Exchange

Create an MCP client that uses the exchanged Civic token:

```typescript
// app/lib/ai/mcp.ts
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { exchangeTokenForCivic } from "@/lib/token-exchange";

export async function getMcpClient(sessionToken: string) {
  // Exchange your JWT for a Civic token
  const civicToken = await exchangeTokenForCivic(sessionToken);

  // Create MCP transport with Civic token
  const transport = new StreamableHTTPClientTransport(
    new URL(process.env.MCP_SERVER_URL!),
    {
      requestInit: {
        headers: {
          Authorization: `Bearer ${civicToken.accessToken}`,
          "x-civic-profile": "default", // Required for END_USER access
        },
      },
    }
  );

  return createMCPClient({ name: "your-app", transport });
}
```

### Step 6: Configure Civic Auth Dashboard

In the Civic Auth dashboard, configure your federated token exchange provider:

| Field | Value |
|-------|-------|
| **Issuer** | `https://your-app.example.com` (must match JWT `iss` claim) |
| **Audience** | `civic-mcp` (must match JWT `aud` claim) |
| **JWKS URL** | `https://your-app.example.com/api/keys/.well-known/jwks.json` |
| **Algorithm** | `RS256` |

Alternatively, provide the PEM public key directly instead of JWKS URL.

### Step 7: Create Civic MCP Account

Ensure you have an organizational account in Civic MCP associated with your client ID. This account determines which MCP servers/tools your users can access.

## Environment Variables

```env
# Auth.js
NEXTAUTH_URL=https://your-app.example.com
NEXTAUTH_SECRET=your-random-secret-min-32-chars

# RSA Keys for JWT signing
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Civic Auth for token exchange
CIVIC_AUTH_URL=https://auth.civic.com/oauth
CIVIC_AUTH_CLIENT_ID=your-civic-client-id
CIVIC_AUTH_CLIENT_SECRET=your-civic-client-secret

# MCP Hub
MCP_SERVER_URL=https://mcp.civic.com/mcp
```

## JWT Claims

Your JWT must include these claims:

| Claim | Description | Example |
|-------|-------------|---------|
| `iss` | Issuer URL (your app) | `https://your-app.example.com` |
| `aud` | Audience | `civic-mcp` |
| `sub` | Subject (user ID) | `user-123` |
| `iat` | Issued at (Unix timestamp) | `1704067200` |
| `exp` | Expiration (Unix timestamp) | `1704153600` |
| `email` | User's email (optional) | `user@example.com` |
| `name` | User's name (optional) | `John Doe` |

## Security Considerations

1. **Key Security**: Never expose your private key. Store it securely in environment variables or a secrets manager.

2. **Token Expiration**: Set reasonable expiration times for your JWTs (e.g., 24 hours).

3. **HTTPS Only**: Always use HTTPS in production for all endpoints.

4. **Client Credentials**: Store Civic Auth client credentials securely.

5. **Profile Locking**: Use `x-civic-profile` header to lock users to a specific profile, preventing unauthorized profile switching.

## Troubleshooting

### Token Exchange Fails with `invalid_grant`

- Verify your issuer URL matches exactly what's configured in Civic Auth
- Check that your JWKS endpoint is accessible from the internet
- Ensure the JWT is signed with the correct private key
- Verify the `aud` claim matches the expected audience

### MCP Connection Fails with 401

- Ensure your Civic MCP account exists and is associated with your client ID
- Check that the account has the required servers installed
- Verify the `x-civic-profile` header is set for END_USER access

### END_USER Role Cannot Unlock Profiles

- Always include `x-civic-profile: "default"` header in MCP requests
- This locks the user to a specific profile, which is required for END_USER role

## Running the Demo

```bash
# Install dependencies
pnpm install

# Generate RSA keys (if not already done)
pnpm tsx scripts/generate-keys.ts

# Start the development server
pnpm dev
```

The demo runs at http://localhost:3006. Login with:
- Email: `demo@example.com`
- Password: `demo123`

## Files Reference

| File | Purpose |
|------|---------|
| `auth.ts` | Auth.js configuration with custom JWT |
| `app/lib/auth/jwt.ts` | Custom JWT encode/decode with RSA signing |
| `app/lib/auth/keys.ts` | RSA key management |
| `app/lib/token-exchange.ts` | Civic token exchange service |
| `app/lib/ai/mcp.ts` | MCP client with token exchange |
| `app/api/keys/.well-known/jwks.json/route.ts` | JWKS endpoint |
| `app/api/keys/public/route.ts` | PEM public key endpoint |
| `scripts/generate-keys.ts` | RSA key pair generator |
