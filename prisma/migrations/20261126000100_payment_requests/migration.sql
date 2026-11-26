CREATE TYPE "PaymentRequestStatus" AS ENUM ('OPEN', 'PAID', 'EXPIRED', 'CANCELLED');

CREATE TABLE "PaymentRequest" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentRequest_token_key" ON "PaymentRequest"("token");
CREATE INDEX "PaymentRequest_businessId_status_createdAt_idx" ON "PaymentRequest"("businessId", "status", "createdAt");
CREATE INDEX "PaymentRequest_orderId_idx" ON "PaymentRequest"("orderId");
ALTER TABLE "Payment" ADD COLUMN "paymentRequestId" TEXT;
CREATE INDEX "Payment_paymentRequestId_idx" ON "Payment"("paymentRequestId");
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "PaymentRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
