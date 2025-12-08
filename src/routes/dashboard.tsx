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
  // {
  //   // ASX All Ordinaries Australia
  //   yahoo: "^AORD",
  //   commsec: "XAO",
  // },
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
      client.api.yahoo.chart({ symbol: c.yahoo })({ interval: "1d" }).get(),
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

  const totalNDaysAgoPrice = (n: number) =>
    holdings.reduce(
      (a, b, c) =>
        a +
        b.holdings.reduce((phv, holding, z) => {
          const sec = securities.find(
            (s) => s.meta.symbol === holding.code + ".AX",
          );
          const len = sec?.timestamp.length ?? 0;
          const nDayIndex = len - 1 - n;
          const nDayClose = sec?.indicators.quote[0]?.close[nDayIndex] ?? 0;
          const value = nDayClose * holding.availUnits;

          return phv + value;
        }, 0),
      0,
    );

  const totalCurrentPrice = totalNDaysAgoPrice(0);

  const daysAgoToShow = 10;
  const daysAgo = Array.from(new Array(daysAgoToShow).keys()).reverse();

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
            <strong>Total Units:</strong>
            <br />
            {totalUnits}
          </div>
          <div>
            <strong>Total Purchase Price:</strong>
            <br />
            {toAUD(totalPurchasePrice)}
            <br />
            <small>(Includes Purchase Costs)</small>
          </div>
          <div>
            <strong>Total Current Price:</strong>
            <br />
            {toAUD(totalCurrentPrice)}
            <br />
            <small>(Excludes Purchase Costs)</small>
          </div>
          <div>
            <strong>Total P/L:</strong>
            <br />
            {toAUD(totalCurrentPrice - totalPurchasePrice)}
          </div>
          <div>
            <strong>Total P/L %:</strong>
            <br />
            {0} ... TODO!
          </div>
        </div>
      </Card>
      <Card>
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: daysAgo.reduce(
              (pv, cv) => `${pv} ${100 / daysAgoToShow}%`,
              "",
            ),
            gridTemplateRows: "auto",
          }}
        >
          {daysAgo.map((d) => {
            return (
              <div key={d}>
                <strong title={`${d} Days Ago`}>Day -{d}</strong>
              </div>
            );
          })}

          {daysAgo.map((d) => {
            return (
              <div key={d}>
                <strong title={`${d} Days Ago`}>
                  {toAUD(totalNDaysAgoPrice(d))}
                </strong>
              </div>
            );
          })}

          {daysAgo.map((d) => {
            const diff = totalNDaysAgoPrice(d) - totalNDaysAgoPrice(d + 1);

            let dir = 0;
            if (diff === 0) {
              dir = 0;
            } else if (diff > 0) {
              dir = 1;
            } else if (diff < 0) {
              dir = -1;
            }

            let color = "";
            switch (dir) {
              case 0:
                color = "orange";
                break;
              case 1:
                color = "green";
                break;
              case -1:
                color = "red";
                break;
            }

            return (
              <div key={d}>
                <strong title={`${d} Days Ago`} style={{ color: color }}>
                  {toAUD(diff)}
                </strong>
              </div>
            );
          })}
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

  const lastPrice = chart?.indicators.quote[0]?.close[lastPriceIndex] ?? 0;
  const diff = lastPrice - holding.purchasePrice;
  let dir = 0;
  if (diff === 0) {
    dir = 0;
  } else if (diff > 0) {
    dir = 1;
  } else {
    dir = -1;
  }

  let color = "orange";

  switch (dir) {
    case 0:
      color = "orange";
      break;
    case 1:
      color = "green";
      break;
    case -1:
      color = "red";
      break;
  }

  return (
    <Card>
      <h3>
        <Link to="/efts/$id" params={{ id: holding.code }}>
          {holding.code}
        </Link>
        &times;{toIntegerAU(holding.availUnits)}@
        <span title="Price per unit (Includes Broker Fee)">
          {toAUD(holding.purchasePrice)}
        </span>
        &#10148;{toAUD(lastPrice)}=
        <span style={{ color: color }}>
          {toAUD((lastPrice - holding.purchasePrice) * holding.availUnits)}
        </span>
      </h3>
      {/*<div>{chart.meta.longName}</div>

      <div>
        {chart.meta.exchangeName} - {chart.meta.exchangeTimezoneName}
      </div>*/}

      {/*<div>
        Current Price:{" "}
        {toAUD(chart?.indicators.quote[0]?.close[lastPriceIndex] ?? 0)}
      </div>*/}
      <div>
        <abbr title="Profit / Loss">P/L</abbr>:{" "}
        {toAUD(
          (chart?.indicators.quote[0]?.close[lastPriceIndex] ?? 0) -
            holding.purchasePrice,
        )}
      </div>
      {/*<div>
        <abbr title="Profit / Loss %">P/L%</abbr>: 0.0% ... TODO
      </div>*/}
      {/*<div>
        Current Date:{" "}
        {new Date((chart?.timestamp[lastPriceIndex] ?? 0) * 1000)
          .toISOString()
          .substring(0, 10)}
      </div>

      <div>
        First Date:{" "}
        {new Date((chart?.timestamp[0] ?? 0) * 1000)
          .toISOString()
          .substring(0, 10)}
      </div>*/}

      {/*<div>
        Ticks: {chart?.timestamp.length ?? 0} @ {chart?.meta.dataGranularity}
      </div>*/}

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
                    .substring(0, 10)}
                </td>
                {/*
                <td>{chart.indicators.quote[0]?.open[i]}</td>
                <td>{chart.indicators.quote[0]?.high[i]}</td>
                <td>{chart.indicators.quote[0]?.low[i]}</td>
                 */}
                <td>{toAUD(chart.indicators.quote[0]?.close[i] ?? 0)}</td>
                <td>
                  {toIntegerAU(chart.indicators.quote[0]?.volume[i] ?? 0)}
                </td>
              </tr>
            ))
            .reverse()
            .slice(0, 5)}
        </tbody>
      </table>
    </Card>
  );
};
