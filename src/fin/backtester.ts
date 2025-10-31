// src/lib/backtester.ts
/**
 * @file Advanced backtester with Walk-Forward + Monte Carlo
 * Supports any signal function (dualMA, RSI, etc.)
 * CommSec cost: $2 per $1,000 (0.2%)
 */

import {
  // dualMASignal,
  type SignalResult,
} from "./signals";

interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  shares: number;
  profit: number;
  return: number;
}

export interface BacktestResult {
  initialCash: number;
  finalValue: number;
  cagr: number;
  maxDrawdown: number;
  sharpe: number;
  winRate: number;
  profitFactor: number;
  trades: Trade[];
  equityCurve: number[];
}

interface WalkForwardResult {
  inSample: BacktestResult;
  outSample: BacktestResult;
  robustness: number; // out/in CAGR ratio
}

interface MonteCarloResult {
  medianCAGR: number;
  cagr95th: number;
  cagr5th: number;
  probProfit: number;
  maxDrawdown95th: number;
}

/**
 * Apply CommSec cost
 */
function applyCost(amount: number): number {
  return amount * 0.002; // $2 per $1,000
}

/**
 * Run single backtest
 */
function runBacktest(
  data: OHLCV[],
  signalFn: (closes: number[]) => SignalResult,
  initialCash = 10000,
  weekly = true,
): BacktestResult {
  const closes = data.map((d) => d.close);
  const dates = data.map((d) => d.date);
  const step = weekly ? 5 : 1; // weekly = every 5th day

  let cash = initialCash;
  let shares = 0;
  let entryPrice = 0;
  let equityCurve: number[] = [];
  const trades: Trade[] = [];
  let peak = initialCash;

  for (let i = 200; i < closes.length; i += step) {
    const window = closes.slice(0, i + 1);
    const signal = signalFn(window);
    const price = closes[i]!;
    const date = dates[i]!;

    // Track equity
    const equity = cash + shares * price;
    equityCurve.push(equity);
    peak = Math.max(peak, equity);

    if (signal.signal === "buy" && cash > 1000 && shares === 0) {
      const cost = applyCost(cash);
      shares = Math.floor((cash - cost) / price);
      cash -= shares * price + cost;
      entryPrice = price;
    }

    if (signal.signal === "sell" && shares > 0) {
      const revenue = shares * price;
      const cost = applyCost(revenue);
      const profit = revenue - cost - shares * entryPrice;
      trades.push({
        entryDate: dates[i - step] || date,
        exitDate: date,
        entryPrice,
        exitPrice: price,
        shares,
        profit,
        return: profit / (shares * entryPrice),
      });
      cash += revenue - cost;
      shares = 0;
    }
  }

  const finalValue = cash + shares * closes.at(-1)!;
  const years = data.length / 252 / (weekly ? 52 : 1);
  const cagr = (finalValue / initialCash) ** (1 / years) - 1;

  const returns = equityCurve.map((v, i) =>
    i > 0 ? (v - equityCurve[i - 1]!) / equityCurve[i - 1]! : 0,
  );
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((a, b) => a + (b - avgReturn) ** 2, 0) / returns.length,
  );
  const sharpe =
    stdDev === 0 ? 0 : (avgReturn * 252) / (stdDev * Math.sqrt(252));

  const drawdowns = equityCurve.map((v, _i) => (v - peak) / peak);
  const maxDrawdown = Math.min(...drawdowns);

  const wins = trades.filter((t) => t.profit > 0);
  const winRate = trades.length ? wins.length / trades.length : 0;
  const grossProfit = wins.reduce((a, t) => a + t.profit, 0);
  const grossLoss = trades
    .filter((t) => t.profit < 0)
    .reduce((a, t) => a + Math.abs(t.profit), 0);
  const profitFactor = grossLoss === 0 ? Infinity : grossProfit / grossLoss;

  return {
    initialCash,
    finalValue,
    cagr,
    maxDrawdown,
    sharpe,
    winRate,
    profitFactor,
    trades,
    equityCurve,
  };
}

/**
 * Walk-Forward Optimization
 */
export function walkForwardBacktest(
  data: OHLCV[],
  signalFn: (closes: number[]) => SignalResult,
  inSampleYears = 5,
  outSampleYears = 1,
  initialCash = 10000,
): WalkForwardResult[] {
  const totalYears = data.length / 252;
  const results: WalkForwardResult[] = [];
  let start = 0;

  while (start + inSampleYears + outSampleYears <= totalYears) {
    const inEnd = start + inSampleYears;
    const outEnd = inEnd + outSampleYears;

    const inData = data.slice(0, Math.floor(inEnd * 252));
    const outData = data.slice(
      Math.floor(inEnd * 252),
      Math.floor(outEnd * 252),
    );

    const inResult = runBacktest(inData, signalFn, initialCash);
    const outResult = runBacktest(outData, signalFn, inResult.finalValue);

    results.push({
      inSample: inResult,
      outSample: outResult,
      robustness: outResult.cagr / (inResult.cagr || 0.0001),
    });

    start += outSampleYears;
  }

  return results;
}

/**
 * Monte Carlo Simulation
 */
export function monteCarloSimulation(
  equityCurve: number[],
  simulations = 1000,
): MonteCarloResult {
  const n = equityCurve.length;
  const results: { cagr: number; maxDD: number }[] = [];

  for (let i = 0; i < simulations; i++) {
    const shuffled = [...equityCurve];
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [shuffled[j], shuffled[k]] = [shuffled[k]!, shuffled[j]!];
    }

    let peak = shuffled[0]!;
    let maxDD = 0;
    for (const eq of shuffled) {
      peak = Math.max(peak, eq);
      maxDD = Math.min(maxDD, (eq - peak) / peak);
    }

    const years = n / 252;
    const cagr = (shuffled.at(-1)! / shuffled[0]!) ** (1 / years) - 1;
    results.push({ cagr, maxDD });
  }

  results.sort((a, b) => a.cagr - b.cagr);
  const cagrValues = results.map((r) => r.cagr);
  const ddValues = results.map((r) => r.maxDD);

  return {
    medianCAGR: cagrValues[Math.floor(simulations * 0.5)]!,
    cagr95th: cagrValues[Math.floor(simulations * 0.95)]!,
    cagr5th: cagrValues[Math.floor(simulations * 0.05)]!,
    probProfit: results.filter((r) => r.cagr > 0).length / simulations,
    maxDrawdown95th: ddValues[Math.floor(simulations * 0.95)]!,
  };
}

export { runBacktest, type OHLCV, type SignalResult };
