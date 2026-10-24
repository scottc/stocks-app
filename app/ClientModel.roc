import pf.Http
import YahooV8Finance exposing [Chart]

ClientModel := {
    page : Page,
    chart : [NotRequestedYet, Loading, Loaded(Chart), Error(Str)],
}.{
    ClientMsg : [
        UserClickedNav(Page),
        UserRequestedChart(Str),
        GotChart(Try(Http.Response, [HttpErr([Timeout, NetworkError])])),
    ]

    Page : [Dashboard, Accounts, Efts, Sectors, Compare, Ai]
}
