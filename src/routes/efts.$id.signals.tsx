import client from "@/client";
import Signals from "@/components/Signals";
import { last, type CrossExchangeTickerSymbol } from "@/store/lib";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";

import type { CSSProperties } from "react";
import React from "react";

export const Route = createFileRoute("/efts/$id/signals")({
  component: EftPage,
  loader: async ({ params }) =>
    await client.api.yahoo
      .chart({ symbol: `${params.id.toUpperCase()}.AX` })({ interval: "1d" })
      .get(),
});

function EftPage() {
  const { id } = Route.useParams();
  const d = useLoaderData({ from: "/efts/$id/signals" });

  const r = d.data?.value?.chart.result[0];
  const q = last(r?.indicators.quote);
  const adjclose = r?.indicators.adjclose[0]?.adjclose ?? [];

  return (
    <>
      <Signals
        symbol={{ yahoo: `${id.toUpperCase()}.AX`, commsec: id.toUpperCase() }}
        history={99999999}
      />
    </>
  );
}
