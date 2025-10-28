import { Elysia, t } from "elysia";
import index from "./index.html";

import { yahooApiFetch } from "./data-loaders/yahoo-finance-charts";
import { loadLatestTransactions } from "./data-loaders/commsec-transactions";

//import stream from "./ssr-react";

const app = new Elysia()
  .get("/*", index)
  .get("/api/commsectransactions", async (req) => {
    return await loadLatestTransactions();
  })
  .get("/api/yahoo/:symbol", async (req) => {
    return await yahooApiFetch(req.params.symbol);
  })
  //.get("/ssr", async (req) => new Response(stream, { headers: {'Content-Type': 'text/html'}, }))
  .listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });

export type ServerApi = typeof app;
