// src/components/ChartComponent.jsx
import { useState, type CSSProperties } from "react";
import { useYahooStock } from "@/hooks/useYahooStock";
import { useCommsecTransactions } from "@/hooks/useCommsecTransactions";

import {
  first,
  last,
  match,
  type StockSymbol,
} from "@/lib";
import { useCommsecHoldings } from "@/hooks/useCommsecHoldings";
import { ErrorView } from "./Error";


interface ChartComponentProps {
  initialStockSymbol: StockSymbol;
  history: number;
}

const style: CSSProperties = {
  border: "2px solid rgb(140 140 140)",
  borderCollapse: "collapse",
};

const ChartComponent = ({
  initialStockSymbol,
  history
}: ChartComponentProps) => {

  const stocks = useYahooStock({ symbol: initialStockSymbol });
  const holdings = useCommsecHoldings({});
  const transactions = useCommsecTransactions({});

  const relevantHoldings = holdings.type === "value" ? holdings.value.holdings.filter(x => x.code === initialStockSymbol) : [];
  const purchasePrice = relevantHoldings.at(0)?.purchasePrice ?? 0;
  const availUnits = relevantHoldings.at(0)?.availUnits ?? 0;

  return (
    <div
      style={{
        border: "5px solid black",
        margin: "10px",
        padding: "10px",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <h2>Commsec {initialStockSymbol} Transactions</h2>

      {match(transactions, {
        init: () => (<></>),
        loading: () => (<></>),
        value: (v) => {
          
          const relevant = v.filter(x => x.details.includes(initialStockSymbol));

          return (<>
          <table style={style}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Details</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {relevant.map((t) => (
                <tr>
                  <td>{t.date}</td>
                  <td>{t.reference}</td>
                  <td>{t.details}</td>
                  <td>{t.debit}</td>
                  <td>{t.credit}</td>
                  <td>{t.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>);
        },
        error: (e) => (<ErrorView error={e} />),
      })}

      {match(stocks, {
        init: () => <></>,
        error: (e) => (<ErrorView error={e} />),
        loading: () => <>{initialStockSymbol} Loading...</>,
        value: (val) => {
          const r = val.chart.result[0];
          const q = first(r?.indicators.quote);
          const meta = r?.meta;
          const currentPrice = last(q?.close) ?? 0;
          const profit = (currentPrice - purchasePrice) * availUnits;

          const style: CSSProperties = {
            border: "2px solid rgb(140 140 140)",
            borderCollapse: "collapse",
          };

          return (
            <>
              {/* <h3>Transactions</h3>
              <table style={style}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Buy or Sell</th>
                    <th>Units</th>
                    <th>StockSymbol</th>
                    <th>Price</th>
                    <th>debit / credit / Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2025-10-24</td>
                    <td>167683575</td>
                    <td>B</td>
                    <td>{toDecimalAU(initialStock)}</td>
                    <td>{initialStockSymbol}</td>
                    <td>{toAUD(initalBuyPrice)}</td>
                    <td>{toAUD(initalBuyPrice * initialStock)}</td>
                  </tr>
                </tbody>
              </table> */}

              {/* <h3>Summary:</h3>
              <p>
                Total:
                <br />
                Investment: {toAUD(initalBuyPrice * initialStock)}
                <br />
                Units: {toDecimalAU(initialStock)}
                <br />
                Profit per Unit: {toAUD(currentPrice - initalBuyPrice)}
                <br />
                Profit per Day: {toAUD(0.0)}
                <br />
                Total Profit:{" "}
                <span style={{ color: color(profit) }}>
                  {icon(profit)}
                  {toAUD(profit)} (
                  {toPercentAU(pctDiff(currentPrice, initalBuyPrice))})
                </span>
              </p> */}

              <p>
                Commsec{" | "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www2.commsec.com.au/Portfolio/holdings"
                >
                  Holdings
                </a>
                {" | "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www2.commsec.com.au/Portfolio/transactions"
                >
                  Transactions
                </a>
              </p>
            </>
          );
        },
      })}
    </div>
  );
};

export default ChartComponent;
