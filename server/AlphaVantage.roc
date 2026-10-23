import pf.Server
import http.Response

AlphaVantage :: {}.
{
    listing_status! : { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    listing_status! = |_context|
        Ok(json_stub(501, "{\"error\":\"LISTING_STATUS not ported yet\"}"))

    news_sentiment! : Str, { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    news_sentiment! = |tickers, _context| {
        body = "{\"tickers\":\"${tickers}\",\"status\":\"stub\"}"
        Ok(json_stub(501, body))
    }
}

json_stub = |status, body|
    Server.respond(
        Response.from_status(status)
            .with_headers([{ name: "Content-Type", value: "application/json" }])
            .with_body(Str.to_utf8(body)),
    )
