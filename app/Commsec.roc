import pf.Server
import http.Response

Commsec :: {}.
{
    accounts! : { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    accounts! = |_c| Ok(json_stub(501, "{\"error\":\"commsec/accounts not ported yet\"}"))

    holdings! : Str, { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    holdings! = |id, _c| Ok(json_stub(501, "{\"error\":\"commsec/accounts/${id}/holdings not ported yet\"}"))

    transactions! : Str, { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    transactions! = |id, _c| Ok(json_stub(501, "{\"error\":\"commsec/accounts/${id}/transactions not ported yet\"}"))

    eft_screener! : { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    eft_screener! = |_c| Ok(json_stub(501, "{\"error\":\"commsec/eftscreener not ported yet\"}"))

    market_prices! : Str, { alpha_vantage_key : Str } => Try(Server.Outcome, [ServerErr(Str)])
    market_prices! = |code, _c| Ok(json_stub(501, "{\"error\":\"commsec/marketprices/${code} not ported yet\"}"))
}

json_stub = |status, body|
    Server.respond(
        Response.from_status(status)
            .with_headers([{ name: "Content-Type", value: "application/json" }])
            .with_body(Str.to_utf8(body)),
    )
