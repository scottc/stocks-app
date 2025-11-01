/**
 * OHLCV + date row
 */
export interface OHLCV {
  date: Date; // or string that can be parsed with new Date(...)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Options for Sharpe calculation
 */
export interface SharpeOptions {
  /** Risk-free rate expressed as a *decimal* (e.g. 0.02 for 2%) */
  riskFreeRate?: number;
  /** Number of trading periods per year – 252 for daily data */
  periodsPerYear?: number;
}

/**
 * Compute the Sharpe Ratio from a time-series of OHLCV rows.
 *
 * @param data          Sorted array of OHLCV rows (oldest → newest)
 * @param options       Optional parameters
 * @returns             Sharpe ratio (NaN if not enough data or std-dev = 0)
 */
export function sharpeRatio(
  data: OHLCV[],
  options: SharpeOptions = {},
): number {
  const { riskFreeRate = 0, periodsPerYear = 252 } = options;

  if (data.length < 2) return NaN;

  // ------------------------------------------------------------------
  // 1. Build daily returns:  r_i = (close_i / close_{i-1}) - 1
  // ------------------------------------------------------------------
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].close;
    const cur = data[i].close;
    if (prev <= 0 || cur <= 0) continue; // skip invalid prices
    returns.push(cur / prev - 1);
  }

  if (returns.length === 0) return NaN;

  // ------------------------------------------------------------------
  // 2. Mean & standard deviation of *daily* returns
  // ------------------------------------------------------------------
  const meanDaily = returns.reduce((a, b) => a + b, 0) / returns.length;

  const varianceDaily =
    returns.reduce((sum, r) => sum + Math.pow(r - meanDaily, 2), 0) /
    returns.length; // population std-dev (N denominator)

  const stdDaily = Math.sqrt(varianceDaily);
  if (stdDaily === 0) return NaN; // avoid division by zero

  // ------------------------------------------------------------------
  // 3. Annualise
  // ------------------------------------------------------------------
  const meanAnnual = meanDaily * periodsPerYear;
  const stdAnnual = stdDaily * Math.sqrt(periodsPerYear);

  // ------------------------------------------------------------------
  // 4. Sharpe = (E[R] - Rf) / σ
  // ------------------------------------------------------------------
  const excessAnnual = meanAnnual - riskFreeRate;
  return excessAnnual / stdAnnual;
}

/* ------------------------------------------------------------------ */
/* Example usage                                                      */
/* ------------------------------------------------------------------ */
if (require.main === module) {
  const sample: OHLCV[] = [
    {
      date: new Date("2024-01-01"),
      open: 100,
      high: 105,
      low: 98,
      close: 103,
      volume: 1e6,
    },
    {
      date: new Date("2024-01-02"),
      open: 103,
      high: 107,
      low: 102,
      close: 106,
      volume: 1.2e6,
    },
    {
      date: new Date("2024-01-03"),
      open: 106,
      high: 108,
      low: 104,
      close: 104,
      volume: 0.9e6,
    },
    {
      date: new Date("2024-01-04"),
      open: 104,
      high: 106,
      low: 103,
      close: 105,
      volume: 1.1e6,
    },
    // … add as many rows as you like
  ];

  const sharpe = sharpeRatio(sample, { riskFreeRate: 0.02 });
  console.log(`Sharpe Ratio = ${sharpe.toFixed(4)}`);
}
