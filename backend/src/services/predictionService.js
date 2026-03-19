const getAverageUsage = (usageHistory) => {
  if (usageHistory.length === 0) return 0;

  const total = usageHistory.reduce((sum, u) => sum + u.quantity_used, 0);

  const first = new Date(usageHistory[0].timestamp);
  const last = new Date(usageHistory[usageHistory.length - 1].timestamp);

  const days = (last - first) / (1000 * 60 * 60 * 24);

  return total / (days || 1);
};


// 🔥 NEW: Confidence Calculation
const calculateConfidence = (usageHistory) => {
  if (usageHistory.length === 0) return 0;

  // 📊 1. Data Volume Score
  const dataScore = Math.min(1, usageHistory.length / 10);

  // 📊 2. Consistency Score (variance-based)
  const values = usageHistory.map(u => u.quantity_used);

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

  const consistencyScore = 1 / (1 + variance); // lower variance = higher score

  // 🔥 FINAL CONFIDENCE (average of both)
  const confidence = (dataScore + consistencyScore) / 2;

  return Number(confidence.toFixed(2)); // clean number like 0.73
};


const computePrediction = (item, usageHistory) => {
  const avgUsage = getAverageUsage(usageHistory);

  if (avgUsage === 0) {
    return {
      days_left: null,
      depletion_date: null,
      confidence: 0
    };
  }

  const daysLeft = item.quantity / avgUsage;

  const depletionDate = new Date();
  depletionDate.setDate(depletionDate.getDate() + daysLeft);

  // 🔥 Use dynamic confidence
  const confidence = calculateConfidence(usageHistory);

  return {
    days_left: Math.round(daysLeft),
    depletion_date: depletionDate,
    confidence
  };
};

module.exports = { computePrediction };