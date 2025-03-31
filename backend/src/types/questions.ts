export interface QuestionAnswer {
  id?: string;
  subject: string;
  question: string;
  answer: string;
  created_at?: string;
  user_id?: string;
  difficulty_level?: "easy" | "medium" | "hard";
}
