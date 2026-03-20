const cron = require("node-cron");

const InventoryItem = require("../models/InventoryItem");
const UsageHistory = require("../models/UsageHistory");
const Prediction = require("../models/Prediction");
const Alert = require("../models/Alert");
const Batch = require("../models/Batch");

const { computePrediction } = require("../services/predictionService");

const runInventoryAnalysis = async () => {
  console.log("🔄 Running inventory analysis...");

  const items = await InventoryItem.find();

  for (const item of items) {
    console.log("👉 Processing item:", item.name);
    // 🔥 STEP 1: CLEAR OLD ALERTS
    await Alert.deleteMany({ item_id: item._id });

    let alerts = [];

    // 🔥 STEP 2: GET ALL BATCHES OF ITEM
    const batches = await Batch.find({ item_id: item._id }).sort("expiry_date");

    // 🔥 STEP 3: CALCULATE TOTAL QUANTITY FROM BATCHES
    const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);

    // 🔥 UPDATE ITEM QUANTITY (IMPORTANT)
    await InventoryItem.findByIdAndUpdate(item._id, {
      quantity: totalQuantity,
    });

    // 🔥 STEP 4: USAGE + PREDICTION
    const usage = await UsageHistory.find({ item_id: item._id }).sort(
      "timestamp",
    );

    const prediction = computePrediction(
      { ...item.toObject(), quantity: totalQuantity },
      usage,
      batches, // 🔥 IMPORTANT
    );

    await Prediction.findOneAndUpdate(
      { item_id: item._id },
      {
        predicted_depletion_date: prediction.depletion_date,
        confidence_score: prediction.confidence,
      },
      { upsert: true, returnDocument: "after" },
    );

    // 🔔 STEP 5: LOW STOCK
    if (prediction.days_left !== null && prediction.days_left < 3) {
      alerts.push({
        item_id: item._id,
        type: "LOW_STOCK",
        message: `${item.name} will run out in ${prediction.days_left} days`,
      });
    }

    // 🔥 STEP 6: BATCH-LEVEL EXPIRY ALERTS (NEW 🔥)
    for (const batch of batches) {
      if (!batch.expiry_date) continue;

      const days =
        (new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);

      if (days <= 2 && days > 0) {
        alerts.push({
          item_id: item._id,
          type: "EXPIRY",
          message: `${item.name} batch (${batch.quantity}) expires in ${Math.ceil(
            days,
          )} day(s)`,
        });
      }

      if (days <= 0) {
        alerts.push({
          item_id: item._id,
          type: "EXPIRED",
          message: `${item.name} batch (${batch.quantity}) has expired`,
        });
      }
    }

    // 🔥 CRITICAL: WILL EXPIRE BEFORE CONSUMPTION
    for (const batch of batches) {
      if (!batch.expiry_date) continue;

      const daysToExpire =
        (new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);

      const daysToConsume = batch.quantity / (prediction.days_left || 1);

      if (daysToExpire < daysToConsume) {
        alerts.push({
          item_id: item._id,
          type: "WASTE_RISK",
          message: `${item.name} batch may expire before it is consumed`,
        });
      }
    }

    // 📦 STEP 7: OVERSTOCK
    if (prediction.days_left > 10) {
      alerts.push({
        item_id: item._id,
        type: "OVERSTOCK",
        message: `${item.name} may be overstocked`,
      });
    }

    // ⚠️ STEP 8: WASTE RISK (SMART 🔥)
    const earliestBatch = [...batches].sort(
      (a, b) => new Date(a.expiry_date) - new Date(b.expiry_date),
    )[0];

    if (
      earliestBatch &&
      prediction.depletion_date &&
      earliestBatch.expiry_date &&
      prediction.depletion_date > earliestBatch.expiry_date
    ) {
      alerts.push({
        item_id: item._id,
        type: "WASTE_RISK",
        message: `${item.name} may expire before being fully used`,
      });
    }

    // 💾 STEP 9: SAVE ALERTS
    console.log("🚨 Alerts generated:", alerts);
    if (alerts.length === 0) {
      alerts.push({
        item_id: item._id,
        type: "INFO",
        message: `${item.name} is stable`,
      });
    }
    for (const alert of alerts) {
      await Alert.create(alert);
    }
  }

  console.log("✅ Inventory analysis completed");
};

// ⏰ CRON
const startCron = () => {
  cron.schedule("* * * * *", runInventoryAnalysis); // every minute
};

module.exports = startCron;
