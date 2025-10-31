import { toAUD, toDecimalAU, type CrossExchangeTickerSymbol } from "@/lib/lib";
import { useYahooStock } from "@/hooks/useYahooStock";

import { sma, rsi, ema } from "@/fin/signals";
import type { CSSProperties } from "react";
import { Card } from "./Card";

interface SignalsProps {
  symbol: CrossExchangeTickerSymbol;
  history: number;
}

const DerivedData = (props: SignalsProps) => {
  const stocks = useYahooStock({ symbol: props.symbol.yahoo });
  // const holdings = useCommsecHoldings({});
  // const transactions = useCommsecTransactions({});

  const end = (stocks.value?.chart.result.at(0)?.timestamp ?? []).length;
  const start = length - props.history;

  // const adjclose = stocks.value?.chart.result.at(0)?.indicators.adjclose;
  const quote = stocks.value?.chart.result.at(0)?.indicators.quote;
  const closes = quote?.at(0)?.close.map((x) => x ?? 0) ?? [];

  const timestamps = stocks.value?.chart.result.at(0)?.timestamp ?? [];
  // const meta = stocks.value?.chart.result.at(0)?.meta;

  const rsis = rsi(closes, 20);
  const smas50 = sma(closes, 50);
  const smas200 = sma(closes, 200);
  const emas = ema(closes, 20);

  const style: CSSProperties = {
    border: "1px solid white",
    borderCollapse: "collapse",
  };

  return (
    <>
      <Card>
        <h2>Derived Yahoo {props.symbol.yahoo} Data</h2>

        <table style={style}>
          <thead>
            <tr>
              <th style={style}>Date</th>
              {/* <h3>Derived Data</h3> */}
              <th style={style}>rsi(20)</th>
              <th style={style}>sma(50)</th>
              <th style={style}>sma(200)</th>
              <th style={style}>ema(20)</th>
            </tr>
          </thead>
          <tbody>
            {timestamps
              .slice(start, end)
              .map((ts, i) => (
                <tr key={ts}>
                  <td style={style}>
                    {new Date(ts * 1000).toISOString().substring(0, 10)}
                  </td>
                  <td style={style}>
                    {toDecimalAU(rsis.slice(start, end).at(i) ?? 0)}
                  </td>
                  <td style={style}>
                    {toAUD(smas50.slice(start, end).at(i) ?? 0)}
                  </td>
                  <td style={style}>
                    {toAUD(smas200.slice(start, end).at(i) ?? 0)}
                  </td>
                  <td style={style}>
                    {toAUD(emas.slice(start, end).at(i) ?? 0)}
                  </td>
                </tr>
              ))
              .reverse()}
          </tbody>
        </table>
      </Card>
    </>
  );
};

export default DerivedData;
