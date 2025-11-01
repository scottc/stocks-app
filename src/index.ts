import { Elysia } from "elysia";
import index from "./index.html";

import { yahooApiFetch } from "./data-loaders/yahoo-finance-charts";
import { loadLatestTransactions } from "./data-loaders/commsec-transactions";
import { loadHoldings } from "./data-loaders/commsec-holdings";
import { fetchASXListedSecurities } from "./data-loaders/asx";
import { cache, instance } from "./data-loaders/alpha-vantage";

//import stream from "./ssr-react";

const app = new Elysia()
  .get("/*", index)
  .get("/api/asx/listedcompanies", fetchASXListedSecurities)
  .get("/api/commsec/holdings", loadHoldings)
  .get("/api/commsec/transactions", loadLatestTransactions)
  .get("/api/alphavantage/LISTING_STATUS", () => cache)
  .get(
    "/api/alphavantage/NEWS_SENTIMENT/:tickers",
    async (req) => await instance.NEWS_SENTIMENT(req.params.tickers),
  )
  .get(
    "/api/yahoo/chart/:symbol",
    async (req) => await yahooApiFetch(req.params.symbol),
  )
  //.get("/ssr", async (req) => new Response(stream, { headers: {'Content-Type': 'text/html'}, }))
  .listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });

export type ServerApi = typeof app;
