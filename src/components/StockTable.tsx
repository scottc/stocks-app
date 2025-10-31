import { type CSSProperties } from "react";
import {
  color,
  last,
  match,
  pctDiff,
  toAUD,
  toDecimalAU,
  toPercentAU,
  type CrossExchangeTickerSymbol,
} from "@/lib/lib";
import React from "react";
import { useYahooStock } from "@/hooks/useYahooStock";
import { ErrorView } from "./Error";
import { Card } from "./Card";

interface StockTableProps {
  symbol: CrossExchangeTickerSymbol;
  history: number;
}

const StockTable = (props: StockTableProps) => {
  const stocks = useYahooStock({ symbol: props.symbol.yahoo });
  // const holdings = useCommsecHoldings({});
  // const transactions = useCommsecTransactions({});

  return (
    <>
      <Card>
        <h2>
          Yahoo {props.symbol.yahoo} {props.history}-Day Trade History
        </h2>

        {match(stocks, {
          init: () => <></>,
          error: (e) => <ErrorView error={e} />,
          loading: () => <>{props.symbol.commsec} Loading...</>,
          value: (val) => {
            const r = val.chart.result[0];
            const q = last(r?.indicators.quote);
            const adjclose = r?.indicators.adjclose[0]?.adjclose ?? [];
            const style: CSSProperties = {
              border: "2px solid rgb(140 140 140)",
              borderCollapse: "collapse",
            };
            const startat = (r?.timestamp.length ?? 0) - props.history;

            return (
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
                    <th style={style} scope="col">
                      change flat
                    </th>
                    <th style={style} scope="col">
                      change %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r?.timestamp
                    .slice(startat)
                    .map((ts, index) => {
                      const i = startat + index;

                      if ((q?.volume[i] ?? 0) === 0) {
                        console.warn(
                          "Expected volume but instead got: ",
                          " yahoo symbol:",
                          props.symbol.yahoo,
                          " startat:",
                          startat,
                          " index:",
                          index,
                          " i:",
                          i,
                          " Timestamp:",
                          ts,
                          " Volume:",
                          q?.volume[i],
                          " Open:",
                          q?.open[i],
                          " Close:",
                          adjclose[i],
                          " High:",
                          q?.high[i],
                          " Low:",
                          q?.low[i],
                        );
                      }

                      return (
                        <React.Fragment key={ts}>
                          {new Date(ts * 1000).getDay() === 5 ? ( // friday, it's the weekend... and we only trade on weekdays.
                            <>
                              <tr>
                                <td>&nbsp;</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                              </tr>
                              <tr>
                                <td>&nbsp;</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                              </tr>
                            </>
                          ) : (
                            <></>
                          )}

                          <tr>
                            {/* <td style={style}>{startat + index}</td> */}
                            <td
                              style={
                                q?.volume[i]
                                  ? style
                                  : { backgroundColor: "#f00" }
                              }
                            >
                              {new Date(ts * 1000)
                                .toISOString()
                                .substring(0, 10)}
                            </td>
                            <td style={style}>{toAUD(adjclose[i] ?? 0)}</td>
                            <td style={style}>{toAUD(q?.open[i] ?? 0)}</td>
                            <td style={style}>{toAUD(q?.high[i] ?? 0)}</td>
                            <td style={style}>{toAUD(q?.low[i] ?? 0)}</td>
                            <td
                              style={
                                q?.volume[i]
                                  ? style
                                  : { backgroundColor: "#f00" }
                              }
                            >
                              {toDecimalAU(q?.volume[i] ?? 0)}
                            </td>

                            <td
                              style={{
                                ...style,
                                color: color(
                                  (adjclose[i] ?? 0) - (q?.open[i] ?? 0),
                                ),
                              }}
                            >
                              {toAUD((adjclose[i] ?? 0) - (q?.open[i] ?? 0))}
                            </td>

                            <td
                              style={{
                                ...style,
                                color: color(
                                  (adjclose[i] ?? 0) - (q?.open[i] ?? 0),
                                ),
                              }}
                            >
                              {toPercentAU(
                                pctDiff(adjclose[i] ?? 0, q?.open[i] ?? 0),
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                    .reverse() ?? <></>}
                </tbody>
              </table>
            );
          },
        })}
      </Card>
    </>
  );
};

export default StockTable;
