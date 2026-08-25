-- DropForeignKey
ALTER TABLE "monthly_payments" DROP CONSTRAINT "monthly_payments_commitmentId_fkey";

-- DropForeignKey
ALTER TABLE "monthly_payments" DROP CONSTRAINT "monthly_payments_installmentId_fkey";

-- CreateTable
CREATE TABLE "credit_card_statements" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "statementYear" INTEGER NOT NULL,
    "statementMonth" INTEGER NOT NULL,
    "statementDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "statementBalance" DECIMAL(12,2) NOT NULL,
    "minimumPayment" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_card_statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_card_statements_userId_idx" ON "credit_card_statements"("userId");

-- CreateIndex
CREATE INDEX "credit_card_statements_accountId_idx" ON "credit_card_statements"("accountId");

-- CreateIndex
CREATE INDEX "credit_card_statements_userId_accountId_idx" ON "credit_card_statements"("userId", "accountId");

-- CreateIndex
CREATE INDEX "credit_card_statements_statementYear_statementMonth_idx" ON "credit_card_statements"("statementYear", "statementMonth");

-- CreateIndex
CREATE INDEX "credit_card_statements_dueDate_idx" ON "credit_card_statements"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_statements_userId_accountId_statementYear_state_key" ON "credit_card_statements"("userId", "accountId", "statementYear", "statementMonth");

-- AddForeignKey
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "commitments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_payments" ADD CONSTRAINT "monthly_payments_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_statements" ADD CONSTRAINT "credit_card_statements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_statements" ADD CONSTRAINT "credit_card_statements_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "monthly_payments_userId_installmentId_paymentYear_paymentMon_ke" RENAME TO "monthly_payments_userId_installmentId_paymentYear_paymentMo_key";
