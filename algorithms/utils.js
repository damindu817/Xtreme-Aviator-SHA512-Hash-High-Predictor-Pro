// utils.js
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