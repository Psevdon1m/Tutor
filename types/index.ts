export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
}

export interface UserPreferences {
  userId: string;
  subjects: string[];
  notificationFrequency: "hourly" | "daily" | "weekly";
}

export interface Question {
  id: string;
  subjectId: string;
  question: string;
  answer: string;
  created_at: string;
}
