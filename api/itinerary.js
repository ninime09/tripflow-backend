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
    const apiKey = process.env.API_KEY;
    if (!apiKey) return json(res, 500, { error: "Missing API_KEY env variable" });

    // 确保解析了 body (Vercel 会自动解析 JSON body)
    const { prompt } = req.body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt in request body" });

    // 1. 初始化 SDK (注意类名需与 import 保持一致)
    const genAI = new GoogleGenAI(apiKey);

    // 2. 建议使用 gemini-2.5-flash 或 gemini-2.0-flash-001
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // 3. 获取模型实例
    const model = genAI.getGenerativeModel({ model: modelName });

    // 4. 执行生成
    const result = await model.generateContent(prompt);
    
    // 5. 提取响应内容
    const response = await result.response;
    const text = response.text();

    return json(res, 200, { 
      text, 
      model: modelName,
      status: "success"
    });

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
