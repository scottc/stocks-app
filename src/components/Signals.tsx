import { last, watchList, type CrossExchangeTickerSymbol } from "@/lib/lib";
import { useYahooStock } from "@/hooks/useYahooStock";

import {
  dualMASignal,
  rsiVolumeSignal,
  macdSignal,
  donchianSignal,
  rotationSignal,
  type SignalResult,
  resampleToWeeklyCloses,
  type OHLCVT,
} from "@/fin/signals";
import { Card } from "./Card";
import { useCommsecHoldings } from "@/hooks/useCommsecHoldings";

const color = (sr: SignalResult) => {
  switch (sr.signal) {
    case "buy":
      return `hsl(127, ${50 + (sr.confidence * 100) / 2}%, ${100 - (sr.confidence * 100) / 2}%)`;
    case "sell":
      return `hsl(0, ${50 + (sr.confidence * 100) / 2}%, ${100 - (sr.confidence * 100) / 2}%)`;
    case "hold":
      return `hsl(45, ${50 + (sr.confidence * 100) / 2}%, ${100 - (sr.confidence * 100) / 2}%)`;
  }
};

interface SignalResultProps {
  name: string;
  signal: SignalResult;
}

const SignalResult = (props: SignalResultProps) => {
  return (
    <>
      <h4>{props.name}</h4>
      <p
        style={{
          color: color(props.signal),
          fontWeight: 100 + props.signal.confidence * 700,
          fontSize: 14 + props.signal.confidence * 6,
        }}
      >
        signal: {props.signal.signal}
        <br />
        confidence: {props.signal.confidence}
        <br />
        cost adjusted: {props.signal.costAdjusted ? "true" : "false"}
        <br />
        reason: {props.signal.reason}
      </p>
    </>
  );
};

interface SignalsProps {
  symbol: CrossExchangeTickerSymbol;
  history: number;
}

const Signals = (props: SignalsProps) => {
  const stocks = useYahooStock({ symbol: props.symbol.yahoo });
  const holdings = useCommsecHoldings({});

  // const adjclose = stocks.value?.chart.result.at(0)?.indicators.adjclose;
  const quote = stocks.value?.chart.result.at(0)?.indicators.quote;
  const highs = quote?.at(0)?.high ?? [];
  const lows = quote?.at(0)?.low ?? [];
  const opens = quote?.at(0)?.open ?? [];
  const volumes = quote?.at(0)?.volume ?? [];
  const closes = quote?.at(0)?.close.map((x) => x ?? 0) ?? [];

  const timestamps = stocks.value?.chart.result.at(0)?.timestamp ?? [];
  // const meta = stocks.value?.chart.result.at(0)?.meta;

  const ohlcvs = timestamps.map(
    (ts, index): OHLCVT => ({
      timestamp: ts,
      close: closes.at(index) ?? 0,
      high: highs.at(index) ?? 0,
      low: lows.at(index) ?? 0,
      open: opens.at(index) ?? 0,
      volume: volumes.at(index) ?? 0,
    }),
  );

  const weeklyOhlcvs = resampleToWeeklyCloses(ohlcvs);

  const rotationSig = rotationSignal(
    watchList.map((tickerSymbol) => ({
      symbol: tickerSymbol.commsec,
      returnsM:
        ((last(closes) ?? 0) -
          (holdings.value?.holdings.find((h) => h.code === tickerSymbol.commsec)
            ?.purchasePrice ??
            last(closes) ??
            0)) /
        100,
    })),
    1,
    1,
  ).find((s) => s.symbol === props.symbol.commsec);

  return (
    <>
      <Card>
        <h2>Yahoo {props.symbol.yahoo} Signals</h2>

        <SignalResult
          name="rsiVolume(days: 20, overbought: 65, oversold: 35) ->"
          signal={rsiVolumeSignal(
            ohlcvs,
            20, // period in days
            65, // overbought
            35, // oversold
          )}
        />
        <SignalResult
          name="dualMA(weeklyData, shortPeriod: 50, longPeriod: 200) ->"
          signal={dualMASignal(
            weeklyOhlcvs,
            50, // short period
            200, // long period
          )}
        />
        <SignalResult
          name="macd(weeklyData) ->"
          signal={macdSignal(weeklyOhlcvs)}
        />
        <SignalResult
          name="donchian(weeklyData, weeks: 20) ->"
          signal={donchianSignal(weeklyOhlcvs, 20 /* Weeks */)}
        />

        {rotationSig ? (
          <SignalResult
            name={`returnsMomentumRotation(buyTop: 1, sellBottom: 1)`}
            signal={rotationSig.signal}
          />
        ) : (
          <></>
        )}
      </Card>
    </>
  );
};

export default Signals;
