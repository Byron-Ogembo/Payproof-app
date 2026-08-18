/**
 * M-PESA OAuth Token Service
 *
 * Handles fetching and caching the Daraja API access token.
 * Token is valid for 3600 seconds; we refresh 60 seconds early.
 *
 * All credentials come ONLY from environment variables.
 * NEVER hard-code credentials.
 */

const MPESA_BASE_URL = process.env.MPESA_BASE_URL ?? "https://sandbox.safaricom.co.ke";
const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY ?? "";
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET ?? "";

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getMpesaToken(): Promise<string> {
  const now = Date.now();

  if (tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }

  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
    throw new Error(
      "M-PESA credentials not configured. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET env vars."
    );
  }

  const credentials = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const response = await fetch(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`M-PESA OAuth failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: string;
  };

  const expiresInMs = (parseInt(data.expires_in, 10) - 60) * 1000;
  tokenCache = {
    token: data.access_token,
    expiresAt: now + expiresInMs,
  };

  return tokenCache.token;
}
