-- CreateTable
CREATE TABLE "wife_transfers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "paymentYear" INTEGER NOT NULL,
    "paymentMonth" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transferDate" DATE NOT NULL,
    "sourceAccountId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wife_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wife_transfers_userId_idx" ON "wife_transfers"("userId");

-- CreateIndex
CREATE INDEX "wife_transfers_userId_paymentYear_paymentMonth_idx" ON "wife_transfers"("userId", "paymentYear", "paymentMonth");

-- CreateIndex
CREATE INDEX "wife_transfers_transferDate_idx" ON "wife_transfers"("transferDate");

-- CreateIndex
CREATE INDEX "wife_transfers_sourceAccountId_idx" ON "wife_transfers"("sourceAccountId");

-- AddForeignKey
ALTER TABLE "wife_transfers" ADD CONSTRAINT "wife_transfers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wife_transfers" ADD CONSTRAINT "wife_transfers_sourceAccountId_fkey" FOREIGN KEY ("sourceAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
