// src/components/ChartComponent.jsx
import { useState, useEffect, type CSSProperties } from "react";
import client from "@/client";
import {
  error,
  first,
  init,
  last,
  loading,
  match,
  value,
  type AsyncResult,
  type StockSymbol,
} from "@/lib";
import type { YahooStockData } from "@/data-loaders/yahoo-finance-charts";

interface ChartComponentProps {
  initialStockSymbol: StockSymbol;
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
          .yahoo({ symbol: props.initialStockSymbol })
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
        <h2>{props.initialStockSymbol} Information</h2>

        {match(asyncState, {
          init: () => <></>,
          error: (e) => (
            <pre>
              {e.message} {e.name} {e.stack ?? ""}
            </pre>
          ),
          loading: () => <>{props.initialStockSymbol} Loading...</>,
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
                <p>
                  {meta?.fullExchangeName} {meta?.instrumentType}{" "}
                  {meta?.longName}
                </p>
                <p>{meta?.shortName}</p>

                <p>
                  Regular Trading Hours: <br />
                  Open:{" "}
                  {new Date(
                    (meta?.currentTradingPeriod.regular.start ?? 0) * 1000,
                  ).toTimeString()}
                  <br />
                  Close:{" "}
                  {new Date(
                    (meta?.currentTradingPeriod.regular.end ?? 0) * 1000,
                  ).toTimeString()}
                  <br />
                  {meta?.timezone} {meta?.exchangeTimezoneName}
                </p>

                {/* <pre>{JSON.stringify(meta, null, 2)}</pre> */}
                {/*
            <p>
              Total Profit:{" "}
              <span style={{ color: color(profit) }}>
                {icon(profit)}
                {toAUD(profit)}
              </span>
            </p>



            <table style={style}>
              <thead>
                <tr>
                  <th style={style}>
                    <select value={option} onChange={(e) => setOption(e.target.value as any)}>
                      <option value="single">Single</option>
                      <option value="sum">Sum</option>
                      <option value="average">Average</option>
                    </select>
                  </th>
                  <th scope="col" style={style}>1 Day</th>
                  <th scope="col" style={style}>7 Day</th>
                  <th scope="col" style={style}>14 Day</th>
                  <th scope="col" style={style}>28 Day</th>
                  <th scope="col" style={style}>56 Day</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" style={style}>Date:</th>
                  <td style={style}>{new Date(1000 * (previous(r?.timestamp, 0) ?? 0)).toISOString().substring(0, 10)}</td>
                  <td style={style}>{new Date(1000 * (previous(r?.timestamp, 7) ?? 0)).toISOString().substring(0, 10)}</td>
                  <td style={style}>{new Date(1000 * (previous(r?.timestamp, 14) ?? 0)).toISOString().substring(0, 10)}</td>
                  <td style={style}>{new Date(1000 * (previous(r?.timestamp, 28) ?? 0)).toISOString().substring(0, 10)}</td>
                  <td style={style}>{new Date(1000 * (previous(r?.timestamp, 56) ?? 0)).toISOString().substring(0, 10)}</td>
                </tr>
                <tr>
                  <th scope="row" style={style}>Flat Change:</th>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 0) ?? 0) - (previous(q?.open, 0) ?? 0)) }}>
                      {icon((previous(q?.close, 0) ?? 0) - (previous(q?.open, 0) ?? 0))}
                      {toAUD((previous(q?.close, 0) ?? 0) - (previous(q?.open, 0) ?? 0))}
                    </span>
                  </td>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 7) ?? 0) - (previous(q?.open, 7) ?? 0)) }}>
                      {icon((previous(q?.close, 7) ?? 0) - (previous(q?.open, 7) ?? 0))}
                      {toAUD((previous(q?.close, 7) ?? 0) - (previous(q?.open, 7) ?? 0))}
                    </span>
                  </td>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 14) ?? 0) - (previous(q?.open, 14) ?? 0)) }}>
                      {icon((previous(q?.close, 14) ?? 0) - (previous(q?.open, 14) ?? 0))}
                      {toAUD((previous(q?.close, 14) ?? 0) - (previous(q?.open, 14) ?? 0))}
                    </span>
                  </td>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 28) ?? 0) - (previous(q?.open, 28) ?? 0)) }}>
                      {icon((previous(q?.close, 28) ?? 0) - (previous(q?.open, 28) ?? 0))}
                      {toAUD((previous(q?.close, 28) ?? 0) - (previous(q?.open, 28) ?? 0))}
                    </span>
                  </td>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 56) ?? 0) - (previous(q?.open, 56) ?? 0)) }}>
                      {icon((previous(q?.close, 56) ?? 0) - (previous(q?.open, 56) ?? 0))}
                      {toAUD((previous(q?.close, 56) ?? 0) - (previous(q?.open, 56) ?? 0))}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th scope="row" style={style}>% Change:</th>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 0) ?? 0) - (previous(q?.open, 0) ?? 0)) }}>
                      {toPercentAU(pctDiff(previous(q?.close, 0) ?? 0, previous(q?.open, 0) ?? 0))}
                    </span>
                  </td>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 7) ?? 0) - (previous(q?.open, 7) ?? 0)) }}>
                      {toPercentAU(pctDiff(previous(q?.close, 7) ?? 0, previous(q?.open, 7) ?? 0))}
                    </span>
                  </td>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 14) ?? 0) - (previous(q?.open, 14) ?? 0)) }}>
                      {toPercentAU(pctDiff(previous(q?.close, 14) ?? 0, previous(q?.open, 14) ?? 0))}
                    </span>
                  </td>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 28) ?? 0) - (previous(q?.open, 28) ?? 0)) }}>
                      {toPercentAU(pctDiff(previous(q?.close, 28) ?? 0, previous(q?.open, 28) ?? 0))}
                    </span>
                  </td>
                  <td style={style}>
                    <span style={{ color: color((previous(q?.close, 56) ?? 0) - (previous(q?.open, 56) ?? 0)) }}>
                      {toPercentAU(pctDiff(previous(q?.close, 56) ?? 0, previous(q?.open, 56) ?? 0))}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th scope="row" style={style}>Open:</th>
                  <td style={style}>{toAUD((previous(q?.open, 0) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.open, 7) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.open, 14) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.open, 28) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.open, 56) ?? 0))}</td>
                </tr>
                <tr>
                  <th scope="row" style={style}>Close:</th>
                  <td style={style}>{toAUD((previous(q?.close, 0) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.close, 7) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.close, 14) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.close, 28) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.close, 56) ?? 0))}</td>
                </tr>
                <tr>
                  <th scope="row" style={style}>Low:</th>
                  <td style={style}>{toAUD((previous(q?.low, 0) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.low, 7) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.low, 14) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.low, 28) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.low, 56) ?? 0))}</td>
                </tr>
                <tr>
                  <th scope="row" style={style}>High:</th>
                  <td style={style}>{toAUD((previous(q?.high, 0) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.high, 7) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.high, 14) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.high, 28) ?? 0))}</td>
                  <td style={style}>{toAUD((previous(q?.high, 56) ?? 0))}</td>
                </tr>
                <tr>
                  <th scope="row" style={style}>Volume:</th>
                  <td style={style}>{toDecimalAU((previous(q?.volume, 0) ?? 0))}</td>
                  <td style={style}>{toDecimalAU((previous(q?.volume, 7) ?? 0))}</td>
                  <td style={style}>{toDecimalAU((previous(q?.volume, 14) ?? 0))}</td>
                  <td style={style}>{toDecimalAU((previous(q?.volume, 28) ?? 0))}</td>
                  <td style={style}>{toDecimalAU((previous(q?.volume, 56) ?? 0))}</td>
                </tr>
              </tbody>
            </table> */}

                <p>
                  Commsec{" | "}
                  <a
                    target="_blank"
                    href={`https://www2.commsec.com.au/Quotes?stockCode=${props.initialStockSymbol}&exchangeCode=ASX`}
                  >
                    {props.initialStockSymbol} Quotes
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
