-- CreateTable
CREATE TABLE "debt_collectors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "commission_rate" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "debt_collectors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collection_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "collector_id" TEXT NOT NULL,
    "rate_snapshot" REAL NOT NULL,
    "assigned_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" DATETIME,
    "end_reason" TEXT,
    "commission_cents" INTEGER,
    CONSTRAINT "collection_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collection_assignments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "collection_assignments_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "debt_collectors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "collection_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignment_id" TEXT NOT NULL,
    "occurred_at" DATETIME NOT NULL,
    "outcome" TEXT NOT NULL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collection_activities_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "collection_assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "debt_collectors_user_id_idx" ON "debt_collectors"("user_id");

-- CreateIndex
CREATE INDEX "collection_assignments_invoice_id_ended_at_idx" ON "collection_assignments"("invoice_id", "ended_at");

-- CreateIndex
CREATE INDEX "collection_assignments_collector_id_ended_at_idx" ON "collection_assignments"("collector_id", "ended_at");

-- CreateIndex
CREATE INDEX "collection_assignments_user_id_idx" ON "collection_assignments"("user_id");

-- CreateIndex
CREATE INDEX "collection_activities_assignment_id_idx" ON "collection_activities"("assignment_id");

