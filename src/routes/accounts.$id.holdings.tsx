import client from "@/client";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import type { CSSProperties } from "react";

export const Route = createFileRoute("/accounts/$id/holdings")({
  component: HoldingsPage,
  loader: async ({ params }) =>
    await client.api.commsec.accounts({ id: params.id }).holdings.get(),
});

const style: CSSProperties = {
  border: "2px solid rgb(140 140 140)",
  borderCollapse: "collapse",
};

function HoldingsPage() {
  const v = useLoaderData({ from: "/accounts/$id/holdings" }).data?.value;

  if (v === undefined) return <></>;

  return (
    <div>
      <h2>Holdings</h2>

      <p>{v.asOfDateTime}</p>

      <table style={style}>
        <thead>
          <tr>
            <th>availUnits</th>
            <th>changePercent</th>
            <th>changePrice</th>
            <th>code</th>
            <th>lastPrice</th>
            <th>marketValue</th>
            <th>profitLoss</th>
            <th>profitLossPercent</th>
            <th>purchasePrice</th>
            <th>valueChange</th>
            <th>weightPercent</th>
          </tr>
        </thead>
        <tbody>
          {v.holdings.map((h) => (
            <tr key={h.code} /* TODO: is this key unique? */>
              <td>{h.availUnits}</td>
              <td>{h.changePercent}</td>
              <td>{h.changePrice}</td>
              <td>
                <Link
                  to="/efts/$id/chart"
                  params={{ id: h.code.toLowerCase() }}
                >
                  {h.code}
                </Link>
              </td>
              <td>{h.lastPrice}</td>
              <td>{h.marketValue}</td>
              <td>{h.profitLoss}</td>
              <td>{h.profitLossPercent}</td>
              <td>{h.purchasePrice}</td>
              <td>{h.valueChange}</td>
              <td>{h.weightPercent}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Summary:</h4>
      <p>
        marketValue: {v.summary.marketValue}
        <br />
        profitLoss: {v.summary.profitLoss}
        <br />
        profitLossPercent: {v.summary.profitLossPercent}
        <br />
        valueChange: {v.summary.valueChange}
        <br />
        weightPercent: {v.summary.weightPercent}
        <br />
      </p>

      <button onClick={(_e) => alert("TODO: Not Yet Implemented.")}>
        Import Commsec Holdings CSV
      </button>

      <p>
        Commsec{" | "}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www2.commsec.com.au/Portfolio/holdings"
        >
          Holdings
        </a>
      </p>
    </div>
  );
}
