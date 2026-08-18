-- AlterTable: add CheckoutRequestID and MerchantRequestID to Payment
ALTER TABLE "Payment" ADD COLUMN "checkoutRequestId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "merchantRequestId" TEXT;

-- CreateIndex: CheckoutRequestID must be globally unique for idempotency
CREATE UNIQUE INDEX "Payment_checkoutRequestId_key" ON "Payment"("checkoutRequestId");
