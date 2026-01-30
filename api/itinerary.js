import { GoogleGenAI } from '@google/genai';

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  // CORS 设置
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-id");

  if (req.method === "OPTIONS") return json(res, 200, { ok: true });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    // 调试日志：确认 Vercel 是否成功加载了变量
    console.log("API Key found:", !!apiKey);

    if (!apiKey) {
      console.error("CRITICAL: API_KEY is missing from process.env");
      return json(res, 500, { error: "Missing API_KEY env variable" });
    }

    // 解析请求体
    let body = req.body;
    if (typeof body === 'string') { 
      try { body = JSON.parse(body); } catch(e) { console.error("Parse error:", e); }
    }
    
    const { prompt } = body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt" });

    // ✨ 核心修复：新版 SDK 必须传入一个对象 { apiKey: '...' }
    const genAI = new GoogleGenAI({ apiKey: apiKey });

    // 使用 2026 年主流的 2.5 系列模型
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    // 执行生成任务
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return json(res, 200, { 
      text, 
      model: modelName,
      status: "success" 
    });

  } catch (e) {
    console.error("Gemini API Runtime Error:", e.message);
    return json(res, 500, { 
      error: e.message,
      detail: "If this is a key error, double check your Vercel project settings."
    });
  }
}
