YahooV8Finance := {}.{

    to_str : Chart -> Str
    to_str = |chart|
        match Json.to_str_try(chart) {
            Ok(str) => str
            Err(_e) => ""
        }

    Chart : {
        chart?: YahooChart,
    }

    YahooChart : {
        result?: List(YahooChartResultItem),
        error?: [Str(Str), Null],
    }

    YahooChartResultItem : {
        meta?: YahooMeta,
        timestamp?: List(I64),
        indicators?: YahooChartIndicators,
    }

    YahooMeta : {
        currency?: Str,
        symbol?: Str,
        exchangeName?: Str,
        fullExchangeName?: Str,
        instrumentType?: Str,
        firstTradeDate?: [Known(I64), Unknown],
        regularMarketTime?: [Known(I64), Unknown],
        hasPrePostMarketData?: [Known(Bool), Unknown],
        gmtoffset?: [Known(I64), Unknown],
        timezone?: Str,
        exchangeTimezoneName?: Str,
        regularMarketPrice?: F64,
        fiftyTwoWeekHigh?: F64,
        fiftyTwoWeekLow?: F64,
        regularMarketDayHigh?: F64,
        regularMarketDayLow?: F64,
        regularMarketVolume?: I64,
        longName?: Str,
        shortName?: Str,
        chartPreviousClose?: F64,
        priceHint?: [Known(I64), Unknown],
        currentTradingPeriod?: TradingPeriods,
        dataGranularity?: Str, #DataGranularity,
        range?: [Known(Str), Unknown],
        validRanges?: [Known(List(Str)), Unknown],
    }

    TradingPeriods : {
        pre?: TradingHours,
        regular?: TradingHours,
        post?: TradingHours,
    }

    TradingHours : {
        timezone?: Str,
        start?: I64,
        end?: I64,
        gmtoffset?: I64,
    }

    YahooChartIndicators : {
        quote?: List(YahooQuote),
        adjclose?: List(AdjClose),
    }

    AdjClose : {
        adjclose?: List([Num(F64), Null]),
    }

    YahooQuote : {
        high?: List([Num(F64), Null]),
        volume?: List([Num(I64), Null]),
        close?: List([Num(F64), Null]),  # deprecated in TS source; prefer adjclose
        low?: List([Num(F64), Null]),
        open?: List([Num(F64), Null]),
    }

    DataGranularity : [
        OneMinute,
        FiveMinute,
        OneHour,
        OneDay,
        OneWeek,
        OneMonth,
        Other(Str),
    ]
}

expect {
    # https://query1.finance.yahoo.com/v8/finance/chart/VOD.L?period=1d&interval=1d
    str = \\{"chart":{"result":[{"meta":{"currency":"GBp","symbol":"VOD.L","exchangeName":"LSE","fullExchangeName":"LSE","instrumentType":"EQUITY","firstTradeDate":593769600,"regularMarketTime":1792769764,"hasPrePostMarketData":false,"gmtoffset":3600,"timezone":"BST","exchangeTimezoneName":"Europe/London","regularMarketPrice":118.2,"regularMarketChangePercent":-1.336,"fulldayPrice":118.2,"fulldayChange":-1.6,"fulldayChangePercent":-1.336,"fiftyTwoWeekHigh":132.072,"fiftyTwoWeekLow":85.235,"regularMarketDayHigh":120.15,"regularMarketDayLow":117.1,"regularMarketVolume":30133825,"longName":"Vodafone Group Public Limited Company","shortName":"VODAFONE GROUP PLC ORD USD0.20 ","chartPreviousClose":119.8,"priceHint":2,"currentTradingPeriod":{"pre":{"timezone":"BST","start":1792736100,"end":1792738800,"gmtoffset":3600},"regular":{"timezone":"BST","start":1792738800,"end":1792769400,"gmtoffset":3600},"post":{"timezone":"BST","start":1792769400,"end":1792772100,"gmtoffset":3600}},"dataGranularity":"1d","range":"1d","validRanges":["1d","5d","1mo","3mo","6mo","1y","2y","5y","10y","ytd","max"]},"timestamp":[1792769764],"indicators":{"quote":[{"high":[120.1500015258789],"low":[117.0999984741211],"volume":[30133825],"close":[118.19999694824219],"open":[119.1500015258789]}],"adjclose":[{"adjclose":[118.19999694824219]}]}}],"error":null}}

    decoded : Try(Chart, _)
    decoded = Json.parse(str)

    match decoded {
        Ok(_v) => True
        Err(e) => {
            dbg(e)
            False
        }
    }
}
