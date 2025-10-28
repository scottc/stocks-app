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

export interface YahooStockData {
    chart: YahooChart;
}

export interface YahooChart {
    result: YahooChartResultItem[];
    error: null;
}

export interface YahooChartResultItem {
    meta: YahooMeta;
    timestamp: number[];
    indicators: YahooChartIndicators;
}

export interface YahooMeta {
    currency: any;
    symbol: string;
    exchangeName: any;
    fullExchangeName: any;
    instrumentType: any;
    firstTradeDate: any;
    regularMarketTime: any;
    hasPrePostMarketData: any;
    gmtoffset: any;
    timezone: any;
    exchangeTimezoneName: any;
    regularMarketPrice: any;
    fiftyTwoWeekHigh: any;
    fiftyTwoWeekLow: any;
    regularMarketDayHigh: any;
    regularMarketDayLow: any;
    regularMarketVolume: any;
    longName: string;
    shortName: string;
    chartPreviousClose: any;
    priceHint: any;
    currentTradingPeriod: TradingPeriods;
    dataGranularity: any;
    range: any;
    validRanges: any; 
}

export interface TradingPeriods {
  pre: TradingHours;
  regular: TradingHours;
  post: TradingHours;
}

export interface TradingHours { timezone: string, start: number, end:number, gmtoffset: number }

export interface YahooChartIndicators {
    quote: YahooQuote[];
    adjclose: number[];
}

export interface YahooQuote {
    high: number[];
    volume: number[];
    close: number[];
    low: number[];
    open: number[];
}

const toAUD = (value: number | bigint | Intl.StringNumericLiteral): string => 
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);


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
    result.push(+(sum / dayCount).toFixed(3));
  }
  return result;
}

export interface ValueResult<T, E> {
    type: "value";
    value: T;
    error: undefined;
}

export interface ErrorResult<T, E = Error> {
    type: "error";
    value: undefined;
    error: E;
}

export interface InitResult<T, E = Error> {
    type: "init";
    value: undefined;
    error: undefined;
}

export interface LoadingResult<T, E = Error> {
    type: "loading";
    value: undefined;
    error: undefined;
}


export type Result<T, E = Error> = ValueResult<T, E> | ErrorResult<T, E>;

export type AsyncResult<T, E = Error> = InitResult<T, E> | LoadingResult<T, E> | ValueResult<T, E> | ErrorResult<T, E>;

function error<T, E = Error>(error: E): Result<T, E> {
    return ({
        type: "error",
        error: error,
        value: undefined,
    });
}

function value<T, E = Error>(value: T): Result<T, E> {
    return ({
        type: "value",
        value: value,
        error: undefined,
    });
}

function loading<T, E = Error>(): AsyncResult<T, E> {
    return ({
        type: "loading",
        value: undefined,
        error: undefined,
    });
}

function init<T, E = Error>(): AsyncResult<T, E> {
    return ({
        type: "init",
        value: undefined,
        error: undefined,
    });
}

interface AsyncResultMatchBody<T, E, R> {
  init: () => R;
  loading: () => R;
  error: (e: E) => R;
  value: (v: T) => R;
}

function match<T, E, R>(value: AsyncResult<T, E>, body: AsyncResultMatchBody<T, E, R>  ): R {
  switch(value.type) {
    case "init": return body.init();
    case "loading": return body.loading();
    case "value": return body.value(value.value);
    case "error": return body.error(value.error);
    default: throw new Error("Unexpected");
  }
}

function first<T>(arr: T[] | undefined): T | undefined {
  return arr?.[0];
}

function last<T>(arr: T[] | undefined): T | undefined {
  return arr?.[(arr?.length ?? 0) - 1];
}

function previous<T>(arr: T[] | undefined, index: number): T | undefined {
  return arr?.[(arr?.length ?? 0) - 1 - index];
}

function pctDiff(close: number, open: number): number {
  if (open === 0) {
    return 0;
      //throw new Error("Cannot calculate percentage change with zero open price.");
  }
  
  return ((close - open) / open);
}

const upColor = '#00da3c';
const downColor = '#ec0000';
const eqColor = '#ecda3c';

const color = (x :number) => {
  if (x > 0) {
    return upColor;
  } else if (x < 0) {
    return downColor;
  } else {
    return eqColor;
  }
}

const up = "▲";
const down = "▼";
const eq = "▶"

const icon = (x :number) => {
  if (x > 0) {
    return up;
  } else if (x < 0) {
    return down;
  } else {
    return eq;
  }
}

const toDecimalAU = (value :number) => 
  new Intl.NumberFormat('en-AU', { style: "decimal" }).format(value);

const toPercentAU = (value :number) => 
  new Intl.NumberFormat('en-AU', { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const toUnitAU = (value :number) => 
  new Intl.NumberFormat('en-AU', { style: "unit" }).format(value);

export {
    toChartData,
    calculateMA,
    value,
    error,
    loading,
    init,
    match,
    first,
    last,
    previous,
    pctDiff,
    toAUD,
    toDecimalAU,
    toPercentAU,
    toUnitAU,
    color,
    icon
};