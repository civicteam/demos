import { getLogger } from "./debug";

const logger = getLogger();

interface TokenExchangeConfig {
  civicAuthUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface TokenExchangeResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
}

function getConfig(): TokenExchangeConfig {
  const civicAuthUrl = process.env.CIVIC_AUTH_URL || "https://auth.civic.com/oauth";
  const clientId = process.env.CIVIC_AUTH_CLIENT_ID;
  const clientSecret = process.env.CIVIC_AUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "CIVIC_AUTH_CLIENT_ID and CIVIC_AUTH_CLIENT_SECRET are required for token exchange",
    );
  }

  return { civicAuthUrl, clientId, clientSecret };
}

export async function exchangeTokenForCivic(subjectToken: string): Promise<TokenExchangeResponse> {
  const config = getConfig();

  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    subject_token: subjectToken,
    scope: "openid",
  });

  logger.debug("Exchanging JWT for Civic access token");

  const response = await fetch(`${config.civicAuthUrl}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Token exchange failed", {
      status: response.status,
      error: errorText,
    });
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
