import { GoogleGenAI } from "@google/genai";

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-id");

  if (req.method === "OPTIONS") return json(res, 200, { ok: true });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return json(res, 500, { error: "Missing API_KEY env" });

    const { prompt } = req.body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt" });

    const ai = new GoogleGenAI({ apiKey });

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    const result = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text =
      result?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

    return json(res, 200, { text });
  } catch (e) {
    return json(res, 500, { error: e?.message || "Unknown error" });
  }
}
