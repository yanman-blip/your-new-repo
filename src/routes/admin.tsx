import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  loader: ({ location }) => {
    if (location.pathname === "/admin") {
      throw redirect({ to: "/admin/orders" });
    }
  },
});
