const fallbackResponse = (query, context) => {
  const lowerQuery = query.toLowerCase();

  const batches = context.batches || [];
  const predictions = context.predictions || [];

  console.log("📦 FALLBACK CONTEXT:", context);

  // 🔥 Helper → group batches by item
  const batchMap = {};
  batches.forEach(b => {
    if (!batchMap[b.item_name]) batchMap[b.item_name] = [];
    batchMap[b.item_name].push(b);
  });

  // =====================================================
  // 🔥 1. RUN OUT / DEPLETION (prediction-based)
  // =====================================================
  if (lowerQuery.includes("run out") || lowerQuery.includes("deplete")) {
    let result = "Items running out soon:\n";
    let found = false;

    predictions.forEach(p => {
      const days =
        (new Date(p.predicted_depletion_date) - new Date()) /
        (1000 * 60 * 60 * 24);

      if (days <= 3) {
        found = true;
        result += `- ${p.item_name}: ${Math.round(days)} days left\n`;
      }
    });

    return found ? result : "No items running out soon.";
  }

  // =====================================================
  // 🔥 2. LOW STOCK (derive from batches)
  // =====================================================
  if (lowerQuery.includes("low stock")) {
    let result = "Low stock items:\n";
    let found = false;

    Object.keys(batchMap).forEach(itemName => {
      const total = batchMap[itemName].reduce(
        (sum, b) => sum + b.quantity,
        0
      );

      if (total <= 5) { // ⚠️ simple threshold (you can tune)
        found = true;
        result += `- ${itemName}: only ${total} left\n`;
      }
    });

    return found ? result : "No low stock items.";
  }

  // =====================================================
  // 🔥 3. ITEM-SPECIFIC EXPIRY
  // =====================================================
  for (const b of batches) {
    if (lowerQuery.includes(b.item_name.toLowerCase())) {
      if (!b.expiry_date) continue;

      const days =
        (new Date(b.expiry_date) - new Date()) /
        (1000 * 60 * 60 * 24);

      if (days <= 2 && days > 0) {
        return `${b.item_name} has a batch expiring in ${Math.ceil(days)} days. Use it soon.`;
      }

      if (days <= 0) {
        return `${b.item_name} has expired batches.`;
      }
    }
  }

  // =====================================================
  // 🔥 4. GENERIC EXPIRY
  // =====================================================
  if (
    lowerQuery.includes("expire") ||
    lowerQuery.includes("expiring") ||
    lowerQuery.includes("about to expire") ||
    lowerQuery.includes("expiry")
  ) {
    let result = "Items expiring soon:\n";
    let found = false;

    batches.forEach(b => {
      if (!b.expiry_date) return;

      const days =
        (new Date(b.expiry_date) - new Date()) /
        (1000 * 60 * 60 * 24);

      if (days <= 2 && days > 0) {
        found = true;
        result += `- ${b.item_name}: expires in ${Math.ceil(days)} days\n`;
      }
    });

    return found ? result : "No items expiring soon.";
  }

  // =====================================================
  // 🔥 5. WASTE RISK (batch vs prediction)
  // =====================================================
  if (lowerQuery.includes("waste")) {
    let result = "Potential waste risks:\n";
    let found = false;

    predictions.forEach(p => {
      const itemBatches = batchMap[p.item_name];
      if (!itemBatches) return;

      // earliest expiry batch
      const earliest = itemBatches.sort(
        (a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)
      )[0];

      if (!earliest?.expiry_date) return;

      if (
        new Date(p.predicted_depletion_date) >
        new Date(earliest.expiry_date)
      ) {
        found = true;
        result += `- ${p.item_name}: may expire before use\n`;
      }
    });

    return found ? result : "No waste risks detected.";
  }

  // =====================================================
  // 🔥 DEFAULT
  // =====================================================
  return "I couldn’t fully understand, but your inventory is being monitored.";
};

module.exports = { fallbackResponse };