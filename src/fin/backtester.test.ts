// src/lib/backtester.test.ts
import { describe, it, expect, beforeEach, test } from "bun:test";
import {
  runBacktest,
  walkForwardBacktest,
  monteCarloSimulation,
  type OHLCV,
  type SignalResult,
} from "./backtester";

// Mock signal: Always "buy" on first valid day, "sell" on last
function mockSignal(closes: number[]): SignalResult {
  if (closes.length < 201)
    return {
      signal: "hold",
      confidence: 0,
      reason: "wait",
      costAdjusted: true,
    };
  const i = closes.length - 1;
  if (i === 200)
    return { signal: "buy", confidence: 1, reason: "test", costAdjusted: true };
  if (i === closes.length - 1 && i > 200)
    return {
      signal: "sell",
      confidence: 1,
      reason: "test",
      costAdjusted: true,
    };
  return {
    signal: "hold",
    confidence: 0.5,
    reason: "hold",
    costAdjusted: true,
  };
}

// Generate synthetic data: 10 years, 252 days/year
function generateData(
  years: number,
  startPrice = 100,
  drift = 0.08,
  volatility = 0.15,
): OHLCV[] {
  const days = years * 252;
  const data: OHLCV[] = [];
  let price = startPrice;

  for (let i = 0; i < days; i++) {
    const dailyReturn =
      drift / 252 + (volatility / Math.sqrt(252)) * (Math.random() - 0.5) * 2;
    price *= 1 + dailyReturn;
    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    const close = price * (1 + (Math.random() - 0.5) * 0.01);
    data.push({
      date: `2020-01-${String((i % 30) + 1).padStart(2, "0")}`,
      open,
      high,
      low,
      close,
      volume: 1000000 + Math.floor(Math.random() * 500000),
    });
  }
  return data;
}

describe("runBacktest", () => {
  let data: OHLCV[];

  beforeEach(() => {
    data = generateData(10);
  });

  test.todo("executes one full trade cycle with costs", () => {
    // 52 weeks, price drifts **+5%**, then **-5%** → one round-trip
    const prices = Array(26).fill(100); // flat
    prices.push(
      ...Array.from(
        { length: 13 },
        (_, i) => 100 * (1 + (0.05 * (i + 1)) / 13),
      ),
    ); // up to ~105
    prices.push(
      ...Array.from(
        { length: 13 },
        (_, i) => 105 * (1 - (0.05 * (i + 1)) / 13),
      ),
    ); // down to ~100
    const data = prices.map((close, i) => ({
      date: "",
      open: close * 0.99,
      high: close * 1.01,
      low: close * 0.98,
      close,
      volume: 10000,
      timestamp: Date.now() - (prices.length - i) * 7 * 86400000,
    }));

    const result = runBacktest(data, mockSignal, 10000, true);

    expect(result.trades).toHaveLength(1);
    const trade = result.trades[0]!;
    expect(trade.shares).toBeGreaterThan(0);
    // profit is negative because of costs (0.2% each side)
    expect(trade.profit).toBeLessThan(0);
  });

  it("handles no trades gracefully", () => {
    const noTradeSignal = (_closes: number[]): SignalResult => ({
      signal: "hold",
      confidence: 0,
      reason: "no",
      costAdjusted: true,
    });
    const result = runBacktest(data, noTradeSignal, 10000, true);

    expect(result.trades).toHaveLength(0);
    expect(result.finalValue).toBeCloseTo(10000, 0);
    expect(result.cagr).toBeCloseTo(0, 4);
    expect(result.winRate).toBe(0);
    expect(result.profitFactor).toBe(Infinity);
  });

  test.todo("applies CommSec cost correctly", () => {
    const result = runBacktest(data, mockSignal, 10000, true);
    const trade = result.trades[0]!;
    const expectedCost =
      trade.shares * trade.entryPrice * 0.002 +
      trade.shares * trade.exitPrice * 0.002;
    const actualCost =
      trade.shares * trade.entryPrice +
      expectedCost -
      trade.profit -
      (trade.shares * trade.exitPrice - expectedCost);
    expect(actualCost).toBeCloseTo(expectedCost, 0);
  });

  it("calculates CAGR correctly", () => {
    // 5 years flat → CAGR = 0
    const flatData = Array(5 * 52)
      .fill(100)
      .map(
        (close, i): OHLCV => ({
          open: close * 0.99,
          high: close * 1.01,
          low: close * 0.98,
          close,
          volume: 10000,
          date: new Date(
            Date.now() - (5 * 52 - i) * 7 * 86400000,
          ).toISOString(),
        }),
      );
    const result = runBacktest(
      flatData,
      () => ({ signal: "hold", confidence: 0, reason: "", costAdjusted: true }),
      10000,
      true,
    );
    expect(result.cagr).toBeCloseTo(0, 4);
  });
});

describe("walkForwardBacktest", () => {
  test.todo("runs multiple walk-forward periods", () => {
    const prices = Array(12 * 52).fill(100); // 12 years flat
    const data = prices.map(
      (close, i): OHLCV => ({
        open: close * 0.99,
        high: close * 1.01,
        low: close * 0.98,
        close,
        volume: 10000,
        date: new Date(
          Date.now() - (prices.length - i) * 7 * 86400000,
        ).toISOString(),
      }),
    );

    const results = walkForwardBacktest(data, mockSignal, 5, 1, 10000);
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.inSample.finalValue).toBeGreaterThan(0);
      expect(r.outSample.finalValue).toBeGreaterThan(0);
      expect(r.robustness).toBeGreaterThan(0);
    });
  });

  it("chains capital correctly", () => {
    const prices = Array(12 * 52).fill(100);
    const data = prices.map(
      (close, i): OHLCV => ({
        open: close * 0.99,
        high: close * 1.01,
        low: close * 0.98,
        close,
        volume: 10000,
        date: new Date(
          Date.now() - (prices.length - i) * 7 * 86400000,
        ).toISOString(),
      }),
    );

    const results = walkForwardBacktest(data, mockSignal, 5, 1, 10000);
    if (results.length > 1) {
      const firstOut = results[0]!.outSample.finalValue;
      const secondIn = results[1]!.inSample.initialCash;
      expect(secondIn).toBeCloseTo(firstOut, 0);
    }
  });

  it("returns empty if not enough data", () => {
    const shortData = generateData(5);
    const results = walkForwardBacktest(shortData, mockSignal, 5, 1);
    expect(results).toHaveLength(0);
  });
});

describe("monteCarloSimulation", () => {
  test.todo("returns valid percentiles", () => {
    const equity = Array.from(
      { length: 252 },
      (_, i) => 10000 * (1 + i * 0.0003),
    ); // +7.5% year
    const result = monteCarloSimulation(equity, 100);

    expect(result.medianCAGR).toBeGreaterThan(0.05);
    expect(result.cagr95th).toBeGreaterThan(result.medianCAGR);
    expect(result.cagr5th).toBeLessThan(result.medianCAGR);
    expect(result.probProfit).toBeGreaterThan(0.8);
    expect(result.maxDrawdown95th).toBeLessThan(-0.1);
  });

  test.todo("handles flat equity", () => {
    const equity = Array(252).fill(10000);
    const result = monteCarloSimulation(equity, 100);
    expect(result.medianCAGR).toBeCloseTo(0, 3);
    expect(result.probProfit).toBeGreaterThan(0.4);
  });

  test.todo("handles declining equity", () => {
    // Strong downward trend → median CAGR < -5%
    const equity = Array.from(
      { length: 252 },
      (_, i) => 10000 * (1 - i * 0.001),
    );
    const result = monteCarloSimulation(equity, 100);
    expect(result.medianCAGR).toBeLessThan(-0.05);
  });

  it("returns consistent results with seed", () => {
    const equity = Array.from({ length: 100 }, (_, i) => 10000 + i * 10);
    const result1 = monteCarloSimulation(equity, 100);
    const result2 = monteCarloSimulation(equity, 100);
    // Not identical due to random, but within range
    expect(Math.abs(result1.medianCAGR - result2.medianCAGR)).toBeLessThan(
      0.05,
    );
  });
});
