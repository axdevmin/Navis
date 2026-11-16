import * as sqlite from "sqlite";

export const migrate = async (deps: { db: sqlite.Database }) => {
  await deps.db.exec(/* SQL */ `
    BEGIN;
    PRAGMA "user_version" = 5;
    CREATE TABLE "libraryCharacters" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "faction" TEXT NOT NULL,
      "color" TEXT NOT NULL,
      "tokenImageId" TEXT,
      "createdAt" INT NOT NULL
    );
    CREATE INDEX "index_libraryCharacters_created_at" ON "libraryCharacters" ("createdAt" DESC);
    COMMIT;
  `);
};
