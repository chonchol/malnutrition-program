import mongoose from "mongoose";

const MentalResponseSchema = new mongoose.Schema(
  {
    key: String,
    question: String,
    response: { type: String, enum: ["Never", "Sometimes", "Often", "Always", "Yes", "No", "Talk to family or friends", "Cry or get angry", "Spend time alone", "Use substances (e.g., cigarettes, alcohol, drugs)"] },
  },
  { _id: false }
);

const NutritionalSupplementSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "Cerelac (Rice and Milk)",
        "Cerelac (5 fruits, Multigrain & Milk)",
        "Junior Horlicks",
        "Peanut Butter",
        "Peanut Bar",
      ],
    },
    quantity: Number,
    unit: {
      type: String,
      enum: ["Spoon", "Piece"],
    },
  },
  { _id: false }
);

const AssessmentSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    surveyType: { type: String, enum: ["new", "followup"], default: "" },
    surveyStatus: { type: String, enum: ["malnutrition", "mentalhealth", ""], default: "" },
    nirogId: { type: String, default: "" },
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
    nutritionalSupplements: [NutritionalSupplementSchema],
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
