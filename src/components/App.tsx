import { useState } from "react";
import "@/index.css";

import { watchList } from "@/lib/lib";

import StockChart from "./StockChart";
import StockTable from "./StockTable";
import StockTicker from "./StockTicker";
import StockTransactions from "./StockTransactions";
import StockHoldings from "./StockHoldings";
import { CommsecLinks, YahooLinks } from "./CommsecLinks";
import { LlamaAnalyzer } from "./LlamaAnalyzer";
import Signals from "./Signals";
import DerivedData from "./DerivedData";
import {
  BacktestSimulation,
  MonteCarloSimulation,
  WalkForwardSimulation,
} from "./Backtests";
import { AsxSelect } from "./AsxSelect";
import { Score } from "./Score";
import { Disclaimer } from "./Disclaimer";

export function App() {
  const [daysHistory, setDaysHistory] = useState(63);

  return (
    <>
      <Disclaimer />
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
          <optgroup label="Period">
            <option value="20">Past 20 trading days (~1 Month)</option>
            <option value="63">
              Past 63 trading days (1 Quater / ~3 Months)
            </option>
            <option value={252 * 1}>
              Past {252 * 1} trading days (1 Year)
            </option>
            <option value={252 * 2}>
              Past {252 * 2} trading days (2 Years)
            </option>
            <option value={252 * 5}>
              Past {252 * 5} trading days (5 Years)
            </option>
            <option value={252 * 10}>
              Past {252 * 10} trading days (10 Years)
            </option>
            <option value={99999999999}>MAX</option>
          </optgroup>
        </select>
      </div>
      <div style={{ height: 40 }}></div>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: watchList.reduce((pv) => `${pv} 33%`, ""),
          gridTemplateRows: "auto",
        }}
      >
        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <Score ticker={symbol} />
          </div>
        ))}

        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <Signals symbol={symbol} history={daysHistory} />
          </div>
        ))}

        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <StockChart symbol={symbol} history={daysHistory} />
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
            <StockTable symbol={symbol} history={daysHistory} />
          </div>
        ))}

        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <StockTicker symbol={symbol} history={daysHistory} />
          </div>
        ))}

        {/*

        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <DerivedData symbol={symbol} history={daysHistory} />
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

         */}
      </div>
    </>
  );
}

export default App;
