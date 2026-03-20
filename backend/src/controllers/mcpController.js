const {
  parseQueryWithAI,
  generateAIResponse,
} = require("../services/aiService");
const InventoryItem = require("../models/InventoryItem");
const Prediction = require("../models/Prediction");
const AIQueryLog = require("../models/AIQueryLog");
const {
  calculateSustainabilityScore,
} = require("../services/sustainabilityService");
const { fallbackResponse } = require("../services/fallbackService");
const Batch = require("../models/Batch");

exports.handleQuery = async (req, res) => {
  try {
    const { query } = req.body;

    let intent = "UNKNOWN";

    try {
      const parsed = await parseQueryWithAI(query);
      intent = parsed.intent;
    } catch {
      console.log("⚠️ Intent fallback used");
    }

    // 🔥 Fetch ALL items + predictions
    const items = await InventoryItem.find();
    const predictions = await Prediction.find().populate("item_id");
    const batches = await Batch.find().populate("item_id");
    // console.log(batches);

    const context = {
      batches: batches.slice(0, 50).map((b) => ({
        item_name: b.item_id.name,
        quantity: b.quantity,
        expiry_date: b.expiry_date,
      })),
      predictions: predictions.slice(0, 20).map((p) => ({
        item_name: p.item_id.name,
        predicted_depletion_date: p.predicted_depletion_date,
        confidence: p.confidence_score,
      })),
    };

    // console.log("📊 AI CONTEXT:", context);

    // 🤖 AI handles everything
    const responseText = await generateAIResponse(intent, context, query);

    await AIQueryLog.create({
      query_text: query,
      intent_detected: intent,
      context_sent: context,
      response: responseText,
      fallback_used: false,
    });

    res.json({ response: responseText });
  } catch (error) {
    console.error("⚠️ AI failed → using fallback");

    const predictions = await Prediction.find().populate("item_id");
    const batches = await Batch.find().populate("item_id");
    // console.log(batches);

    const context = {
      batches: batches.slice(0, 50).map((b) => ({
        item_name: b.item_id.name,
        quantity: b.quantity,
        expiry_date: b.expiry_date,
      })),
      predictions: predictions.slice(0, 20).map((p) => ({
        item_name: p.item_id.name,
        predicted_depletion_date: p.predicted_depletion_date,
        confidence: p.confidence_score,
      })),
    };

    const fallbackText = fallbackResponse(req.body.query, context);

    await AIQueryLog.create({
      query_text: req.body.query,
      intent_detected: "FALLBACK",
      context_sent: context,
      response: fallbackText,
      fallback_used: true,
    });

    res.json({ response: fallbackText });
  }
};
