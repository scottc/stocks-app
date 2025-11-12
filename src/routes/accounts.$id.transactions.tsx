import client from "@/client";
import { toAUD } from "@/store/lib";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import type { CSSProperties } from "react";

export const Route = createFileRoute("/accounts/$id/transactions")({
  component: TransactionsPage,
  loader: async ({ params }) =>
    await client.api.commsec.accounts({ id: params.id }).transactions.get(),
});

const style: CSSProperties = {
  border: "2px solid rgb(140 140 140)",
  borderCollapse: "collapse",
};

function TransactionsPage() {
  const v =
    useLoaderData({ from: "/accounts/$id/transactions" }).data?.value ?? [];

  return (
    <div>
      <h2>Transactions</h2>

      <table style={style}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference</th>
            <th>Details</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {v.map((t) => (
            <tr key={t.reference}>
              <td>{t.date}</td>
              <td>
                <Link
                  to="/accounts/$id/transactions/$txid"
                  params={{ id: "0", txid: t.reference }}
                >
                  {t.reference}
                </Link>
              </td>
              <td>
                <Details details={t.details} />
              </td>
              <td>{toAUD(t.debit)}</td>
              <td>{toAUD(t.credit)}</td>
              <td>{toAUD(t.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={(_e) => alert("TODO: Implement missing feature.")}>
        Import Commsec Transactions
      </button>

      <p>
        Commsec{" | "}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www2.commsec.com.au/Portfolio/transactions"
        >
          Transactions
        </a>
      </p>
    </div>
  );
}

const Details: React.FC<{ details: string }> = ({ details }) => {
  const ds = details.split(" ");

  return (
    <>
      {ds[0]} {ds[1]}{" "}
      <Link
        to="/efts/$id/chart"
        params={{ id: ds[2]?.toLowerCase() ?? "ID_NOT_FOUND" }}
      >
        {ds[2]}
      </Link>{" "}
      {ds[3]} {ds[4]}
    </>
  );
};
