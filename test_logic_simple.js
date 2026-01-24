const { predictCutoff } = require('./server/services/predictor');

const historyA = [
    { year: 2022, closing_rank: 1000 },
    { year: 2023, closing_rank: 1100 }, // +100
    { year: 2024, closing_rank: 1250 }  // +150
];
// Weighted Delta: (150*0.7 + 100*0.3) = 135
// Dampened: 135 * 0.8 = 108
// Expected: 1250 + 108 = 1358

const historyB = [
    { year: 2022, closing_rank: 2000 },
    { year: 2023, closing_rank: 2100 }, // +100
    { year: 2024, closing_rank: 1500 }  // -600
];
// Weighted Delta: (-600*0.7 + 100*0.3) = -390
// No Dampening
// Expected: 1500 - 390 = 1110

const resA = predictCutoff(historyA);
const resB = predictCutoff(historyB);

console.log("RESULT_A: " + resA.expected);
console.log("RESULT_B: " + resB.expected);
