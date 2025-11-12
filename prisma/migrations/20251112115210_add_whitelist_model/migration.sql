-- CreateTable
CREATE TABLE "Whitelist" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "addedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Whitelist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Whitelist_address_key" ON "Whitelist"("address");

-- CreateIndex
CREATE INDEX "Whitelist_address_idx" ON "Whitelist"("address");
