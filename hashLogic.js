// XTREME AVIATOR SHA512 HASH PREDICTOR PRO - CORE LOGIC
class AviatorPredictor {
  constructor() {
    this.activeSignals = [];
    this.currentCountdown = null;
    this.serverTimeOffset = 0;
    this.lastHash = '';
    this.selectedOdd = null;
    this.init();
  }

  init() {
    this.updateDateTime();
    this.loadHistory();
    this.updateStats();
    this.syncServerTime();
    
    // Initialize event listeners
    document.getElementById("hashInput").addEventListener('input', (e) => this.handleHashInput(e));
    document.getElementById("pasteHashInput").addEventListener('click', () => this.pasteHash());
    document.getElementById("clearHashInput").addEventListener('click', () => this.clearHash());
    document.getElementById("signalPopup").addEventListener('click', (e) => {
      if (e.target === this) this.closeSignalPopup();
    });

    // Initialize disclaimer
    const disclaimerBadge = document.getElementById("disclaimerBadge");
    disclaimerBadge.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://damindu817.github.io/DISCLAIMER-/', '_blank');
    });

    // Show disclaimer popup after 5 seconds if not shown before
    if (!sessionStorage.getItem('disclaimerShown')) {
      setTimeout(() => {
        this.showDisclaimer();
        setTimeout(() => this.hideDisclaimer(), 8000);
        sessionStorage.setItem('disclaimerShown', 'true');
      }, 5000);
    }
  }

  // ================= CORE ALGORITHMS ================= //
  validateHash(hash) {
    return hash.length === 128 && /^[a-f0-9]+$/.test(hash);
  }

  calcEntropy(hash) {
    const freq = {};
    for (let c of hash) freq[c] = (freq[c] || 0) + 1;
    return Object.values(freq).reduce((acc, f) => {
      const p = f / hash.length;
      return acc - p * Math.log2(p);
    }, 0);
  }

  scoreFromHash(hash) {
    const indexes = [5, 15, 25, 35, 50, 75, 100, 120];
    return indexes.reduce((sum, i) => sum + parseInt(hash[i], 16), 0);
  }

  calculateConfidence(entropy, score, oddTarget, hash) {
    let confidence = 50;
    
    // Pattern detection
    const hasTripleRepeat = /(\w)\1{2,}/.test(hash);
    const hasDoubleRepeat = /(\w{2,4})\1{1,}/.test(hash);
    const tailPattern = /^(aaaa|ffff|0000|1111)$/.test(hash.slice(-4));

    // Entropy scoring
    if (entropy > 4.2) confidence += entropy > 4.5 ? 25 : 10;
    
    // Pattern bonuses
    if (hasTripleRepeat) confidence += 15;
    if (hasDoubleRepeat) confidence += 10;
    if (tailPattern) confidence += 20;
    
    // Score patterns
    if (score % 7 === 0) confidence += 8;
    if (score % 5 === 0) confidence += 5;
    
    // Odd-specific adjustments
    const oddBonus = { '2': 5, '3': 5, '4': 0, '7': 5, '10': 10, '100': 15 };
    confidence += oddBonus[oddTarget] || 0;
    
    // Special cases
    if (oddTarget === '4' && entropy > 3.91 && entropy < 3.97) confidence += 10;
    if (oddTarget === '7' && entropy > 4.1 && entropy < 4.4) confidence += 12;
    if (oddTarget === '10' && entropy > 4.25 && entropy < 4.5) confidence += 15;

    return Math.min(98, Math.max(5, Math.round(confidence)));
  }

  calculateDelay(score, entropy, oddTarget) {
    let base = parseInt(oddTarget) * 45;
    
    // Adjustments
    if (entropy > 4.3) base += 20;
    if (score % 7 === 0) base += 30;
    if (score % 5 === 0) base += 15;
    
    // Odd-specific
    if (oddTarget === '10') base += 60;
    if (oddTarget === '100') base += 600;
    
    return Math.max(45, base);
  }

  // ================= UI FUNCTIONS ================= //
  handleHashInput(e) {
    const hash = e.target.value.trim();
    if (this.validateHash(hash)) {
      this.lastHash = hash;
      this.preAnalyzeHash(hash);
    } else {
      document.getElementById("copyResultBtn").disabled = true;
    }
  }

  preAnalyzeHash(hash) {
    if (!this.validateHash(hash)) return;
    
    const entropy = this.calcEntropy(hash);
    const score = this.scoreFromHash(hash);
    
    [2, 3, 4, 7, 10, 100].forEach(odd => {
      const confidence = this.calculateConfidence(entropy, score, odd.toString(), hash);
      document.getElementById(`confidence-${odd}`).style.width = `${confidence}%`;
    });
  }

  async pasteHash() {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById("hashInput").value = text;
      this.lastHash = text.trim();
      if (this.validateHash(this.lastHash)) {
        this.preAnalyzeHash(this.lastHash);
      } else {
        document.getElementById("copyResultBtn").disabled = true;
      }
    } catch (err) {
      this.showErrorDialog("Failed to read from clipboard. Please paste manually.");
    }
  }

  clearHash() {
    document.getElementById("hashInput").value = '';
    this.lastHash = '';
    document.getElementById("copyResultBtn").disabled = true;
    this.selectedOdd = null;
    
    // Reset confidence bars
    [2, 3, 4, 7, 10, 100].forEach(odd => {
      document.getElementById(`confidence-${odd}`).style.width = '0%';
    });
    
    // Reset results display
    document.getElementById("result-odd").textContent = "-";
    document.getElementById("result-entropy").textContent = "-";
    document.getElementById("result-score").textContent = "-";
    document.getElementById("result-confidence").textContent = "-";
    document.getElementById("result-delay").textContent = "-";
    document.getElementById("result-time").textContent = "-";
  }

  predict(oddStr) {
    const hash = document.getElementById("hashInput").value.trim().toLowerCase();
    if (!this.validateHash(hash)) {
      this.showErrorDialog("Invalid SHA512 hash. Must be exactly 128 hexadecimal characters (0-9, a-f).");
      return;
    }
    
    this.selectedOdd = oddStr;
    const entropy = this.calcEntropy(hash);
    const score = this.scoreFromHash(hash);
    const confidence = this.calculateConfidence(entropy, score, oddStr, hash);
    const delay = this.calculateDelay(score, entropy, oddStr);
    const future = new Date(Date.now() + this.serverTimeOffset + delay * 1000);
    
    // Update UI
    document.getElementById("result-odd").textContent = `${oddStr}x`;
    document.getElementById("result-entropy").textContent = entropy.toFixed(3);
    document.getElementById("result-score").textContent = score;
    document.getElementById("result-confidence").textContent = `${confidence}%`;
    document.getElementById("result-delay").textContent = `${delay} seconds`;
    document.getElementById("result-time").textContent = future.toLocaleTimeString();
    
    document.getElementById("copyResultBtn").disabled = false;
    this.updateCountdown(future, oddStr);
    this.logHistory(oddStr, future.toLocaleTimeString(), entropy, score, delay, confidence);
    this.showSuccessDialog(`Signal for ${oddStr}x generated with ${confidence}% confidence!`);
  }

  // [All other functions remain with the same implementation]
  // ... (updateCountdown, showSignalPopup, closeSignalPopup, etc.)
}

// Initialize the predictor when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.aviatorPredictor = new AviatorPredictor();
});

// Global functions for HTML event handlers
function predict(odd) {
  window.aviatorPredictor.predict(odd);
}

function copyResultToClipboard(e) {
  window.aviatorPredictor.copyResultToClipboard(e);
}

function showClearDialog() {
  window.aviatorPredictor.showClearDialog();
}

function hideClearDialog() {
  window.aviatorPredictor.hideClearDialog();
}

function clearHistory() {
  window.aviatorPredictor.clearHistory();
}

function closeSignalPopup() {
  window.aviatorPredictor.closeSignalPopup();
}