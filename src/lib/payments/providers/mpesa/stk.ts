/**
 * M-PESA STK Push Service
 *
 * Initiates an STK Push (M-Pesa Express) request via Safaricom Daraja API.
 *
 * CRITICAL: Initiating an STK Push does NOT mean payment is confirmed.
 * The order is NOT marked PAID here. Only the callback handler can do that.
 *
 * Environment variables required:
 *   MPESA_BASE_URL         - Sandbox: https://sandbox.safaricom.co.ke
 *   MPESA_SHORTCODE        - Sandbox: 174379
 *   MPESA_PASSKEY          - Sandbox passkey from Daraja portal
 *   MPESA_CALLBACK_URL     - Your HTTPS callback URL (must be publicly accessible)
 */

import { getMpesaToken } from "./token";

const MPESA_BASE_URL = process.env.MPESA_BASE_URL ?? "https://sandbox.safaricom.co.ke";
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE ?? "174379";
const MPESA_PASSKEY = process.env.MPESA_PASSKEY ?? "";
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL ?? "";

export interface StkPushRequest {
  phoneNumber: string;   // In format 2547XXXXXXXX
  amount: number;        // Integer KES amount
  orderId: string;       // Used as AccountReference
  description?: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

function getTimestamp(): string {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14); // YYYYMMDDHHMMSS
}

function getPassword(timestamp: string): string {
  const raw = `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

export async function initiateStkPush(
  req: StkPushRequest
): Promise<StkPushResponse> {
  if (!MPESA_PASSKEY) {
    throw new Error("MPESA_PASSKEY env var is not set.");
  }
  if (!MPESA_CALLBACK_URL) {
    throw new Error("MPESA_CALLBACK_URL env var is not set.");
  }

  const token = await getMpesaToken();
  const timestamp = getTimestamp();
  const password = getPassword(timestamp);

  const body = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: req.amount,
    PartyA: req.phoneNumber,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: req.phoneNumber,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: req.orderId,
    TransactionDesc: req.description ?? `Payment for order ${req.orderId}`,
  };

  const response = await fetch(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`STK Push failed: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as StkPushResponse;

  if (data.ResponseCode !== "0") {
    throw new Error(
      `STK Push rejected: ${data.ResponseDescription ?? "Unknown error"}`
    );
  }

  return data;
}
