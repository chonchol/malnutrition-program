import whoLms from "@/data/who-bmi-lms.json";

export function calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm) return null;
    const h = heightCm / 100;
    return +(weightKg / (h * h)).toFixed(2);
}

export function calculateBMIZScore({ bmi, ageMonths, gender }) {
    console.log("Calculating Z-Score for BMI:", bmi, "Age (months):", ageMonths, "Gender    :", gender);
    const sex = gender.toLowerCase();
    const lms = whoLms[sex]?.[ageMonths];

    if (!lms) return null;

    const { L, M, S } = lms;
    const z = (Math.pow(bmi / M, L) - 1) / (L * S);
    return +z.toFixed(2);
}

export function getBMICategory(z) {
    if (z === null) return "Unknown";
    if (z < -3) return "Severe Thinness";
    if (z < -2) return "Thinness";
    if (z <= 1) return "Normal";
    if (z <= 2) return "Overweight";
    return "Obese";
}