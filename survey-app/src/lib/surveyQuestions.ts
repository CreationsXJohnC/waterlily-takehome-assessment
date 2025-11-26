export type ChoiceQuestion = {
  id: number;
  label: string;
  type: "choice";
  required: boolean;
  options: string[];
};

export type InputQuestion = {
  id: number;
  label: string;
  type: "text" | "number" | "email";
  required: boolean;
};

export type Question = ChoiceQuestion | InputQuestion;

export const QUESTIONS: Question[] = [
  { id: 1, label: "What is your ethnicity or racial background?", type: "text", required: true },
  { id: 2, label: "What is your age range?", type: "choice", required: true, options: ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"] },
  { id: 3, label: "What is your weight in pounds (lbs)?", type: "number", required: true },
  { id: 4, label: "Do you have a history of any diagnosed illnesses or diseases? Please list below, if so.", type: "text", required: false },
  { id: 5, label: "Are you currently on any medication?", type: "choice", required: true, options: ["Yes", "No"] },
  { id: 6, label: "What was your annual income last year (USD $)?", type: "number", required: false },
  { id: 7, label: "Do you currently have any form of medical insurance?", type: "choice", required: true, options: ["Yes", "No"] },
];