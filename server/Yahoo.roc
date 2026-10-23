import pf.Server
import http.Response

Yahoo :: {}.
{
    chart! : Str, Str, { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    chart! = |symbol, interval, _context| {
        body = "{\"symbol\":\"${symbol}\",\"interval\":\"${interval}\",\"status\":\"stub\"}"
        Ok(json_stub(501, body))
    }
}

json_stub = |status, body|
    Server.respond(
        Response.from_status(status)
            .with_headers([{ name: "Content-Type", value: "application/json" }])
            .with_body(Str.to_utf8(body)),
    )
