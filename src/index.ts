import { Elysia } from "elysia";
import index from "./index.html";

import { yahooApiFetch } from "./data-loaders/yahoo-finance-charts";
import { loadLatestTransactions } from "./data-loaders/commsec-transactions";
import { loadHoldings } from "./data-loaders/commsec-holdings";

//import stream from "./ssr-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const app = new Elysia()
  .get("/*", index)
  .get("/api/commsecholdings", async () => await loadHoldings())
  .get("/api/commsectransactions", async () => await loadLatestTransactions())
  .get(
    "/api/yahoo/:symbol",
    async (req) => await yahooApiFetch(req.params.symbol),
  )
  //.get("/ssr", async (req) => new Response(stream, { headers: {'Content-Type': 'text/html'}, }))
  .listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });

export type ServerApi = typeof app;
