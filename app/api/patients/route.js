import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Assessment from "@/models/Assessment";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getUserFromRequest();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const query = user.role === "admin" ? {} : { createdBy: user.id };
  const assessments = await Assessment.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("createdBy", "name")
    .lean();
  return NextResponse.json({ assessments });
}

export async function POST(req) {
  const user = await getUserFromRequest();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const data = await req.json();
    // console.log("Received data:", data);
    await connectToDatabase();
    const doc = await Assessment.create({ ...data, createdBy: user.id });
    // console.log("Saved document:", doc);
    return NextResponse.json({ assessment: doc });
  } catch (error) {
    // console.error("Error saving assessment:", error);
    return NextResponse.json(
      { error: "Unable to save", details: error.message },
      { status: 500 }
    );
  }
}
