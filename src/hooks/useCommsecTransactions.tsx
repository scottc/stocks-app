import { useCachedFetch } from "./useCachedFetch";
import client from "@/client";
import { DEFAULT_TTL } from "./cache";

interface UseCommsecTransactionsOptions {
  enabled?: boolean;
  ttl?: number;
}

const DEFAULT_OPTS: UseCommsecTransactionsOptions = {
  enabled: true,
  ttl: DEFAULT_TTL,
};

export const useCommsecTransactions = (opts: UseCommsecTransactionsOptions = {}) => 
  useCachedFetch(
    // cache key
    `client.api.commsectransactions()`,
    // cache task
    () =>
      client.api.commsectransactions.get().then((res) => {
        if (!res.data) throw new Error("No data");
        return res.data;
      }),
    // options
    { ...DEFAULT_OPTS, ...opts }
  );
