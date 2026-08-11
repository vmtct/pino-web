import worker from "./worker";
import { getMember } from "./lib/member";

type Env = {
  NOTION_TOKEN: string;
  NOTION_PARENT_DATA_SOURCE_ID: string;
  NOTION_STUDENT_DATA_SOURCE_ID: string;
  NOTION_OS_PASS_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATABASE_ID?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const memberHandler = {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/member") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }

      let body: any;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid request." }, 400);
      }

      const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
      if (!phone) {
        return json({ error: "phone is required." }, 400);
      }

      const result = await getMember(env, phone);
      return result.ok ? json(result) : json(result, result.status);
    }

    return worker.fetch(request, env as any);
  },
};

export default memberHandler;
