import { useState, useEffect } from "react";
import {
  error,
  init,
  loading,
  type AsyncResult,
} from "@/lib";
import client from "@/client";
import type { CommsecTransaction } from "@/data-loaders/commsec-transactions";
import type { Treaty } from "@elysiajs/eden";

interface UseCommsecTransactions {
  enabled?: boolean;
}

export const useCommsecTransactions = ({enabled = true }: UseCommsecTransactions) => {

  const [asyncState, setAsyncState] = useState<AsyncResult<CommsecTransaction[], Error>>(init());

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setAsyncState(loading());
        const response = await client.api.commsectransactions.get();

        response.data

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
