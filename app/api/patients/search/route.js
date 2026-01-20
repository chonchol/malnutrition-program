import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Assessment from "@/models/Assessment";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        // Check authentication
        const user = await getUserFromRequest();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const nirogId = searchParams.get("nirogId");

        if (!nirogId) {
            return NextResponse.json(
                { error: "NIROG ID is required" },
                { status: 400 }
            );
        }

        // Find the most recent assessment for this NIROG ID
        // Admin users can see all records, regular users can only see their own
        const query = user.role === "admin" ? { nirogId } : { nirogId, createdBy: user.id };
        const assessment = await Assessment.findOne(query)
            .sort({ createdAt: -1 })
            .lean();

        if (!assessment) {
            return NextResponse.json(
                { found: false, message: "No previous records found" },
                { status: 200 }
            );
        }

        // Return the assessment data that should be auto-populated
        return NextResponse.json(
            {
                found: true,
                data: {
                    campName: assessment.campName,
                    patientName: assessment.patientName,
                    age: assessment.age,
                    gender: assessment.gender,
                    address: assessment.address,
                    schoolStatus: assessment.schoolStatus,
                    campStayYears: assessment.campStayYears,
                    livesWithParents: assessment.livesWithParents,
                    familySize: assessment.familySize,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Search patient error:", error);
        return NextResponse.json(
            { error: "Failed to search patient" },
            { status: 500 }
        );
    }
}
