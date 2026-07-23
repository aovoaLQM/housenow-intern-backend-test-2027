import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getRuntimeDatabase } from "../../db";
import { handleCreateBookingRequest } from "../../server/create-booking";

export const Route = createFileRoute("/api/bookings")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        handleCreateBookingRequest(request, await getRuntimeDatabase()),
    },
  },
});
