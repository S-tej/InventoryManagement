const { parseQueryWithAI, generateAIResponse } = require("../services/aiService");
const InventoryItem = require("../models/InventoryItem");
const Prediction = require("../models/Prediction");
const AIQueryLog = require("../models/AIQueryLog");

exports.handleQuery = async (req, res) => {
  try {
    const { query } = req.body;

    // 🧠 Step 1: LLM parses query
    const { intent, item_name } = await parseQueryWithAI(query);

    // 📦 Step 2: Fetch controlled data
    const item = await InventoryItem.findOne({
      name: new RegExp(item_name, "i")
    });

    if (!item) {
      return res.json({ response: "Item not found in inventory" });
    }

    const prediction = await Prediction.findOne({ item_id: item._id });

    const context = {
      item: {
        name: item.name,
        quantity: item.quantity,
        expiry_date: item.expiry_date
      },
      prediction
    };

    // 🤖 Step 3: Generate response
    const responseText = await generateAIResponse(intent, context);

    // 💾 Step 4: Log
    await AIQueryLog.create({
      query_text: query,
      intent_detected: intent,
      context_sent: context,
      response: responseText,
      fallback_used: false
    });

    res.json({ response: responseText });

  } catch (error) {
    console.error(error);

    res.json({
      response: "Something went wrong, fallback triggered"
    });
  }
};