import { GoogleGenAI } from '@google/genai';

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
    console.log("API Key found:", !!apiKey);

    if (!apiKey) return json(res, 500, { error: "Missing API_KEY env variable" });

    let body = req.body;
    if (typeof body === 'string') { 
      try { body = JSON.parse(body); } catch(e) { console.error("JSON Parse Error"); }
    }
    
    const { prompt } = body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt" });

    // 1. 初始化客户端
    const client = new GoogleGenAI({ apiKey });

    // 2. ✨ 核心修改点：新版 SDK 使用 client.models.get() 或直接在生成时指定
    // 如果 getGenerativeModel 报错，说明该版本推荐使用如下链式调用：
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // 3. 执行生成任务 (注意新版 SDK 可能直接通过 client 调用)
    const result = await client.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // 4. 解析结果
    const text = result.text || (await result.response?.text?.()) || "No response text";

    return json(res, 200, { 
      text, 
      model: modelName,
      status: "success" 
    });

  } catch (e) {
    console.error("Gemini API Runtime Error:", e.message);
    return json(res, 500, { 
      error: e.message,
      stack: "Check if SDK methods have changed in 2026 version."
    });
  }
}
