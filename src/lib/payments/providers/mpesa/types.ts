/**
 * M-PESA Callback Payload Types
 *
 * These types represent the exact structure Safaricom sends
 * to our CallBackURL after an STK Push transaction completes.
 */

export interface MpesaCallbackItem {
  Name: string;
  Value?: string | number;
}

export interface MpesaCallbackMetadata {
  Item: MpesaCallbackItem[];
}

export interface MpesaStkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;        // 0 = success, anything else = failure
  ResultDesc: string;
  CallbackMetadata?: MpesaCallbackMetadata;  // Only present when ResultCode === 0
}

export interface MpesaCallbackPayload {
  Body: {
    stkCallback: MpesaStkCallback;
  };
}

/**
 * Extract a named value from CallbackMetadata.Item array
 */
export function extractMetadataValue(
  metadata: MpesaCallbackMetadata,
  name: string
): string | number | undefined {
  return metadata.Item.find((i) => i.Name === name)?.Value;
}
