import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/transactions/$transactionId")({
  component: TransactionPage,
});

function TransactionPage() {
  return <div>Page 3</div>;
}
