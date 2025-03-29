export interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          user_id: string;
          subjects: string[];
          notification_frequency: number;
          created_at: string;
          updated_at: string;
          fcm_token: string;
        };
        Insert: {
          user_id: string;
          subjects: string[];
          notification_frequency: number;
          created_at?: string;
          updated_at?: string;
          fcm_token?: string;
        };
      };
    };
  };
}
