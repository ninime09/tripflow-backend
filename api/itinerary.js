import { GoogleGenerativeAI } from '@google/generative-ai';

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
    
    // 之前日志显示你的环境变量是能读到的，只是库不对
    if (!apiKey) return json(res, 500, { error: "Missing API_KEY env variable" });

    let body = req.body;
    if (typeof body === 'string') { 
      try { body = JSON.parse(body); } catch(e) { console.error("JSON parse error"); }
    }
    
    const { prompt } = body || {};
    if (!prompt) return json(res, 400, { error: "Missing prompt" });

    // 1. 初始化官方 SDK (这是标准写法)
    const genAI = new GoogleGenerativeAI(apiKey);

    // 2. 获取模型 (推荐使用 gemini-1.5-flash，它在 DC 地区最稳定)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. 执行生成任务
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return json(res, 200, { 
      text, 
      model: "gemini-1.5-flash",
      status: "success" 
    });

  } catch (e) {
    console.error("Gemini API Error:", e.message);
    return json(res, 500, { 
      error: e.message,
      tip: "Ensure @google/generative-ai is installed correctly."
    });
  }
}
