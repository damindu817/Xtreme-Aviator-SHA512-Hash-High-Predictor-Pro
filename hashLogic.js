// hashLogic.js - XTREME AVIATOR SHA512 HASH ULTRA PREDICTOR PRO Algorithms

/**
 * Calculate entropy of SHA512 hash string
 * @param {string} hash - 128-character hexadecimal string
 * @returns {number} Entropy value
 */
export function calcEntropy(hash) {
  const freq = {};
  for (let c of hash) freq[c] = (freq[c] || 0) + 1;
  return Object.values(freq).reduce((acc, f) => {
    const p = f / hash.length;
    return acc - p * Math.log2(p);
  }, 0);
}

/**
 * Calculate score from hash using strategic index positions
 * @param {string} hash - 128-character hexadecimal string
 * @returns {number} Calculated score
 */
export function scoreFromHash(hash) {
  const indexes = [5, 15, 25, 35, 50, 75, 100, 120];
  return indexes.reduce((sum, i) => sum + parseInt(hash[i], 16), 0);
}

/**
 * Calculate confidence level for prediction
 * @param {number} entropy - Entropy value
 * @param {number} score - Hash score
 * @param {string} oddTarget - Target odd ('2','3','4','7','10','100')
 * @param {string} hash - Original hash string
 * @returns {number} Confidence percentage (5-98)
 */
export function calculateConfidence(entropy, score, oddTarget, hash) {
  let confidence = 50;
  
  // Entropy scoring
  if (entropy > 4.2) confidence += 10;
  if (entropy > 4.5) confidence += 15;
  
  // Pattern recognition
  if (score % 7 === 0) confidence += 8;
  if (score % 5 === 0) confidence += 5;
  if (/(\w)\1{2,}/.test(hash)) confidence += 15;
  if (/(\w{2,4})\1{1,}/.test(hash)) confidence += 10;
  
  // Tail pattern detection
  const tail = hash.slice(-4);
  if (/^(aaaa|ffff|0000|1111)$/.test(tail)) confidence += 20;
  
  // Odd-specific adjustments
  if (oddTarget === '2') confidence += 5;
  if (oddTarget === '3') confidence += 5;
  if (oddTarget === '7') confidence += 5;
  if (oddTarget === '10') confidence += 10;
  if (oddTarget === '100') confidence += 15;
  
  // Special cases
  if (oddTarget === '4') {
    if (entropy > 3.91 && entropy < 3.97) confidence += 10;
    if (score >= 45 && score <= 80) confidence += 8;
  }
  
  if (oddTarget === '7') {
    if (entropy > 4.1 && entropy < 4.4) confidence += 12;
    if (score >= 55 && score <= 90) confidence += 6;
  }
  
  if (oddTarget === '10') {
    if (entropy > 4.25 && entropy < 4.5) confidence += 15;
    if (score >= 60 && score <= 100) confidence += 10;
  }
  
  return Math.min(98, Math.max(5, Math.round(confidence)));
}

/**
 * Calculate delay in seconds before signal activates
 * @param {number} score - Hash score
 * @param {number} entropy - Entropy value
 * @param {string} oddTarget - Target odd
 * @param {string} hash - Original hash
 * @returns {number} Delay in seconds (minimum 45)
 */
export function calculateDelay(score, entropy, oddTarget, hash) {
  let base = parseInt(oddTarget) * 45;
  
  if (entropy > 4.3) base += 20;
  if (score % 7 === 0) base += 30;
  if (score % 5 === 0) base += 15;
  if (/(\w)\1{2,}/.test(hash)) base += 20;
  if (/(\w{2,4})\1{1,}/.test(hash)) base += 15;
  
  // Odd-specific adjustments
  if (oddTarget === '10') base += 60;
  if (oddTarget === '100') base += 600;
  
  return Math.max(45, base);
}

/**
 * Pre-analyze hash to show confidence levels
 * @param {string} hash - 128-character hexadecimal string
 */
export function preAnalyzeHash(hash) {
  if (!hash || hash.length !== 128 || !/^[a-f0-9]+$/.test(hash)) return;
  
  const entropy = calcEntropy(hash);
  const score = scoreFromHash(hash);
  
  // Update confidence bars for each odd
  [2, 3, 4, 7, 10, 100].forEach(odd => {
    const confidence = calculateConfidence(entropy, score, odd.toString(), hash);
    document.getElementById(`confidence-${odd}`).style.width = `${confidence}%`;
  });
}
