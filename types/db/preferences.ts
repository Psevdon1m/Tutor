export interface UserPreferences {
  user_id: string;
  subjects: string[];
  notification_frequency: number;
  created_at?: string;
  updated_at?: string;
}
