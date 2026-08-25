-- AlterTable
ALTER TABLE "monthly_payments" ALTER COLUMN "commitmentId" DROP NOT NULL,
ADD COLUMN     "installmentId" UUID;

-- CreateIndex
CREATE INDEX "monthly_payments_installmentId_idx" ON "monthly_payments"("installmentId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "monthly_payments_userId_installmentId_paymentYear_paymentMon_key" ON "monthly_payments"("userId", "installmentId", "paymentYear", "paymentMonth");

-- AddForeignKey
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "installments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_exactly_one_source_check" CHECK (
    (
        "commitmentId" IS NOT NULL
        AND "installmentId" IS NULL
    )
    OR
    (
        "commitmentId" IS NULL
        AND "installmentId" IS NOT NULL
    )
);

-- AddCheckConstraint
ALTER TABLE "installments" ADD CONSTRAINT "installments_remaining_payments_non_negative_check" CHECK ("remainingPayments" >= 0);
