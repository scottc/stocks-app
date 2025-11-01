import { useCachedFetch } from "./useCachedFetch";
import client from "@/client";
import { DEFAULT_TTL } from "./cache";
import type { AsyncResult } from "@/lib/lib";
import type { YahooStockData } from "@/data-loaders/yahoo-finance-charts";
import type { OHLCVT } from "@/fin/signals";

interface UseYahooStockOptions {
  symbol: string;
  enabled?: boolean;
  ttl?: number;
}

export const useYahooStock = ({
  symbol,
  enabled = true,
  ttl = DEFAULT_TTL,
}: UseYahooStockOptions) =>
  useCachedFetch(
    // cache key
    `client.api.yahoo.chart({ symbol: : ${symbol} })`,
    // cache task
    () =>
      client.api.yahoo
        .chart({ symbol })
        .get()
        .then((res) => {
          if (!res.data) throw new Error("No data");
          return res.data;
        }),
    // options
    { enabled, ttl },
  );

export const toOHLCV = (stocks: AsyncResult<YahooStockData>): OHLCVT[] => {
  const quote = stocks.value?.chart.result.at(0)?.indicators.quote;
  const highs = quote?.at(0)?.high ?? [];
  const lows = quote?.at(0)?.low ?? [];
  const opens = quote?.at(0)?.open ?? [];
  const volumes = quote?.at(0)?.volume ?? [];
  const closes = quote?.at(0)?.close.map((x) => x ?? 0) ?? [];

  const timestamps = stocks.value?.chart.result.at(0)?.timestamp ?? [];

  const ohlcvs = timestamps.map(
    (ts, index): OHLCVT => ({
      timestamp: ts,
      close: closes.at(index) ?? 0,
      high: highs.at(index) ?? 0,
      low: lows.at(index) ?? 0,
      open: opens.at(index) ?? 0,
      volume: volumes.at(index) ?? 0,
    }),
  );

  return ohlcvs;
};
