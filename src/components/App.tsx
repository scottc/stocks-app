import { useState } from "react";
import "@/index.css";

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
            initialStockSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialStockSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialStockSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialStockSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialStockSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockTicker
            initialStockSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>

        <div>
          <StockHoldings
            initialStockSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialStockSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialStockSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialStockSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialStockSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockHoldings
            initialStockSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>

        <div>
          <StockChart
            initialStockSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialStockSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialStockSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialStockSymbol="IOO"
            initalBuyPrice={185.295}
            initialStock={269}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialStockSymbol="VAP"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>
        <div>
          <StockChart
            initialStockSymbol="ETPMPM"
            initalBuyPrice={0}
            initialStock={0}
            history={daysHistory}
          />
        </div>

        <div>
          <StockTable initialStockSymbol="IOO" history={daysHistory} />
        </div>
        <div>
          <StockTable initialStockSymbol="VAP" history={daysHistory} />
        </div>
        <div>
          <StockTable initialStockSymbol="ETPMPM" history={daysHistory} />
        </div>
        <div>
          <StockTable initialStockSymbol="IOO" history={daysHistory} />
        </div>
        <div>
          <StockTable initialStockSymbol="VAP" history={daysHistory} />
        </div>
        <div>
          <StockTable initialStockSymbol="ETPMPM" history={daysHistory} />
        </div>
      </div>
    </>
  );
}

export default App;
