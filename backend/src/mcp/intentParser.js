const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const parseIntent = async (query) => {
  const prompt = `
Extract:
1. intent (PREDICT_DEPLETION, CHECK_EXPIRY, REORDER_SUGGESTION, WASTE_ANALYSIS)
2. item_name

Query: "${query}"

Return JSON:
{
  "intent": "...",
  "item_name": "..."
}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = { parseIntent };