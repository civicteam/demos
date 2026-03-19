import os
from typing import Any, Dict, Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from civic_mcp_client import CivicMCPClient

app = FastAPI()


def extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    token = parts[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    return token


def get_client(token: str) -> CivicMCPClient:
    # Civic MCP Hub endpoint is under `/hub/mcp`.
    mcp_url = os.getenv("MCP_SERVER_URL", "https://app.civic.com/hub/mcp")
    if mcp_url == "https://app.civic.com/mcp":
        mcp_url = "https://app.civic.com/hub/mcp"
    civic_profile_id = os.getenv("CIVIC_PROFILE_ID")

    kwargs: Dict[str, Any] = {
        "auth": {"token": token},
        "url": mcp_url,
    }
    if civic_profile_id:
        kwargs["civic_profile"] = civic_profile_id

    return CivicMCPClient(**kwargs)


@app.get("/health")
async def health(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    token = extract_bearer_token(authorization)
    client = get_client(token)
    try:
        # Any authenticated MCP request is enough to validate the bearer token.
        await client.get_server_instructions()
        return {"ok": True}
    except Exception as e:  # noqa: BLE001 - demo-friendly surface
        raise HTTPException(status_code=401, detail=f"Unauthorized or MCP unavailable: {str(e)[:200]}")
    finally:
        await client.close()


@app.get("/tools")
async def tools(authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    token = extract_bearer_token(authorization)
    client = get_client(token)
    try:
        print("Getting tools...")
        tools = await client.get_tools()
        print("Tools count:", len(tools))
        return {"tools": tools}
    except Exception as e:  # noqa: BLE001 - demo-friendly surface
        raise HTTPException(status_code=502, detail=f"Failed to fetch tools: {str(e)[:200]}")
    finally:
        await client.close()


class ToolCallRequest(BaseModel):
    name: str
    args: Dict[str, Any] = {}


@app.post("/tools/call")
async def call_tool(req: ToolCallRequest, authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    token = extract_bearer_token(authorization)
    client = get_client(token)
    try:
        result = await client.call_tool(name=req.name, args=req.args)
        return {"result": result}
    except Exception as e:  # noqa: BLE001 - demo-friendly surface
        raise HTTPException(status_code=502, detail=f"Tool call failed: {str(e)[:200]}")
    finally:
        await client.close()

