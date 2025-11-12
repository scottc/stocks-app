import client from "@/client";
import { Card } from "@/components/Card";
import type { HoldingEntry } from "@/data-loaders/commsec/holdings";
import type { YahooChartResultItem } from "@/data-loaders/yahoo-finance-charts";
import {
  toAUD,
  toIntegerAU,
  type CrossExchangeTickerSymbol,
} from "@/store/lib";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";

const watchList: CrossExchangeTickerSymbol[] = [
  {
    // ASX All Ordinaries Australia
    yahoo: "^AORD",
    commsec: "XAO",
  },
];

export const Route = createFileRoute("/dashboard")({
  component: IndexPage,
  loader: async () => {
    const accountIds = (await client.api.commsec.accounts.get()).data ?? [];

    const fetchIds = accountIds.map((id) =>
      client.api.commsec.accounts({ id }).holdings.get(),
    );

    const holdings = (await Promise.all(fetchIds))
      .map((r) => r.data?.value)
      .filter((acc) => acc !== undefined);

    const codes = holdings.flatMap((h) => h.holdings).map((h) => h.code); // TODO filter by unique...

    const fetchData = codes.map((c) =>
      client.api.yahoo
        .chart({ symbol: `${c}.AX` })({ interval: "1d" })
        .get(),
    );
    const wl = watchList.map((c) =>
      client.api.yahoo
        .chart({ symbol: `${c}.AX` })({ interval: "1d" })
        .get(),
    );

    const securities = (await Promise.all([...fetchData, ...wl]))
      .map((r) => r.data?.value?.chart.result[0])
      .filter((x) => x !== undefined);

    return {
      accountIds,
      holdings,
      securities,
    };
  },
});

function IndexPage() {
  const { accountIds, holdings, securities } = useLoaderData({
    from: "/dashboard",
  });

  const totalUnits = holdings.reduce(
    (a, b, c) => a + b.holdings.reduce((x, y, z) => x + y.availUnits, 0),
    0,
  );

  const totalPurchasePrice = holdings.reduce(
    (a, b, c) =>
      a + b.holdings.reduce((x, y, z) => x + y.availUnits * y.purchasePrice, 0),
    0,
  );

  const totalCurrentPrice = holdings.reduce(
    (a, b, c) =>
      a +
      b.holdings.reduce((phv, holding, z) => {
        const sec = securities.find(
          (s) => s.meta.symbol === holding.code + ".AX",
        );
        const len = sec?.timestamp.length ?? 0;
        const lastIndex = len - 1;
        const lastClose = sec?.indicators.quote[0]?.close[lastIndex] ?? 0;
        const value = lastClose * holding.availUnits;

        return phv + value;
      }, 0),
    0,
  );

  return (
    <>
      <Card>
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "20% 20% 20% 20% 20%",
            gridTemplateRows: "auto",
          }}
        >
          <div>
            <strong>Total Units</strong>: {totalUnits}
          </div>
          <div>
            <strong>Total Purchase Price</strong>: {toAUD(totalPurchasePrice)}
            <br />
            <small>(Includes Purchase Costs)</small>
          </div>
          <div>
            <strong>Total Current Price</strong>: {toAUD(totalCurrentPrice)}
            <br />
            <small>(Excludes Purchase Costs)</small>
          </div>
          <div>
            <strong>Total P/L</strong>:{" "}
            {toAUD(totalCurrentPrice - totalPurchasePrice)}
          </div>
          <div>
            <strong>Total P/L %</strong>: {0}
          </div>
        </div>
      </Card>
      <Card>
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "20% 20% 20% 20% 20%",
            gridTemplateRows: "auto",
          }}
        >
          <div>
            <strong>One-Day Change: {0}</strong>
          </div>
          <div>
            <strong>Two-Day Change: {0}</strong>
          </div>
          <div>
            <strong>Three-Day Change: {0}</strong>
          </div>
          <div>
            <strong>Four-Day Change: {0}</strong>
          </div>
          <div>
            <strong>Five-Day Change: {0}</strong>
          </div>
        </div>
        <div>
          <small>(By portfolio units, excludes time of purchase.)</small>
        </div>
      </Card>
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "33% 34% 33%",
          gridTemplateRows: "auto",
        }}
      >
        {holdings
          .flatMap((h) => h.holdings)
          .filter((h) => h.availUnits !== 0)
          .map((h) => (
            <SecurityCard
              key={h.code}
              holding={h}
              chart={
                securities.find((s) => s?.meta.symbol === h.code + ".AX") as any
              }
            />
          ))}
      </div>
    </>
  );
}

const SecurityCard: React.FC<{
  holding: HoldingEntry;
  chart: YahooChartResultItem;
}> = ({ holding, chart }) => {
  const len = chart?.timestamp.length;
  const lastIndex = len - 1;
  const lastPriceIndex =
    chart?.indicators.quote[0]?.close.findLastIndex(
      (c) => c !== null && c !== undefined,
    ) ?? lastIndex;

  return (
    <Card>
      <h3>
        {chart.meta.exchangeName}
        {" -> ASX - "}
        <Link to="/efts/$id" params={{ id: holding.code }}>
          {holding.code}
        </Link>
        {" - "}
        {chart.meta.longName}
        {" - "}
        {chart.meta.exchangeTimezoneName}
      </h3>
      <div>Units: {toIntegerAU(holding.availUnits)}</div>
      <div>
        Purchase Price: {toAUD(holding.purchasePrice)}{" "}
        <small>(Includes Broker Fee)</small>
      </div>
      <div>
        Current Price:{" "}
        {toAUD(chart?.indicators.quote[0]?.close[lastPriceIndex] ?? 0)}
      </div>
      <div>
        <abbr title="Profit / Loss">P/L</abbr>:{" "}
        {(chart?.indicators.quote[0]?.close[lastPriceIndex] ?? 0) -
          holding.purchasePrice}
      </div>
      <div>
        <abbr title="Profit / Loss %">P/L%</abbr>:{" "}
        {(chart?.indicators.quote[0]?.close[lastPriceIndex] ?? 0) -
          holding.purchasePrice}
      </div>
      <div>
        Current Date:{" "}
        {new Date((chart?.timestamp[lastPriceIndex] ?? 0) * 1000).toISOString()}
      </div>

      <div>
        First Date: {new Date((chart?.timestamp[0] ?? 0) * 1000).toISOString()}
      </div>

      <div>
        Ticks: {chart?.timestamp.length ?? 0} @ {chart?.meta.dataGranularity}
      </div>

      <table>
        <thead>
          <tr>
            <th>T</th>
            {/*
            <th>O</th>
            <th>H</th>
            <th>L</th>
             */}
            <th>C</th>
            <th>V</th>
          </tr>
        </thead>
        <tbody>
          {Array(len)
            .fill(0)
            .map((_, i) => (
              <tr>
                <td>
                  {new Date((chart.timestamp[i] ?? 0) * 1000)
                    .toISOString()
                    .substring(0, 16)}
                </td>
                {/*
                <td>{chart.indicators.quote[0]?.open[i]}</td>
                <td>{chart.indicators.quote[0]?.high[i]}</td>
                <td>{chart.indicators.quote[0]?.low[i]}</td>
                 */}
                <td>{chart.indicators.quote[0]?.close[i] ?? "-"}</td>
                <td>{chart.indicators.quote[0]?.volume[i] ?? "-"}</td>
              </tr>
            ))
            .reverse()
            .slice(0, 20)}
        </tbody>
      </table>
    </Card>
  );
};
