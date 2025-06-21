// hashLogic.js - Core SHA512 prediction algorithms for XTREME AVIATOR PREDICTOR

export function calcEntropy(hash) {
  const freq = {};
  for (let c of hash) freq[c] = (freq[c] || 0) + 1;
  return Object.values(freq).reduce((acc, f) => {
    const p = f / hash.length;
    return acc - p * Math.log2(p);
  }, 0);
}

export function scoreFromHash(hash) {
  const indexes = [5, 15, 25, 35, 50, 75, 100, 120];
  return indexes.reduce((sum, i) => sum + parseInt(hash[i], 16), 0);
}

export function calculateConfidence(entropy, score, oddTarget, hash) {
  let confidence = 50;
  if (entropy > 4.2) confidence += 10;
  if (entropy > 4.5) confidence += 15;
  if (score % 7 === 0) confidence += 8;
  if (score % 5 === 0) confidence += 5;
  if (/(\w)\1{2,}/.test(hash)) confidence += 15;
  if (/(\w{2,4})\1{1,}/.test(hash)) confidence += 10;
  const tail = hash.slice(-4);
  if (/^(aaaa|ffff|0000|1111)$/.test(tail)) confidence += 20;
  if (oddTarget === '2') confidence += 5;
  if (oddTarget === '3') confidence += 5;
  if (oddTarget === '7') confidence += 5;
  if (oddTarget === '10') confidence += 10;
  if (oddTarget === '100') confidence += 15;
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

export function calculateDelay(score, entropy, oddTarget, hash) {
  let base = parseInt(oddTarget) * 45;
  if (entropy > 4.3) base += 20;
  if (score % 7 === 0) base += 30;
  if (score % 5 === 0) base += 15;
  if (/(\w)\1{2,}/.test(hash)) base += 20;
  if (/(\w{2,4})\1{1,}/.test(hash)) base += 15;
  if (oddTarget === '10') base += 60;
  if (oddTarget === '100') base += 600;
  return Math.max(45, base);
}

export function preAnalyzeHash(hash) {
  if (!hash || hash.length !== 128 || !/^[a-f0-9]+$/.test(hash)) return;
  const entropy = calcEntropy(hash);
  const score = scoreFromHash(hash);
  [2, 3, 4, 7, 10, 100].forEach(odd => {
    const confidence = calculateConfidence(entropy, score, odd.toString(), hash);
    const element = document.getElementById(`confidence-${odd}`);
    if (element) {
      element.style.width = `${confidence}%`;
    }
  });
}
