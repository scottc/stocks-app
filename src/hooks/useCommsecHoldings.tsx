import { useState, useEffect } from "react";
import {
  error,
  init,
  loading,
  type AsyncResult,
} from "@/lib";
import client from "@/client";
import type { CommsecHoldings } from "@/data-loaders/commsec-holdings";


interface UseCommsecHoldings {
  enabled?: boolean;
}

export const useCommsecHoldings = ({enabled = true }: UseCommsecHoldings) => {

  const [asyncState, setAsyncState] = useState<AsyncResult<CommsecHoldings, Error>>(init());

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setAsyncState(loading());
        const response = await client.api.commsecholdings.get();
        setAsyncState(response.data ?? error(new Error("It's null for some reason? see Error.cause for the TreatyResponse object.", { cause: response })));
      } catch (err) {
        console.error("Error fetching Yahoo stock data:", err);
        setAsyncState(
          error(err instanceof Error ? err : new Error("Unknown error")),
        );
      }
    };

    fetchData();
  }, [enabled]);

  return asyncState;
};
