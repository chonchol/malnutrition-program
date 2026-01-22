import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Assessment from "@/models/Assessment";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const user = await getUserFromRequest();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const nirogId = searchParams.get("nirogId");
    const patientId = searchParams.get("id");

    if (!nirogId && !patientId) {
      return NextResponse.json(
        { error: "nirogId or id is required" },
        { status: 400 }
      );
    }

    const query = nirogId
      ? user.role === "admin"
        ? { nirogId }
        : { nirogId, createdBy: user.id }
      : user.role === "admin"
        ? { _id: patientId }
        : { _id: patientId, createdBy: user.id };

    const assessments = await Assessment.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name")
      .lean();
    return NextResponse.json({ assessments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching patient history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
