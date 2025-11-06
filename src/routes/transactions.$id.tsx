import client from "@/client";
import { Card } from "@/components/Card";
import type { YahooStockData } from "@/data-loaders/yahoo-finance-charts";
import { toAUD, toDecimalAU } from "@/store/lib";
import {
  createFileRoute,
  Link,
  useLoaderData,
  useParams,
} from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/transactions/$id")({
  component: TransactionPage,
  loader: async ({ params }) => {
    const tx = (await client.api.commsec.transactions.get()).data?.value?.find(
      (tx) => tx.reference === params.id,
    );

    const stockSymbol = tx?.details.split(" ")[2];

    const chart = (
      await client.api.yahoo.chart({ symbol: `${stockSymbol}.AX` }).get()
    ).data?.value?.chart.result[0];

    return {
      transaction: tx,
      chart: chart,
    };
  },
});

interface SellTarget {
  /** When the price goes Above a specific threshold. */
  profitTarget: PriceTarget;

  /** When the price goes "To the right" a specific threshold. */
  time: TimeTarget;

  /** When the price goes Below a specific threshold. */
  stopLoss: PriceTarget;
}

type PriceTarget =
  | StaticCloseTarget
  | DynamicMaximumCloseFixedTarget
  | DynamicMaximumCloseDynamicTarget;

type TimeTarget = StaticTimeTarget;

interface StaticTimeTarget {
  type: "static_time";
  value: number;
}

interface StaticCloseTarget {
  type: "static_price_per_unit";
  value: number;
}

interface DynamicMaximumCloseFixedTarget {
  type: "maximum_price_plus_fixed";
  value: number;
}

interface DynamicMaximumCloseDynamicTarget {
  type: "maximum_price_plus_percent";
  value: number;
}

function TransactionPage() {
  const { id } = useParams({ from: "/transactions/$id" });
  const { chart, transaction } = useLoaderData({ from: "/transactions/$id" });

  const txrawdate = transaction?.date ?? "01/01/1970";
  const txdate = auDatetoDate(txrawdate);
  const txtime = txdate.getTime() / 1000;

  const quote = chart?.indicators.quote[0];

  const buyIndex = (chart?.timestamp.findIndex((v) => v > txtime) ?? 0) - 2;
  const lastIndex = (quote?.close.length ?? 0) - 1;
  const elapsedIndexes = lastIndex - buyIndex;
  const iter = [...Array(elapsedIndexes).keys()];

  const lastClose = quote?.close[lastIndex] ?? 0;
  const lastTime = chart?.timestamp[lastIndex] ?? 0;
  const firstTime = chart?.timestamp[0] ?? 0;
  const elapsedTime = lastTime - txtime;

  const parts = transaction?.details.split(" ") ?? [];
  const buyOrSell: "B" | "S" = parts[0] as any;
  const units = parseInt(parts[1] ?? "0");
  const stockSymbol = parts[2];
  const pricePerUnit = parts[4];

  const maxClose = iter.reduce(
    (pv, cv, i) =>
      (quote?.close[i + buyIndex] ?? 0) < pv
        ? pv
        : (quote?.close[i + buyIndex] ?? 0),
    0,
  );

  const minClose = iter.reduce(
    (pv, cv, i) =>
      (quote?.close[i + buyIndex] ?? 0) > pv
        ? pv
        : (quote?.close[i + buyIndex] ?? 0),
    maxClose,
  );

  const [sellTarget, setSellTarget] = useState<SellTarget>({
    stopLoss: {
      type: "static_price_per_unit",
      value: 186,
    },
    profitTarget: {
      type: "static_price_per_unit",
      value: 1000,
    },
    time: {
      type: "static_time",
      value: 1899999999,
    },
  });

  return (
    <div>
      <style>
        {`
          label {
            display: block;
          }
          table, td, th {
            border: 1px solid #666;
            border-collapse: collapse;
          }
          `}
      </style>
      <h2>Transaction {id}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "30% 30% 20% 20%",
        }}
      >
        <Card>
          <strong>Date:</strong>
          <br />
          {transaction?.date}
        </Card>

        <Card>
          <strong>{buyOrSell === "B" ? "Bought" : "Sold"}:</strong>
          <br />
          {units} &times;{" "}
          <Link
            to="/efts/$id/chart"
            params={{ id: (stockSymbol ?? "SYMBOL_NOT_FOUND").toLowerCase() }}
          >
            {stockSymbol}
          </Link>{" "}
          @ {toAUD(parseFloat(pricePerUnit ?? "0"))} ={" "}
          {toAUD(transaction?.balance ?? 0)}
        </Card>
        <div>&nbsp;</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60% 40%",
        }}
      >
        <Card>
          <h3>Activity:</h3>

          <table>
            <thead>
              <tr>
                <th></th>
                <th>Date</th>
                <th>Price</th>
                <th>Profit Per Unit</th>
                <th>Total Profit</th>
                <th>Profit Reached</th>
                <th>Time Reached</th>
                <th>Stop Loss Reached</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(elapsedIndexes).keys()]
                .map((_x, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>
                      {i === 0 ? "Entry" : ""}
                      {i === elapsedIndexes - 1 ? "Today" : ""}
                      {i === elapsedIndexes - 1 || i === 0 ? "" : "^"}
                    </td>
                    <td>
                      {new Date(
                        (chart?.timestamp[i + buyIndex + 1] ?? 0) * 1000,
                      )
                        .toISOString()
                        .substring(0, 10)}
                    </td>
                    <td>{toAUD(quote?.close[i + buyIndex + 1] ?? 0)}</td>
                    <td style={{ textAlign: "center" }}>
                      {toAUD(
                        (quote?.close[i + buyIndex + 1] ?? 0) - 184.924819,
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {toAUD(
                        ((quote?.close[i + buyIndex + 1] ?? 0) - 184.924819) *
                          269,
                      )}
                    </td>
                    <td
                      style={{
                        backgroundColor: "hsl(90, 50%, 20%)",
                        textAlign: "center",
                      }}
                    >
                      {sellTarget.profitTarget.value <
                      (quote?.close[i + buyIndex + 1] ?? 0) ? (
                        <Sell />
                      ) : (
                        <Hold />
                      )}
                    </td>
                    <td
                      style={{
                        backgroundColor: `hsl(${45 * 5}, 50%, 20%)`,
                        textAlign: "center",
                      }}
                    >
                      {sellTarget.time.value <
                      (chart?.timestamp[i + buyIndex + 1] ?? 0) ? (
                        <Sell />
                      ) : (
                        <Hold />
                      )}
                    </td>
                    <td
                      style={{
                        backgroundColor: "hsl(0, 50%, 20%)",
                        textAlign: "center",
                      }}
                    >
                      {sellTarget.stopLoss.value >
                      (quote?.close[i + buyIndex + 1] ?? 0) ? (
                        <Sell />
                      ) : (
                        <Hold />
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {i === 0 ? "Entry" : ""}
                      {i === elapsedIndexes - 1 ? "Today" : ""}
                      {i === elapsedIndexes - 1 || i === 0 ? "" : "^"}
                    </td>
                    <td>
                      {(quote?.close[i + buyIndex + 1] ?? 0) === minClose ? (
                        <RedLabel>MIN @ {toAUD(minClose)}</RedLabel>
                      ) : (
                        <></>
                      )}
                      {(quote?.close[i + buyIndex + 1] ?? 0) === maxClose ? (
                        <GreenLabel>MAX @ {toAUD(maxClose)}</GreenLabel>
                      ) : (
                        <></>
                      )}
                    </td>
                  </tr>
                ))
                .reverse()}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3>Sell Condition Target</h3>
          <div>
            <label>Profit:</label>
            <select
              value={sellTarget.profitTarget.type}
              onChange={(e) =>
                setSellTarget({
                  ...sellTarget,
                  profitTarget: {
                    type: e.target.value as any,
                    value: sellTarget.profitTarget.value,
                  },
                })
              }
            >
              <option>static_price_per_unit</option>
              <option>maximum_price_plus_fixed</option>
              <option>maximum_price_plus_percent</option>
            </select>
            <input
              type="number"
              value={sellTarget.profitTarget.value}
              onChange={(e) =>
                setSellTarget({
                  ...sellTarget,
                  profitTarget: {
                    value: parseFloat(e.target.value),
                    type: sellTarget.profitTarget.type,
                  },
                })
              }
            />
          </div>
          <div>
            <label>Stop Loss:</label>
            <select
              value={sellTarget.stopLoss.type}
              onChange={(e) =>
                setSellTarget({
                  ...sellTarget,
                  stopLoss: {
                    type: e.target.value as any,
                    value: sellTarget.stopLoss.value,
                  },
                })
              }
            >
              <option>static_price_per_unit</option>
              <option>maximum_price_plus_fixed</option>
              <option>maximum_price_plus_percent</option>
            </select>
            <input
              type="number"
              value={sellTarget.stopLoss.value}
              onChange={(e) =>
                setSellTarget({
                  ...sellTarget,
                  stopLoss: {
                    value: parseFloat(e.target.value),
                    type: sellTarget.stopLoss.type,
                  },
                })
              }
            />
          </div>
          <div>
            <label>Date:</label>
            <select
              value={sellTarget.time.type}
              onChange={(e) =>
                setSellTarget({
                  ...sellTarget,
                  time: {
                    type: e.target.value as any,
                    value: sellTarget.time.value,
                  },
                })
              }
            >
              <option>static_time</option>
            </select>
            <input
              type="date"
              value={new Date(sellTarget.time.value * 1000)
                .toISOString()
                .substring(0, 10)}
              onChange={(e) => {
                setSellTarget({
                  ...sellTarget,
                  time: {
                    value: new Date(e.target.value).getTime() / 1000,
                    type: sellTarget.time.type,
                  },
                });
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

const RedLabel: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: "inline-block",
      background: "hsl(0, 100%, 20%)",
      color: "#fff",
      borderRadius: "3px",
      fontWeight: "bolder",
      whiteSpace: "nowrap",
      padding: "2px 3px",
      margin: "2px", // arg margins...
    }}
  >
    {children}
  </span>
);

const OrangeLabel: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => (
  <span
    style={{
      display: "inline-block",
      background: "hsl(45, 100%, 20%)",
      color: "#fff",
      borderRadius: "3px",
      fontWeight: "bolder",
      whiteSpace: "nowrap",
      padding: "2px 3px",
      margin: "2px", // arg margins...
    }}
  >
    {children}
  </span>
);

const GreenLabel: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: "inline-block",
      background: "hsl(90, 100%, 20%)",
      color: "#fff",
      borderRadius: "3px",
      fontWeight: "bolder",
      whiteSpace: "nowrap",
      padding: "2px 3px",
      margin: "2px", // arg margins...
    }}
  >
    {children}
  </span>
);

const Hold = () => (
  <span style={{ color: "hsl(45, 100%, 50%)", fontWeight: "bold" }}>HOLD</span>
);
const Sell = () => (
  <span style={{ color: "hsl(0, 100%, 50%)", fontWeight: "bolder" }}>SELL</span>
);

const auDatetoDate = (auDate: string): Date => {
  const parts = auDate.split("/");
  return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
};
