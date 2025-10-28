import { useState, useEffect } from "react";
import {
  error,
  init,
  loading,
  type AsyncResult,
} from "@/lib";
import client from "@/client";
import type { YahooStockData } from "@/data-loaders/yahoo-finance-charts";

interface UseYahooStockOptions {
  symbol: string
  enabled?: boolean;
}

export const useYahooStock = ({
  symbol,
  enabled = true,
}: UseYahooStockOptions) => {
  const [asyncState, setAsyncState] =
    useState<AsyncResult<YahooStockData, Error>>(init<YahooStockData>());

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setAsyncState(loading());
        const response = await client.api.yahoo({ symbol }).get();
        setAsyncState(response.data ?? error(new Error("No data returned from API")));
      } catch (err) {
        console.error("Error fetching Yahoo stock data:", err);
        setAsyncState(
          error(err instanceof Error ? err : new Error("Unknown error")),
        );
      }
    };

    fetchData();
  }, [symbol, enabled]);

  return asyncState;
};
