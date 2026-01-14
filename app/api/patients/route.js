import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Assessment from "@/models/Assessment";
import { getUserFromRequest } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const query = user.role === "admin" ? {} : { createdBy: user.id };
  const assessments = await Assessment.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  return NextResponse.json({ assessments });
}

export async function POST(req) {
  const user = await getUserFromRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await req.json();
    await connectToDatabase();
    const doc = await Assessment.create({ ...data, createdBy: user.id });
    return NextResponse.json({ assessment: doc });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to save" }, { status: 500 });
  }
}
