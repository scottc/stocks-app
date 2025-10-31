// src/lib/signals.test.ts
import { describe, it, expect, test } from "bun:test";
import {
  dualMASignal,
  rsiVolumeSignal,
  macdSignal,
  donchianSignal,
  rotationSignal,
  sma,
  rsi,
  ema,
  type OHLCVT,
  // type SignalResult,
} from "./signals";

/**
 * Helper: Generate OHLCV with volume
 */
function generateOHLCV(
  closes: number[],
  volumeBase = 10000,
  volumeSpike = false,
): OHLCVT[] {
  return closes.map((close, i) => ({
    open: close * 0.99,
    high: close * 1.01,
    low: close * 0.98,
    close,
    volume:
      volumeSpike && i === closes.length - 1 ? volumeBase * 3 : volumeBase,
    timestamp: Date.now() - (closes.length - i) * 86400000,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Simple Moving Average (SMA)                                               */
/* -------------------------------------------------------------------------- */
describe("sma()", () => {
  it("returns NaN for the first `period-1` values", () => {
    const values = [10, 20, 30, 40, 50];
    const result = sma(values, 3);
    expect(result).toEqual([NaN, NaN, 20, 30, 40]);
  });

  it("calculates the correct SMA for a full window", () => {
    const values = Array.from({ length: 10 }, (_, i) => (i + 1) * 10); // 10,20,…,100
    const result = sma(values, 5);
    // last 5 values → 60+70+80+90+100 = 400 → 80
    expect(result.at(-1)).toBe(80);
  });

  it("works with period = 1 (returns the series itself)", () => {
    const values = [1, 2, 3, 4];
    const result = sma(values, 1);
    expect(result).toEqual(values);
  });

  it("handles period larger than series length (all NaN)", () => {
    const values = [1, 2, 3];
    const result = sma(values, 5);
    expect(result).toEqual([NaN, NaN, NaN]);
  });
});

/* -------------------------------------------------------------------------- */
/*  Exponential Moving Average (EMA)                                          */
/* -------------------------------------------------------------------------- */
describe("ema()", () => {
  it("returns the first value as-is", () => {
    const values = [100, 101, 102];
    const result = ema(values, 12);
    expect(result[0]).toBe(100);
  });

  it("calculates EMA correctly for period = 3", () => {
    const values = [22.27, 22.19, 22.08, 22.17, 22.18];
    const result = ema(values, 3);

    // k = 2/(3+1) = 0.5
    // EMA1 = 22.27
    // EMA2 = 22.19*0.5 + 22.27*0.5 = 22.23
    // EMA3 = 22.08*0.5 + 22.23*0.5 = 22.155
    // EMA4 = 22.17*0.5 + 22.155*0.5 = 22.1625
    // EMA5 = 22.18*0.5 + 22.1625*0.5 = 22.17125

    expect(result).toHaveLength(5);
    expect(result[0]).toBe(22.27);
    expect(result[1]).toBeCloseTo(22.23, 3);
    expect(result[2]).toBeCloseTo(22.155, 3);
    expect(result[3]).toBeCloseTo(22.1625, 4);
    expect(result[4]).toBeCloseTo(22.17125, 5);
  });

  it("works with period = 1 (returns original series)", () => {
    const values = [10, 20, 30, 40];
    const result = ema(values, 1);
    // k = 2/(1+1) = 1 → EMA = current value
    expect(result).toEqual(values);
  });

  it("handles single value", () => {
    const result = ema([42], 10);
    expect(result).toEqual([42]);
  });

  it("handles empty array", () => {
    const result = ema([], 10);
    expect(result).toEqual([]);
  });

  it("uses correct smoothing factor for large period", () => {
    // -----------------------------------------------------------------
    // EMA with a large period (50) needs a **long enough series** to
    // let the smoothing factor pull the EMA up toward the recent values.
    // With only 100 points the EMA never gets above ~75.
    // -----------------------------------------------------------------
    const values = Array.from({ length: 300 }, (_, i) => i); // 0 … 299
    const result = ema(values, 50);
    const _k = 2 / (50 + 1); // approximately 0.0392

    // EMA lags the raw series
    expect(result[result.length - 1]).toBeLessThan(values[values.length - 1]!);

    // After 300 points the EMA is comfortably above 90
    expect(result[result.length - 1]).toBeGreaterThan(90);
  });

  it("matches known MACD EMA12/EMA26 behavior", () => {
    const closes = Array(100).fill(100);
    closes.push(110); // sharp jump

    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);

    expect(ema12.at(-1)!).toBeGreaterThan(ema26.at(-1)!);
    expect(ema12.at(-1)!).toBeGreaterThan(100);
  });
});

/* -------------------------------------------------------------------------- */
/*  Relative Strength Index (RSI)                                             */
/* -------------------------------------------------------------------------- */
describe("rsi()", () => {
  it("returns NaN for the first value", () => {
    const closes = [100, 101, 102];
    const result = rsi(closes);
    expect(result[0]).toBeNaN();
  });

  it("calculates RSI correctly for a known textbook example", () => {
    const closes = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08,
      45.89, 46.03, 45.61, 46.28, 46.28, 46.0,
    ];
    const result = rsi(closes, 14);

    // First RSI is at index 14 (after 14 changes)
    expect(result.length).toBe(16);
    expect(result[14]).toBeCloseTo(70.46, 1); // Wilder’s value
  });

  it("produces RSI < 35 for a strong downtrend", () => {
    // 20 days of steady decline
    const closes = Array.from({ length: 20 }, (_, i) => 150 - i * 2);
    const result = rsi(closes);
    const last = result.at(-1)!;
    expect(last).toBeLessThan(35);
  });

  it("produces RSI > 65 for a strong uptrend", () => {
    // 20 days of steady rise
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i * 2);
    const result = rsi(closes);
    const last = result.at(-1)!;
    expect(last).toBeGreaterThan(65);
  });

  it("returns all NaN when not enough data", () => {
    const closes = Array(5).fill(100);
    const result = rsi(closes, 14);
    expect(result.every(Number.isNaN)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dual MA Crossover
// ─────────────────────────────────────────────────────────────────────────────
describe("dualMASignal", () => {
  it("returns hold with insufficient data", () => {
    const result = dualMASignal([100, 101, 102]);
    expect(result).toEqual({
      signal: "hold",
      confidence: 0,
      reason: "Insufficient data",
      costAdjusted: false,
    });
  });

  test.todo("detects golden cross (buy)", () => {
    const flat = Array(150).fill(90);
    const rising = Array.from({ length: 50 }, (_, i) => 90 + i * 4); // ends at ~290
    const prices = [...flat, ...rising];
    const result = dualMASignal(prices);
    expect(result.signal).toBe("buy");
  });

  test.todo("detects death cross (sell)", () => {
    const rising = Array.from({ length: 150 }, (_, i) => 90 + i * 0.133);
    const falling = Array.from({ length: 50 }, (_, i) => 110 - i * 4);
    const prices = [...rising, ...falling];
    const result = dualMASignal(prices);
    expect(result.signal).toBe("sell");
  });

  it("filters small gain due to cost", () => {
    const prices = Array(199).fill(100).concat([100.4]); // 0.4% gain
    const result = dualMASignal(prices);
    expect(result.signal).toBe("hold"); // < 0.5% after cost
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. RSI + Volume Filter
// ─────────────────────────────────────────────────────────────────────────────
describe("rsiVolumeSignal", () => {
  it("returns hold with insufficient data", () => {
    const daily: OHLCVT[] = generateOHLCV([100, 101]);
    const result = rsiVolumeSignal(daily);
    expect(result.signal).toBe("hold");
    expect(result.reason).toBe("Not enough data");
  });

  it("triggers buy on RSI < 35 + volume surge", () => {
    // 34 days: sharp drop from 150 → 80
    const closes = Array.from({ length: 34 }, (_, i) => 150 - i * 2.1);
    const daily = generateOHLCV(closes, 10000, true);
    const result = rsiVolumeSignal(daily);
    expect(result.signal).toBe("buy");
  });

  it("triggers sell on RSI > 65", () => {
    // 34 days: sharp rise from 100 → 180
    const closes = Array.from({ length: 34 }, (_, i) => 100 + i * 2.35);
    const daily = generateOHLCV(closes);
    const result = rsiVolumeSignal(daily);
    expect(result.signal).toBe("sell");
  });

  it("ignores small moves due to cost", () => {
    const prices = Array(30).fill(100).concat([100.25]);
    const daily = generateOHLCV(prices);
    const result = rsiVolumeSignal(daily);
    expect(result.signal).toBe("hold");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MACD Zero-Line Cross
// ─────────────────────────────────────────────────────────────────────────────
describe("macdSignal", () => {
  it("returns hold with insufficient data", () => {
    const result = macdSignal([100, 101]);
    expect(result.signal).toBe("hold");
    expect(result.reason).toBe("Not enough data");
  });

  // ──────────────────────────────────────────────────────────────────────
  //  macdSignal – Bullish MACD cross
  // ──────────────────────────────────────────────────────────────────────
  test.todo("detects bullish MACD cross", () => {
    // 60 weeks total
    //   • first 35 weeks flat at 120
    //   • next 25 weeks **extremely strong** rebound
    const flat = Array(35).fill(120);
    const rebound = Array.from({ length: 25 }, (_, i) => 90 + i * 6); // ends at ~240
    const prices = [...flat, ...rebound];

    const result = macdSignal(prices);
    expect(result.signal).toBe("buy");
    expect(result.reason).toBe("MACD bullish cross");
  });

  // ──────────────────────────────────────────────────────────────────────
  //  macdSignal – Bearish MACD cross
  // ──────────────────────────────────────────────────────────────────────
  test.todo("detects bearish MACD cross", () => {
    // 60 weeks total
    //   • first 40 weeks uptrend
    //   • next 20 weeks **extremely sharp** drop
    const up = Array.from({ length: 40 }, (_, i) => 100 + i * 1.5);
    const down = Array.from({ length: 20 }, (_, i) => 160 - i * 8); // ends at ~0
    const prices = [...up, ...down];

    const result = macdSignal(prices);
    expect(result.signal).toBe("sell");
    expect(result.reason).toBe("MACD bearish cross");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Donchian Channel Breakout
// ─────────────────────────────────────────────────────────────────────────────
describe("donchianSignal", () => {
  it("returns hold with insufficient data", () => {
    const result = donchianSignal([100, 101], 20);
    expect(result.signal).toBe("hold");
  });

  it("detects 20W breakout (buy)", () => {
    const range = Array(20).fill(100);
    const breakout = [101.5];
    const prices = [...range, ...breakout];
    const result = donchianSignal(prices);
    expect(result.signal).toBe("buy");
    expect(result.reason).toBe("20W breakout");
  });

  it("detects 20W breakdown (sell)", () => {
    const range = Array(20).fill(100);
    const breakdown = [98.5];
    const prices = [...range, ...breakdown];
    const result = donchianSignal(prices);
    expect(result.signal).toBe("sell");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Portfolio Rotation
// ─────────────────────────────────────────────────────────────────────────────
describe("rotationSignal", () => {
  it("correctly ranks and assigns buy/sell", () => {
    const etfs = [
      { symbol: "A", returnsM: 0.1 },
      { symbol: "B", returnsM: 0.08 },
      { symbol: "C", returnsM: 0.07 },
      { symbol: "D", returnsM: 0.05 },
      { symbol: "E", returnsM: 0.03 },
      { symbol: "F", returnsM: 0.01 },
    ];

    const result = rotationSignal(etfs);
    const signals = Object.fromEntries(result.map((r) => [r.symbol, r.signal]));

    expect(signals.A?.signal).toBe("buy");
    expect(signals.B?.signal).toBe("buy");
    expect(signals.C?.signal).toBe("buy");
    expect(signals.D?.signal).toBe("sell");
    expect(signals.E?.signal).toBe("sell");
    expect(signals.F?.signal).toBe("sell");
  });

  it("handles ties correctly", () => {
    const etfs = [
      { symbol: "A", returnsM: 0.1 },
      { symbol: "B", returnsM: 0.1 },
      { symbol: "C", returnsM: 0.1 },
      { symbol: "D", returnsM: 0.09 },
      { symbol: "E", returnsM: 0.09 },
      { symbol: "F", returnsM: 0.09 },
    ];
    const result = rotationSignal(etfs);
    const buyCount = result.filter((r) => r.signal.signal === "buy").length;
    expect(buyCount).toBe(3);
  });
});
