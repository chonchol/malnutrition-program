import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Assessment from "@/models/Assessment";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  const user = await getUserFromRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const payload = await req.json();
    const items = Array.isArray(payload?.assessments) ? payload.assessments : [];
    if (!items.length) {
      return NextResponse.json({ count: 0 });
    }
    await connectToDatabase();
    const docs = items.map((item) => ({ ...item, createdBy: user.id }));
    const res = await Assessment.insertMany(docs);
    return NextResponse.json({ count: res.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Bulk save failed" }, { status: 500 });
  }
}
