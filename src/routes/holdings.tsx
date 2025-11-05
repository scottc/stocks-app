import Holdings from "@/components/StockHoldings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/holdings")({
  component: HoldingsPage,
});

function HoldingsPage() {
  return (
    <div>
      <h2>Holdings</h2>
      {/* TODO: from loader... */}
      <Holdings />
    </div>
  );
}
