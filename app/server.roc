app [Context, program] {
    http: "https://github.com/roc-lang/http/releases/download/1.0.0/6ZUwqYhCS8PU9Mo6MF7oV82ET2o7KYb57CLKDq4cq4sS.tar.zst",
    pf: platform "https://github.com/roc-lang/basic-webserver/releases/download/0.18.0/9VgbC77zLmYYgxLpiNGCq3eySyRCbE2RriAM4sjr2y81.tar.zst",
}

import pf.Env
import pf.Server
import pf.Path
import http.Response
import Routes
import Asx
import YahooLoader
import AlphaVantage
import Commsec

Context : {
    alpha_vantage_key : Str,
    # FINNHUB_API_KEY=
    # FINANCIAL_MODELING_PREP_API_KEY=
    # ALPHA_VANTAGE_API_KEY=
}

program = { init!, respond!, shutdown! }

init! : () => Try({ config : Server.Config, context : Context }, [Exit(I64)])
init! = || {
    key =
        match Env.var_str!("ALPHA_VANTAGE_API_KEY") {
            Ok(value) => value
            Err(_) => ""
        }
    Ok({
        config: Server.default_config,
        context: { alpha_vantage_key: key },
    })
}

respond! : Server.Request, Context => Try(Server.Outcome, [ServerErr(Str)])
respond! = |request, context| {
    method = request.method()
    path = Routes.segments(raw_path_from_target(request.target()))

    match (method, path) {
        ## Joy SPA shell + assets (cwd = project root)
        (GET, []) => serve_static!("app/www/index.html", "text/html; charset=utf-8")
        (GET, ["favicon.ico"]) => serve_static!("app/www/favicon.ico", "text/html; charset=utf-8")
        (GET, ["index.html"]) => serve_static!("app/www/index.html", "text/html; charset=utf-8")
        (GET, ["style.css"]) => serve_static!("app/www/style.css", "text/css; charset=utf-8")
        (GET, ["client.wasm"]) => serve_static!("app/www/client.wasm", "application/wasm")
        (GET, ["runtime.js"]) => serve_static!("app/www/runtime.js", "application/javascript; charset=utf-8")

        ## API
        (GET, ["api", "asx"]) => Asx.listed_companies!(context)
        (GET, ["api", "yahoo", "chart", symbol, interval]) =>
            YahooLoader.chart!(symbol, interval, context)
        (GET, ["api", "alphavantage", "LISTING_STATUS"]) =>
            AlphaVantage.listing_status!(context)
        (GET, ["api", "alphavantage", "NEWS_SENTIMENT", tickers]) =>
            AlphaVantage.news_sentiment!(tickers, context)
        (GET, ["api", "commsec", "accounts"]) =>
            Commsec.accounts!(context)
        (GET, ["api", "commsec", "accounts", id, "holdings"]) =>
            Commsec.holdings!(id, context)
        (GET, ["api", "commsec", "accounts", id, "transactions"]) =>
            Commsec.transactions!(id, context)
        (GET, ["api", "commsec", "eftscreener"]) =>
            Commsec.eft_screener!(context)
        (GET, ["api", "commsec", "marketprices", code]) =>
            Commsec.market_prices!(code, context)
        _ => Ok(text_response(404, "not found"))
    }
}

## Read a file under the process cwd and return it with a Content-Type.
serve_static! : Str, Str => Try(Server.Outcome, [ServerErr(Str)])
serve_static! = |rel_path, content_type| {
    # TODO: Files from in-memory cache, don't read from disk on every request!
    # TODO: Also support hot-reload?
    match Path.read_bytes!(Path.utf8(rel_path)) {
        Ok(bytes) =>
            Ok(
                Server.respond(
                    Response.from_status(200)
                        .with_headers([{ name: "Content-Type", value: content_type }])
                        .with_body(bytes),
                ),
            )
        Err(_) => Ok(text_response(404, "missing asset: ${rel_path}"))
    }
}

shutdown! : Server.ShutdownReason, Context => Try({}, [Exit(I64)])
shutdown! = |_reason, _context| Ok({})

## Server.Target is opaque on 0.18; parse path from Str.inspect until the platform
## exposes a public accessor (health.roc matches Resource on older pins).
raw_path_from_target : Server.Target -> Str
raw_path_from_target = |target| {
    inspected = Str.inspect(target)
    match Str.split_first(inspected, "raw_path: \"") {
        Ok({ after, .. }) =>
            match Str.split_first(after, "\"") {
                Ok({ before, .. }) => before
                Err(_) => ""
            }
        Err(_) => ""
    }
}

html_response : U16, Str -> Server.Outcome
html_response = |status, body|
    Server.respond(
        Response.from_status(status)
            .with_headers([{ name: "Content-Type", value: "text/html; charset=utf-8" }])
            .with_body(Str.to_utf8(body)),
    )

text_response : U16, Str -> Server.Outcome
text_response = |status, body|
    Server.respond(
        Response.from_status(status)
            .with_headers([{ name: "Content-Type", value: "text/plain; charset=utf-8" }])
            .with_body(Str.to_utf8(body)),
    )
