import mongoose from "mongoose";

const MentalResponseSchema = new mongoose.Schema(
  {
    key: String,
    question: String,
    response: { type: String, enum: ["Never", "Sometimes", "Often", "Always"] },
  },
  { _id: false }
);

const AssessmentSchema = new mongoose.Schema(
  {
    campName: { type: String, required: true },
    patientName: { type: String, required: true },
    age: { type: Number, required: true },
    address: { type: String, required: true },
    gender: { type: String, required: true },
    schoolStatus: {
      type: String,
      enum: ["attending", "not_attending"],
    },
    campStayYears: {
      type: Number,
      min: 0,
      max: 10,
    },
    livesWithParents: {
      type: String,
      enum: ["yes", "no"],
    },
    familySize: {
      type: Number,
      min: 1,
    },
    heightCm: Number,
    weightKg: Number,
    muacCm: Number,
    mentalScore: Number,
    mentalRisk: {
      type: String,
      enum: ["low", "moderate", "high"],
    },
    referralOrg: String,
    mentalHealth: [MentalResponseSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Assessment ||
  mongoose.model("Assessment", AssessmentSchema);
