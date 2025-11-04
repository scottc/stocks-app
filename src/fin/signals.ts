// src/fin/signals.ts
/**
 * @file Trading signal generators for 6-ETF portfolio.
 * All functions are pure, type-safe, and CommSec-cost-aware ($2 per $1,000).
 * Designed for weekly or daily use — max 1 trade per ETF per week.
 */

import { toPercentAU } from "@/store/lib";

/** "Open, High, Low, Close, and Volume", and we also include unix timestamp in ms.  */
export interface OHLCVT {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number; // Unix ms
}

/** Buy Sell Signal */
export interface SignalResult {
  /** The signal direction */
  signal: "buy" | "sell" | "hold";
  /** How confidant are we in this signal */
  confidence: number; // 0–1
  /** Some logical reasoning to act on this signal */
  reason: string;
  /** Does this signal take into consideration trading costs, taxes and what not...? */
  costAdjusted: boolean;
}

/**
 * Calculate Simple Moving Average
 * @param values fdfsdf
 * @param period sdfsdf
 * @returns Simple Moving Averages
 */
export function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

/**
 * Calculate Relative Strength Index (RSI) — Wilder’s method
 * @param closes
 * @param period The number of days... Default: 14
 */
export function rsi(closes: number[], period = 14): number[] {
  if (closes.length <= period) return Array(closes.length).fill(NaN);

  const result: number[] = Array(period).fill(NaN);
  let gains = 0;
  let losses = 0;

  // Step 1: Sum first `period` changes
  for (let i = 1; i <= period; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(100 - 100 / (1 + rs));

  // Step 2: Smoothed updates
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  return result;
}

/**
 * Apply CommSec trading cost: $2 per $1,000 (0.2%)
 */
function commSecTradingCost(amount: number): number {
  console.warn("Commsec costs may not be accurate, please check."); // TODO: verify
  return amount * 0.002;
}

/**
 * 1. Dual Moving Average Crossover (Weekly)
 *
 * Uses simple moving average calculation to derive smoother data,
 * to determine if the faster more volitle line intersects with the slower & more smoother line.
 */
export function dualMASignal(
  weeklyCloses: number[],
  shortPeriod = 50,
  longPeriod = 200,
): SignalResult {
  if (weeklyCloses.length < longPeriod) {
    return {
      signal: "hold",
      confidence: 0,
      reason: "Insufficient data",
      costAdjusted: false,
    };
  }

  const shortMA = sma(weeklyCloses, shortPeriod).at(-1);
  const longMA = sma(weeklyCloses, longPeriod).at(-1);
  const prevShort = sma(weeklyCloses.slice(0, -1), shortPeriod).at(-1);
  const prevLong = sma(weeklyCloses.slice(0, -1), longPeriod).at(-1);

  const currentPrice = weeklyCloses.at(-1)!;
  const _cost = commSecTradingCost(currentPrice * 100);

  if (shortMA! > longMA! && prevShort! <= prevLong!) {
    const gain = ((currentPrice - longMA!) / longMA!) * 100;
    if (gain > 0.5) {
      return {
        signal: "buy",
        confidence: 0.8,
        reason: "Golden cross",
        costAdjusted: false,
      };
    }
  }

  if (shortMA! < longMA! && prevShort! >= prevLong!) {
    return {
      signal: "sell",
      confidence: 0.8,
      reason: "Death cross",
      costAdjusted: false,
    };
  }

  return {
    signal: "hold",
    confidence: 0.6,
    reason: "Trending",
    costAdjusted: false,
  };
}

/**
 * 2. RSI + Volume Filter (Daily)
 */
export function rsiVolumeSignal(
  daily: OHLCVT[],
  rsiPeriod = 14,
  overbought = 65,
  oversold = 35,
): SignalResult {
  if (daily.length < rsiPeriod + 20) {
    return {
      signal: "hold",
      confidence: 0,
      reason: "Not enough data",
      costAdjusted: false,
    };
  }

  const closes = daily.map((d) => d.close);
  const volumes = daily.map((d) => d.volume);
  const rsiValues = rsi(closes, rsiPeriod);
  const currentRSI = rsiValues.at(-1)!;
  const avgVolume20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentVolume = volumes.at(-1)!;
  const currentPrice = closes.at(-1)!;

  const _cost = commSecTradingCost(currentPrice * 100);

  if (currentRSI < oversold && currentVolume > avgVolume20 * 1.5) {
    const potentialGain =
      ((closes.at(-2)! - currentPrice) / currentPrice) * 100;
    if (potentialGain > 0.3) {
      return {
        signal: "buy",
        confidence: 0.7,
        reason: "Oversold + volume surge",
        costAdjusted: false,
      };
    }
  }

  if (currentRSI > overbought) {
    return {
      signal: "sell",
      confidence: 0.7,
      reason: "Overbought",
      costAdjusted: false,
    };
  }

  return {
    signal: "hold",
    confidence: 0.5,
    reason: "Neutral",
    costAdjusted: false,
  };
}

/**
 * Exponential Moving Average
 * @param values
 * @param period
 * @returns
 */
export const ema = (values: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const result: number[] = [values[0]!];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i]! * k + result[i - 1]! * (1 - k));
  }
  return result;
};

/**
 * 3. MACD Zero-Line Cross (Weekly)
 */
export function macdSignal(weeklyCloses: number[]): SignalResult {
  if (weeklyCloses.length < 50) {
    return {
      signal: "hold",
      confidence: 0,
      reason: "Not enough data",
      costAdjusted: false,
    };
  }

  const ema12 = ema(weeklyCloses, 12);
  const ema26 = ema(weeklyCloses, 26);
  const macdLine = ema12.map((v, i) => (i >= 25 ? v - ema26[i]! : NaN));
  const _signalLine = ema(
    macdLine.filter((v) => !isNaN(v)),
    9,
  );

  const current = macdLine.at(-1);
  const prev = macdLine.at(-2);

  if (current! > 0 && prev! <= 0) {
    return {
      signal: "buy",
      confidence: 0.75,
      reason: "MACD bullish cross",
      costAdjusted: false,
    };
  }
  if (current! < 0 && prev! >= 0) {
    return {
      signal: "sell",
      confidence: 0.75,
      reason: "MACD bearish cross",
      costAdjusted: false,
    };
  }

  return {
    signal: "hold",
    confidence: 0.6,
    reason: "MACD neutral",
    costAdjusted: false,
  };
}

/**
 * 4. Donchian Channel Breakout (20W)
 */
export function donchianSignal(
  weeklyCloses: number[],
  period = 20,
): SignalResult {
  if (weeklyCloses.length < period + 1) {
    return {
      signal: "hold",
      confidence: 0,
      reason: "Not enough data",
      costAdjusted: false,
    };
  }

  const highs = weeklyCloses.slice(-period - 1, -1);
  const lows = weeklyCloses.slice(-period - 1, -1);
  const upper = Math.max(...highs);
  const lower = Math.min(...lows);
  const current = weeklyCloses.at(-1)!;
  const prev = weeklyCloses.at(-2)!;

  if (current > upper && prev <= upper) {
    return {
      signal: "buy",
      confidence: 0.7,
      reason: "20W breakout",
      costAdjusted: false,
    };
  }
  if (current < lower && prev >= lower) {
    return {
      signal: "sell",
      confidence: 0.7,
      reason: "20W breakdown",
      costAdjusted: false,
    };
  }

  return {
    signal: "hold",
    confidence: 0.5,
    reason: "Inside channel",
    costAdjusted: false,
  };
}

/**
 * 5. Portfolio Rotation (Top 3 Momentum)
 */
export function rotationSignal(
  etfs: { symbol: string; returnsM: number }[],
  topCount: number = 3,
  bottomCount: number = 3,
): { symbol: string; signal: SignalResult }[] {
  const sorted = [...etfs].sort((a, b) => b.returnsM - a.returnsM);
  const top = sorted.slice(0, topCount).map((e) => e.symbol);
  const bottom = sorted.slice(bottomCount * -1).map((e) => e.symbol);

  return etfs.map<{ symbol: string; signal: SignalResult }>((etf) => ({
    symbol: etf.symbol,
    signal: top.includes(etf.symbol)
      ? {
          signal: "buy",
          reason: `Top ${topCount} returns @ ${toPercentAU(etf.returnsM)}.`,
          confidence: 0.4, // TODO: give a score for the strength of the signal.
          costAdjusted: false,
        }
      : bottom.includes(etf.symbol)
        ? {
            signal: "sell",
            reason: `Bottom ${bottomCount}  returns @ ${toPercentAU(etf.returnsM)}.`,
            confidence: 0.4, // TODO: give a score for the strength of the signal.
            costAdjusted: false,
          }
        : {
            signal: "hold",
            reason: `Mid returns @ ${toPercentAU(etf.returnsM)}.`,
            confidence: 0.4, // TODO: give a score for the strength of the signal.
            costAdjusted: false,
          },
  }));
}

export function resampleToWeeklyCloses(ohlcvs: OHLCVT[]): number[] {
  if (ohlcvs.length === 0) return [];

  const weeklyCloses: number[] = [];
  let currentWeek = -1;
  let weekClose = 0;

  for (const bar of ohlcvs) {
    const date = new Date(bar.timestamp * 1000);
    const weekNum = date.getFullYear() * 52 + Math.floor(date.getDate() / 7);

    if (weekNum !== currentWeek) {
      if (currentWeek !== -1) weeklyCloses.push(weekClose);
      currentWeek = weekNum;
      weekClose = bar.close;
    } else {
      weekClose = bar.close; // last close of week
    }
  }

  if (currentWeek !== -1) weeklyCloses.push(weekClose);
  return weeklyCloses;
}
