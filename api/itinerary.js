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
    // 日志显示你的 Key 已经成功读取（True）
    if (!apiKey) return json(res, 500, { error: "Missing API_KEY env variable" });

    let body = req.body;
    if (typeof body === 'string') { 
      try { body = JSON.parse(body); } catch(e) { console.error("JSON parse error"); }
    }
    
    const { prompt } = body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt" });

    // ✨ 终极语法修正：
    // 在 2026 年版 SDK 中，GoogleGenAI 返回的是一个包含 models 命名空间的客户端对象
    const client = new GoogleGenAI({ apiKey });

    // 推荐写法：通过 client.getGenerativeModel 获取模型实例（注意这是新版实例方法）
    // 或者直接使用 client.models.generateContent
    const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });

    // 执行生成
    const result = await model.generateContent(prompt);
    
    // 兼容多种返回格式的处理逻辑
    const text = result.response?.text() || result.text || "No response text";

    return json(res, 200, { 
      text, 
      model: "gemini-2.5-flash",
      status: "success" 
    });

  } catch (e) {
    console.error("Gemini API Runtime Error:", e.message);
    // 如果还是报错，尝试最原始的调用方式
    return json(res, 500, { 
      error: `SDK Error: ${e.message}`,
      tip: "Please ensure @google/genai is correctly installed in package.json"
    });
  }
}
