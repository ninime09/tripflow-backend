// api/itinerary.js
import { GoogleGenerativeAI } from "@google/generative-ai";

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return json(res, 200, {});
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return json(res, 400, { error: "Missing prompt" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return json(res, 200, { itinerary: text });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}
