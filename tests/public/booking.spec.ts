import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createDatabase,
  migrateDatabase,
  seedDatabase,
  type AppDatabase,
} from "../../src/db";
import { handleCreateBookingRequest } from "../../src/server/create-booking";

function bookingRequest(body: unknown): Request {
  return new Request("http://localhost/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function postBooking(db: AppDatabase, body: unknown) {
  const response = await handleCreateBookingRequest(bookingRequest(body), db);
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

describe("POST /api/bookings — public tests", () => {
  let db: AppDatabase;

  beforeEach(async () => {
    db = createDatabase();
    await migrateDatabase(db);
    await seedDatabase(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("creates a valid booking", async () => {
    const response = await postBooking(db, {
      userId: 1,
      slotId: 10,
      idempotencyKey: "public-happy-path",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      userId: 1,
      slotId: 10,
      status: "CONFIRMED",
    });
    expect(response.body.id).toEqual(expect.any(Number));

    const slot = await db
      .selectFrom("slots")
      .select("remaining")
      .where("id", "=", 10)
      .executeTakeFirstOrThrow();
    expect(slot.remaining).toBe(1);
  });

  it("validates the request body", async () => {
    const response = await postBooking(db, { userId: "1", slotId: 10 });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      code: "VALIDATION_ERROR",
      message: expect.any(String),
    });
  });

  it("returns 404 for a missing user", async () => {
    const response = await postBooking(db, {
      userId: 999,
      slotId: 10,
      idempotencyKey: "missing-user",
    });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("USER_NOT_FOUND");
  });

});
