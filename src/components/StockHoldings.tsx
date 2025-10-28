import { type CSSProperties } from "react";
import { useYahooStock } from "@/hooks/useYahooStock";
import { useCommsecHoldings } from "@/hooks/useCommsecHoldings";

import { match, type CrossExchangeTickerSymbol } from "@/lib";
import { ErrorView } from "./Error";

interface ChartComponentProps {
  symbol: CrossExchangeTickerSymbol;
  history: number;
}

const style: CSSProperties = {
  border: "2px solid rgb(140 140 140)",
  borderCollapse: "collapse",
};

const StockHoldings = ({ symbol }: ChartComponentProps) => {
  const stocks = useYahooStock({ symbol: symbol.yahoo });
  const holdings = useCommsecHoldings({});
  // const transactions = useCommsecTransactions({});

  //const relevantHoldings =
  //  holdings.type === "value"
  //    ? holdings.value.holdings.filter((x) => x.code === symbol.commsec)
  //    : [];
  //const purchasePrice = relevantHoldings.at(0)?.purchasePrice ?? 0;
  //const availUnits = relevantHoldings.at(0)?.availUnits ?? 0;

  return (
    <div
      style={{
        border: "5px solid black",
        margin: "10px",
        padding: "10px",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <h2>Commsec {symbol.commsec} Holdings</h2>

      {match(holdings, {
        init: () => <></>,
        loading: () => <></>,
        value: (v) => {
          const relevant = v.holdings.filter((x) => x.code === symbol.commsec);

          return (
            <>
              <p>As of: {v.asOfDateTime}</p>

              <table style={style}>
                <thead>
                  <tr>
                    <th>Units</th>
                    <th>Purchase Price</th>
                  </tr>
                </thead>
                <tbody>
                  {relevant.map((h) => (
                    <tr key={h.code} /* TODO: is this key unique? */>
                      <td>{h.availUnits}</td>
                      <td>{h.purchasePrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          );
        },
        error: (e) => <ErrorView error={e} />,
      })}

      {match(stocks, {
        init: () => <></>,
        error: (e) => <ErrorView error={e} />,
        loading: () => <>{symbol.commsec} Loading...</>,
        value: () => {
          //const r = val.chart.result[0];
          //const q = first(r?.indicators.quote);
          //const meta = r?.meta;
          //const currentPrice = last(q?.close) ?? 0;
          //const profit = (currentPrice - purchasePrice) * availUnits;

          //const style: CSSProperties = {
          //border: "2px solid rgb(140 140 140)",
          //borderCollapse: "collapse",
          //};

          return (
            <>
              <p>
                Commsec{" | "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www2.commsec.com.au/Portfolio/holdings"
                >
                  Holdings
                </a>
              </p>
            </>
          );
        },
      })}
    </div>
  );
};

export default StockHoldings;
