import { useState, useEffect, type CSSProperties } from 'react';
import client from '@/client';
import { color, error, init, last, loading, match, pctDiff, toAUD, toDecimalAU, toPercentAU, value, type AsyncResult, type StockSymbol } from '@/lib';
import React from 'react';
import type { YahooStockData } from '@/data-loaders/yahoo-finance-charts';
import { useYahooStock } from '@/hooks/useYahooStock';
import { useCommsecHoldings } from '@/hooks/useCommsecHoldings';
import { ErrorView } from './Error';

interface StockTableProps {
    initialStockSymbol: StockSymbol;
    history: number;
}

const StockTable = (props: StockTableProps) => {

  const stocks = useYahooStock({ symbol: props.initialStockSymbol });
  // const holdings = useCommsecHoldings({});
  // const transactions = useCommsecTransactions({});

  return (<>
          <div style={{border: "5px solid black", margin: "10px", padding:"10px", background: "rgba(0,0,0,0.2)" }}>
            <h2>Yahoo {props.initialStockSymbol} {props.history}-Day Trade History</h2>

            {
                  match(stocks, {
    init: () => <></>,
    error: (e) => <ErrorView error={e} />,
    loading: () => <>{props.initialStockSymbol} Loading...</>,
    value: (val) => {
        
        const r = val.chart.result[0];
        const q = last(r?.indicators.quote);
        const style: CSSProperties = { border: "2px solid rgb(140 140 140)", borderCollapse: "collapse" };
        const startat = (r?.timestamp.length ?? 0) - props.history;

        return (
            <table style={style}>
              <thead>
                <tr>
                  {/* <th style={style} scope="col">i</th> */}
                  <th style={style} scope="col">date</th>
                  <th style={style} scope="col">close</th>
                  <th style={style} scope="col">open</th>
                  <th style={style} scope="col">high</th>
                  <th style={style} scope="col">low</th>
                  <th style={style} scope="col">volume</th>
                  <th style={style} scope="col">change flat</th>
                  <th style={style} scope="col">change %</th>
                </tr>
              </thead>
              <tbody>
                {
                  val.chart.result[0]?.timestamp.slice(startat).map((ts, index) => (
                    <React.Fragment key={ts}>
                      <tr>
                        {/* <td style={style}>{startat + index}</td> */}
                        <td style={style}>{new Date(ts *1000).toISOString().substring(0, 10)}</td>
                        <td style={style}>{toAUD(q?.close[startat + index] ?? 0)}</td>
                        <td style={style}>{toAUD(q?.open[startat + index] ?? 0)}</td>
                        <td style={style}>{toAUD(q?.high[startat + index] ?? 0)}</td>
                        <td style={style}>{toAUD(q?.low[startat + index] ?? 0)}</td>
                        <td style={style}>
                          {toDecimalAU(q?.volume[startat + index] ?? 0)}
                        </td>

                        <td style={{ ...style, color: color((q?.close[startat + index] ?? 0) - (q?.open[startat + index] ?? 0))}}>
                          {toAUD((q?.close[startat + index] ?? 0) - (q?.open[startat + index] ?? 0))}
                        </td>

                        <td style={{ ...style, color: color((q?.close[startat + index] ?? 0) - (q?.open[startat + index] ?? 0))}}>
                          {toPercentAU(pctDiff(q?.close[startat + index] ?? 0, q?.open[startat + index] ?? 0))}
                        </td>
                      </tr>

                      {new Date(ts *1000).getDay() === 5 // friday, it's the weekend... and we only trade on weekdays.
                        ? (<>
                        <tr>
                          <td>&nbsp;</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr>
                          <td>&nbsp;</td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                        </>
                        )
                        : (<></>)
                      }

                    </React.Fragment>
                  ))
                  ?? (<></>)
                }
              </tbody>
            </table>
        );
}
  })
            }

        </div>
  </>);
  


};

export default StockTable;