import pf.Http
import pf.Path
import pf.Stdout
import pf.Server
import pf.UnixTime
import http.Request
import http.Response

YahooLoader :: {}.{
    ## 23 hours, matching the Bun CACHE_TTL (3600 * 23).
    cache_ttl_secs : I128
    cache_ttl_secs = 3600 * 23

    # TODO: Decode Yahoo v8 Finance Chart

    chart! : Str, Str, { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    chart! = |symbol, interval, _context| {
        if symbol == "unknown" {
            Ok(json_response(400, "{\"error\":\"unhandled symbol\"}"))
        } else if !(interval == "1d" or interval == "1m") {
            Ok(json_response(400, "{\"error\":\"interval must be 1d or 1m\"}"))
        } else {
            match fetch_chart!(symbol, interval) {
                Ok(body) => Ok(json_response(200, body))
                Err(msg) => Ok(json_response(502, "{\"error\":${Json.to_str(msg)}}"))
            }
        }
    }

    fetch_chart! : Str, Str => Try(Str, [ServerErr(Str)])
    fetch_chart! = |symbol, interval| {
        now = unix_now_secs!()

        match read_fresh_cache!(symbol, interval, now) {
            Ok(body) => {
                # Stdout.line!("[Disk] yahoo cache hit ${symbol}/${interval}")?
                Ok(body)
            }
            Err(_) => {
                body = network_fetch!(symbol, interval, now)?
                write_cache!(symbol, interval, now, body)?
                Ok(body)
            }
        }
    }

    ## Yahoo chart URL — same query shape as the Bun loader.
    network_fetch! : Str, Str, I128 => Try(Str, [ServerErr(Str)])
    network_fetch! = |symbol, interval, now| {
        one_week = 60 * 60 * 24 * 7
        period1 = if interval == "1d" "0" else (now - one_week).to_str()
        period2 = "9999999999"

        url =
            "https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=false&includeAdjustedClose=true&events=div%7Csplit"

        # Stdout.line!("[Network] Yahoo ${url}")?

        request =
            Request.from_method(GET)
                .with_uri(url)
                .with_headers([
                    { name: "User-Agent", value: "stocks-app-roc/0.1" },
                    { name: "Accept", value: "application/json" },
                ])

        match Http.send!(request) {
            Ok(resp) => {
                status = Response.status(resp)
                body_bytes = Response.body(resp)
                body =
                    match Str.from_utf8(body_bytes) {
                        Ok(s) => s
                        Err(_) => return Err(ServerErr("yahoo body was not utf-8"))
                    }

                if status >= 200 and status < 300 {
                    Ok(body)
                } else {
                    Err(ServerErr("yahoo HTTP ${status.to_str()}"))
                }
            }
            Err(err) => Err(ServerErr("yahoo transport: ${Str.inspect(err)}"))
        }
    }

    ## data/yahoo/charts/{SYMBOL}/{interval}/{unix}.json
    cache_dir : Str, Str -> Path
    cache_dir = |symbol, interval|
        Path.utf8("data/yahoo/charts")
            .join(symbol)
            .join(interval)

    read_fresh_cache! : Str, Str, I128 => Try(Str, [ServerErr(Str)])
    read_fresh_cache! = |symbol, interval, now| {
        dir = cache_dir(symbol, interval)

        entries =
            match dir.list!() {
                Ok(paths) => paths
                Err(_) => return Err(ServerErr("no cache dir"))
            }

        ## Prefer newest timestamp filename within TTL.
        freshest =
            entries
                .map(|p| Path.display(p))
                .keep_if(|name| Str.ends_with(name, ".json"))
                .map(|name| {
                    stem =
                        match Str.split_last(name, ".json") {
                            Ok({ before, .. }) => before
                            Err(_) => "0"
                        }
                    ## basename only
                    base =
                        match Str.split_last(stem, "/") {
                            Ok({ after, .. }) => after
                            Err(_) => stem
                        }
                    ts =
                        match I128.from_str(base) {
                            Ok(n) => n
                            Err(_) => 0
                        }
                    (ts, name)
                })
                .keep_if(|(ts, _)| ts > 0 and now - ts <= cache_ttl_secs)
                # .sort_with(|(a, _), (b, _)| Num.compare(b, a)) # TODO: fix sort

        match freshest {
            [(ts, _), ..] => {
                file_path = dir.join("${ts.to_str()}.json")
                match file_path.read_utf8!() {
                    Ok(body) => Ok(body)
                    Err(_) => Err(ServerErr("cache unreadable"))
                }
            }
            [] => Err(ServerErr("cache miss"))
        }
    }

    write_cache! : Str, Str, I128, Str => Try({}, [ServerErr(Str)])
    write_cache! = |symbol, interval, now, body| {
        dir = cache_dir(symbol, interval)
        dir.create_all!() ? |_| ServerErr("mkdir cache failed")

        file_path = dir.join("${now.to_str()}.json")
        file_path.write_utf8!(body) ? |_| ServerErr("write cache failed")

        # Stdout.line!("[Disk] yahoo cached ${Path.display(file_path)}")?
        Ok({})
    }

    ## Wall-clock seconds. Prefer a platform clock when available; this is a
    ## coarse fallback so cache keys still advance across process restarts.
    ## If you have `UnixTime` / host time on your pin, swap this out.
    unix_now_secs! : () => I128
    unix_now_secs! = || {
        UnixTime.now!().nanos_since_epoch()
    }

    json_response : U16, Str -> Server.Outcome
    json_response = |status, body|
        Server.respond(
            Response.from_status(status)
                .with_headers([{ name: "Content-Type", value: "application/json" }])
                .with_body(Str.to_utf8(body)),
        )
}
