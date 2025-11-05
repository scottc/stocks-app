import client from "@/client";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import type { YahooStockData } from "@/data-loaders/yahoo-finance-charts";
import type { EChartsOption } from "@/components/echarts-for-react";
import EChartsReact from "@/components/echarts-for-react";

export const Route = createFileRoute("/efts/$id/chart")({
  component: EftPage,
  loader: async ({ params }) =>
    await client.api.yahoo
      .chart({ symbol: `${params.id.toUpperCase()}.AX` })
      .get(),
});

function EftPage() {
  const d = useLoaderData({ from: "/efts/$id/chart" });
  const val = d.data?.value;

  if (val === undefined) {
    return <></>;
  }

  return (
    <>
      <EChartsReact
        option={toChartOptions(val)}
        style={{ height: 800, width: "100%" }}
      />
    </>
  );
}

const upColor = "#00da3c";
const downColor = "#ec0000";

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

const toChartOptions = (all: YahooStockData): EChartsOption => {
  const r = all.chart.result[0];

  if (r === undefined) {
    throw new Error("unhandled");
  }

  const q = r.indicators.quote[0];

  if (q === undefined) {
    throw new Error("unhandled");
  }

  const values: ChartValues = r.timestamp.map(
    (_, index): [number, number, number, number, number] => [
      q.open.at(index) ?? 0,
      q.close.at(index) ?? 0,
      q.low.at(index) ?? 0,
      q.high.at(index) ?? 0,
      q.volume.at(index) ?? 0,
    ],
  );
  //.filter((d) => (d.at(4) ?? 0) !== 0)
  const volumes: ChartVolumes = r.timestamp.map(
    (_, index): [number, number, 1 | -1] => [
      index,
      q.volume.at(index) ?? 0,
      (q.open.at(index) ?? 0) > (q.close.at(index) ?? 0) ? 1 : -1,
    ],
  );
  //.filter((v) => (v.at(1) ?? 0) !== 0)
  const categoryData = r.timestamp.map((value) =>
    new Date(value * 1000).toISOString().slice(0, 10),
  );

  const option: EChartsOption = {
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
        data: categoryData,
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
        data: categoryData,
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
        name: "bars",
        type: "candlestick",
        data: values,
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
          all.chart.result[0]?.indicators.quote[0]?.close ?? [],
        ),
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
          all.chart.result[0]?.indicators.quote[0]?.close ?? [],
        ),
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
        data: volumes,
      },
    ],
  };

  return option;
};
