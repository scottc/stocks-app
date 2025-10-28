import { Elysia, t } from 'elysia';
import index from "./index.html";
import { error, value, type YahooStockData } from './lib';
import { yahooApiFetch } from './server-lib';
//import stream from "./ssr-react";

const app = 
  new Elysia()
    .get("/*", index)
    .get("/api/yahoo/:symbol", async (req) => {
      const yh = await yahooApiFetch(req.params.symbol);
      if(yh.type === "value") {
        return value<YahooStockData, string>(yh.value);
      } else {
        return error<YahooStockData, string>("An error occured");
      }
    })
    //.get("/ssr", async (req) => new Response(stream, { headers: {'Content-Type': 'text/html'}, }))
    .listen(3000, () => { console.log('Server running on http://localhost:3000'); });

export type ServerApi = typeof app;