import client from "@/client";
import { Toolbar } from "@/components/App";
import { CommsecLinks, YahooLinks } from "@/components/CommsecLinks";
import { ScoreCard } from "@/components/Score";
import Signals from "@/components/Signals";
import StockChart from "@/components/StockChart";
import StockTable from "@/components/StockTable";
import StockTicker from "@/components/StockTicker";
import type { YahooChartResultItem } from "@/data-loaders/yahoo-finance-charts";
import {
  color,
  last,
  match,
  pctDiff,
  toAUD,
  toDecimalAU,
  toPercentAU,
  type CrossExchangeTickerSymbol,
} from "@/store/lib";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type AccessorFnColumnDef,
  type AccessorKeyColumnDef,
} from "@tanstack/react-table";
import type { CSSProperties } from "react";
import React from "react";

export const Route = createFileRoute("/efts/$id/table")({
  component: EftPage,
  loader: async ({ params }) =>
    await client.api.yahoo
      .chart({ symbol: `${params.id.toUpperCase()}.AX` })({ interval: "1d" })
      .get(),
});

function EftPage() {
  const { id } = Route.useParams();
  const d = useLoaderData({ from: "/efts/$id/table" });

  const symbol: CrossExchangeTickerSymbol = {
    commsec: id.toUpperCase(),
    yahoo: `${id}.AX`.toUpperCase(),
  };

  const r = d.data?.value?.chart.result[0];
  const q = last(r?.indicators.quote);
  const adjclose = r?.indicators.adjclose[0]?.adjclose ?? [];
  const style: CSSProperties = {
    border: "2px solid rgb(140 140 140)",
    borderCollapse: "collapse",
  };
  const startat = 0;

  /*
  const table = useReactTable({
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    data: data, //note: data needs a "stable" reference in order to prevent infinite re-renders
  });
*/

  return (
    <>
      <table style={style}>
        <thead>
          <tr>
            {/* <th style={style} scope="col">i</th> */}
            <th style={style} scope="col">
              date
            </th>
            <th style={style} scope="col">
              adjclose
            </th>
            <th style={style} scope="col">
              open
            </th>
            <th style={style} scope="col">
              high
            </th>
            <th style={style} scope="col">
              low
            </th>
            <th style={style} scope="col">
              volume
            </th>
          </tr>
        </thead>
        <tbody>
          {r?.timestamp
            .slice(startat)
            .map((ts, index) => {
              const i = startat + index;

              return (
                <React.Fragment key={ts}>
                  <tr>
                    <td
                      style={q?.volume[i] ? style : { backgroundColor: "#f00" }}
                    >
                      {new Date(ts * 1000).toISOString().substring(0, 10)}
                    </td>
                    <td style={style}>{toAUD(adjclose[i] ?? 0)}</td>
                    <td style={style}>{toAUD(q?.open[i] ?? 0)}</td>
                    <td style={style}>{toAUD(q?.high[i] ?? 0)}</td>
                    <td style={style}>{toAUD(q?.low[i] ?? 0)}</td>
                    <td
                      style={q?.volume[i] ? style : { backgroundColor: "#f00" }}
                    >
                      {toDecimalAU(q?.volume[i] ?? 0)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })
            .reverse() ?? <></>}
        </tbody>
      </table>
    </>
  );
}
