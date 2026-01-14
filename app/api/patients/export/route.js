import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { connectToDatabase } from "@/lib/db";
import Assessment from "@/models/Assessment";
import { getUserFromRequest } from "@/lib/auth";

export async function GET() {
  const user = await getUserFromRequest();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const query = user.role === "admin" ? {} : { createdBy: user.id };
  const assessments = await Assessment.find(query).lean();
  const rows = assessments.map((a) => ({
    Camp: a.campName,
    Patient: a.patientName,
    Age: a.age,
    Gender: a.gender,
    HeightCm: a.heightCm,
    WeightKg: a.weightKg,
    MUACCm: a.muacCm,
    CreatedAt: a.createdAt,
    ...Object.fromEntries(
      (a.mentalHealth || []).map((q) => [`Q_${q.key || q.question}`, q.response])
    ),
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Assessments");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="assessments.xlsx"',
    },
  });
}
