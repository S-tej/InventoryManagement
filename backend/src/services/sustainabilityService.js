const calculateSustainabilityScore = (item, prediction) => {
  let score = 100;

  if (!prediction || !prediction.predicted_depletion_date) return 50;

  const daysLeft =
    (new Date(prediction.predicted_depletion_date) - new Date()) /
    (1000 * 60 * 60 * 24);

  // 🔻 Waste risk
  if (item.expiry_date) {
    const expiryDays =
      (new Date(item.expiry_date) - new Date()) /
      (1000 * 60 * 60 * 24);

    if (daysLeft > expiryDays) score -= 40;
  }

  // 🔻 Overstock
  if (daysLeft > 10) score -= 20;

  // 🔻 Low stock panic
  if (daysLeft < 2) score -= 10;

  return Math.max(0, score);
};

module.exports = { calculateSustainabilityScore };