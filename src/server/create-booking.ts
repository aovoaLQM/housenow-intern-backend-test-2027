import type { Selectable } from "kysely";
import type {
  AppDatabase,
  BookingTable,
} from "../db";
import { jsonError } from "../errors";

interface CreateBookingBody {
  userId?: unknown;
  slotId?: unknown;
  idempotencyKey?: unknown;
}

type Booking = Selectable<BookingTable>;

function serializeBooking(row: Booking) {
  return {
    id: row.id,
    userId: row.user_id,
    slotId: row.slot_id,
    status: row.status,
  };
}

async function readBody(request: Request): Promise<CreateBookingBody | null> {
  try {
    return (await request.json()) as CreateBookingBody;
  } catch {
    return null;
  }
}

export async function handleCreateBookingRequest(
  request: Request,
  db: AppDatabase,
): Promise<Response> {
  const body = await readBody(request);
  const { userId, slotId, idempotencyKey } = body ?? {};

  if (
    !Number.isInteger(userId) ||
    !Number.isInteger(slotId) ||
    typeof idempotencyKey !== "string" ||
    idempotencyKey.trim().length === 0
  ) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "userId, slotId and idempotencyKey are required",
    );
  }

  const user = await db
    .selectFrom("users")
    .select("id")
    .where("id", "=", userId as number)
    .executeTakeFirst();

  if (!user) {
    return jsonError(404, "USER_NOT_FOUND", "User was not found");
  }

  const slot = await db
    .selectFrom("slots")
    .select(["id", "remaining"])
    .where("id", "=", slotId as number)
    .executeTakeFirst();

  if (!slot) {
    return jsonError(404, "SLOT_NOT_FOUND", "Slot was not found");
  }

  if (slot.remaining <= 0) {
    return jsonError(409, "SLOT_FULL", "Slot is fully booked");
  }

  try {
    const booking = await db
      .insertInto("bookings")
      .values({
        user_id: userId as number,
        slot_id: slotId as number,
        idempotency_key: idempotencyKey,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    await db
      .updateTable("slots")
      .set(({ eb }) => ({
        remaining: eb("remaining", "-", 1),
      }))
      .where("id", "=", slotId as number)
      .execute();

    return Response.json(serializeBooking(booking), { status: 201 });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Unexpected booking error");
  }
}
