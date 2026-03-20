# Civic Demos

Demo projects showcasing Civic integrations.

## Setup

**Prerequisites:** Node.js 18+, pnpm 9+

```bash
pnpm install
```

## Demo Apps

| App | Description |
|-----|-------------|
| [civic-auth-demo](./apps/civic-auth-demo) | Simplest integration — Civic Auth tokens work directly with Civic MCP, no token exchange needed |
| [google-auth-demo](./apps/google-auth-demo) | Google OAuth + Civic token exchange with no custom JWT signing required |
| [next-auth-demo](./apps/next-auth-demo) | Auth.js with custom RS256 JWT signing and token exchange; supports multiple LLM providers |
| [next-auth-demo-intercept](./apps/next-auth-demo-intercept) | Like next-auth-demo but with civic:rest-auth tool wrapping for transparent auth interception |
| [federated-auth-demo-webmcp](./apps/federated-auth-demo-webmcp) | Like federated-auth-demo but uses the MCP SDK directly (WebMCP) instead of a higher-level client |
| [better-auth-demo](./apps/better-auth-demo) | Better Auth with an OIDC provider plugin for JWT generation and Civic token exchange; runs over local HTTPS |
| [civic-auth-demo-python-backend](./apps/civic-auth-demo-python-backend) | Next.js frontend + FastAPI Python backend demonstrating [`civic-mcp-client`](https://pypi.org/project/civic-mcp-client/) by forwarding the Civic access token server-side |

## Projects

### [civic-auth-demo](./apps/civic-auth-demo)

A Next.js application using [Civic Auth](https://www.civic.com/) as the identity provider. Because Civic Auth tokens are natively accepted by Civic MCP, no custom JWT signing or token exchange is required — making this the simplest way to integrate.

### [google-auth-demo](./apps/google-auth-demo)

A Next.js application using NextAuth v5 with Google OAuth. Google ID tokens (RS256-signed) are exchanged directly for Civic access tokens via OAuth 2.0 Token Exchange (RFC 8693), so no custom JWT infrastructure is needed.

### [next-auth-demo](./apps/next-auth-demo)

A Next.js application using Auth.js (NextAuth v5) with a custom RS256-signed JWT and a JWKS endpoint. The app exchanges its own JWTs for Civic access tokens and includes an AI chat interface with support for multiple LLM providers (Anthropic, OpenAI, Amazon Bedrock, Ollama).

### [next-auth-demo-intercept](./apps/next-auth-demo-intercept)

Like next-auth-demo but adds civic:rest-auth capability and tool wrapping to transparently intercept and handle OAuth2 authorization flows during tool execution. When a tool requires user authorization, it automatically manages the auth popup flow without the LLM needing to know about it.

### [federated-auth-demo-webmcp](./apps/federated-auth-demo-webmcp)

Similar to federated-auth-demo but connects to Civic MCP using the `@modelcontextprotocol/sdk` directly (WebMCP) instead of a higher-level MCP client, demonstrating lower-level protocol integration.

### [better-auth-demo](./apps/better-auth-demo)

A Next.js application using [Better Auth](https://www.better-auth.com/) with an OIDC provider plugin that generates RS256-signed JWTs. These are exchanged for Civic access tokens via RFC 8693. Runs over local HTTPS (self-signed certificate) on port 3023.

### [civic-auth-demo-python-backend](./apps/civic-auth-demo-python-backend)

A Next.js frontend with a small FastAPI Python backend that demonstrates [`civic-mcp-client`](https://pypi.org/project/civic-mcp-client/) by forwarding your authenticated Civic access token server-side. After login, users land directly on `/python-backend` to list available MCP tools and call a tool via the Python service.
