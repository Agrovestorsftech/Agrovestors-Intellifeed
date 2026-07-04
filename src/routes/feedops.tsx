import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/feedops")({
  component: () => <Outlet />,
});