import { GoogleGenAI } from '@google/genai';

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  // CORS 响应头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-user-id");

  if (req.method === "OPTIONS") return json(res, 200, { ok: true });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    // 你的日志显示 API Key 已找到，长度 39 位是正确的
    if (!apiKey) return json(res, 500, { error: "Missing API_KEY env variable" });

    let body = req.body;
    if (typeof body === 'string') { 
      try { body = JSON.parse(body); } catch(e) { console.error("JSON parse error"); }
    }
    
    const { prompt } = body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt" });

    // 1. 初始化客户端 (使用对象格式)
    const genAI = new GoogleGenAI({ apiKey });

    // 2. ✨ 核心修复：新版 SDK 直接使用 generateContent 方法
    // 不再需要 genAI.getGenerativeModel()
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const result = await genAI.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // 3. 解析响应内容
    // 新版 SDK 的结果通常直接在 text 属性中或通过 response.text() 获取
    const responseText = result.text || (await result.response?.text?.()) || "No output from AI";

    return json(res, 200, { 
      text: responseText, 
      model: modelName,
      status: "success" 
    });

  } catch (e) {
    console.error("Gemini API Error:", e.message);
    return json(res, 500, { 
      error: e.message,
      detail: "The SDK method might have changed in the 2026 version. Updated to direct call."
    });
  }
}
