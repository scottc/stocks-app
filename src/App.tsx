import { useState } from "react";
import "./index.css";

import StockChart from "./StockChart";
import StockTable from "./StockTable";
import StockTicker from "./StockTicker";
import StockHoldings from "./StockHoldings";

export function App() {
  const [daysHistory, setDaysHistory] = useState(20);

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

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "33% 33% 33% 33% 33% 33%",
          gridTemplateRows: "auto",
          // gridTemplateAreas:
          //   "ticker ticker ticker"
          //   "chart chart chart"
          //   "history history history"
        }}
      >
        <div>
          <StockTicker
            initialSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>

        <div>
          <StockHoldings
            initialSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>

        <div>
          <StockChart
            initialSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>

        <div>
          <StockTable initialSymbol="IOO" history={daysHistory} />
        </div>
        <div>
          <StockTable initialSymbol="VAP" history={daysHistory} />
        </div>
        <div>
          <StockTable initialSymbol="ETPMPM" history={daysHistory} />
        </div>
        <div>
          <StockTable initialSymbol="IOO" history={daysHistory} />
        </div>
        <div>
          <StockTable initialSymbol="VAP" history={daysHistory} />
        </div>
        <div>
          <StockTable initialSymbol="ETPMPM" history={daysHistory} />
        </div>
      </div>
    </>
  );
}

export default App;
