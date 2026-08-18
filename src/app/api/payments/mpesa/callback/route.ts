/**
 * POST /api/payments/mpesa/callback
 *
 * Public HTTPS endpoint that receives asynchronous M-PESA STK Push results.
 *
 * Security layers:
 *   1. Only POST requests are accepted.
 *   2. IP validation against official Safaricom CIDR ranges.
 *   3. Payload is validated before processing.
 *   4. Always returns 200 OK — if we return an error, Safaricom retries endlessly.
 *   5. All processing is idempotent (duplicate callbacks are safe).
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { handleMpesaCallback } from "@/lib/payments/providers/mpesa/callback";
import { MpesaCallbackPayload } from "@/lib/payments/providers/mpesa/types";

// Official Safaricom IP ranges (CIDR blocks for M-PESA callbacks)
const SAFARICOM_IP_RANGES = [
  "196.201.214.",
  "196.201.213.",
];

function isFromSafaricom(ip: string): boolean {
  // In development / sandbox, allow all IPs
  if (process.env.NODE_ENV !== "production") return true;
  return SAFARICOM_IP_RANGES.some((range) => ip.startsWith(range));
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // Always respond 200 to Safaricom even on errors — they will retry on non-200
  try {
    if (!isFromSafaricom(clientIp)) {
      console.warn(`[MPESA CALLBACK] Blocked request from unauthorized IP: ${clientIp}`);
      // Return 200 but don't process — do not reveal rejection to potential attackers
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    let payload: MpesaCallbackPayload;
    try {
      payload = (await req.json()) as MpesaCallbackPayload;
    } catch {
      console.error("[MPESA CALLBACK] Invalid JSON payload");
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    // Validate the payload has the expected structure
    if (!payload?.Body?.stkCallback?.CheckoutRequestID) {
      console.error("[MPESA CALLBACK] Missing required fields in payload");
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
    }

    await handleMpesaCallback(payload);
    revalidatePath("/dashboard");

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("[MPESA CALLBACK] Unhandled error:", error);
    // Still return 200 — we have audit logs; don't make Safaricom retry infinitely
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
