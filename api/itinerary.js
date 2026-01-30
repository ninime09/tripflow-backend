import { GoogleGenerativeAI } from '@google/generative-ai';

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-id");

  if (req.method === "OPTIONS") return json(res, 200, { ok: true });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) return json(res, 500, { error: "Missing API_KEY" });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      // ✨ 必须在这里也配置 JSON 模式确保实例稳定
      generationConfig: { responseMimeType: "application/json" } 
    });

    const { prompt } = req.body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt" });

    // 优化后的 Prompt 指令
    const systemInstruction = `${prompt}. 
    Return a JSON object strictly following this schema:
    {
      "days": [
        {
          "day_number": number,
          "activities": [
            { "time": "string", "location": "string", "description": "string" }
          ]
        }
      ]
    }`;

    const result = await model.generateContent(systemInstruction);
    const response = await result.response;
    const rawText = response.text();
    
    // ✨ 将字符串解析为真正的 JSON 对象再返回给前端
    const itineraryData = JSON.parse(rawText);
    
    return json(res, 200, { 
      data: itineraryData, 
      model: modelName, 
      status: "success" 
    });

  } catch (e) {
    return json(res, 500, { 
      error: e.message, 
      debug_info: { attempted_model: process.env.GEMINI_MODEL }
    });
  }
}