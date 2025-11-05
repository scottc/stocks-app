import "@/index.css";

import { watchList } from "@/store/lib";

import StockChart from "./StockChart";
import StockTable from "./StockTable";
import StockTicker from "./StockTicker";
import StockTransactions from "./StockTransactions";
import StockHoldings from "./StockHoldings";
import { CommsecLinks, YahooLinks } from "./CommsecLinks";
import { LlamaChat } from "./LlamaAnalyzer";
import Signals from "./Signals";
import DerivedData from "./DerivedData";
import {
  BacktestSimulation,
  MonteCarloSimulation,
  WalkForwardSimulation,
} from "./Backtests";
import { AsxSelect } from "./AsxSelect";
import { ScoreCard, Weights } from "./Score";
import { Disclaimer } from "./Disclaimer";
import { useSelector } from "@xstate/react";
import { actor } from "@/store";
import type { ReactNode } from "react";

export function App() {
  const historyPeriod = useSelector(actor, (ss) => ss.context.historyPeriod);

  return (
    <>
      <Panel>
        <PeriodSelect />
        <Weights />
        <LlamaChat />
      </Panel>

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
            <ScoreCard ticker={symbol} />
          </div>
        ))}

        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <Signals symbol={symbol} history={historyPeriod} />
          </div>
        ))}

        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <StockChart symbol={symbol} history={historyPeriod} />
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
            <StockHoldings symbol={symbol} history={historyPeriod} />
          </div>
        ))}

        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <StockTransactions symbol={symbol} history={historyPeriod} />
          </div>
        ))}

        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <StockTable symbol={symbol} history={historyPeriod} />
          </div>
        ))}

        {watchList.map((symbol) => (
          <div key={symbol.yahoo}>
            <StockTicker symbol={symbol} history={historyPeriod} />
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

const Panel: React.FC<{ children?: ReactNode }> = (props) => (
  <>
    <div
      style={{
        height: 40,
        width: "33%",
        position: "fixed",
        right: 0,
        backgroundColor: "#222",
        borderLeft: "3px solid black",
      }}
    >
      {props.children}
    </div>
  </>
);

export const Toolbar: React.FC<{ children?: React.ReactNode }> = (props) => {
  return (
    <>
      <div
        style={{
          position: "fixed",
          zIndex: 999999999999999,
          display: "block",
          width: "100%",
          height: "40px",
          fontSize: "32px",
          background: "#000",
          color: "#fff",
        }}
      >
        {props.children}
      </div>
      <div style={{ height: "40px" }}></div>
    </>
  );
};

const PeriodSelect: React.FC<{}> = () => {
  const historyPeriod = useSelector(actor, (s) => s.context.historyPeriod);

  return (
    <select
      value={historyPeriod}
      onChange={(e) =>
        actor.send({
          type: "historyPeriod.change",
          value: parseInt(e.target.value),
        })
      }
    >
      <optgroup label="Period">
        <option value="20">Past 20 trading days (~1 Month)</option>
        <option value="63">Past 63 trading days (1 Quater / ~3 Months)</option>
        <option value={252 * 1}>Past {252 * 1} trading days (1 Year)</option>
        <option value={252 * 2}>Past {252 * 2} trading days (2 Years)</option>
        <option value={252 * 5}>Past {252 * 5} trading days (5 Years)</option>
        <option value={252 * 10}>
          Past {252 * 10} trading days (10 Years)
        </option>
        <option value={99999999999}>MAX</option>
      </optgroup>
    </select>
  );
};

export default App;
