// src/components/ChartComponent.jsx
import { useState, useEffect, type CSSProperties } from "react";
import client from "./client";
import {
  color,
  error,
  first,
  icon,
  init,
  last,
  loading,
  match,
  pctDiff,
  previous,
  toAUD,
  toDecimalAU,
  toPercentAU,
  toUnitAU,
  value,
  type AsyncResult,
  type YahooStockData,
} from "./lib";

type Symbol = "IOO" | "VAP" | "ETPMPM";
const symbols: Symbol[] = ["IOO", "VAP", "ETPMPM"];

interface ChartComponentProps {
  initialSymbol: Symbol;
  initalBuyPrice: number;
  initialStock: number;
  history: number;
}

const ChartComponent = (props: ChartComponentProps) => {
  const [asyncState, setAsyncState] =
    useState<AsyncResult<YahooStockData, Error>>(init<YahooStockData>());

  const [option, setOption] = useState<"single" | "sum" | "average">("single");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setAsyncState(loading());
        const response = await client.api
          .yahoo({ symbol: props.initialSymbol })
          .get();
        setAsyncState(
          response.data?.value
            ? value(response.data.value)
            : error(new Error("some err")),
        );
      } catch (err) {
        console.error(err);
        setAsyncState(error(new Error("some err rerrr")));
      } finally {
        // setAsyncState("loading");
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div
        style={{
          border: "5px solid black",
          margin: "10px",
          padding: "10px",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <h2>{props.initialSymbol} Holdings</h2>

        {match(asyncState, {
          init: () => <></>,
          error: (e) => (
            <pre>
              {e.message} {e.name} {e.stack ?? ""}
            </pre>
          ),
          loading: () => <>{props.initialSymbol} Loading...</>,
          value: (val) => {
            const r = val.chart.result[0];

            const q = first(r?.indicators.quote);
            const meta = val.chart.result[0]?.meta;
            const profit =
              ((last(q?.close) ?? 0) - props.initalBuyPrice) *
              props.initialStock;

            const style: CSSProperties = {
              border: "2px solid rgb(140 140 140)",
              borderCollapse: "collapse",
            };

            return (
              <>
                <h3>Transactions</h3>

                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Buy or Sell</th>
                      <th>Units</th>
                      <th>Symbol</th>
                      <th>Price</th>
                      <th>debit / credit / Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>2025-10-24</td>
                      <td>167683575</td>
                      <td>B</td>
                      <td>{toDecimalAU(props.initialStock)}</td>
                      <td>{props.initialSymbol}</td>
                      <td>{toAUD(props.initalBuyPrice)}</td>
                      <td>
                        {toAUD(props.initalBuyPrice * props.initialStock)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h3>Summary:</h3>
                <p>
                  Total:
                  <br />
                  Investment: {toAUD(props.initalBuyPrice * props.initialStock)}
                  <br />
                  Units: {toDecimalAU(props.initialStock)}
                  <br />
                  Profit per Unit:{" "}
                  {toAUD((last(q?.close) ?? 0) - props.initalBuyPrice)}
                  <br />
                  Profit per Day: {toAUD(0.0)}
                  <br />
                  Total Profit:{" "}
                  <span style={{ color: color(profit) }}>
                    {icon(profit)}
                    {toAUD(profit)}
                    {" ("}
                    {toPercentAU(
                      pctDiff(
                        last(q?.close) ?? 0, // * props.initialStock,
                        props.initalBuyPrice, // * props.initialStock,
                        //(props.initalBuyPrice * props.initialStock) + profit,
                      ),
                    )}
                    {")"}
                  </span>
                </p>

                <p>
                  <a
                    target="_blank"
                    href={`https://www2.commsec.com.au/Portfolio/holdings`}
                  >
                    Commsec Holdings
                  </a>
                </p>
              </>
            );
          },
        })}
      </div>
    </>
  );
};

export default ChartComponent;
