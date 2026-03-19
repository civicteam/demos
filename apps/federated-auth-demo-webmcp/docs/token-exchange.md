# Civic Token Exchange Integration Guide

This guide explains how third-party applications can use OAuth 2.0 Token Exchange ([RFC 8693](https://datatracker.ietf.org/doc/html/rfc8693)) to map users from their own identity system to Civic.

## Overview

Token exchange allows your application to swap a self-issued JWT (representing one of your users) for a Civic access token. That access token then authorizes the user to interact with Civic MCP tools on behalf of your organization.

```
Your App                    Civic Auth                  Civic
  │                            │                            │
  │  1. Sign JWT (RS256)       │                            │
  │  with user claims          │                            │
  │                            │                            │
  │  2. POST /oauth/token      │                            │
  │  grant_type=token-exchange │                            │
  │  subject_token=<jwt>       │                            │
  │──────────────────────────> │                            │
  │                            │  (validates JWT signature  │
  │                            │   via your JWKS endpoint)  │
  │  3. Civic access token     │                            │
  │ <────────────────────────  │                            │
  │                            │                            │
  │  4. API calls with Bearer token                         │
  │ ──────────────────────────────────────────────────────> │
  │                            │                            │
  │  5. MCP tool responses                                  │
  │ <────────────────────────────────────────────────────── │
```

## Prerequisites

Before integrating, you need:

1. **A Civic Auth application** — register at [auth.civic.com](https://auth.civic.com) to get a Client ID and Client Secret.
2. **A Civic organization** — create one at [app.civic.com](https://app.civic.com).
3. **Linked accounts** — contact Civic to link your Auth Client ID to your Civic Organization Account ID.
4. **An RSA key pair** — used to sign your JWTs (RS256).

## Step 1: Generate an RSA Key Pair

Generate an RSA key pair for signing JWTs. Your private key stays on your server; your public key must be accessible to Civic Auth for signature verification.

```bash
# Generate a 2048-bit RSA private key
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048

# Extract the public key
openssl rsa -pubout -in private.pem -out public.pem
```

## Step 2: Expose Your Public Key

Civic Auth needs to verify the signature on your JWTs. Provide your public key via one of these methods:

### Option A: JWKS Endpoint (Recommended)

Host a JSON Web Key Set at a well-known URL:

```
GET https://your-app.example.com/.well-known/jwks.json
```

Response:

```json
{
  "keys": [
    {
      "kty": "RSA",
      "n": "<modulus>",
      "e": "AQAB",
      "kid": "your-key-id",
      "use": "sig",
      "alg": "RS256"
    }
  ]
}
```

### Option B: PEM Upload

Paste your PEM-encoded public key directly in the Civic Auth dashboard.

## Step 3: Configure Token Exchange in Civic Auth

In your Civic Auth application settings, navigate to **Token Exchange** and register a provider:

| Field | Value |
|-------|-------|
| **Issuer** | Your application's URL (e.g. `https://your-app.example.com`) |
| **Audience** | `civic-mcp` |
| **Algorithm** | `RS256` |
| **JWKS URL** | `https://your-app.example.com/.well-known/jwks.json` (if using Option A) |

> The `iss` and `aud` claims in your JWT **must match exactly** what you configure here.

## Step 4: Issue JWTs for Your Users

When a user authenticates in your application, create a JWT with these claims:

### Required Claims

| Claim | Type | Description |
|-------|------|-------------|
| `iss` | string | Your issuer URL. Must match the issuer configured in Civic Auth. |
| `aud` | string | Must be `civic-mcp`. |
| `sub` | string | A stable, unique user identifier from your system. This is what Civic uses to distinguish users within your organization. |
| `iat` | number | Issued-at timestamp (seconds since epoch). |
| `exp` | number | Expiration timestamp. Keep short-lived (recommended: 5–60 minutes). |

### Optional Claims

| Claim | Type | Description |
|-------|------|-------------|
| `email` | string | User's email address. |
| `name` | string | User's display name. |
| `scope` | string | Requested scopes (default: `openid profile email`). |

### Example JWT Payload

```json
{
  "iss": "https://your-app.example.com",
  "aud": "civic-mcp",
  "sub": "user-abc-123",
  "email": "alice@example.com",
  "name": "Alice",
  "iat": 1700000000,
  "exp": 1700003600,
  "scope": "openid profile email"
}
```

Sign this payload with your RSA private key using the RS256 algorithm. Set the JWT header to:

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

## Step 5: Exchange the JWT for a Civic Access Token

Make a POST request to the Civic Auth token endpoint:

```
POST https://auth.civic.com/oauth/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(clientId:clientSecret)>
```

Body (URL-encoded):

```
grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=<your-signed-jwt>
&scope=openid profile email
```

### Successful Response

```json
{
  "access_token": "eyJhbGciOiJS...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| 400 | `invalid_grant` | JWT signature verification failed. Check your issuer, audience, and JWKS endpoint. |
| 400 | `invalid_request` | Malformed request or missing parameters. |
| 401 | `invalid_client` | Bad Client ID or Client Secret. |

## Step 6: Use the Access Token with Civic

Pass the Civic access token in the `Authorization` header when connecting to Civic. Include the `x-civic-profile` header to scope requests to a profile within your organization.

### Using @civic/nexus-client

```typescript
import { NexusClient } from "@civic/nexus-client";

const client = new NexusClient({
  url: "https://app.civic.com/mcp",
  auth: {
    token: civicAccessToken,
  },
  headers: {
    "x-civic-profile": "default",
  },
});

const tools = await client.getTools(adapter);
```

### Using Raw HTTP (MCP over Streamable HTTP)

```
POST https://app.civic.com/mcp
Content-Type: application/json
Authorization: Bearer <civic-access-token>
x-civic-profile: default
```

## How User Mapping Works

The token exchange creates a mapping between your user identities and Civic:

```
Your Application                          Civic
┌──────────────────┐                     ┌──────────────────┐
│ sub: "user-123"  │  ── exchange ──>    │ Civic user tied   │
│ iss: "your-app"  │                     │ to your org +     │
│ email: "a@b.com" │                     │ "user-123" sub    │
└──────────────────┘                     └──────────────────┘
```

- **`sub` claim** — the primary key. Civic uses the combination of your application's issuer and the `sub` value to uniquely identify a user within your organization.
- **Same `sub`, same user** — if two requests carry JWTs with the same `sub` from the same issuer, Civic treats them as the same user. Any OAuth grants, preferences, or data the user has authorized will carry over.
- **Different `sub`, different user** — each unique `sub` is an isolated identity with its own authorizations and data.
- **`x-civic-profile` header** — scopes the user to a specific profile within your Civic organization. Use `default` unless you have multiple profiles configured.

## Token Lifecycle & Caching

- Civic access tokens have a limited lifetime (returned in the `expires_in` field, typically 24 hours).
- Cache the access token on your server and reuse it for the same user until it expires.
- When the token expires, perform a new token exchange with a fresh JWT.
- Do **not** send expired or invalid tokens to Civic — you will receive a `401 Unauthorized`.

## Security Considerations

- **Keep your private key secret.** Never expose it to the client/browser.
- **Keep your Client Secret secret.** The token exchange must happen server-side.
- **Use short-lived JWTs.** The subject token is only used for the exchange and does not need a long lifetime.
- **Validate the `expires_in` value.** Always respect the token expiry returned by Civic Auth rather than assuming a fixed duration.
- **Use HTTPS** for all endpoints, including your JWKS URL.

## Quick Reference

| Item | Value |
|------|-------|
| Token endpoint | `https://auth.civic.com/oauth/token` |
| Grant type | `urn:ietf:params:oauth:grant-type:token-exchange` |
| JWT algorithm | `RS256` |
| JWT audience | `civic-mcp` |
| Civic MCP endpoint | `https://app.civic.com/mcp` |
| Profile header | `x-civic-profile: default` |
| RFC reference | [RFC 8693 — OAuth 2.0 Token Exchange](https://datatracker.ietf.org/doc/html/rfc8693) |
