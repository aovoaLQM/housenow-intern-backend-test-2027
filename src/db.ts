import SqliteDatabase from "better-sqlite3";
import {
  Kysely,
  SqliteDialect,
  sql,
  type ColumnType,
  type Generated,
} from "kysely";

interface UserTable {
  id: number;
  name: string;
}

interface SlotTable {
  id: number;
  capacity: number;
  remaining: number;
  starts_at: string;
}

export interface BookingTable {
  id: Generated<number>;
  user_id: number;
  slot_id: number;
  idempotency_key: string;
  status: ColumnType<"CONFIRMED", "CONFIRMED" | undefined, never>;
  created_at: ColumnType<string, string | undefined, never>;
}

export interface DatabaseSchema {
  users: UserTable;
  slots: SlotTable;
  bookings: BookingTable;
}

export type AppDatabase = Kysely<DatabaseSchema>;

export function createDatabase(filename = ":memory:"): AppDatabase {
  const sqlite = new SqliteDatabase(filename);

  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  if (filename !== ":memory:") {
    sqlite.pragma("journal_mode = WAL");
  }

  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({ database: sqlite }),
  });
}

export async function migrateDatabase(db: AppDatabase): Promise<void> {
  await db.schema
    .createTable("users")
    .ifNotExists()
    .addColumn("id", "integer", (column) => column.primaryKey())
    .addColumn("name", "text", (column) => column.notNull())
    .execute();

  await db.schema
    .createTable("slots")
    .ifNotExists()
    .addColumn("id", "integer", (column) => column.primaryKey())
    .addColumn("capacity", "integer", (column) => column.notNull())
    .addColumn("remaining", "integer", (column) => column.notNull())
    .addColumn("starts_at", "text", (column) => column.notNull())
    .addCheckConstraint("slots_capacity_nonnegative", sql`capacity >= 0`)
    .addCheckConstraint("slots_remaining_nonnegative", sql`remaining >= 0`)
    .execute();

  await db.schema
    .createTable("bookings")
    .ifNotExists()
    .addColumn("id", "integer", (column) =>
      column.primaryKey().autoIncrement(),
    )
    .addColumn("user_id", "integer", (column) =>
      column.notNull().references("users.id"),
    )
    .addColumn("slot_id", "integer", (column) =>
      column.notNull().references("slots.id"),
    )
    .addColumn("idempotency_key", "text", (column) =>
      column.notNull().unique(),
    )
    .addColumn("status", "text", (column) =>
      column.notNull().defaultTo("CONFIRMED"),
    )
    .addColumn("created_at", "text", (column) =>
      column.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
    )
    .addUniqueConstraint("bookings_user_slot_unique", ["user_id", "slot_id"])
    .execute();
}

export async function seedDatabase(db: AppDatabase): Promise<void> {
  await db.transaction().execute(async (transaction) => {
    await transaction.deleteFrom("bookings").execute();
    await transaction.deleteFrom("slots").execute();
    await transaction.deleteFrom("users").execute();
    await sql`DELETE FROM sqlite_sequence WHERE name = 'bookings'`.execute(
      transaction,
    );

    await transaction
      .insertInto("users")
      .values([
        { id: 1, name: "An" },
        { id: 2, name: "Binh" },
        { id: 3, name: "Chi" },
      ])
      .execute();

    await transaction
      .insertInto("slots")
      .values([
        {
          id: 10,
          capacity: 2,
          remaining: 2,
          starts_at: "2027-01-10T09:00:00.000Z",
        },
        {
          id: 11,
          capacity: 1,
          remaining: 0,
          starts_at: "2027-01-10T10:00:00.000Z",
        },
        {
          id: 12,
          capacity: 1,
          remaining: 1,
          starts_at: "2027-01-10T11:00:00.000Z",
        },
      ])
      .execute();
  });
}

let runtimeDatabasePromise: Promise<AppDatabase> | undefined;

export function getRuntimeDatabase(): Promise<AppDatabase> {
  runtimeDatabasePromise ??= (async () => {
    const db = createDatabase(
      process.env.DATABASE_FILE ?? "booking.sqlite",
    );
    await migrateDatabase(db);

    const existing = await db
      .selectFrom("users")
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirstOrThrow();

    if (Number(existing.count) === 0) {
      await seedDatabase(db);
    }

    return db;
  })();

  return runtimeDatabasePromise;
}
