const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 🧠 Intent + Entity Extraction
const parseQueryWithAI = async (query) => {
  const prompt = `
Extract:
1. intent (PREDICT_DEPLETION, CHECK_EXPIRY, REORDER_SUGGESTION, WASTE_ANALYSIS)
2. item_name

Query: "${query}"

Return ONLY valid JSON:
{
  "intent": "...",
  "item_name": "..."
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    let text = response.text;

    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }

  } catch (err) {
    console.error("Gemini parse error:", err);
  }

  return {
    intent: "UNKNOWN",
    item_name: ""
  };
};

// 🤖 Response Generator
const generateAIResponse = async (intent, context) => {
  const prompt = `
You are an AI inventory assistant focused on sustainability.

Context:
${JSON.stringify(context)}

Intent: ${intent}

Give a clear, human-friendly response.
Also suggest smart actions like reducing waste or reordering.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (err) {
    console.error("Gemini response error:", err);
    return "AI unavailable, fallback used";
  }
};

module.exports = {
  parseQueryWithAI,
  generateAIResponse,
};
