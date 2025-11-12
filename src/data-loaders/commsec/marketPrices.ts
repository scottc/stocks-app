import {
  FileSystem,
  Path,
  HttpClient,
  FetchHttpClient,
} from "@effect/platform";
import { Effect, Schema, DateTime } from "effect";

const pricesSchema = Schema.Struct({
  status: Schema.Number, // 0 = Success ... TODO: this looks like an a bool or enum
  marketDepthPrices: Schema.Struct({
    prices: Schema.Array(
      Schema.Struct({
        buyNumber: Schema.Number, //1,
        buyVolume: Schema.Number, // 31,
        buyPrice: Schema.Number, // 93.1,
        sellNumber: Schema.Number, // 1,
        sellVolume: Schema.Number, //14,
        sellPrice: Schema.Number, // 93.16
      }),
    ),
    totalBuyOrders: Schema.Number, //5,
    totalBuyVolume: Schema.Number, //395,
    totalSellOrders: Schema.Number, //6,
    totalSellVolume: Schema.Number, //2648,
    currentDateTime: Schema.String, //"2025-11-10T16:16:47.2581121+11:00"
  }),
  currentDateTime: Schema.String, // "2025-11-10T16:16:47.2581121+11:00"
});

// why bother with the Schema.Schema.Type<T> helper???
//type CommsecEftScreener = typeof commsecEftScreenerSchema.Type;
type CommsecMarketPrices = Schema.Schema.Type<typeof pricesSchema>;

const fetchCommsecMarketPrices = (securityCode: string) =>
  Effect.gen(function* () {
    // TODO: implement in-memory caching
    // TODO: implement Http fetch from upstream
    // TODO: implement persisting to disk

    const client = yield* HttpClient.HttpClient;

    const response = yield* client.get(
      `https://www2.commsec.com.au/quotes/api/v1/marketinfo/prices?securityCode=${securityCode.toUpperCase()}`,
      {
        acceptJson: true,
        headers: {
          // we need to authorize the request with a CommSec user login session... and probs anti-forge token etc
          cookie: "",
        },
      },
    );

    const content = yield* response.text;

    const decodeFunc = Schema.decode(Schema.parseJson(pricesSchema));

    const decoded = yield* decodeFunc(content, { exact: true });

    return decoded;
  });

export { fetchCommsecMarketPrices, type CommsecMarketPrices };
