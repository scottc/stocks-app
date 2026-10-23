app [Model, Msg, init, update, render, subscriptions] {
    pf: platform "https://github.com/niclas-ahden/joy/releases/download/0.34.0/2B3sC6U2dWkVUK2VY2gJS5Wej9YCDo3ZYq2e7tMWUCNp.tar.zst",
    html: "https://github.com/niclas-ahden/joy-html/releases/download/0.17.0/AcmwFzyfbsf5RALWNdX6cXw1cuuDXt96YfcysNqgFqoG.tar.zst",
}

import html.Html exposing [a, div, footer, h1, header, nav, p, section, text]
import html.Attribute exposing [class, class_list, href, on_click]
import pf.Effect

Page : [Dashboard, Accounts, Efts, Sectors, Compare, Ai]

Model : { page : Page }

Msg : [UserClickedNav(Page)]

subscriptions = |_model| []

init : Str -> (Model, List(Effect(Msg)))
init = |_flags|
    ({ page: Dashboard }, [])

update : Model, Msg -> (Model, List(Effect(Msg)))
update = |model, msg|
    match msg {
        UserClickedNav(page) => ({ ..model, page }, [])
    }

render : Model -> Html(Msg)
render = |model|
    div(
        [class("app")],
        [
            view_disclaimer,
            view_toolbar(model.page),
            div([class("content")], [view_page(model.page)]),
        ],
    )

view_disclaimer : Html(Msg)
view_disclaimer =
    section(
        [class("disclaimer")],
        [
            p(
                [],
                [
                    text(
                        "Personal research only — not financial advice. Data may be delayed or incomplete.",
                    ),
                ],
            ),
        ],
    )

view_toolbar : Page -> Html(Msg)
view_toolbar = |current|
    header(
        [class("toolbar")],
        [
            nav(
                [],
                [
                    nav_link("Dashboard", Dashboard, current),
                    text(" | "),
                    nav_link("Accounts", Accounts, current),
                    text(" | "),
                    nav_link("EFTs", Efts, current),
                    text(" | "),
                    nav_link("Sectors", Sectors, current),
                    text(" | "),
                    nav_link("Compare", Compare, current),
                    text(" | "),
                    nav_link("AI", Ai, current),
                ],
            ),
        ],
    )

nav_link : Str, Page, Page -> Html(Msg)
nav_link = |label, page, current|
    a(
        [
            href("#"),
            class_list([("active", page == current)]),
            on_click(UserClickedNav(page)),
        ],
        [text(label)],
    )

view_page : Page -> Html(Msg)
view_page = |page|
    match page {
        Dashboard => page_shell("Dashboard", "Overview of holdings and market movers (API wiring next).")
        Accounts => page_shell("Accounts", "CommSec accounts & holdings — hits /api/commsec/* later.")
        Efts => page_shell("EFTs", "EFT screener — /api/commsec/eftscreener.")
        Sectors => page_shell("Sectors", "Sector breakdown (placeholder).")
        Compare => page_shell("Compare", "Compare securities — Yahoo chart stubs available.")
        Ai => page_shell("AI", "News sentiment via Alpha Vantage (stub).")
    }

page_shell : Str, Str -> Html(Msg)
page_shell = |title, blurb|
    section(
        [class("page")],
        [
            h1([], [text(title)]),
            p([], [text(blurb)]),
            footer(
                [class("page-meta")],
                [text("stocks-app · Roc + Joy · basic-webserver API on :8000")],
            ),
        ],
    )
