import { useState } from "react";
import "@/index.css";

import StockChart from "./StockChart";
import StockTable from "./StockTable";
import StockTicker from "./StockTicker";
import StockTransactions from "./StockTransactions";
import StockHoldings from "./StockHoldings";
import { useCommsecHoldings } from "@/hooks/useCommsecHoldings";
import { match, watchList } from "@/lib/lib";
import { ErrorView } from "./Error";
import { CommsecLinks, YahooLinks } from "./CommsecLinks";
import { LlamaAnalyzer } from "./LlamaAnalyzer";
import Signals from "./Signals";
import DerivedData from "./DerivedData";
import {
  BacktestSimulation,
  MonteCarloSimulation,
  WalkForwardSimulation,
} from "./Backtests";

export function App() {
  const [daysHistory, setDaysHistory] = useState(63);

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
          <option value="20">Past 20 trading days (~1 Month)</option>
          <option value="63">
            Past 63 trading days (1 Quater / ~3 Months)
          </option>
          <option value="252">Past 252 trading days (1 Year)</option>
          <option value="504">Past 504 trading days (2 Years)</option>
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
                  <Signals symbol={symbol} history={daysHistory} />
                </div>
              ))}

              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <CommsecLinks code={symbol.commsec} />
                </div>
              ))}

              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <YahooLinks p={symbol.yahoo} />
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

              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <DerivedData symbol={symbol} history={daysHistory} />
                </div>
              ))}

              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <StockTicker symbol={symbol} history={daysHistory} />
                </div>
              ))}

              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <LlamaAnalyzer symbol={symbol.yahoo} />
                </div>
              ))}

              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <MonteCarloSimulation />
                </div>
              ))}

              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <BacktestSimulation tickerSymbol={symbol} />
                </div>
              ))}

              {watchList.map((symbol) => (
                <div key={symbol.yahoo}>
                  <WalkForwardSimulation />
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
