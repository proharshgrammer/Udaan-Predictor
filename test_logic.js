const { predictCutoff } = require('./server/services/predictor');

console.log("--- Verification Test ---");

// Scenario A: Steady Growth (Easier)
// 2022: 1000, 2023: 1100 (+100), 2024: 1250 (+150)
// Exp: Weighted = (150*0.7 + 100*0.3) = 135. Dampened (*0.8) = 108.
// Result: 1250 + 108 = 1358.
const historyA = [
    { year: 2022, closing_rank: 1000 },
    { year: 2023, closing_rank: 1100 },
    { year: 2024, closing_rank: 1250 }
];
const resultA = predictCutoff(historyA);
console.log(`Scenario A (Steady): Expected 1358. Got: ${resultA.expected}`);

// Scenario B: Sudden Drop (Harder)
// 2022: 2000, 2023: 2100 (+100), 2024: 1500 (-600)
// Exp: Weighted = (-600*0.7 + 100*0.3) = -390. No Dampening.
// Result: 1500 - 390 = 1110.
const historyB = [
    { year: 2022, closing_rank: 2000 },
    { year: 2023, closing_rank: 2100 },
    { year: 2024, closing_rank: 1500 }
];
const resultB = predictCutoff(historyB);
console.log(`Scenario B (Drop): Expected 1110. Got: ${resultB.expected}`);

console.log("--- End Test ---");
