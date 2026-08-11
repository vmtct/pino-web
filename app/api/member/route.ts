import { NextRequest, NextResponse } from "next/server";

// Member API is intentionally thin. Production authentication remains phone-only for this MVP;
// the canonical lookup/authorization logic should be moved into the Worker once the member flow is wired there.
export async function POST(request: NextRequest) {
  return NextResponse.json({ ok: false, error: "Member API is not connected to the Worker yet." }, { status: 501 });
}
