import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function setCors(res) {
  // MVP 先用 *，上线后建议换成你的前端域名（更安全）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-User-Id");
}

export default async function handler(req, res) {
  setCors(res);

  // 预检请求：浏览器会先发 OPTIONS
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const userId =
      req.query?.userId ||
      req.body?.userId ||
      req.headers["x-user-id"];

    if (!userId) return json(res, 400, { error: "Missing userId" });

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { trips: data });
    }

    if (req.method === "POST") {
      const { destination, startDate, endDate, itinerary } = req.body || {};

      if (!itinerary) return json(res, 400, { error: "Missing itinerary" });

      const payload = {
        user_id: userId,
        destination: destination || null,
        start_date: startDate || null,
        end_date: endDate || null,
        itinerary,
      };

      const { data, error } = await supabase
        .from("trips")
        .insert(payload)
        .select("*")
        .single();

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { trip: data });
    }

    res.setHeader("Allow", "GET, POST, OPTIONS");
    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return json(res, 500, { error: e?.message || "Unknown error" });
  }
}

