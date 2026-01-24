const db = require('../db');

/**
 * Calculate Standard Deviation
 */
const calculateSigma = (ranks) => {
  const n = ranks.length;
  if (n < 2) return 0; // Not enough data for volatility

  const mean = ranks.reduce((a, b) => a + b, 0) / n;
  const variance = ranks.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance);
};

/**
 * Predict Closing Rank and Volatility
 * Input: Array of closing ranks [CR1, CR2, CR3] (sorted by year ascending)
 */
const predictCutoff = (history) => {
  // history = [{ year: 2022, open: 100, close: 1000 }, ...]
  // We need closing ranks sorted by year
  const sortedHistory = history.sort((a, b) => a.year - b.year);
  const closingRanks = sortedHistory.map(h => h.closing_rank);

  if (closingRanks.length < 2) {
    // Not enough data, just return last year's data
    const last = closingRanks[closingRanks.length - 1];
    return { expected: last, sigma: 0, trend: 0 };
  }

  // Calculate Deltas (Year-over-Year changes)
  const deltas = [];
  for (let i = 1; i < closingRanks.length; i++) {
    deltas.push(closingRanks[i] - closingRanks[i - 1]);
  }

  // Calculate Weighted Trend
  let weightedTrend = 0;
  
  if (deltas.length === 1) {
    // Only 2 years of data -> Simple difference
    weightedTrend = deltas[0];
  } else if (deltas.length === 2) {
    // 3 years of data -> 70% Recent, 30% Previous
    // deltas[0] is Old->Mid, deltas[1] is Mid->New
    weightedTrend = (deltas[1] * 0.7) + (deltas[0] * 0.3);
  } else {
    // >3 years -> Decay weights (e.g., 50%, 30%, 20%...)
    // For simplicity and effectiveness, we maintain heavy bias on recent:
    // Recent: 60%, Previous: 30%, Before: 10%
    const recent = deltas[deltas.length - 1];
    const prev = deltas[deltas.length - 2];
    const old = deltas[deltas.length - 3]; // Take at most last 3 changes
    
    weightedTrend = (recent * 0.6) + (prev * 0.3) + (old * 0.1);
  }

  // Conservative Guardrails
  // If Trend > 0 (Rank Rising/Easier): Dampen by 20% (Optimism Check)
  // If Trend < 0 (Rank Dropping/Harder): Zero dampening (Safety First)
  if (weightedTrend > 0) {
    weightedTrend = weightedTrend * 0.8;
  }

  // CR_expected = CR_last + Weighted Trend
  const lastCR = closingRanks[closingRanks.length - 1];
  const expectedCR = lastCR + weightedTrend;

  // Volatility (Sigma) - Standard Calculation
  const sigma = calculateSigma(closingRanks);

  return { expected: Math.round(expectedCR), sigma, trend: weightedTrend };
};

/**
 * Calculate Admission Probability and Band
 */
const calculateChance = (userRank, expectedCR, sigma) => {
  if (sigma === 0) {
    // Fallback if no volatility data
    if (userRank <= expectedCR) return { band: 'Safe', prob: 90 };
    if (userRank <= expectedCR * 1.1) return { band: 'Moderate', prob: 50 };
    return { band: 'Risky', prob: 20 };
  }

  // Bands Logic from Requirements
  // Safe: <= CR + 0.5σ
  // Moderate: <= CR + 1σ
  // Risky: <= CR + 1.5σ
  // Very Risky: <= CR + 2σ

  const diff = userRank - expectedCR;
  
  if (diff <= 0.5 * sigma) return { band: 'Safe', prob: 75 }; // Actually if diff is negative (rank < expected), it's even safer.
  if (diff <= 1.0 * sigma) return { band: 'Moderate', prob: 55 };
  if (diff <= 1.5 * sigma) return { band: 'Risky', prob: 35 };
  
  return { band: 'Very Risky', prob: 15 };
};

module.exports = {
  predictCutoff,
  calculateChance
};
