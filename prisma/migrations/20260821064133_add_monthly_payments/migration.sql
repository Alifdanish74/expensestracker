-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AMOUNT_REQUIRED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'SKIPPED');

-- CreateTable
CREATE TABLE "monthly_payments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "commitmentId" UUID NOT NULL,
    "paymentYear" INTEGER NOT NULL,
    "paymentMonth" INTEGER NOT NULL,
    "plannedAmount" DECIMAL(12,2) NOT NULL,
    "actualAmount" DECIMAL(12,2),
    "dueDate" DATE NOT NULL,
    "paidDate" DATE,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "variableAmount" BOOLEAN NOT NULL DEFAULT false,
    "transferToWife" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" UUID NOT NULL,
    "accountId" UUID,
    "commitmentName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_payments_userId_idx" ON "monthly_payments"("userId");

-- CreateIndex
CREATE INDEX "monthly_payments_userId_paymentYear_paymentMonth_idx" ON "monthly_payments"("userId", "paymentYear", "paymentMonth");

-- CreateIndex
CREATE INDEX "monthly_payments_commitmentId_idx" ON "monthly_payments"("commitmentId");

-- CreateIndex
CREATE INDEX "monthly_payments_status_idx" ON "monthly_payments"("status");

-- CreateIndex
CREATE INDEX "monthly_payments_dueDate_idx" ON "monthly_payments"("dueDate");

-- CreateIndex
CREATE INDEX "monthly_payments_transferToWife_idx" ON "monthly_payments"("transferToWife");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_payments_userId_commitmentId_paymentYear_paymentMon_key" ON "monthly_payments"("userId", "commitmentId", "paymentYear", "paymentMonth");

-- AddForeignKey
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "commitments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
