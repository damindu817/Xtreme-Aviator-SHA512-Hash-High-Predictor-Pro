
export function predict7x(hash) {
  const entropy = calcEntropy(hash);
  const score = scoreFromHash(hash);
  
  let confidence = 50;
  if (entropy > 4.2) confidence += 10;
  if (entropy > 4.5) confidence += 15;
  if (score % 7 === 0) confidence += 8;
  if (score % 5 === 0) confidence += 5;
  if (/(\w)\1{2,}/.test(hash)) confidence += 15;
  if (/(\w{2,4})\1{1,}/.test(hash)) confidence += 10;
  
  // 7x-specific adjustments
  if (entropy > 4.1 && entropy < 4.4) confidence += 12;
  if (score >= 55 && score <= 90) confidence += 6;
  confidence += 5;
  
  confidence = Math.min(98, Math.max(5, Math.round(confidence)));
  
  const delay = calculateDelay(score, entropy, '7', hash);
  
  return {
    odd: '7',
    entropy,
    score,
    confidence,
    delay
  };
}