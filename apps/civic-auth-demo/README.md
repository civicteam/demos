# Civic Auth Demo

Direct Civic Auth integration with Civic MCP -- the simplest path to connecting an AI assistant to Civic tools.

## How it works

This app uses `@civic/auth` as the identity provider. Unlike federated auth flows, **no token exchange is needed** -- Civic Auth tokens are directly valid for the Civic MCP endpoint.

## Prerequisites

- A Civic account at [app.civic.com](https://app.civic.com) with Integration configured (see [Integration docs](https://docs.civic.com/civic/developers/integration/apps))
- An Anthropic API key

> **No token exchange configuration needed** — since Civic Auth is the identity provider, the tokens it issues are directly valid for the Civic MCP endpoint. No issuer, JWKS, or audience setup required.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from the example:

   ```bash
   cp .env.example .env
   ```

3. Fill in your environment variables:

   - `CIVIC_CLIENT_ID` -- your Civic Auth client ID
   - `MCP_SERVER_URL` -- Civic MCP endpoint (default: `https://app.civic.com/mcp`)
   - `ANTHROPIC_API_KEY` -- your Anthropic API key

4. Run the dev server:

   ```bash
   npm run dev
   ```

   The app runs on **port 3024**.
