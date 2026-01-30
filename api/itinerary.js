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

  // 预检请求处理
  if (req.method === "OPTIONS") return json(res, 200, { ok: true });
  
  // 仅允许 POST
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    // --- 调试日志：在 Vercel 控制台查看 ---
    console.log("Detected API Key length:", apiKey ? apiKey.length : 0);
    if (apiKey) console.log("API Key preview:", apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4));
    // ------------------------------------

    if (!apiKey) return json(res, 500, { error: "Missing API_KEY env variable" });

    // 兼容性处理：如果 req.body 是字符串，手动解析它
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
    }
    
    const { prompt } = body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt in request body" });

    const genAI = new GoogleGenAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return json(res, 200, { text, model: modelName, status: "success" });

  } catch (e) {
    console.error("Gemini API Error:", e);
    
    // 如果错误信息包含 "not found"，说明是模型名称或版本不对
    const errorMessage = e.message || "Unknown error occurred";
    return json(res, 500, { 
      error: errorMessage,
      tip: "Please check if the model name is supported in your region."
    });
  }
}
// test rebuild