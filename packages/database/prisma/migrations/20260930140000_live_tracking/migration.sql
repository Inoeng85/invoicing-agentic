-- AlterTable
ALTER TABLE "clients" ADD COLUMN "latitude" REAL;
ALTER TABLE "clients" ADD COLUMN "longitude" REAL;

-- AlterTable
ALTER TABLE "collection_assignments" ADD COLUMN "last_accuracy_m" REAL;
ALTER TABLE "collection_assignments" ADD COLUMN "last_latitude" REAL;
ALTER TABLE "collection_assignments" ADD COLUMN "last_location_at" DATETIME;
ALTER TABLE "collection_assignments" ADD COLUMN "last_longitude" REAL;
ALTER TABLE "collection_assignments" ADD COLUMN "tracking_token" TEXT;

-- CreateTable
CREATE TABLE "collector_locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignment_id" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "accuracy_m" REAL,
    "recorded_at" DATETIME NOT NULL,
    "received_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collector_locations_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "collection_assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "collector_locations_assignment_id_recorded_at_idx" ON "collector_locations"("assignment_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "collection_assignments_tracking_token_key" ON "collection_assignments"("tracking_token");

