# Civic Auth Demo

Direct Civic Auth integration with Civic Nexus MCP -- the simplest path to connecting an AI assistant to Nexus tools.

## How it works

This app uses `@civic/auth` as the identity provider. Unlike federated auth flows, **no token exchange is needed** -- Civic Auth tokens are directly valid for the Nexus MCP endpoint.

## Prerequisites

- A Civic Auth client ID (from [auth.civic.com](https://auth.civic.com))
- Your Nexus organization linked to your Civic Auth app
- An Anthropic API key

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
   - `MCP_SERVER_URL` -- Nexus MCP endpoint (default: `https://nexus.civic.com/mcp`)
   - `ANTHROPIC_API_KEY` -- your Anthropic API key

4. Run the dev server:

   ```bash
   npm run dev
   ```

   The app runs on **port 3024**.
