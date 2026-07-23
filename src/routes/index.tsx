import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main>
      <p className="eyebrow">HouseNow Engineering</p>
      <h1>Backend Intern Mini Test</h1>
      <p>
        Complete <code>POST /api/bookings</code> using TanStack Start, TanStack
        Router and Kysely.
      </p>
      <pre>npm test</pre>
    </main>
  );
}
