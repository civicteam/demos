# Civic Demos

Demo projects showcasing Civic integrations.

## Setup

**Prerequisites:** Node.js 18+, pnpm 9+

```bash
pnpm install
```

## Demo Apps

| App | Port | Auth | Description |
|-----|------|------|-------------|
| [civic-auth-demo](./apps/civic-auth-demo) | 3024 | Civic Auth | Simplest integration — Civic Auth tokens work directly with Civic MCP, no token exchange needed |
| [civic-auth-demo-python-backend](./apps/civic-auth-demo-python-backend) | 3024 | Civic Auth | Like civic-auth-demo, plus a FastAPI Python backend using [`civic-mcp-client`](https://pypi.org/project/civic-mcp-client/) |
| [google-auth-demo](./apps/google-auth-demo) | 3025 | Google OAuth | Google ID tokens exchanged for Civic tokens — no custom JWT signing required |
| [next-auth-demo](./apps/next-auth-demo) | 3020 | Auth.js (credentials) | Auth.js with custom RS256 JWT signing and token exchange via `@civic/mcp-client` |
| [next-auth-demo-intercept](./apps/next-auth-demo-intercept) | 3021 | Auth.js (credentials) | Like next-auth-demo, plus transparent OAuth2 auth interception for tools (`civic:rest-auth`) |
| [next-auth-demo-webmcp](./apps/next-auth-demo-webmcp) | 3022 | Auth.js (credentials) | Bare-bones WebMCP demo — token exchange only, no chat UI (uses third-party WebMCP client) |
| [better-auth-demo](./apps/better-auth-demo) | 3023 | Better Auth | Better Auth with OIDC provider plugin for JWT generation and Civic token exchange; runs over local HTTPS |

## Projects

### [civic-auth-demo](./apps/civic-auth-demo)

A Next.js application using [Civic Auth](https://www.civic.com/) as the identity provider. Because Civic Auth tokens are natively accepted by Civic MCP, no custom JWT signing or token exchange is required — making this the simplest way to integrate.

### [civic-auth-demo-python-backend](./apps/civic-auth-demo-python-backend)

Extends civic-auth-demo with a FastAPI Python backend that demonstrates [`civic-mcp-client`](https://pypi.org/project/civic-mcp-client/) by forwarding the authenticated Civic access token server-side. After login, users land on `/python-backend` to list available MCP tools and call a tool via the Python service.

### [google-auth-demo](./apps/google-auth-demo)

A Next.js application using NextAuth v5 with Google OAuth. Google ID tokens (RS256-signed) are exchanged directly for Civic access tokens via OAuth 2.0 Token Exchange (RFC 8693), so no custom JWT infrastructure is needed.

### [next-auth-demo](./apps/next-auth-demo)

A Next.js application using Auth.js (NextAuth v5) with custom RS256-signed JWTs and a JWKS endpoint. The app uses `@civic/mcp-client` with built-in token exchange to connect to Civic MCP, and includes an AI chat interface.

### [next-auth-demo-intercept](./apps/next-auth-demo-intercept)

Like next-auth-demo but adds `civic:rest-auth` capability and tool wrapping to transparently intercept and handle OAuth2 authorization flows during tool execution. When a tool requires user authorization, it automatically manages the auth popup flow without the LLM needing to know about it.

### [next-auth-demo-webmcp](./apps/next-auth-demo-webmcp)

A bare-bones WebMCP demo using Auth.js (NextAuth v5) with federated token exchange. This app handles authentication and token exchange only — a third-party WebMCP-compatible chat client connects to Civic MCP using the exchanged access token.

### [better-auth-demo](./apps/better-auth-demo)

A Next.js application using [Better Auth](https://www.better-auth.com/) with an OIDC provider plugin that generates RS256-signed JWTs. These are exchanged for Civic access tokens via RFC 8693. Runs over local HTTPS (self-signed certificate) on port 3023.
