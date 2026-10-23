import pf.Server
import http.Response

Asx :: {}.
{
    listed_companies! : { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    listed_companies! = |_context|
        Ok(json_stub(501, "{\"error\":\"ASX loader not ported yet\"}"))
}

json_stub = |status, body|
    Server.respond(
        Response.from_status(status)
            .with_headers([{ name: "Content-Type", value: "application/json" }])
            .with_body(Str.to_utf8(body)),
    )
