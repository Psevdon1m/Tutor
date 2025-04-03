const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");
const { Subject } = require("../types/subject");

// Define the types
interface UserPreference {
  user_id: string;
  subjects: string[];
  notification_frequency: 1 | 2 | 3;
  fcm_token: string | null;
  recent_subjects: string[];
  last_subject_update: string;
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

    this.apiBaseUrl =
      process.env.API_BASE_URL || "https://tutor-backend-9s28.onrender.com";
  }

  // Schedule all notifications
  public setupSchedules() {
    // Morning schedule - 8 AM UTC (all frequencies)
    cron.schedule("0 8 * * *", () => {
      // Get all users with any notification frequency (1, 2, or 3)
      this.processNotificationsForTime("morning");
    });

    // Afternoon schedule - 12 PM UTC (only frequencies 2 and 3)
    cron.schedule("9 15 * * *", () => {
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

      // Use the new subject selection method
      const subjectId = await this.selectSubject(userPref);

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
          body: JSON.stringify({
            subject:
              subjectData.name === "Українська"
                ? "Ukrainian"
                : subjectData.name,
          }),
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
        `Practicing ${subjectData.name}`,
        `${questionData.question.substring(0, 100)}...`,
        {
          question_id: savedQuestion.id,
          subject: subjectData.name,
        },
        savedQuestion.id
      );

      // After successful notification, update history if needed
      await this.supabase
        .from("user_preferences")
        .update({
          last_subject_update: new Date().toISOString(),
          recent_subjects: [...userPref.recent_subjects, subjectId],
        })
        .eq("user_id", userPref.user_id);

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
    data: any,
    questionId: string
  ) {
    try {
      // Get OAuth 2.0 access token - this requires setting up Google Application Default Credentials
      const accessToken = await this.getAccessToken();

      // Make sure the question_id is included in data
      // The data needs to be all strings for FCM
      const notificationData = this.transformData({
        ...data,
        question_id: data.question_id,
        click_action: "OPEN_QUESTION_DETAIL", // This helps with intent filtering
      });

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
              token: token,
              notification: {
                title,
                body,
              },
              // Include data for both Android and Web
              data: notificationData,
              // For iOS, we need to add the content_available flag
              apns: {
                payload: {
                  aps: {
                    "content-available": 1,
                    "mutable-content": 1,
                    category: "QUESTION_NOTIFICATION",
                  },
                  // Also include the data in the APNS payload
                  ...notificationData,
                },
              },
              // For Android
              android: {
                priority: "high",
                notification: {
                  click_action: "OPEN_QUESTION_DETAIL",
                },
              },
              // Add a web specific object
              webpush: {
                fcm_options: {
                  link: `/Tutor/questions/${data.question_id}`,
                },
              },
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
    const { GoogleAuth } = require("google-auth-library");

    try {
      let credentials;
      if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
        try {
          credentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
        } catch (parseError) {
          console.error(
            "Error parsing FIREBASE_ADMIN_CREDENTIALS:",
            parseError
          );

          throw new Error("Invalid Firebase credentials format");
        }
      }

      const auth = new GoogleAuth({
        credentials: credentials,
        scopes: "https://www.googleapis.com/auth/firebase.messaging",
      });

      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();
      return accessToken.token;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw error;
    }
  }

  private async selectSubject(userPref: UserPreference): Promise<string> {
    // Get all user's subjects
    const availableSubjects = userPref.subjects || [];

    if (availableSubjects.length === 0) {
      throw new Error("No subjects available for user");
    }

    if (availableSubjects.length === 1) {
      return availableSubjects[0]; // Only one option
    }

    // Get history of subjects used for this user in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentSubjects } = await this.supabase
      .from("questions")
      .select("subject_id, created_at")
      .eq("user_id", userPref.user_id)
      .gte("created_at", yesterday.toISOString())
      .order("created_at", { ascending: false });

    // If no history or all subjects have been used, reset weights
    if (!recentSubjects || recentSubjects.length === 0) {
      return this.getRandomElement(availableSubjects);
    }

    // If we've used all subjects today, prioritize the least recently used
    if (recentSubjects.length >= availableSubjects.length) {
      // Sort subjects by how recently they were used
      const subjectFrequency: Record<string, number> = {};
      recentSubjects.forEach((item: { subject_id: string }) => {
        subjectFrequency[item.subject_id] =
          (subjectFrequency[item.subject_id] || 0) + 1;
      });

      // Find least used subject
      const subjectsSortedByUsage = availableSubjects.sort(
        (a, b) => (subjectFrequency[a] || 0) - (subjectFrequency[b] || 0)
      );

      return subjectsSortedByUsage[0];
    }

    // Get subjects not used today
    const usedSubjectIds = new Set(
      recentSubjects.map((item: { subject_id: string }) => item.subject_id)
    );
    const unusedSubjects = availableSubjects.filter(
      (id) => !usedSubjectIds.has(id)
    );

    // Pick randomly from unused subjects
    if (unusedSubjects.length > 0) {
      return this.getRandomElement(unusedSubjects);
    }

    // Fallback to completely random if something went wrong
    return this.getRandomElement(availableSubjects);
  }

  // Helper method for random selection
  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
