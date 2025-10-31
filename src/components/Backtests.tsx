import {
  monteCarloSimulation,
  runBacktest,
  walkForwardBacktest,
  type BacktestResult,
  type OHLCV,
  type SignalResult,
} from "@/fin/backtester";
import { toOHLCV, useYahooStock } from "@/hooks/useYahooStock";
import type { CrossExchangeTickerSymbol } from "@/lib/lib";
import { Card } from "./Card";

interface MonteCarloSimulationProps {
  simulations?: number;
}

/**
 *
 */
const MonteCarloSimulation = (props: MonteCarloSimulationProps) => {
  const equityCurve = Array(100)
    .fill(0)
    .map(() => Math.random());

  const result = monteCarloSimulation(equityCurve, props.simulations ?? 100);

  return (
    <Card>
      <h2>Monte Carlo Simulation Results</h2>

      <h4>Inputs</h4>
      <p>
        Simulations: {100}
        <br />
        Equity Curve Data: Mock data... 100 random numbers...
        <br />
        Noise Function: Math.Random()
        <br />
        Seed Value: Math.Random()
      </p>

      <h4>Results</h4>
      <p>
        cagr5th: {result.cagr5th}
        <br />
        cagr95th: {result.cagr95th}
        <br />
        maxDrawdown95th: {result.maxDrawdown95th}
        <br />
        medianCAGR: {result.medianCAGR}
        <br />
        probProfit: {result.probProfit}
        <br />
      </p>
    </Card>
  );
};

interface BacktestSimulationProps {
  tickerSymbol: CrossExchangeTickerSymbol;
}

const BacktestSimulation = (props: BacktestSimulationProps) => {
  const yahooData = useYahooStock({ symbol: props.tickerSymbol.yahoo });

  const isWeekly = true;
  const initialCash = 10000;

  const signalFn = (_closes: number[]): SignalResult => ({
    confidence: 1,
    costAdjusted: true,
    reason: "Just do eeet!",
    signal: "buy",
  });

  const result = runBacktest(
    toOHLCV(yahooData),
    signalFn,
    initialCash,
    isWeekly,
  );

  return (
    <Card>
      <h2>Backtest Simulation Results</h2>

      <h4>Inputs</h4>
      <p>
        Initial Cash: {10000}
        <br />
        Buy/Sell Signal Function: {"alwaysBuyWithFullConfidence()"}
        <br />
        Historical Data: {props.tickerSymbol.yahoo} MAX
      </p>

      <h4>Results</h4>
      <p>
        <br />
        Cagr: {result.cagr}
        <br />
        Final Value: {result.finalValue}
        <br />
        Initial Cash: {result.initialCash}
        <br />
        Max Drawdown: {result.maxDrawdown}
        <br />
        Profit Factor: {result.profitFactor}
        <br />
        Sharpe: {result.sharpe}
        <br />
        Trade Count: {result.trades.length}
        <br />
        Win Rate: {result.winRate}
        <br />
        Trades:{" "}
        {result.trades.map((t) => (
          <span key={t.entryDate}>
            Shares: {t.shares}, Return: {t.return}
            <br />
          </span>
        ))}
        Equity Curve:
        <br />
        {result.equityCurve.map((ec, i) => (
          <span key={i}>
            {ec}
            <br />
          </span>
        ))}
      </p>
    </Card>
  );
};

const BackTestResult = (props: { result: BacktestResult }) => {
  return (
    <>
      <td>cagr:{props.result.cagr}</td>
      <td>equityCurve: {props.result.equityCurve}</td>
      <td>finalValue: {props.result.finalValue}</td>
      <td>initialCash: {props.result.initialCash}</td>
      <td>maxDrawdown: {props.result.maxDrawdown}</td>
      <td>profitFactor: {props.result.profitFactor}</td>
      <td>sharpe: {props.result.sharpe}</td>
      <td>
        Trade Count: {props.result.trades.length}
        Entry Dates: {props.result.trades.map((t) => t.entryDate)}
        Exit Dates: {props.result.trades.map((t) => t.exitDate)}
        Entry Price: {props.result.trades.map((t) => t.entryPrice)}
        Exit Price: {props.result.trades.map((t) => t.exitPrice)}
        Profits: {props.result.trades.map((t) => t.profit)}
        Returns: {props.result.trades.map((t) => t.return)}
        Shares: {props.result.trades.map((t) => t.shares)}
      </td>
      <td>{props.result.winRate}</td>
    </>
  );
};

interface WalkForwardSimulation {}

const WalkForwardSimulation = () => {
  const data: OHLCV[] = [];
  const signalFn = (_closes: number[]): SignalResult => ({
    confidence: 0.5,
    costAdjusted: true,
    reason: "",
    signal: "buy",
  });
  const inSampleYears: number = 5;
  const outSampleYears: number = 1;
  const initialCash: number = 10000;

  const results = walkForwardBacktest(
    data,
    signalFn,
    inSampleYears,
    outSampleYears,
    initialCash,
  );

  return (
    <Card>
      <h2>Walk Forward Simulation Results</h2>

      <h4>Inputs</h4>

      <h4>Results</h4>
      {results.map((result, _i) => {
        return (
          <tr
            key={_i} // this is a shit sequence key, can we get a unique identifying key?
          >
            <td>{result.robustness}</td>
            <BackTestResult result={result.inSample} />
            <BackTestResult result={result.outSample} />
          </tr>
        );
      })}
    </Card>
  );
};

export { BacktestSimulation, WalkForwardSimulation, MonteCarloSimulation };
