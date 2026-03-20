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

exports.handleQuery = async (req, res) => {
  try {
    const { query } = req.body;

    const { intent } = await parseQueryWithAI(query);

    // 🔥 Fetch ALL items + predictions
    const items = await InventoryItem.find();
    const predictions = await Prediction.find().populate("item_id");

    const context = {
      items: items.slice(0, 20).map((i) => {
        const pred = predictions.find((p) => p.item_id._id.equals(i._id));

        return {
          name: i.name,
          quantity: i.quantity,
          min_threshold: i.min_threshold,
          expiry_date: i.expiry_date,
          sustainability_score: pred
            ? calculateSustainabilityScore(i, pred)
            : null,
        };
      }),
      predictions: predictions.slice(0, 20).map((p) => ({
        item_name: p.item_id.name,
        predicted_depletion_date: p.predicted_depletion_date,
        confidence: p.confidence_score,
      })),
    };

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
    console.error(error);

    res.json({
      response: "AI unavailable. Please try again.",
    });
  }
};
