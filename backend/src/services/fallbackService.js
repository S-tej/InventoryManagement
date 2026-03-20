const fallbackResponse = (query, context) => {
  const lowerQuery = query.toLowerCase();

  const items = context.items;
  const predictions = context.predictions;

  // 🔥 1. RUN OUT / DEPLETION
  if (lowerQuery.includes("run out") || lowerQuery.includes("deplete")) {
    let result = "Items running out soon:\n";

    predictions.forEach((p) => {
      const days =
        (new Date(p.predicted_depletion_date) - new Date()) /
        (1000 * 60 * 60 * 24);

      if (days <= 3) {
        result += `- ${p.item_name}: ${Math.round(days)} days left\n`;
      }
    });

    return result || "No items running out soon.";
  }

  // 🔥 2. LOW STOCK
  if (lowerQuery.includes("low stock")) {
    let result = "Low stock items:\n";

    items.forEach((i) => {
      if (i.quantity <= i.min_threshold) {
        result += `- ${i.name}: ${i.quantity} left\n`;
      }
    });

    return result || "No low stock items.";
  }

  // 🔥 3. EXPIRY SOON
  // 🔥 3. EXPIRY SOON (IMPROVED)
  if (
    lowerQuery.includes("expire") ||
    lowerQuery.includes("expiring") ||
    lowerQuery.includes("about to expire") ||
    lowerQuery.includes("going bad") ||
    lowerQuery.includes("expiry")
  ) {
    let found = false;
    let result = "Items expiring soon:\n";

    // 🔥 1. ITEM-SPECIFIC QUERY FIRST
    for (const i of items) {
      if (lowerQuery.includes(i.name.toLowerCase())) {
        if (!i.batches) continue;

        for (const batch of i.batches) {
          if (!batch.expiry_date) continue;

          const days =
            (new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);

          if (days <= 2 && days > 0) {
            return `${i.name} has a batch expiring in ${Math.ceil(days)} days. Use it soon to avoid waste.`;
          }

          if (days <= 0) {
            return `${i.name} has expired batches.`;
          }
        }

        return `${i.name} has no batches expiring soon.`;
      }
    }

    return found ? result : "No items expiring soon.";
  }

  // 🔥 4. WASTE RISK
  if (lowerQuery.includes("waste")) {
    let result = "Potential waste risks:\n";

    predictions.forEach((p) => {
      const item = items.find((i) => i.name === p.item_name);
      if (!item || !item.expiry_date) return;

      if (new Date(p.predicted_depletion_date) > new Date(item.expiry_date)) {
        result += `- ${item.name}: may expire before use\n`;
      }
    });

    return result || "No waste risks detected.";
  }

  // 🔥 DEFAULT
  return "I couldn’t process that fully, but your inventory is being monitored.";
};

module.exports = { fallbackResponse };
