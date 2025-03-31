import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
import { Subject } from "../types/subject";

// Define the types
interface UserPreference {
  user_id: string;
  subjects: string[];
  notification_frequency: 1 | 2 | 3;
  fcm_token: string | null;
}
interface QnA {
  question: string;
  answer: string;
  response_id: string;
}

export class SchedulerService {
  private supabase;
  private apiBaseUrl: string;

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_KEY as string
    );

    this.apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3001";
  }

  // Schedule all notifications
  public setupSchedules() {
    // Morning schedule - 8 AM UTC (all frequencies)
    cron.schedule("0 8 * * *", () => {
      // Get all users with any notification frequency (1, 2, or 3)
      this.processNotificationsForTime("morning");
    });

    // Afternoon schedule - 12 PM UTC (only frequencies 2 and 3)
    cron.schedule("0 12 * * *", () => {
      // Get only users with frequencies 2 or 3
      this.processNotificationsForTime("afternoon");
    });

    // Evening schedule - 6 PM UTC (only frequency 3)
    cron.schedule("0 18 * * *", () => {
      // Get only users with frequency 3
      this.processNotificationsForTime("evening");
    });

    console.log("Notification schedules set up");
  }

  // New method to process notifications based on time of day
  private async processNotificationsForTime(
    timeOfDay: "morning" | "afternoon" | "evening"
  ) {
    try {
      console.log(`Processing notifications for ${timeOfDay}`);

      // Query based on time of day
      let query = this.supabase
        .from("user_preferences")
        .select("*")
        .not("fcm_token", "is", null);

      if (timeOfDay === "morning") {
        // Morning - all frequencies (1, 2, 3)
        query = query.gte("notification_frequency", 1);
      } else if (timeOfDay === "afternoon") {
        // Afternoon - only frequencies 2 and 3
        query = query.gte("notification_frequency", 2);
      } else if (timeOfDay === "evening") {
        // Evening - only frequency 3
        query = query.eq("notification_frequency", 3);
      }

      const { data: userPreferences, error } = await query;

      if (error) {
        throw error;
      }

      if (!userPreferences || userPreferences.length === 0) {
        console.log(`No users found for ${timeOfDay} notifications`);
        return;
      }

      console.log(
        `Found ${userPreferences.length} users for ${timeOfDay} notification`
      );

      // Process each user
      for (const userPref of userPreferences as UserPreference[]) {
        await this.processUserNotification(userPref);
      }
    } catch (error) {
      console.error(`Error processing ${timeOfDay} notifications:`, error);
    }
  }

  // Process notification for a single user
  private async processUserNotification(userPref: UserPreference) {
    console.log({ userPref });
    try {
      // Skip if no subjects or no FCM token
      if (
        !userPref.subjects ||
        userPref.subjects.length === 0 ||
        !userPref.fcm_token
      ) {
        console.log(
          `Skipping user ${userPref.user_id} - no subjects or FCM token`
        );
        return;
      }

      // Randomly select one subject from the user's preferences
      const randomSubjectIndex = Math.floor(
        Math.random() * userPref.subjects.length
      );
      console.log({ randomSubjectIndex });
      const subjectId = userPref.subjects[randomSubjectIndex];

      // Get the subject name from the subjects table
      const { data: subjectData, error: subjectError } = await this.supabase
        .from("subjects")
        .select("name")
        .eq("id", subjectId)
        .single();

      if (subjectError || !subjectData) {
        console.error(
          `Error fetching subject name for ${subjectId}:`,
          subjectError
        );
        return;
      }

      // Generate question and answer
      const questionResponse = await fetch(
        `${this.apiBaseUrl}/api/generate-question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subject: subjectData.name }),
        }
      );

      if (!questionResponse.ok) {
        console.log(JSON.stringify(questionResponse));
        throw new Error(
          `API request failed with status ${questionResponse.status}`
        );
      }

      const questionData = (await questionResponse.json()) as QnA;

      // Save question and answer to the database
      const { data: savedQuestion, error: saveError } = await this.supabase
        .from("questions")
        .insert({
          user_id: userPref.user_id,
          subject_id: subjectId,
          question_text: questionData.question,
          answer_text: questionData.answer,
          response_id: questionData.response_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      // Send push notification with FCM
      await this.sendPushNotification(
        userPref.fcm_token,
        `New ${subjectData.name} Question`,
        `Time to practice: ${questionData.question.substring(0, 100)}...`,
        {
          question_id: savedQuestion.id,
          subject: subjectData.name,
        }
      );

      console.log(
        `Processed notification for user ${userPref.user_id}, subject: ${subjectData.name}`
      );
    } catch (error) {
      console.error(
        `Error processing notification for user ${userPref.user_id}:`,
        error
      );
    }
  }

  // Send push notification using FCM
  private async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: any
  ) {
    try {
      // Get OAuth 2.0 access token - this requires setting up Google Application Default Credentials
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        "https://fcm.googleapis.com/v1/projects/tutor-bd76b/messages:send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: token, // Use token instead of 'to'
              notification: {
                title,
                body,
              },
              data: this.transformData(data),
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `FCM request failed: ${response.status} - ${errorText}`
        );
      }

      console.log(`Push notification sent to ${token}`);
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }

  // Helper method to transform nested data (if needed)
  private transformData(data: any): Record<string, string> {
    const result: Record<string, string> = {};

    // Convert all values to strings, and handle nested objects
    for (const key in data) {
      if (typeof data[key] === "object") {
        // HTTP v1 API doesn't support nested JSON values, convert to string
        result[key] = JSON.stringify(data[key]);
      } else {
        // Convert all values to strings
        result[key] = String(data[key]);
      }
    }

    return result;
  }

  // Get OAuth access token using Google Application Default Credentials
  private async getAccessToken(): Promise<string> {
    // This is a simple implementation using the google-auth-library package
    // You'll need to add this package to your dependencies
    const { GoogleAuth } = require("google-auth-library");

    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/firebase.messaging",
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
  }
}
