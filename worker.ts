interface Env {
  ASSETS: Fetcher;
  NOTION_TOKEN: string;
  NOTION_PARENT_DATA_SOURCE_ID: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const allowedPasses = new Set([
  "Piano",
  "Art",
  "Little Piner",
  "Bring-a-Friend",
]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/open-studio/interest") {
      if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

      if (!env.NOTION_TOKEN || !env.NOTION_PARENT_DATA_SOURCE_ID) {
        return json({ error: "Open Studio intake is not configured yet." }, 503);
      }

      let body: {
        parentName?: string;
        phone?: string;
        childName?: string;
        ageStage?: string;
        passType?: string;
      };

      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid request." }, 400);
      }

      const parentName = body.parentName?.trim();
      const phone = body.phone?.trim();
      const childName = body.childName?.trim() || "";
      const ageStage = body.ageStage?.trim();
      const passType = body.passType?.trim();

      if (!parentName || !phone || !ageStage || !passType) {
        return json({ error: "Please complete the required fields." }, 400);
      }

      if (!allowedPasses.has(passType)) {
        return json({ error: "Invalid pass type." }, 400);
      }

      const note = [
        "Source: pino-web",
        "Open Studio interest",
        `Pass: ${passType}`,
        `Age stage: ${ageStage}`,
        childName ? `Child: ${childName}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const notionResponse = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.NOTION_TOKEN}`,
          "Content-Type": "application/json",
          "Notion-Version": "2026-03-11",
        },
        body: JSON.stringify({
          parent: {
            data_source_id: env.NOTION_PARENT_DATA_SOURCE_ID,
          },
          properties: {
            Name: {
              title: [{ text: { content: parentName } }],
            },
            Mobile: {
              phone_number: phone,
            },
            Note: {
              rich_text: [{ text: { content: note } }],
            },
          },
        }),
      });

      if (!notionResponse.ok) {
        const detail = await notionResponse.text();
        console.error("Notion create page failed", detail);
        return json({ error: "We could not save your request. Please try again." }, 502);
      }

      const created = await notionResponse.json() as { id?: string };
      return json({ ok: true, id: created.id });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
