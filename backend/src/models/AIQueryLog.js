const mongoose = require("mongoose");

const aiQuerySchema = new mongoose.Schema({
  query_text: String,
  intent_detected: String,
  context_sent: Object,
  response: String,
  fallback_used: Boolean
}, { timestamps: true });

module.exports = mongoose.model("AIQueryLog", aiQuerySchema);