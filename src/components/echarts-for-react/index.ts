import * as echarts from "echarts";
import { type EChartsOption, type ECharts } from "echarts";
import type { EChartsReactProps } from "./types";
import EChartsReactCore from "./core";

export type { EChartsReactProps, EChartsOption, ECharts };

/** Vendored forked verson of https://github.com/hustcc/echarts-for-react/blob/master/package.json */
export default class EChartsReact extends EChartsReactCore {
  constructor(props: EChartsReactProps) {
    super(props);

    this.echarts = echarts;
  }
}
