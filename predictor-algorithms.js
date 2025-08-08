// ====== CORE PREDICTION ALGORITHMS ====== //

// 1. Entropy calculation
function calcEntropy(hash) {
  const freq = {};
  for (let c of hash) freq[c] = (freq[c] || 0) + 1;
  return Object.values(freq).reduce((acc, f) => {
    const p = f / hash.length;
    return acc - p * Math.log2(p);
  }, 0);
}

// 2. Hash scoring with improved index positions
function scoreFromHash(hash) {
  const indexes = [5, 15, 25, 35, 50, 75, 100, 120];
  return indexes.reduce((sum, i) => sum + parseInt(hash[i], 16), 0);
}

// 3. Confidence calculation with improved logic for 3× odds
function calculateConfidence(entropy, score, oddTarget, hash) {
  let confidence = 50;
  
  // Improved entropy scoring
  if (entropy > 4.2) confidence += 10;
  if (entropy > 4.5) confidence += 15;
  
  // Improved pattern recognition
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
  
  // New logic for 4×, 7×, and 10× multipliers
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

// 4. Delay calculation with improved timing for 3× odds
function calculateDelay(score, entropy, oddTarget, hash) {
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

// Pre-analyze hash to show confidence levels
function preAnalyzeHash(hash) {
  if (!hash || hash.length !== 128 || !/^[a-f0-9]+$/.test(hash)) return;
  
  const entropy = calcEntropy(hash);
  const score = scoreFromHash(hash);
  
  // Update confidence bars for each odd
  [2, 3, 4, 7, 10, 100].forEach(odd => {
    const confidence = calculateConfidence(entropy, score, odd.toString(), hash);
    document.getElementById(`confidence-${odd}`).style.width = `${confidence}%`;
  });
}

// Auto-select the best multiplier based on hash analysis
function autoSelectMultiplier() {
  const hash = document.getElementById("hashInput").value.trim();
  if (!hash || hash.length !== 128 || !/^[a-f0-9]+$/.test(hash)) {
    showErrorDialog("Please enter a valid SHA512 hash first.");
    return;
  }
  
  const entropy = calcEntropy(hash);
  const score = scoreFromHash(hash);
  const resultPanel = document.getElementById("autoSelectionResult");
  
  // Analyze all multipliers
  const multipliers = [2, 3, 4, 7, 10, 100];
  const analysis = multipliers.map(odd => {
    const confidence = calculateConfidence(entropy, score, odd.toString(), hash);
    const delay = calculateDelay(score, entropy, odd.toString(), hash);
    
    // Calculate safety score (higher is safer)
    let safetyScore = 0;
    if (odd === 2) safetyScore = 95;
    else if (odd === 3) safetyScore = 85;
    else if (odd === 4) safetyScore = 70;
    else if (odd === 7) safetyScore = 50;
    else if (odd === 10) safetyScore = 30;
    else safetyScore = 5; // 100x is very risky
    
    // Adjust safety based on confidence
    safetyScore = Math.min(100, Math.max(0, safetyScore + (confidence - 50) / 2));
    
    return {
      odd,
      confidence,
      delay,
      safetyScore,
      successRate: Math.min(95, Math.max(5, confidence * 0.9)) // Estimated success rate
    };
  });
  
  // Sort by best combination of safety and confidence
  analysis.sort((a, b) => {
    // Weight safety more than confidence for auto-selection
    const scoreA = (a.safetyScore * 0.7) + (a.confidence * 0.3);
    const scoreB = (b.safetyScore * 0.7) + (b.confidence * 0.3);
    return scoreB - scoreA; // Descending order
  });
  
  const best = analysis[0];
  
  // Update UI with recommendation
  document.getElementById("auto-selected-odd").textContent = `${best.odd}x`;
  document.getElementById("auto-safety").textContent = `${Math.round(best.safetyScore)}%`;
  document.getElementById("auto-confidence").textContent = `${best.confidence}%`;
  document.getElementById("auto-delay").textContent = `${best.delay}s`;
  document.getElementById("auto-success-rate").textContent = `${Math.round(best.successRate)}%`;
  
  // Show the result panel
  resultPanel.classList.add("active");
  
  // Highlight the recommended odd button
  document.querySelectorAll('.odd-btn').forEach(btn => {
    btn.style.boxShadow = 'none';
  });
  document.getElementById(`odd-${best.odd}`).style.boxShadow = `0 0 0 3px rgba(58, 134, 255, 0.5)`;
  
  // Auto-select this odd after a short delay
  setTimeout(() => {
    predict(best.odd.toString());
  }, 1500);
}

// Main prediction function
function predict(oddStr) {
  const hash = document.getElementById("hashInput").value.trim().toLowerCase();
  const output = document.getElementById("output");
  
  if (!hash || hash.length !== 128 || !/^[a-f0-9]+$/.test(hash)) {
    showErrorDialog("Invalid SHA512 hash. Must be exactly 128 hexadecimal characters (0-9, a-f).");
    return;
  }
  
  selectedOdd = oddStr;
  const entropy = calcEntropy(hash);
  const score = scoreFromHash(hash);
  const confidence = calculateConfidence(entropy, score, oddStr, hash);
  const delay = calculateDelay(score, entropy, oddStr, hash);
  const future = new Date(Date.now() + serverTimeOffset + delay * 1000);
  const timeStr = future.toLocaleTimeString();
  
  // Update results display
  document.getElementById("result-odd").textContent = `${oddStr}x`;
  document.getElementById("result-entropy").textContent = entropy.toFixed(3);
  document.getElementById("result-score").textContent = score;
  document.getElementById("result-confidence").textContent = `${confidence}%`;
  document.getElementById("result-delay").textContent = `${delay} seconds`;
  document.getElementById("result-time").textContent = timeStr;
  
  // Enable copy button only after odd is selected
  document.getElementById("copyResultBtn").disabled = false;
  
  output.style.display = 'block';
  updateCountdown(future, oddStr);
  logHistory(oddStr, timeStr, entropy, score, delay, confidence);
  showSuccessDialog(`Signal for ${oddStr}x generated with ${confidence}% confidence!`);
  
  // Scroll to results
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Set flag that first signal has been generated
  firstSignalGenerated = true;
}