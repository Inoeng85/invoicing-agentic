-- AlterTable
ALTER TABLE "debt_collectors" ADD COLUMN "photo_updated_at" DATETIME;

-- CreateTable
CREATE TABLE "debt_collector_photos" (
    "collector_id" TEXT NOT NULL PRIMARY KEY,
    "bytes" BLOB NOT NULL,
    "mime_type" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "debt_collector_photos_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "debt_collectors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

