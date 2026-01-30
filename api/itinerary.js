import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    // 强制指定模型为你在 Vercel 设置的变量，如果没有则手动锁定 gemini-2.5-flash
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) return json(res, 500, { error: "Missing API_KEY" });

    // 使用官方标准初始化
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const { prompt } = req.body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return json(res, 200, { 
      text: response.text(), 
      model: modelName, 
      status: "success" 
    });
  } catch (e) {
    // 报错时输出具体的模型名称，排查为什么会跳到 1.5
    return json(res, 500, { 
      error: e.message, 
      debug_info: {
        attempted_model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        sdk: "@google/generative-ai"
      }
    });
  }
}
