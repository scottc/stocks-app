import EChartsReact, { type EChartsOption } from "echarts-for-react";
import { match, type CrossExchangeTickerSymbol } from "@/store/lib";
import type { YahooStockData } from "@/data-loaders/yahoo-finance-charts";
import { useYahooStock } from "@/hooks/useYahooStock";
import { ErrorView } from "./Error";
import { Card } from "./Card";
import WebGLCandlestickChart, { generateMockData, type Candle } from "./Chart";

interface ChartComponentProps {
  symbol: CrossExchangeTickerSymbol;
  history: number;
}

const upColor = "#00da3c";
const downColor = "#ec0000";

const toChartData = (
  rawData: YahooStockData,
  history: number,
): StockDataForChart => {
  const r = rawData.chart.result[0];

  if (r === undefined) {
    throw new Error("unhandled");
  }

  const q = r.indicators.quote[0];

  if (q === undefined) {
    throw new Error("unhandled");
  }

  const startat1 = (r.timestamp.length ?? 0) - history;

  const vals: ChartValues = r.timestamp
    .slice(startat1)
    .map((_, index) => [
      q.open.at(startat1 + index) ?? 0,
      q.close.at(startat1 + index) ?? 0,
      q.low.at(startat1 + index) ?? 0,
      q.high.at(startat1 + index) ?? 0,
      q.volume.at(startat1 + index) ?? 0,
    ])
    .filter((d) => (d.at(4) ?? 0) !== 0);

  const volumes: ChartVolumes = r.timestamp
    .slice(startat1)
    .map((_, index) => [
      startat1 + index,
      q.volume.at(startat1 + index) ?? 0,
      (q.open.at(startat1 + index) ?? 0) > (q.close.at(startat1 + index) ?? 0)
        ? 1
        : -1,
    ])
    .filter((v) => (v.at(1) ?? 0) !== 0);

  const data: StockDataForChart = {
    categoryData: r.timestamp
      .slice(startat1)
      .map((value) => new Date(value * 1000).toISOString().slice(0, 10)),
    values: vals,
    volumes: volumes,
  };

  return data;
};

function calculateMA2(dayCount: number, values: (number | null)[]) {
  var result = [];
  for (var i = 0, len = values.length ?? 0; i < len; i++) {
    if (i < dayCount) {
      result.push("-");
      continue;
    }
    var sum = 0;
    var zeroCount = 0;
    for (var j = 0; j < dayCount; j++) {
      const v = values[i - j] ?? 0;

      // A hack to excluse zero values...
      if (v === 0) {
        zeroCount += 1;
      }

      sum += v; // close value
    }
    result.push(+(sum / (dayCount - zeroCount)));
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
type ChartVolumes = [number, number, -1 | 1][];

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

const toChartOptions = (
  filteredByPeriod: StockDataForChart,
  all: YahooStockData,
  period: number,
): EChartsOption => {
  const option = {
    animation: false,
    legend: {
      bottom: 10,
      left: "center",
      data: ["bars", "MA50", "MA200"],
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
      borderWidth: 1,
      borderColor: "#ccc",
      padding: 10,
      textStyle: {
        color: "#000",
      },
    },
    axisPointer: {
      link: [
        {
          xAxisIndex: "all",
        },
      ],
      label: {
        backgroundColor: "#777",
      },
    },
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: false,
        },
        brush: {
          type: ["lineX", "clear"],
        },
      },
    },
    brush: {
      xAxisIndex: "all",
      brushLink: "all",
      outOfBrush: {
        colorAlpha: 0.1,
      },
    },
    visualMap: {
      show: false,
      seriesIndex: 5,
      dimension: 2,
      pieces: [
        {
          value: 1,
          color: downColor,
        },
        {
          value: -1,
          color: upColor,
        },
      ],
    },
    grid: [
      {
        left: "10%",
        right: "8%",
        height: "50%",
      },
      {
        left: "10%",
        right: "8%",
        top: "63%",
        height: "16%",
      },
    ],
    xAxis: [
      {
        type: "category",
        data: filteredByPeriod.categoryData,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: "dataMin",
        max: "dataMax",
        axisPointer: {
          z: 100,
        },
      },
      {
        type: "category",
        gridIndex: 1,
        data: filteredByPeriod.categoryData,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        min: "dataMin",
        max: "dataMax",
      },
    ],
    yAxis: [
      {
        scale: true,
        splitArea: {
          show: true,
        },
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: [0, 1],
        start: 0,
        end: 100,
      },
      {
        show: true,
        xAxisIndex: [0, 1],
        type: "slider",
        top: "85%",
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        name: "index values",
        type: "candlestick",
        data: filteredByPeriod.values,
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: undefined,
          borderColor0: undefined,
        },
      },
      {
        name: "MA50",
        type: "line",
        data: calculateMA2(
          50,
          all.chart.result.at(0)?.indicators.quote.at(0)?.close ?? [],
        ).slice(period * -1, undefined),
        smooth: true,
        lineStyle: {
          opacity: 0.5,
        },
      },
      {
        name: "MA200",
        type: "line",
        data: calculateMA2(
          200,
          all.chart.result.at(0)?.indicators.quote.at(0)?.close ?? [],
        ).slice(period * -1, undefined),
        smooth: true,
        lineStyle: {
          opacity: 0.5,
        },
      },
      {
        name: "Volume",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: filteredByPeriod.volumes,
      },
    ],
  };

  return option;
};

const StockChart = (props: ChartComponentProps) => {
  const stocks = useYahooStock({ symbol: props.symbol.yahoo });

  return (
    <>
      <Card>
        {match(stocks, {
          init: () => <></>,
          error: (e) => <ErrorView error={e} />,
          loading: () => <h2>{props.symbol.commsec} Loading...</h2>,
          value: (val) => {
            // TODO: this is probably expensive to render... consider precalculating.
            //const x = toChartData(val);
            //const r = val.chart.result[0];

            //const timestamp = last(r?.timestamp) ?? 0;
            //const date = new Date(1000 * timestamp);
            //const q = last(r?.indicators.quote);
            //const open = last(q?.open) ?? 0;
            //const close = last(q?.close) ?? 0;
            //const low = last(q?.low) ?? 0;
            //const high = last(q?.high) ?? 0;
            //const volume = last(q?.volume) ?? 0;
            //const profit = (close - buyPrice) * stockCount;

            return (
              <>
                <h2>
                  Yahoo {props.symbol.yahoo} {props.history}-Day Candlestick
                  Chart
                </h2>
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
                <EChartsReact
                  option={toChartOptions(
                    toChartData(val, props.history),
                    val,
                    props.history,
                    // buyPrice,
                  )}
                  style={{ height: 400, width: "100%" }}
                />

                <p>
                  Yahoo
                  {" | "}
                  <a
                    target="_blank"
                    href={`https://finance.yahoo.com/chart/${props.symbol.yahoo}`}
                  >
                    Chart
                  </a>
                </p>
              </>
            );
          },
        })}
      </Card>
    </>
  );
};

const toCandles = (yh: YahooStockData) => {
  const qqq = yh.chart.result.at(0)?.indicators.quote.at(0);
  return (
    yh.chart.result.at(0)?.timestamp.map<Candle>((ts, i) => ({
      time: ts,
      close: qqq?.close.at(i) ?? 0,
      high: qqq?.high.at(i) ?? 0,
      low: qqq?.low.at(i) ?? 0,
      open: qqq?.open.at(i) ?? 0,
    })) ?? []
  );
};

export default StockChart;
