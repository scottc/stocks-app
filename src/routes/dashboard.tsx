import App from "@/components/App";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: IndexPage,
});

function IndexPage() {
  return <App />;
}
