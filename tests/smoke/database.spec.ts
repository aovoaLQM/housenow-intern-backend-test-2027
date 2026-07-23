import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabase,
  migrateDatabase,
  seedDatabase,
  type AppDatabase,
} from "../../src/db";

describe("starter repository", () => {
  let db: AppDatabase;

  beforeAll(async () => {
    db = createDatabase();
    await migrateDatabase(db);
    await seedDatabase(db);
  });

  afterAll(async () => {
    await db.destroy();
  });

  it("creates and seeds the Kysely database", async () => {
    const users = await db
      .selectFrom("users")
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow();

    expect(Number(users.count)).toBe(3);
  });
});
