export interface Candlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ScottScoreWeights {
  returns: number; // Weight for return score (0-1, sum of all weights should ideally =1)
  risk: number; // Weight for risk score (higher weight penalizes high volatility more)
  liquidity: number;
  proven: number;
}

export interface ScottScoreComponents {
  annualizedReturn: number; // Raw annualized return (e.g., 0.10 for 10%)
  annualizedVolatility: number; // Raw annualized volatility (e.g., 0.15 for 15%)
  liquidityFactor: number; // Normalized [0,1]: higher = better liquidity
  trackRecordFactor: number; // Normalized [0,1]: higher = longer proven history
  returnScore: number; // Normalized [0,1]: higher excess return = higher score
  riskScore: number; // Normalized [0,1]: lower volatility = higher score
  compositeScore: number; // Weighted sum: sum(weights[i] * score[i])
}

// Helper: Compute mean of array
function arrayMean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Helper: Compute population standard deviation
function arrayStdDev(arr: number[]): number {
  const avg = arrayMean(arr);
  const variance =
    arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

// Small function: Calculate daily returns from candlestick data
function calculateDailyReturns(data: Candlestick[]): number[] {
  if (data.length < 2) {
    return data.map((d) => 0);
    // throw new Error("At least 2 candlesticks required to compute returns.");
  }
  // Sort by date ascending (in case unsorted)
  data.sort((a, b) => a.timestamp - b.timestamp);
  const dailyReturns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const ret = (data[i].close - data[i - 1].close) / data[i - 1].close;
    dailyReturns.push(ret);
  }
  return dailyReturns;
}

// 1. Annualized Return: Geometric mean of (1 + daily returns) ^252 -1, but approx arithmetic for simplicity
function calculateAnnualizedReturn(
  data: Candlestick[],
  riskFreeRate: number,
): number {
  const dailyReturns = calculateDailyReturns(data);
  if (dailyReturns.length === 0) {
    return 0;
    // throw new Error("No valid returns computed.");
  }
  const meanDailyReturn = arrayMean(dailyReturns);
  return meanDailyReturn * 252; // Simple arithmetic annualization (common approx)
}

// 2. Annualized Volatility: Std dev of daily returns * sqrt(252)
function calculateAnnualizedVolatility(data: Candlestick[]): number {
  const dailyReturns = calculateDailyReturns(data);
  if (dailyReturns.length === 0) {
    return 0;
    // throw new Error("No valid returns computed.");
  }
  const dailyStdDev = arrayStdDev(dailyReturns);
  return dailyStdDev * Math.sqrt(252);
}

// 3. Liquidity Factor: Normalized [0,1] based on avg daily volume (log scale, cap at 1M shares/day)
function calculateLiquidityFactor(data: Candlestick[]): number {
  const totalVolume = data.reduce((sum, candle) => sum + candle.volume, 0);
  const avgDailyVolume = totalVolume / data.length;
  return Math.min(1, Math.log(avgDailyVolume + 1) / Math.log(1e6));
}

// 4. Track Record Factor: Normalized [0,1] based on age in years (log scale, cap at 10 years)
function calculateTrackRecordFactor(data: Candlestick[]): number {
  if (data.length < 1) {
    return 0;
    //throw new Error("At least 1 candlestick required for track record.");
  }
  // Sort by date
  data.sort((a, b) => a.timestamp - b.timestamp);
  const firstDate = data[0].timestamp;
  const lastDate = data[data.length - 1].timestamp;
  const ageInDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
  const ageInYears = ageInDays / 365.25;
  return Math.min(1, Math.log(ageInYears + 1) / Math.log(10));
}

// Normalize scores to [0,1] with configurable ranges (defaults: reasonable for equities)
function normalizeReturnScore(
  excessReturn: number,
  maxExpectedExcess: number = 0.15,
): number {
  // excessReturn = annReturn - rf; score 0 at 0 excess, 1 at maxExpectedExcess, cap/floor [0,1]
  return Math.max(0, Math.min(1, excessReturn / maxExpectedExcess));
}

function normalizeRiskScore(
  volatility: number,
  maxExpectedVol: number = 0.3,
): number {
  // Higher vol = lower score; 0 vol =1, maxExpectedVol=0
  return Math.max(
    0,
    Math.min(1, (maxExpectedVol - volatility) / maxExpectedVol),
  );
}

// Main composer function: Computes all components and weighted composite
export function calculateScottScore(
  data: Candlestick[],
  weights: ScottScoreWeights,
  riskFreeRate: number = 0.045, // Default 4.5% annualized
  maxExpectedExcessReturn: number = 0.15, // Configurable normalization
  maxExpectedVolatility: number = 0.3,
): ScottScoreComponents {
  const annReturn = calculateAnnualizedReturn(data, riskFreeRate);
  const annVol = calculateAnnualizedVolatility(data);
  const lf = calculateLiquidityFactor(data);
  const trf = calculateTrackRecordFactor(data);

  const excessReturn = annReturn - riskFreeRate;
  const returnScore = normalizeReturnScore(
    excessReturn,
    maxExpectedExcessReturn,
  );
  const riskScore = normalizeRiskScore(annVol, maxExpectedVolatility);

  // Validate weights sum ~1 (tolerance)
  const weightSum =
    weights.returns + weights.risk + weights.liquidity + weights.proven;
  if (Math.abs(weightSum - 1) > 0.01) {
    // TODO: normalize weights to a sum of 1.0.
    console.warn(
      `Weights sum to ${weightSum}; scores may not be balanced. Ideal sum=1.`,
    );
  }

  const compositeScore =
    weights.returns * returnScore +
    weights.risk * riskScore +
    weights.liquidity * lf +
    weights.proven * trf;

  return {
    annualizedReturn: annReturn,
    annualizedVolatility: annVol,
    liquidityFactor: lf,
    trackRecordFactor: trf,
    returnScore,
    riskScore,
    compositeScore,
  };
}

// Example usage:
//const sampleData: Candlestick[] = [
// ... your historical data array
//];

//const exampleWeights: Weights = {
//  returns: 0.5,
//  risk: 0.1,
//  liquidity: 0.1,
//  proven: 0.3
//};

//const components = calculateExtendedSharpeScore(sampleData, 0.045, exampleWeights);
//console.log(components);
// Output: { annualizedReturn: 0.10, ..., compositeScore: 0.65 }  // e.g., for risk-tolerant (high returns weight)
