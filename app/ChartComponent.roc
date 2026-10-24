import html.Html exposing [div, button, h1, text, svg, element]
import html.Attribute exposing [class, style, on_click, attribute]

import YahooV8Finance exposing [Chart]
import ClientModel exposing [ClientMsg]

ChartComponent := {}.{

    Candle : { o : F64, h : F64, l : F64, c : F64, ts : I64 }

    # YahooQuote fields are List(Try(F64, [Null])). Flatten List.get + Try.
    unwrap_ohlc : Try(F64, [Null]) -> Try(F64, [Null])
    unwrap_ohlc = |v| v

    extract_candles : Chart -> List(Candle)
    extract_candles = |chart|
        match List.first(chart.chart.result) {
            Err(_) => []
            Ok(item) =>
                match List.first(item.indicators.quote) {
                    Err(_) => []
                    Ok(q) => {
                        #_n = List.len(item.timestamp)
                        # Build indices 0..<n via fold on the timestamp list itself
                        List.fold_with_index(
                            item.timestamp,
                            [],
                            |acc, ts, i| {
                                o = match List.get(q.open, i) {
                                    Ok(Ok(x)) => Ok(x)
                                    _ => Err(Null)
                                }
                                h = match List.get(q.high, i) {
                                    Ok(Ok(x)) => Ok(x)
                                    _ => Err(Null)
                                }
                                l = match List.get(q.low, i) {
                                    Ok(Ok(x)) => Ok(x)
                                    _ => Err(Null)
                                }
                                c = match List.get(q.close, i) {
                                    Ok(Ok(x)) => Ok(x)
                                    _ => Err(Null)
                                }
                                match (o, h, l, c) {
                                    (Ok(oo), Ok(hh), Ok(ll), Ok(cc)) =>
                                        List.append(acc, { o: oo, h: hh, l: ll, c: cc, ts })
                                    _ => acc
                                }
                            },
                        )
                    }
                }
        }

    build_paths : List(Candle), F64, F64, F64, F64 -> { up : Str, down : Str }
    build_paths = |candles, plot_left, plot_width, plot_top, plot_height| {
        n = List.len(candles)

        if n == 0 {
            { up: "", down: "" }
        } else {
            first =
                match List.first(candles) {
                    Ok(c) => c
                    Err(_) => {
                        o: 0.0,
                        h: 0.0,
                        l: 0.0,
                        c: 0.0,
                        ts: 0,
                    }
                }

            prices =
                List.fold(
                    candles,
                    { min: first.l, max: first.h },
                    |acc, candle| {
                        {
                            min: acc.min.min(candle.l).min(candle.o).min(candle.c),
                            max: acc.max.max(candle.h).max(candle.o).max(candle.c),
                        }
                    },
                )

            range = prices.max - prices.min
            safe_range =
                if range < 1.0e-9 {
                    1.0
                } else {
                    range
                }

            spacing =
                if n <= 1 {
                    4.0
                } else {
                    plot_width / (n.to_f64() - 1.0)
                }

            body_w : F64
            body_w = 4.0.F64.min(0.6.F64.max(spacing * 0.65))
            half_w = body_w / 2.0

            y_scale = plot_height / safe_range

            to_y : F64 -> F64
            to_y = |price|
                plot_top + (prices.max - price) * y_scale

            step = |acc, candle, i| {
                cx : F64
                cx = plot_left + i.to_f64() * spacing

                y_high  = to_y(candle.h)
                y_low   = to_y(candle.l)
                y_open  = to_y(candle.o)
                y_close = to_y(candle.c)

                body_top = y_open.min(y_close)
                body_bot = y_open.max(y_close)
                body_h   = 0.8.F64.max(body_bot - body_top)

                wick =
                    "M${cx.to_str()} ${y_high.to_str()} L${cx.to_str()} ${y_low.to_str()} "

                body =
                    "M${(cx - half_w).to_str()} ${body_top.to_str()} h${body_w.to_str()} v${body_h.to_str()} h${(-body_w).to_str()} z "

                segment = Str.concat(wick, body)

                if candle.c >= candle.o {
                    { up: Str.concat(acc.up, segment), down: acc.down }
                } else {
                    { up: acc.up, down: Str.concat(acc.down, segment) }
                }
            }

            List.fold_with_index(candles, { up: "", down: "" }, step)
        }
    }

    view_candlestick : List(Candle) -> Html(ClientMsg)
    view_candlestick = |candles| {
        w : F64
        w = 900.0
        h : F64
        h = 360.0

        ml = 40.0
        mr = 40.0
        mt = 20.0
        mb = 20.0

        plot_w = w - ml - mr
        plot_h = h - mt - mb

        n = List.len(candles)

        { up_d, down_d } =
            if n == 0 {
                { up_d: "", down_d: "" }
            } else {
                first =
                    match List.first(candles) {
                        Ok(c) => c
                        Err(_) => { o: 0.0, h: 0.0, l: 0.0, c: 0.0, ts: 0 }
                    }

                prices =
                    List.fold(
                        candles,
                        { min: first.l, max: first.h },
                        |acc, candle| {
                            {
                                min: acc.min.min(candle.l).min(candle.o).min(candle.c),
                                max: acc.max.max(candle.h).max(candle.o).max(candle.c),
                            }
                        },
                    )

                range = prices.max - prices.min
                safe_range =
                    if range < 1.0e-6 {
                        1.0
                    } else {
                        range
                    }

                spacing =
                    if n <= 1 {
                        8.0
                    } else {
                        plot_w / n.to_f64()
                    }

                body_w : F64
                body_w = 4.0.min(1.0.max(spacing * 0.7))
                half_w = body_w / 2.0

                y_scale = plot_h / safe_range

                to_y = |price|
                    mt + (prices.max - price) * y_scale

                List.fold_with_index(
                    candles,
                    { up_d: "", down_d: "" },
                    |acc, candle, i| {
                        cx = ml + (i.to_f64() + 0.5) * spacing

                        y_h = to_y(candle.h)
                        y_l = to_y(candle.l)
                        y_o = to_y(candle.o)
                        y_c = to_y(candle.c)

                        body_top = y_o.min(y_c)
                        body_h   = 1.0.F64.max(y_o.max(y_c) - body_top)

                        # wick + body in one path segment
                        segment =
                            "M${cx.to_str()} ${y_h.to_str()} L${cx.to_str()} ${y_l.to_str()} "
                            |> Str.concat(
                                "M${(cx - half_w).to_str()} ${body_top.to_str()} h${body_w.to_str()} v${body_h.to_str()} h${(-body_w).to_str()} z ",
                            )

                        if candle.c >= candle.o {
                            { up_d: Str.concat(acc.up_d, segment), down_d: acc.down_d }
                        } else {
                            { up_d: acc.up_d, down_d: Str.concat(acc.down_d, segment) }
                        }
                    },
                )
            }

        svg(
            [
                attribute("viewBox", "0 0 ${w.to_str()} ${h.to_str()}"),
                attribute("preserveAspectRatio", "xMidYMid meet"),
                attribute("width", "100%"),
                style([
                    ("width", "100%"),
                    ("height", "360px"),
                    ("display", "block"),
                    ("background", "#0d1117"),
                ]),
            ],
            [
                element(
                    "rect",
                    [
                        attribute("x", "0"),
                        attribute("y", "0"),
                        attribute("width", w.to_str()),
                        attribute("height", h.to_str()),
                        attribute("fill", "#0d1117"),
                        attribute("stroke", "#30363d"),
                        attribute("stroke-width", "1"),
                    ],
                    [],
                ),
                element(
                    "path",
                    [
                        attribute("d", up_d),
                        attribute("fill", "#3fb950"),
                        attribute("stroke", "#3fb950"),
                        attribute("stroke-width", "1"),
                    ],
                    [],
                ),
                element(
                    "path",
                    [
                        attribute("d", down_d),
                        attribute("fill", "#f85149"),
                        attribute("stroke", "#f85149"),
                        attribute("stroke-width", "1"),
                    ],
                    [],
                ),
            ],
        )
    }

    request_chart_button : Html(ClientMsg)
    request_chart_button =
        button(
            [style([("display", "block")]), on_click(UserRequestedChart("IOO.AX"))],
            [text("Fetch IOO.AX")],
        )

    render_chart : ClientModel -> Html(ClientMsg)
    render_chart = |model|
        match model.chart {
            NotRequestedYet =>
                div(
                    [],
                    [
                        text("Would you like a Yahoo chart?"),
                        ChartComponent.request_chart_button,
                    ],
                )

            Loading => div([], [text("Getting a chart...")])

            Loaded(chart) => {
                candles = ChartComponent.extract_candles(chart)
                meta =
                    match List.first(chart.chart.result) {
                        Ok(r) =>
                            "${r.meta.symbol} · ${r.meta.longName} · ${List.len(candles).to_str()} bars"
                        Err(_) => "chart"
                    }

                div(
                    [class("chart-panel")],
                    [
                        h1([], [text(meta)]),
                        ChartComponent.view_candlestick(candles),
                        ChartComponent.request_chart_button,
                    ],
                )
            }

            Error(error) =>
                div(
                    [],
                    [
                        text("Couldn't get chart, cause: ${error}"),
                        ChartComponent.request_chart_button,
                    ],
                )
        }
}
