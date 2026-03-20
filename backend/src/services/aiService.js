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
      contents: prompt,
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
    item_name: "",
  };
};

// 🤖 Response Generator
const generateAIResponse = async (intent, context, query) => {
  const prompt = `
You are an AI inventory assistant focused on sustainability.

User Query:
"${query}"

Context:
${JSON.stringify(context)}

Instructions:
1. Answer clearly
2. Filter items based on query (time, stock, expiry)
3. ALWAYS include:
   - Explanation (why this result)
   - Recommendation (what to do)

Examples:
- If item runs out soon → suggest restocking
- If overstock → suggest reducing purchase
- If expiry soon → suggest prioritizing usage

Keep response:
- Plain text
- Concise but helpful
- No markdown
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};

module.exports = {
  parseQueryWithAI,
  generateAIResponse,
};
