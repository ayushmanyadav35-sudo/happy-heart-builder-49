export const UNIVERSITIES = [
  "AKTU (Dr. A.P.J. Abdul Kalam Technical University)",
  "GGSIPU",
  "RGPV",
  "VTU",
  "MAKAUT",
  "Other",
];

export const BRANCHES = [
  { code: "CSE", label: "Computer Science & Engineering" },
  { code: "IT", label: "Information Technology" },
  { code: "ECE", label: "Electronics & Communication" },
  { code: "EE", label: "Electrical Engineering" },
  { code: "ME", label: "Mechanical Engineering" },
  { code: "CE", label: "Civil Engineering" },
  { code: "AIML", label: "AI & Machine Learning" },
];

export const YEARS = [1, 2, 3, 4];

export function semestersForYear(year: number) {
  return [year * 2 - 1, year * 2];
}

export const PRIORITY_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const NOTE_TYPES = [
  { value: "handwritten", label: "Handwritten" },
  { value: "short_notes", label: "Short Notes" },
  { value: "formulas", label: "Formulas" },
  { value: "diagrams", label: "Diagrams" },
  { value: "definitions", label: "Definitions" },
  { value: "qna", label: "Exam Q&A" },
];

export function daysUntil(dateISO: string | null | undefined) {
  if (!dateISO) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateISO + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}
