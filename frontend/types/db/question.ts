export type Question = {
  id: string;
  user_id: string;
  response_id: string;
  subject_id: string;
  question_text: string;
  answer_text: string;
  created_at: string;
  updated_at: string;
  difficulty_level: number;
  subject: {
    id: string;
    name: string;
  };
};
