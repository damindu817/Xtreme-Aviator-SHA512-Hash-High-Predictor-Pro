export function predict100x(hash) {
  const entropy = calcEntropy(hash);
  const score = scoreFromHash(hash);
  
  let confidence = 50;
  if (entropy > 4.2) confidence += 10;
  if (entropy > 4.5) confidence += 15;
  if (score % 7 === 0) confidence += 8;
  if (score % 5 === 0) confidence += 5;
  if (/(\w)\1{2,}/.test(hash)) confidence += 15;
  if (/(\w{2,4})\1{1,}/.test(hash)) confidence += 10;
  
  // 100x-specific adjustments
  const tail = hash.slice(-4);
  if (/^(aaaa|ffff|0000|1111)$/.test(tail)) confidence += 20;
  confidence += 15;
  
  confidence = Math.min(98, Math.max(5, Math.round(confidence)));
  
  const delay = calculateDelay(score, entropy, '100', hash);
  
  return {
    odd: '100',
    entropy,
    score,
    confidence,
    delay
  };
}
