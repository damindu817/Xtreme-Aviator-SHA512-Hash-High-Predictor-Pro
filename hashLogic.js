/**
 * XTREME AVIATOR SHA512 HASH PREDICTOR - CORE LOGIC
 * Version: 4.0.0
 * Author: Damindu
 * Last Updated: 2023-11-15
 */

class HashPredictor {
  constructor() {
    this.serverTimeOffset = 0;
    this.currentVersion = "4.0.0";
  }

  // 1. හැෂ් එකේ එන්ට්‍රොපි ගණනය කිරීම
  calcEntropy(hash) {
    if (!hash || typeof hash !== 'string') return 0;
    
    const freq = {};
    for (let c of hash) freq[c] = (freq[c] || 0) + 1;
    
    return Object.values(freq).reduce((acc, f) => {
      const p = f / hash.length;
      return acc - p * Math.log2(p);
    }, 0);
  }

  // 2. හැෂ් එකේ ස්කෝර් ගණනය කිරීම (යාවත්කාලීන දර්ශක සහිතව)
  scoreFromHash(hash) {
    if (!hash || hash.length !== 128) return 0;
    
    const indexes = [5, 15, 25, 35, 50, 75, 100, 120];
    return indexes.reduce((sum, i) => {
      return sum + (parseInt(hash[i], 16) || 0);
    }, 0);
  }

  // 3. විශ්වාසදායකත්වය ගණනය කිරීම (යාවත්කාලීන තර්කනය)
  calculateConfidence(entropy, score, oddTarget, hash) {
    let confidence = 50;
    
    // එන්ට්‍රොපි අගයන්
    if (entropy > 4.2) confidence += 10;
    if (entropy > 4.5) confidence += 15;
    
    // රටා හඳුනාගැනීම
    if (score % 7 === 0) confidence += 8;
    if (score % 5 === 0) confidence += 5;
    if (/(\w)\1{2,}/.test(hash)) confidence += 15;
    if (/(\w{2,4})\1{1,}/.test(hash)) confidence += 10;
    
    // අවසාන අක්ෂර රටා
    const tail = hash.slice(-4);
    if (/^(aaaa|ffff|0000|1111)$/.test(tail)) confidence += 20;
    
    // ඔඩ් අනුව ගැලපීම්
    switch(oddTarget) {
      case '2':
        confidence += 5;
        break;
      case '3':
        confidence += 5;
        if (entropy > 3.8 && entropy < 4.2) confidence += 8;
        if (score >= 40 && score <= 70) confidence += 7;
        break;
      case '4':
        confidence += 5;
        if (entropy > 3.91 && entropy < 3.97) confidence += 10;
        if (score >= 45 && score <= 80) confidence += 8;
        break;
      case '7':
        confidence += 5;
        if (entropy > 4.1 && entropy < 4.4) confidence += 12;
        if (score >= 55 && score <= 90) confidence += 6;
        break;
      case '10':
        confidence += 10;
        if (entropy > 4.25 && entropy < 4.5) confidence += 15;
        if (score >= 60 && score <= 100) confidence += 10;
        break;
      case '100':
        confidence += 15;
        if (entropy > 4.3) confidence += 20;
        if (score >= 80) confidence += 15;
        break;
    }
    
    return Math.min(98, Math.max(5, Math.round(confidence)));
  }

  // 4. ප්‍රමාදය ගණනය කිරීම
  calculateDelay(score, entropy, oddTarget, hash) {
    let base = parseInt(oddTarget) * 45;
    
    // පොදු ගැලපීම්
    if (entropy > 4.3) base += 20;
    if (score % 7 === 0) base += 30;
    if (score % 5 === 0) base += 15;
    if (/(\w)\1{2,}/.test(hash)) base += 20;
    if (/(\w{2,4})\1{1,}/.test(hash)) base += 15;
    
    // ඔඩ් සුවිශේෂී ගැලපීම්
    switch(oddTarget) {
      case '10':
        base += 60;
        break;
      case '100':
        base += 600;
        break;
    }
    
    return Math.max(45, base);
  }

  // ප්‍රධාන ප්‍රතිඵල ගණනය කිරීමේ ක්‍රමය
  predict(hash, oddStr) {
    // වලංගු භාවය පරීක්ෂා කිරීම
    if (!hash || typeof hash !== 'string' || hash.length !== 128 || !/^[a-f0-9]+$/i.test(hash)) {
      throw new Error("අවලංගු SHA512 හැෂ් කේතයකි. 0-9, a-f අක්ෂර 128ක් පමණක් අවශ්‍යයි.");
    }
    
    hash = hash.toLowerCase();
    const entropy = this.calcEntropy(hash);
    const score = this.scoreFromHash(hash);
    const confidence = this.calculateConfidence(entropy, score, oddStr, hash);
    const delay = this.calculateDelay(score, entropy, oddStr, hash);
    const futureTime = new Date(Date.now() + this.serverTimeOffset + delay * 1000);
    
    return {
      version: this.currentVersion,
      odd: oddStr,
      entropy: parseFloat(entropy.toFixed(3)),
      score: score,
      confidence: confidence,
      delay: delay,
      timeStr: futureTime.toLocaleTimeString(),
      futureTime: futureTime,
      hashUsed: hash.slice(0, 8) + '...' + hash.slice(-8) // කෙටි හැෂ් එක
    };
  }

  // හැෂ් එක පූර්ව-විශ්ලේෂණය කිරීම
  preAnalyzeHash(hash) {
    if (!hash || typeof hash !== 'string' || hash.length !== 128 || !/^[a-f0-9]+$/i.test(hash)) {
      return null;
    }
    
    hash = hash.toLowerCase();
    const entropy = this.calcEntropy(hash);
    const score = this.scoreFromHash(hash);
    
    return {
      2: this.calculateConfidence(entropy, score, '2', hash),
      3: this.calculateConfidence(entropy, score, '3', hash),
      4: this.calculateConfidence(entropy, score, '4', hash),
      7: this.calculateConfidence(entropy, score, '7', hash),
      10: this.calculateConfidence(entropy, score, '10', hash),
      100: this.calculateConfidence(entropy, score, '100', hash),
      entropy: parseFloat(entropy.toFixed(3)),
      score: score
    };
  }

  // සර්වර් කාලය සමමුහුර්ත කිරීම
  async syncServerTime() {
    try {
      const start = Date.now();
      const response = await fetch('https://worldtimeapi.org/api/ip');
      const data = await response.json();
      const serverTime = new Date(data.utc_datetime).getTime();
      const end = Date.now();
      const rtt = end - start;
      
      this.serverTimeOffset = serverTime - end + (rtt / 2);
      console.log(`කාලය සමමුහුර්ත කරගත්තා (ප්‍රමාදය: ${rtt}ms)`);
      return true;
    } catch (e) {
      console.error("කාලය සමමුහුර්ත කිරීම අසාර්ථකයි:", e);
      this.serverTimeOffset = 0;
      return false;
    }
  }
}

// Browser හෝ Node.js සඳහා අපනයනය කිරීම
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HashPredictor;
} else {
  window.HashPredictor = HashPredictor;
}