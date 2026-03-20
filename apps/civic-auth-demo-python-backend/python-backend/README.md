# Python Backend (FastAPI) Demo

This backend proxies authenticated requests to Civic MCP using [`civic-mcp-client`](https://pypi.org/project/civic-mcp-client/).

## Endpoints

- `GET /health`  
- `GET /tools`  
- `POST /tools/call` with JSON: `{ "name": "tool-name", "args": { ... } }`

All endpoints require a bearer token in `Authorization: Bearer <access_token>`.

## Setup

1. Ensure you have Python 3.10+
2. Install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Environment Variables

- `MCP_SERVER_URL` (default: `https://app.civic.com/hub/mcp`)
- `CIVIC_PROFILE_ID` (optional; useful for federated profile locking)

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

