import Transactions from "@/components/StockTransactions";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/transactions/")({
  component: TransactionsPage,
});

function TransactionsPage() {
  return (
    <div>
      <h2>Transactions</h2>

      <Transactions />
    </div>
  );
}
