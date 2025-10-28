// src/components/ChartComponent.jsx
import { useState, useEffect, type ChangeEventHandler } from 'react';
import EChartsReact, { type EChartsOption } from 'echarts-for-react';
import client from './client';
import { calculateMA, error, init, last, loading, match, toAUD, toChartData, value, type AsyncResult, type StockDataForChart, type YahooStockData } from './lib';


type Symbol = "IOO" | "VAP" | "ETPMPM";
const symbols: Symbol[] = ["IOO", "VAP", "ETPMPM"];

const SymbolPicker = ({ value, onChange }: { value: Symbol; onChange?: ChangeEventHandler<HTMLSelectElement> }) => (
    <>
    <label>Symbol: </label>
    <select value={value} onChange={onChange}>
        {symbols.map((k) => <option key={k} value={k}>{k}</option>)}
    </select>
    </>
);

interface ChartComponentProps {
    initialSymbol: Symbol;
    initalBuyPrice: number;
    initialStock: number;
    history: number;
}

const upColor = '#00da3c';
const downColor = '#ec0000';


const toChartOptions = (v: StockDataForChart, buyPrice: number): EChartsOption => {


    const option = {
      animation: false,
      /*
      legend: {
        bottom: 10,
        left: 'center',
        data: ['index values', 'MA5', 'MA10', 'MA20', 'MA30', "Buy Price"]
      },
      */
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        textStyle: {
          color: '#000'
        },
      },
      axisPointer: {
        link: [
          {
            xAxisIndex: 'all'
          }
        ],
        label: {
          backgroundColor: '#777'
        }
      },
    //   toolbox: {
    //     feature: {
    //       dataZoom: {
    //         yAxisIndex: false
    //       },
    //       brush: {
    //         type: ['lineX', 'clear']
    //       }
    //     }
    //   },
    //   brush: {
    //     xAxisIndex: 'all',
    //     brushLink: 'all',
    //     outOfBrush: {
    //       colorAlpha: 0.1
    //     }
    //   },
    //   visualMap: {
    //     show: false,
    //     seriesIndex: 5,
    //     dimension: 2,
    //     pieces: [
    //       {
    //         value: 1,
    //         color: downColor
    //       },
    //       {
    //         value: -1,
    //         color: upColor
    //       }
    //     ]
    //   },
      grid: [
        {
          left: '10%',
          right: '8%',
          height: '50%'
        },
        {
          left: '10%',
          right: '8%',
          top: '63%',
          height: '16%'
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: v.categoryData,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
          axisPointer: {
            z: 100
          }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: v.categoryData,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        }
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '85%',
          start: 0,
          end: 100
        }
      ],
      series: [
        {
          name: 'index values',
          type: 'candlestick',
          data: v.values,
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: undefined,
            borderColor0: undefined
          }
        },
        /*
        {
          name: 'MA5',
          type: 'line',
          data: calculateMA(5, asyncState.value),
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: 'MA10',
          type: 'line',
          data: calculateMA(10, asyncState.value),
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: 'MA20',
          type: 'line',
          data: calculateMA(20, asyncState.value),
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: 'MA30',
          type: 'line',
          data: calculateMA(30, asyncState.value),
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        */
        {
          name: 'Volume',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: v.volumes
        },
        {
          name: 'Buy Price',
          type: 'line',
          data: v.categoryData.map(x => buyPrice),
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
      ]
    };

    return option;
};

const ChartComponent = (props: ChartComponentProps) => {

  const [symbol, setSymbol] = useState<Symbol>(props.initialSymbol);
  const [asyncState, setAsyncState] = useState<AsyncResult<YahooStockData, Error>>(init<YahooStockData>());

    const [buyPrice, setBuyPrice] = useState<number>(props.initalBuyPrice);
    const [stockCount, setStockCount] = useState<number>(props.initialStock); 

    const [stopLossPercentage, setStopLossPercentage] = useState<number>(5); // Default 5% stop loss

  useEffect(() => {
    const fetchData = async () => {
      try {
        setAsyncState(loading());
        const response = await client.api.yahoo({ symbol }).get();
        setAsyncState(
            response.data?.value
                ? value(response.data.value)
                : error(new Error("some err"))
        );
      } catch (err) {
        console.error(err);
        setAsyncState(error(new Error("some err rerrr")));
      } finally {
        // setAsyncState("loading");
      }
    };

    fetchData();
  }, [symbol]);


  return (<>
          <div style={{border: "5px solid black", margin: "10px", padding:"10px", background: "rgba(0,0,0,0.2)" }}>

            {
                  match(asyncState, {
    init: () => <></>,
    error: (e) => <pre>{e.message} {e.name} {e.stack ?? ""}</pre>,
    loading: () => <h2>{props.initialSymbol} Loading...</h2>,
    value: (val) => {
        
        // TODO: this is probably expensive to render... consider precalculating.
        //const x = toChartData(val);
        const r = val.chart.result[0];

        const timestamp = last(r?.timestamp) ?? 0;
        const date = new Date(1000 * timestamp);
        const q = last(r?.indicators.quote);
        const open = (last(q?.open) ?? 0);
        const close = (last(q?.close) ?? 0);
        const low = (last(q?.low) ?? 0);
        const high = (last(q?.high) ?? 0);
        const volume = (last(q?.volume) ?? 0);
        const profit = (close - buyPrice) * stockCount;


        return (
<>
            <h2>{props.initialSymbol} {props.history}-Day Candlestick Chart</h2>

            {/* <SymbolPicker value={symbol} onChange={(e) => setSymbol(e.target.value as Symbol)} />

            <label>Buy Price: </label>
            <input
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(Number(e.target.value))}
            />

            <label>Units: </label>
            <input
                type="number"
                value={stockCount}
                onChange={(e) => setStockCount(Number(e.target.value))}
            />

            <label>Stop Loss (%): </label>
            <input
                type="number"
                value={stopLossPercentage}
                onChange={(e) => setStopLossPercentage(Number(e.target.value))}
            /> */}

            <EChartsReact option={toChartOptions(toChartData(val, props.history), buyPrice)} style={{ height: 400, width: '100%' }} />

            </>

    );
}
  })
            }

        </div>
  </>);
  


};

export default ChartComponent;