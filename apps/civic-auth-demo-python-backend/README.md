# Civic Auth with Python Backend Demo

Extends the [Civic Auth Demo](../civic-auth-demo) with a FastAPI Python backend that demonstrates [`civic-mcp-client`](https://pypi.org/project/civic-mcp-client/) -- the Python SDK for Civic MCP.

## How it works

The Next.js frontend uses `@civic/auth` as the identity provider (no token exchange needed). The authenticated Civic access token is forwarded server-side to a Python FastAPI backend, which uses `civic-mcp-client` to list and call MCP tools.

## Prerequisites

- A Civic account at [app.civic.com](https://app.civic.com) with Integration configured (see [Integration docs](https://docs.civic.com/civic/developers/integration/apps))
- An Anthropic API key

> **No token exchange configuration needed** — since Civic Auth is the identity provider, the tokens it issues are directly valid for the Civic MCP endpoint. No issuer, JWKS, or audience setup required.

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env` from the example:

   ```bash
   cp .env.example .env
   ```

3. Fill in your environment variables:
   - `CIVIC_CLIENT_ID` -- your Civic Auth client ID
   - `ANTHROPIC_API_KEY` -- your Anthropic API key

4. Run the dev server:

   ```bash
   pnpm dev
   ```

   The app runs on **port 3024**.

## Python Backend (civic-mcp-client) Demo

This demo also includes a small FastAPI backend that uses [`civic-mcp-client`](https://pypi.org/project/civic-mcp-client/) to list tools and call a tool using the authenticated Civic access token (forwarded server-side by Next.js).

1. Install Python dependencies:

   ```bash
   cd python-backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Run the FastAPI server:

   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. Open the page in your browser:
   - `http://localhost:3024/python-backend`

> If you changed the backend port/host, set `PYTHON_BACKEND_URL` in `.env`.
