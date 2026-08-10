type AssetFetcher = {
  fetch(request: Request): Promise<Response>;
};

interface Env {
  ASSETS: AssetFetcher;
  NOTION_TOKEN: string;
  NOTION_PARENT_DATA_SOURCE_ID: string;
  NOTION_STUDENT_DATA_SOURCE_ID: string;
  NOTION_OS_PASS_DATA_SOURCE_ID: string;
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

const allowedPasses = [
  "Piano",
  "Art",
  "Little Piner",
  "Bring-a-Friend",
] as const;

type PassType = (typeof allowedPasses)[number];

const notionHeaders = (env: Env) => ({
  Authorization: `Bearer ${env.NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2026-03-11",
});

async function notionCreatePage(env: Env, parent: Record<string, string>, properties: Record<string, unknown>) {
  return fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(env),
    body: JSON.stringify({ parent, properties }),
  });
}

async function notionQuery(env: Env, dataSourceId: string, filter: unknown) {
  return fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: "POST",
    headers: notionHeaders(env),
    body: JSON.stringify({ filter }),
  });
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/api/open-studio/interest") {
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
      const passType = body.passType?.trim() as PassType | undefined;

      if (!parentName || !phone || !ageStage || !passType) {
        return json({ error: "Please complete the required fields." }, 400);
      }

      if (!allowedPasses.includes(passType)) {
        return json({ error: "Invalid pass type." }, 400);
      }

      const note = [
        "Source: pino-web",
        "Open Studio interest",
        `Pass: ${passType}`,
        `Age stage: ${ageStage}`,
        childName ? `Child: ${childName}` : "",
      ].filter(Boolean).join("\n");

      const notionResponse = await notionCreatePage(env, {
        data_source_id: env.NOTION_PARENT_DATA_SOURCE_ID,
      }, {
        Name: { title: [{ text: { content: parentName } }] },
        Mobile: { phone_number: phone },
        Note: { rich_text: [{ text: { content: note } }] },
        "Lead Source": { select: { name: "pino.cantho.center" } },
      });

      if (!notionResponse.ok) {
        const detail = await notionResponse.text();
        console.error("Notion create parent failed", notionResponse.status, detail);
        return json({ error: "Notion rejected the request.", notionStatus: notionResponse.status, detail: detail.slice(0, 1000) }, 502);
      }

      const created = (await notionResponse.json()) as { id?: string };
      return json({ ok: true, parentId: created.id });
    }

    if (url.pathname === "/api/passes/issue") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      if (!env.NOTION_TOKEN || !env.NOTION_STUDENT_DATA_SOURCE_ID || !env.NOTION_OS_PASS_DATA_SOURCE_ID) {
        return json({ error: "Pass engine is not configured yet." }, 503);
      }

      let body: { studentId?: string; subscriptionId?: string; month?: string };
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid request." }, 400);
      }

      const studentId = body.studentId?.trim();
      const subscriptionId = body.subscriptionId?.trim();
      const month = body.month?.trim() || new Date().toISOString().slice(0, 7) + "-01";

      if (!studentId) return json({ error: "studentId is required." }, 400);

      // Idempotency: don't issue a second set for the same student/month.
      const existingResponse = await notionQuery(env, env.NOTION_OS_PASS_DATA_SOURCE_ID, {
        and: [
          { property: "Student", relation: { contains: studentId } },
          { property: "Month", date: { on_or_after: month } },
          { property: "Month", date: { before: new Date(new Date(month).setMonth(new Date(month).getMonth() + 1)).toISOString().slice(0, 10) } },
        ],
      });

      if (!existingResponse.ok) {
        const detail = await existingResponse.text();
        console.error("Notion query passes failed", existingResponse.status, detail);
        return json({ error: "Could not check existing passes.", notionStatus: existingResponse.status, detail: detail.slice(0, 1000) }, 502);
      }

      const existing = await existingResponse.json() as { results?: Array<{ id: string }> };
      if ((existing.results?.length || 0) > 0) {
        return json({ ok: true, alreadyIssued: true, passCount: existing.results?.length || 0 });
      }

      const createdIds: string[] = [];
      for (const type of allowedPasses) {
        const response = await notionCreatePage(env, {
          data_source_id: env.NOTION_OS_PASS_DATA_SOURCE_ID,
        }, {
          Name: { title: [{ text: { content: `${type} · ${month}` } }] },
          Student: { relation: [{ id: studentId }] },
          ...(subscriptionId ? { Subscription: { relation: [{ id: subscriptionId }] } } : {}),
          "Pass Type": { select: { name: type } },
          Status: { select: { name: "Available" } },
          Month: { date: { start: month } },
        });

        if (!response.ok) {
          const detail = await response.text();
          console.error("Notion create pass failed", response.status, detail);
          return json({ error: "Could not issue passes.", notionStatus: response.status, detail: detail.slice(0, 1000), createdIds }, 502);
        }

        const created = await response.json() as { id?: string };
        if (created.id) createdIds.push(created.id);
      }

      return json({ ok: true, alreadyIssued: false, passCount: createdIds.length, passIds: createdIds });
    }

    return env.ASSETS.fetch(request);
  },
};

export default worker;
