import { useState } from "react";
import "@/index.css";

import StockChart from "./StockChart";
import StockTable from "./StockTable";
import StockTicker from "./StockTicker";
import StockTransactions from "./StockTransactions";
import StockHoldings from "./StockHoldings";
import { useCommsecHoldings } from "@/hooks/useCommsecHoldings";
import { match } from "@/lib";
import { ErrorView } from "./Error";


const watchList = ["VAP", "ETPMPM"];

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
          init: () => (<>init</>),
          loading: () => (<>loading</>),
          value: (v) => {
            
            const stockList = [
              ...v.holdings.map(h => h.code),
              ...watchList
            ];

            return (
              <div
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: stockList.reduce((pv, cv, ci, arr) => `${pv} 33%`, ""),
                  gridTemplateRows: "auto",
                  // gridTemplateAreas:
                  //   "ticker ticker ticker"
                  //   "chart chart chart"
                  //   "history history history"
                }}
              >
                {stockList.map((code) => (<><div><StockTicker initialStockSymbol={code} history={daysHistory} /></div></>))}
                {stockList.map((code) => (<><div><StockHoldings initialStockSymbol={code} history={daysHistory} /></div></>))}
                {stockList.map((code) => (<><div><StockTransactions initialStockSymbol={code} history={daysHistory} /></div></>))}
                {stockList.map((code) => (<><div><StockChart initialStockSymbol={code} history={daysHistory} /></div></>))}
                {stockList.map((code) => (<><div><StockTable initialStockSymbol={code} history={daysHistory} /></div></>))}
              </div>
            );
          },
          error: (e) => (<><ErrorView error={e} /></>),
        })}

    </>
  );
}

export default App;
