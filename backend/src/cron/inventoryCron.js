const cron = require("node-cron");

const InventoryItem = require("../models/InventoryItem");
const UsageHistory = require("../models/UsageHistory");
const Prediction = require("../models/Prediction");
const Alert = require("../models/Alert");

const { computePrediction } = require("../services/predictionService");

const runInventoryAnalysis = async () => {
  console.log("🔄 Running inventory analysis...");

  const items = await InventoryItem.find();

  for (const item of items) {
    // 🔥 STEP 1: CLEAR OLD ALERTS
    await Alert.deleteMany({ item_id: item._id });

    const usage = await UsageHistory.find({ item_id: item._id }).sort(
      "timestamp",
    );

    const prediction = computePrediction(item, usage);

    // 📈 Store prediction
    await Prediction.findOneAndUpdate(
      { item_id: item._id },
      {
        predicted_depletion_date: prediction.depletion_date,
        confidence_score: prediction.confidence,
      },
      { upsert: true, returnDocument: "after" },
    );

    let alerts = [];

    // 🔔 LOW STOCK
    if (prediction.days_left !== null && prediction.days_left < 3) {
      alerts.push({
        item_id: item._id,
        type: "LOW_STOCK",
        message: `${item.name} will run out in ${prediction.days_left} days`,
      });
    }

    // ⏳ EXPIRY
    if (item.expiry_date) {
      const daysToExpiry =
        (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);

      if (daysToExpiry < 2) {
        alerts.push({
          item_id: item._id,
          type: "EXPIRY",
          message: `${item.name} expires in ${Math.round(daysToExpiry)} days`,
        });
      }
    }

    // 📦 OVERSTOCK
    if (prediction.days_left > 10) {
      alerts.push({
        item_id: item._id,
        type: "OVERSTOCK",
        message: `${item.name} may be overstocked`,
      });
    }

    // ⚠️ WASTE RISK
    if (
      item.expiry_date &&
      prediction.depletion_date &&
      prediction.depletion_date > item.expiry_date
    ) {
      alerts.push({
        item_id: item._id,
        type: "WASTE_RISK",
        message: `${item.name} may expire before usage`,
      });
    }

    // 💾 Save alerts
    for (const alert of alerts) {
      await Alert.create(alert);
    }
  }

  console.log("✅ Inventory analysis completed");
};

// ⏰ Run every 6 hours
const startCron = () => {
  //   cron.schedule("0 */6 * * *", runInventoryAnalysis); // every 6 hours
  cron.schedule("* * * * *", runInventoryAnalysis); // every minute
};

module.exports = startCron;
