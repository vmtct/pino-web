interface MemberEnv {
  NOTION_TOKEN: string;
  NOTION_PARENT_DATA_SOURCE_ID: string;
  NOTION_STUDENT_DATA_SOURCE_ID: string;
  NOTION_OS_PASS_DATA_SOURCE_ID: string;
  NOTION_OS_BOOKING_DATA_SOURCE_ID: string;
}

const notionHeaders = (env: MemberEnv) => ({
  Authorization: `Bearer ${env.NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2026-03-11",
});

const normalizePhone = (value: string) =>
  value.replace(/\D/g, "").replace(/^84(?=0)/, "0");

const propText = (p: any) =>
  p?.title?.[0]?.plain_text ||
  p?.rich_text?.[0]?.plain_text ||
  p?.select?.name ||
  "";

const propDate = (p: any) => p?.date?.start || null;

const propRelationIds = (p: any): string[] =>
  p?.relation?.map((r: any) => r.id).filter(Boolean) || [];

async function notionQuery(env: MemberEnv, dataSourceId: string, filter: unknown) {
  return fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: "POST",
    headers: notionHeaders(env),
    body: JSON.stringify({ filter }),
  });
}

async function findParent(env: MemberEnv, phone: string) {
  const normalized = normalizePhone(phone);
  const response = await notionQuery(env, env.NOTION_PARENT_DATA_SOURCE_ID, {
    property: "Phone Normalized",
    rich_text: { equals: normalized },
  });

  if (!response.ok) {
    return {
      ok: false as const,
      status: 502,
      error: "Could not resolve member.",
      notionStatus: response.status,
    };
  }

  const data = (await response.json()) as { results?: any[] };
  if ((data.results?.length || 0) === 0) {
    return { ok: false as const, status: 404, error: "Member not found." };
  }
  if ((data.results?.length || 0) > 1) {
    return { ok: false as const, status: 409, error: "Multiple members found for this phone." };
  }

  const page = data.results![0];
  return {
    ok: true as const,
    parentId: page.id,
    member: {
      id: page.id,
      name: propText(page.properties?.Name) || "Member",
      phone: propText(page.properties?.["Phone Normalized"]) || normalized,
    },
  };
}

export async function getMember(env: MemberEnv, phone: string) {
  const identity = await findParent(env, phone);
  if (!identity.ok) return identity;

  const studentsResponse = await notionQuery(
    env,
    env.NOTION_STUDENT_DATA_SOURCE_ID,
    { property: "Parents ", relation: { contains: identity.parentId } },
  );
  if (!studentsResponse.ok) {
    return {
      ok: false as const,
      status: 502,
      error: "Could not load member students.",
      notionStatus: studentsResponse.status,
    };
  }

  const studentsData = (await studentsResponse.json()) as { results?: any[] };
  const students = (studentsData.results || []).map((page) => ({
    id: page.id,
    name: propText(page.properties?.["Student Name"]) || "Student",
  }));

  const passes: any[] = [];
  const bookings: any[] = [];

  for (const student of students) {
    const [passesResponse, bookingsResponse] = await Promise.all([
      notionQuery(env, env.NOTION_OS_PASS_DATA_SOURCE_ID, {
        property: "Student",
        relation: { contains: student.id },
      }),
      notionQuery(env, env.NOTION_OS_BOOKING_DATA_SOURCE_ID, {
        property: "Student",
        relation: { contains: student.id },
      }),
    ]);

    if (!passesResponse.ok) {
      return {
        ok: false as const,
        status: 502,
        error: "Could not load member passes.",
        notionStatus: passesResponse.status,
      };
    }
    if (!bookingsResponse.ok) {
      return {
        ok: false as const,
        status: 502,
        error: "Could not load member bookings.",
        notionStatus: bookingsResponse.status,
      };
    }

    const passData = (await passesResponse.json()) as { results?: any[] };
    for (const page of passData.results || []) {
      passes.push({
        id: page.id,
        studentId: student.id,
        studentName: student.name,
        name: propText(page.properties?.Name),
        type: page.properties?.["Pass Type"]?.select?.name || null,
        status: page.properties?.Status?.select?.name || null,
        month: propDate(page.properties?.Month),
        validUntil: propDate(page.properties?.["Valid Until"]),
      });
    }

    const bookingData = (await bookingsResponse.json()) as { results?: any[] };
    for (const page of bookingData.results || []) {
      bookings.push({
        id: page.id,
        studentId: student.id,
        studentName: student.name,
        name: propText(page.properties?.Name),
        status: page.properties?.Status?.select?.name || null,
        sessionId: propRelationIds(page.properties?.["OS Session"])[0] || null,
        passId: propRelationIds(page.properties?.["OS Pass"])[0] || null,
      });
    }
  }

  return {
    ok: true as const,
    member: identity.member,
    students,
    passes,
    bookings,
  };
}
