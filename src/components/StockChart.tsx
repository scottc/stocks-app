import EChartsReact, { type EChartsOption } from 'echarts-for-react';
import { last, match, type CrossExchangeTickerSymbol } from '@/lib';
import type { YahooStockData } from '@/data-loaders/yahoo-finance-charts';
import { useYahooStock } from '@/hooks/useYahooStock';
import { useCommsecHoldings } from '@/hooks/useCommsecHoldings';
import { ErrorView } from './Error';


// const StockSymbolPicker = ({ value, onChange }: { value: StockSymbol; onChange?: ChangeEventHandler<HTMLSelectElement> }) => (
//     <>
//     <label>StockSymbol: </label>
//     <select value={value} onChange={onChange}>
//         {symbols.map((k) => <option key={k} value={k}>{k}</option>)}
//     </select>
//     </>
// );

interface ChartComponentProps {
    symbol: CrossExchangeTickerSymbol;
    history: number;
}

const upColor = '#00da3c';
const downColor = '#ec0000';

const toChartData = (rawData: YahooStockData, history: number): StockDataForChart => {

  const r = rawData.chart.result[0];

    if(r === undefined) {
        throw new Error("unhandled");
    }

  const q = r.indicators.quote[0];

    if(q === undefined) {
        throw new Error("unhandled");
    }

  const startat = (r.timestamp.length ?? 0) - history;


  const vals: ChartValues = r.timestamp.slice(startat).map((value, index, array) => 
        [
            q.open.at(startat + index) ?? 0,
            q.close.at(startat + index) ?? 0,
            q.low.at(startat + index) ?? 0,
            q.high.at(startat + index) ?? 0,
            q.volume.at(startat + index) ?? 0,
        ]
    );


  const volumes: ChartVolumes = r.timestamp.slice(startat).map((value, index, array) =>
        [
            startat + index,
            q.volume.at(startat + index) ?? 0,
            (q.open.at(startat + index) ?? 0) > (q.close.at(startat + index) ?? 0) ? 1 : -1
        ]
    );

  const data: StockDataForChart = {
    categoryData: r.timestamp.slice(startat).map((value) => new Date(value * 1000).toISOString().slice(0, 10)),
    values: vals,
    volumes: volumes
  };

  return data;
};


function calculateMA(dayCount: number, data: StockDataForChart) {
  var result = [];
  for (var i = 0, len = data.values.length; i < len; i++) {
    if (i < dayCount) {
      result.push('-');
      continue;
    }
    var sum = 0;
    for (var j = 0; j < dayCount; j++) {

      data.values;

      sum += data.values[i - j]?.[1] ?? 0;
    }
    result.push(+(sum / dayCount));
  }
  return result;
}

/**
 * open,
 * close,
 * low,
 * high,
 * volume,
 */
type ChartValues = [number, number, number, number, number][];

/**
 * index,
 * volume,
 * direction ? 1 (up) : -1 (down)
 */
type ChartVolumes = [number, number, -1|1][];

export interface StockDataForChart {
    categoryData: string[];
    /**
     * open,
     * close,
     * low,
     * high,
     * volume,
     */
    values: ChartValues;
    volumes: ChartVolumes;
}

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

const StockChart = (props: ChartComponentProps) => {

  // const [symbol, setStockSymbol] = useState<StockSymbol>(props.initialStockSymbol);

  // const [buyPrice, setBuyPrice] = useState<number>(props.initalBuyPrice);
  // const [stockCount, setStockCount] = useState<number>(props.initialStock); 

  // const [stopLossPercentage, setStopLossPercentage] = useState<number>(5); // Default 5% stop loss

  const stocks = useYahooStock({ symbol: props.symbol.yahoo });
  const holdings = useCommsecHoldings({});
  // const transactions = useCommsecTransactions({});

  const relevantHoldings = holdings.type === "value" ? holdings.value.holdings.filter(x => x.code === props.symbol.commsec) : [];
  const buyPrice = relevantHoldings.at(0)?.purchasePrice ?? 0;
  const stockCount = relevantHoldings.at(0)?.availUnits ?? 0;

  return (<>
          <div style={{border: "5px solid black", margin: "10px", padding:"10px", background: "rgba(0,0,0,0.2)" }}>

            {
                  match(stocks, {
    init: () => <></>,
    error: (e) => <ErrorView error={e} />,
    loading: () => <h2>{props.symbol.commsec} Loading...</h2>,
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
            <h2>Yahoo {props.symbol.yahoo} {props.history}-Day Candlestick Chart</h2>

            {/* <StockSymbolPicker value={symbol} onChange={(e) => setStockSymbol(e.target.value as StockSymbol)} />

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


              <p>
                Yahoo
                {" | "}
                <a target="_blank" href={`https://finance.yahoo.com/chart/${props.symbol.yahoo}`}>Chart</a>
              </p>

            </>

    );
}
  })
            }

        </div>
  </>);
  


};

export default StockChart;