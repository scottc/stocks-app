import { FileSystem, Path } from "@effect/platform";
import { Effect, Schema } from "effect";

const rowSchema = Schema.Struct({
  results: Schema.Array(
    Schema.Struct({
      field: Schema.String,
      value: Schema.Union(Schema.String, Schema.Number, Schema.Null),
    }),
  ),
});

const commsecEftScreenerSchema = Schema.Struct({
  apps: Schema.Array(
    Schema.Struct({
      data: Schema.Struct({
        data: Schema.Struct({
          criteriaRanges: Schema.Struct({
            criteriaResults: Schema.Array(
              Schema.Struct({
                max: Schema.Union(Schema.Number, Schema.Null),
                min: Schema.Union(Schema.Number, Schema.Null),
                field: Schema.String,
              }),
            ),
          }),
          screenResults: Schema.Struct({
            matches: Schema.Number, // TODO: "Positive Int"?
            rows: Schema.Array(rowSchema),
          }),
        }),
        // savedFilters: Schema.Null, // TODO: restore
        startingCriteria: Schema.Null,
        symbol: Schema.String,
        wsodIssue: Schema.Null,
        isETF: Schema.Boolean,
        subscribeLink: Schema.String,
        buyStockLink: Schema.String,
        sellStockLink: Schema.String,
        detailedQuotesLink: Schema.String,
        manageOrdersLink: Schema.String,
        addToWatchlistLink: Schema.String,
        addToAlerts: Schema.String,
        resolvedUrl: Schema.String,
        resolvedCdnUrl: Schema.String,
        isWestpac: Schema.Boolean,
        isCAS: Schema.Boolean,
        isCommSec: Schema.Boolean,
        isPremium: Schema.Boolean,
        hideSubscribe: Schema.Boolean,
      }),
      html: Schema.String,
      id: Schema.String,
      status: Schema.String,
      statusMessage: Schema.Null,
    }),
  ),
});

// why bother with the Schema.Schema.Type<T> helper???
//type CommsecEftScreener = typeof commsecEftScreenerSchema.Type;
type CommsecEftScreener = Schema.Schema.Type<typeof commsecEftScreenerSchema>;

type Row = typeof rowSchema.Type;

// https://research.commsec.com.au/F2/Apps/json?params=[{"appId":"com_cs_research_securities_screener","description":"CommSec+OpenF2+App+=>+com_cs_research_securities_screener","name":"CommSec+OpenF2+App+=>+com_cs_research_securities_screener","manifestUrl":"/F2/Apps/json","context":{"containerId":"content_com_cs_research_securities_screener"},"instanceId":"","views":["home"]}]

const fetchCommsecEftScreener = Effect.gen(function* () {
  // TODO: implement in-memory caching
  // TODO: implement Http fetch from upstream
  // TODO: implement persisting to disk

  const path = yield* Path.Path;

  const cwd = path.resolve(".");
  const filePath = path.join(
    cwd,
    "data",
    "commsec",
    "etfscreener",
    "1762327556624.json",
  );

  const fs = yield* FileSystem.FileSystem;

  const content = yield* fs.readFileString(filePath /* , "utf8" */);

  const decode = Schema.decode(Schema.parseJson(commsecEftScreenerSchema));

  const decoded = yield* decode(content, { exact: true });

  return decoded;
});

export { fetchCommsecEftScreener, type CommsecEftScreener, type Row };
