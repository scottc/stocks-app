import { Elysia } from "elysia"; // TODO: use solidstart instead. Because client side isomorphic routing & client intergration.
import index from "./index.html";

import { yahooApiFetch } from "./data-loaders/yahoo-finance-charts";
import { loadLatestTransactions } from "./data-loaders/commsec/transactions";
import { fetchAccountHoldings } from "./data-loaders/commsec/holdings";
import { fetchASXListedSecurities } from "./data-loaders/asx";
import { cache, instance } from "./data-loaders/alpha-vantage";
import { fetchCommsecEftScreener } from "./data-loaders/commsec/efts";
import { Effect } from "effect";
import { BunContext, BunHttpPlatform, BunRuntime } from "@effect/platform-bun";
import { fetchCommsecMarketPrices } from "./data-loaders/commsec/marketPrices";
import {
  FetchHttpClient,
  HttpApiClient,
  HttpClient,
  HttpPlatform,
} from "@effect/platform";
import {
  getCommsecLoginCookies,
  postCommsecLogin,
} from "./data-loaders/commsec/login";
import { fetchAccounts } from "./data-loaders/commsec/accounts";

//import stream from "./ssr-react";

const app = new Elysia()
  .get("/robots.txt", "")
  .get("/*", index)
  .get("/api/asx/listedcompanies", fetchASXListedSecurities)
  .get("/api/commsec/accounts", () =>
    Effect.runPromise(fetchAccounts.pipe(Effect.provide(BunContext.layer))),
  )
  .get("/api/commsec/accounts/:id/holdings", ({ params }) =>
    Effect.runPromise(
      fetchAccountHoldings(params.id).pipe(Effect.provide(BunContext.layer)),
    ),
  )
  .get("/api/commsec/accounts/:id/transactions", loadLatestTransactions)
  .get("/api/commsec/login/:username/:password", (req) =>
    Effect.runPromise(
      // WARNING: do not call this, it's not secure... password will be exposed to browser history api...
      postCommsecLogin(req.params.username, req.params.password).pipe(
        Effect.provide(FetchHttpClient.layer),
      ),
    ),
  )
  .get(
    "/api/commsec/eftscreener",
    () =>
      Effect.runPromise(
        fetchCommsecEftScreener.pipe(Effect.provide(BunContext.layer)),
      ),
    //.catch((err) => {
    // TODO: handle ParseError | PlatformError
    // TODO: how can we enforce error handling is called prior to returning to elysia?
    // TODO: map errors, to the appropriate http reponses...
    //})
  )
  .get(
    "/api/commsec/marketprices/:securityCode",
    (req) =>
      Effect.runPromise(
        fetchCommsecMarketPrices(req.params.securityCode).pipe(
          Effect.provide(FetchHttpClient.layer),
        ), //
      ),
    //.catch((err) => {
    // TODO: handle ParseError | PlatformError
    // TODO: how can we enforce error handling is called prior to returning to elysia?
    // TODO: map errors, to the appropriate http reponses...
    //})
  )
  .get("/api/alphavantage/LISTING_STATUS", () => cache)
  .get(
    "/api/alphavantage/NEWS_SENTIMENT/:tickers",
    async (req) => await instance.NEWS_SENTIMENT(req.params.tickers),
  )
  .get(
    "/api/yahoo/chart/:symbol/:interval",
    async (req) =>
      await yahooApiFetch(
        req.params.symbol,
        req.params.interval as "1d" | "1m", // TODO: validate enum
      ),
  )
  //.get("/ssr", async (req) => new Response(stream, { headers: {'Content-Type': 'text/html'}, }))
  .listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });

export type ServerApi = typeof app;
