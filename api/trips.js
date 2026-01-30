import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  try {
    // 你前端先生成一个匿名 userId（存在 localStorage），每次请求带过来
    const userId =
      req.query.userId ||
      (req.body && req.body.userId) ||
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
        itinerary
      };

      const { data, error } = await supabase
        .from("trips")
        .insert(payload)
        .select("*")
        .single();

      if (error) return json(res, 500, { error: error.message });
      return json(res, 200, { trip: data });
    }

    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return json(res, 500, { error: e?.message || "Unknown error" });
  }
}
