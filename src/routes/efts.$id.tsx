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
import {
  createFileRoute,
  Link,
  Outlet,
  useLoaderData,
} from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type AccessorFnColumnDef,
  type AccessorKeyColumnDef,
} from "@tanstack/react-table";
import type { CSSProperties } from "react";
import React from "react";

export const Route = createFileRoute("/efts/$id")({
  component: EftPage,
  loader: async ({ params }) =>
    await client.api.yahoo
      .chart({ symbol: `${params.id.toUpperCase()}.AX` })
      .get(),
});

function EftPage() {
  const { id } = Route.useParams();
  const d = useLoaderData({ from: "/efts/$id" });

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
      <Toolbar>
        <Link to="/efts/$id/table" params={{ id }}>
          View Raw Data
        </Link>
        {" | "}
        <Link to="/efts/$id/chart" params={{ id }}>
          View Chart
        </Link>
        {" | "}
        <Link to="/efts/$id/chart-webgpu" params={{ id }}>
          WebGPU Experiment
        </Link>
      </Toolbar>

      <h2 style={{ textAlign: "center" }}>{id.toUpperCase()}</h2>

      <Link to="/efts/$id/table" params={{ id }}>
        View Raw Data
      </Link>
      {" | "}
      <Link to="/efts/$id/chart" params={{ id }}>
        View Chart
      </Link>
      {" | "}
      <Link to="/efts/$id/chart-webgpu" params={{ id }}>
        WebGPU Experiment
      </Link>

      <Outlet />
      {/*

        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "33% 33% 33%",
            gridTemplateRows: "auto",
          }}
        >
          <StockTicker symbol={symbol} history={20} />
          <CommsecLinks code={symbol.commsec} />
          <YahooLinks p={symbol.yahoo} />
          <ScoreCard ticker={symbol} />
          <Signals symbol={symbol} history={20} />
          <StockChart symbol={symbol} history={20} />
        </div>

        */}
    </>
  );
}
