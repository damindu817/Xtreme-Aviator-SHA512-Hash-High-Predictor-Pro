// Auto-detect common crash times
function setupCrashTime() {
  document.getElementById("autoCrashTimeBtn").addEventListener("click", function() {
    const commonTimes = [1.2, 1.5, 1.98, 2.5, 3.0, 3.75, 5.0, 7.5, 10.0];
    const randomTime = commonTimes[Math.floor(Math.random() * commonTimes.length)];
    document.getElementById("crashTimeInput").value = randomTime.toFixed(2);
    
    // Play beep sound if available
    if (typeof playBeepSound === 'function') {
      playBeepSound();
    } else {
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3');
      audio.play().catch(e => console.log("Audio play failed:", e));
    }
  });

  // Update clear function to also clear crash time
  const clearButton = document.getElementById("clearHashInput");
  const originalClearFunction = clearButton.onclick;
  
  clearButton.onclick = function() {
    document.getElementById("crashTimeInput").value = '';
    if (originalClearFunction) {
      originalClearFunction();
    }
  };

  // Also trigger analysis when crash time changes
  document.getElementById("crashTimeInput").addEventListener('input', function() {
    if (typeof lastHash !== 'undefined' && lastHash && lastHash.length === 128 && /^[a-f0-9]+$/.test(lastHash)) {
      if (typeof preAnalyzeHash === 'function') {
        preAnalyzeHash(lastHash);
      }
    }
  });
}

// Initialize when document is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupCrashTime);
} else {
  setupCrashTime();
}