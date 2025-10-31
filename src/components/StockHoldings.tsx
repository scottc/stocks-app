import { type CSSProperties } from "react";
import { useCommsecHoldings } from "@/hooks/useCommsecHoldings";

import { match, type CrossExchangeTickerSymbol } from "@/lib/lib";
import { ErrorView } from "./Error";
import { Card } from "./Card";

interface ChartComponentProps {
  symbol: CrossExchangeTickerSymbol;
  history: number;
}

const style: CSSProperties = {
  border: "2px solid rgb(140 140 140)",
  borderCollapse: "collapse",
};

const StockHoldings = ({ symbol }: ChartComponentProps) => {
  //const stocks = useYahooStock({ symbol: symbol.yahoo });
  const holdings = useCommsecHoldings({});
  // const transactions = useCommsecTransactions({});

  //const relevantHoldings =
  //  holdings.type === "value"
  //    ? holdings.value.holdings.filter((x) => x.code === symbol.commsec)
  //    : [];
  //const purchasePrice = relevantHoldings.at(0)?.purchasePrice ?? 0;
  //const availUnits = relevantHoldings.at(0)?.availUnits ?? 0;

  return (
    <Card>
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
                    <th>availUnits</th>
                    <th>changePercent</th>
                    <th>changePrice</th>
                    <th>code</th>
                    <th>lastPrice</th>
                    <th>marketValue</th>
                    <th>profitLoss</th>
                    <th>profitLossPercent</th>
                    <th>purchasePrice</th>
                    <th>valueChange</th>
                    <th>weightPercent</th>
                  </tr>
                </thead>
                <tbody>
                  {relevant.map((h) => (
                    <tr key={h.code} /* TODO: is this key unique? */>
                      <td>{h.availUnits}</td>
                      <td>{h.changePercent}</td>
                      <td>{h.changePrice}</td>
                      <td>{h.code}</td>
                      <td>{h.lastPrice}</td>
                      <td>{h.marketValue}</td>
                      <td>{h.profitLoss}</td>
                      <td>{h.profitLossPercent}</td>
                      <td>{h.purchasePrice}</td>
                      <td>{h.valueChange}</td>
                      <td>{h.weightPercent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4>Summary:</h4>
              <p>
                marketValue: {v.summary.marketValue}
                <br />
                profitLoss: {v.summary.profitLoss}
                <br />
                profitLossPercent: {v.summary.profitLossPercent}
                <br />
                valueChange: {v.summary.valueChange}
                <br />
                weightPercent: {v.summary.weightPercent}
                <br />
              </p>
            </>
          );
        },
        error: (e) => <ErrorView error={e} />,
      })}

      <button onClick={(_e) => alert("TODO: Not Yet Implemented.")}>
        Import Commsec Holdings CSV
      </button>

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
    </Card>
  );
};

export default StockHoldings;
