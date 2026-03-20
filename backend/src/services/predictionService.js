const getAverageUsage = (usageHistory) => {
  const consumption = usageHistory.filter(u => u.type === "CONSUMPTION");

  if (consumption.length === 0) return 0;

  const total = consumption.reduce(
    (sum, u) => sum + Math.abs(u.change),
    0
  );

  const first = new Date(consumption[0].timestamp);
  const last = new Date(consumption[consumption.length - 1].timestamp);

  const days = (last - first) / (1000 * 60 * 60 * 24);

  return total / (days || 1);
};


// 🔥 NEW: Confidence Calculation
const calculateConfidence = (usageHistory) => {
  const consumption = usageHistory.filter(u => u.type === "CONSUMPTION");

  if (consumption.length === 0) return 0;

  const dataScore = Math.min(1, consumption.length / 10);

  const values = consumption.map(u => Math.abs(u.change));

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

  const consistencyScore = 1 / (1 + variance);

  const confidence = (dataScore + consistencyScore) / 2;

  return Number(confidence.toFixed(2));
};


const computePrediction = (item, usageHistory, batches = []) => {
  const avgUsage = getAverageUsage(usageHistory);

  if (avgUsage === 0 || batches.length === 0) {
    return {
      days_left: null,
      depletion_date: null,
      confidence: 0
    };
  }

  // 🔥 FIFO: sort batches by expiry
  const sortedBatches = [...batches].sort(
    (a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)
  );

  let remaining = avgUsage;
  let daysLeft = 0;

  for (const batch of sortedBatches) {
    const daysForBatch = batch.quantity / avgUsage;

    daysLeft += daysForBatch;
  }

  const depletionDate = new Date();
  depletionDate.setDate(depletionDate.getDate() + daysLeft);

  const confidence = calculateConfidence(usageHistory);

  return {
    days_left: Math.round(daysLeft),
    depletion_date: depletionDate,
    confidence
  };
};

module.exports = { computePrediction };