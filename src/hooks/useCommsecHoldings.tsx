import { useCachedFetch } from "./useCachedFetch";
import client from "@/client";
import { DEFAULT_TTL } from "./cache";

interface UseCommsecHoldingsOptions {
  enabled?: boolean;
  ttl?: number;
}

const DEFAULT_OPTS: UseCommsecHoldingsOptions = {
  enabled: true,
  ttl: DEFAULT_TTL,
};

export const useCommsecHoldings = (opts: UseCommsecHoldingsOptions = {}) => 
  useCachedFetch(
    // cache key
    `client.api.commsecholdings()`,
    // cache task
    () =>
      client.api.commsecholdings.get().then((res) => {
        if (!res.data) throw new Error("No data");
        return res.data;
      }),
    // options
    { ...DEFAULT_OPTS, ...opts }
  );
