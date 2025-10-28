import { useState } from "react";
import "@/index.css";

import StockChart from "./StockChart";
import StockTable from "./StockTable";
import StockTicker from "./StockTicker";
import StockTransactions from "./StockTransactions";
import StockHoldings from "./StockHoldings";
import { useCommsecHoldings } from "@/hooks/useCommsecHoldings";
import { match, watchList } from "@/lib";
import { ErrorView } from "./Error";
import { CommsecLinks } from "./CommsecLinks";

export function App() {
  const [daysHistory, setDaysHistory] = useState(20);

  const holdings = useCommsecHoldings({});

  return (
    <>
      <div
        style={{
          height: 40,
          width: "100%",
          position: "fixed",
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
        <select
          value={daysHistory}
          onChange={(e) => setDaysHistory(parseInt(e.target.value))}
        >
          <option value="5">Past 5 trading days</option>
          <option value="10">Past 10 trading days</option>
          <option value="20">Past 20 trading days</option>
          <option value="60">Past 60 trading days</option>
        </select>
      </div>

      <div style={{ height: 40 }}></div>

      {match(holdings, {
        init: () => <>init</>,
        loading: () => <>loading</>,
        value: () => {
          return (
            <div
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: watchList.reduce((pv) => `${pv} 33%`, ""),
                gridTemplateRows: "auto",
                // gridTemplateAreas:
                //   "ticker ticker ticker"
                //   "chart chart chart"
                //   "history history history"
              }}
            >
              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <StockTicker symbol={symbol} history={daysHistory} />
                </div>
              ))}
              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <CommsecLinks code={symbol.commsec} />
                </div>
              ))}
              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <StockHoldings symbol={symbol} history={daysHistory} />
                </div>
              ))}
              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <StockTransactions symbol={symbol} history={daysHistory} />
                </div>
              ))}
              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <StockChart symbol={symbol} history={daysHistory} />
                </div>
              ))}
              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <StockTable symbol={symbol} history={daysHistory} />
                </div>
              ))}
            </div>
          );
        },
        error: (e) => (
          <>
            <ErrorView error={e} />
          </>
        ),
      })}
    </>
  );
}

export default App;
