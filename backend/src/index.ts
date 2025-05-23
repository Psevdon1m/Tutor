import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { OpenAIService } from "./services/openai";
import { SchedulerService } from "./services/scheduler";
import { subjects, Subject } from "./types/subject";
import cron from "node-cron";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean); // filter(Boolean) removes any undefined/null values

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

const openAIService = new OpenAIService();
const schedulerService = new SchedulerService();

// Store active cron jobs with their scheduled times
const activeCronJobs = new Map<
  string,
  { job: cron.ScheduledTask; time: string }
>();


// Test endpoint to generate a question for a specific subject
app.post("/api/generate-question", async (req, res) => {
  try {
    const { subject } = req.body;

    if (!subjects.includes(subject)) {
      return res.status(400).json({ error: "Invalid subject" });
    }

    const result = await openAIService.generateQuestion(subject as Subject);
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// API endpoint to manually trigger notifications for testing
app.post("/api/pre-generate-response-from-openai", async (req, res) => {
  try {
    const { subject_id, subject, user_id } = req.body;

    const pregeneratedQuestions = await schedulerService["supabase"]
      .from("pregenerated_questions")
      .select("*")
      .eq("subject_id", subject_id)
      .eq("user_id", user_id);

    if (pregeneratedQuestions.data && pregeneratedQuestions.data.length > 0) {
      return res.json({
        message: "Response already generated",
        result: pregeneratedQuestions.data[0],
      });
    }

    const result = await openAIService.generateQuestion(subject as Subject);
    await schedulerService["supabase"].from("pregenerated_questions").insert({
      subject_id,
      user_id,
      question_text: result.question,
      answer_text: result.answer,
      response_id: result.response_id,
    });

    res.json({ message: "Response generated successfully", result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Endpoint to update user's notification schedule
app.post("/api/update-notification-schedule", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: "user_id is required",
      });
    }

    const result = await setupUserNotificationSchedule(user_id);

    if (!result) {
      return res.status(404).json({
        error: "Failed to set up user notification schedule",
      });
    }

    res.json({
      message: "Notification schedule updated successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error updating notification schedule:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// api to send first notification after user selected subjects
app.post("/api/require-first-notification", async (req, res) => {
  try {
    const { user_id: userId } = req.body;

    // Send response immediately to client
    res.json({
      message: "Notification will be sent shortly",
      details: {
        userId,
        scheduledTime: new Date(Date.now() + 2000).toISOString(), // 2 seconds from now
      },
    });

    try {
      // Get user preferences
      const { data: userPreferences, error: userError } =
        await schedulerService["supabase"]
          .from("user_preferences")
          .select("*")
          .not("fcm_token", "is", null)
          .eq("user_id", userId)
          .single();

      if (userError) {
        console.error(`Error fetching user preferences:`, userError);
        return;
      }

      if (!userPreferences) {
        console.log(`No eligible user found for ID: ${userId}`);
        return;
      }

      // Process the notification
      await schedulerService["processUserNotification"](userPreferences);
      console.log(`Processed first notification for user ${userId}`);
    } catch (error) {
      console.error(
        `Error processing first notification for user ${userId}:`,
        error
      );
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Endpoint to stop a specific cron job
app.delete("/api/cron-jobs/:jobId", (req, res) => {
  const { jobId } = req.params;

  if (activeCronJobs.has(jobId)) {
    activeCronJobs.get(jobId)?.job.stop();
    activeCronJobs.delete(jobId);
    res.json({ message: `Cron job ${jobId} stopped and removed` });
  } else {
    res.status(404).json({ error: `Cron job ${jobId} not found` });
  }
});

// Helper function to validate time format
function isValidTime(time: string): boolean {
  // Accept both HH:mm and HH:mm:ss formats
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/;
  return timeRegex.test(time);
}

// Helper function to convert time to cron expression
function timeToCronExpression(time: string): string {
  // Split time into components
  const parts = time.split(":");
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parts.length === 3 ? parseInt(parts[2]) : 0;

  // Create cron expression with seconds if provided
  const cronExp = `${seconds} ${minutes} ${hours} * * *`;
  console.log(`Creating cron expression for ${time} -> ${cronExp}`);
  return cronExp;
}
// Function to set up user's notification schedule
async function setupUserNotificationSchedule(userId: string) {
  try {
    // Get user preferences from Supabase
    const { data: userPref, error: userError } = await schedulerService[
      "supabase"
    ]
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (userError || !userPref) {
      console.error(`User preferences not found for user ${userId}`);
      return null;
    }

    // Remove existing cron jobs for this user
    const userJobIds = Array.from(activeCronJobs.keys()).filter((key) =>
      key.startsWith(`user_${userId}`)
    );
    userJobIds.forEach((jobId) => {
      activeCronJobs.get(jobId)?.job.stop();
      activeCronJobs.delete(jobId);
    });

    const schedules = [];

    // Set up cron jobs based on notification frequency
    switch (userPref.notification_frequency) {
      case 6: // 6 times a day
        schedules.push(
          { time: "07:00", label: "morning" },
          { time: "09:00", label: "afternoon" },
          { time: "13:00", label: "afternoon2" },
          { time: "15:00", label: "evening" },
          { time: "18:00", label: "evening" }
        );
        break;
      case 4: // 4 times a day
        schedules.push(
          { time: "07:00", label: "morning" },
          { time: "09:00", label: "afternoon" },
          { time: "13:00", label: "afternoon2" },
          { time: "15:00", label: "evening" }
        );
        break;
      case 2: // twice a day
        schedules.push({ time: "07:00", label: "morning" });
        schedules.push({ time: "15:00", label: "evening" });
        break;
      default:
        console.error(`Invalid notification frequency for user ${userId}`);
        return null;
    }

    // Create cron jobs for each schedule
    const createdJobs = schedules.map((schedule) => {
      const jobId = `user_${userId}_${schedule.label}`;
      const cronExpression = timeToCronExpression(schedule.time);

      const job = cron.schedule(
        cronExpression,
        async () => {
          console.log(
            `Executing ${
              schedule.label
            } notification for user ${userId} at ${new Date().toISOString()}`
          );
          try {
            await schedulerService["processUserNotification"](userPref);
          } catch (error) {
            console.error(
              `Error processing ${schedule.label} notification for user ${userId}:`,
              error
            );
          }
        },
        {
          scheduled: true,
          timezone: "UTC",
        }
      );

      activeCronJobs.set(jobId, { job, time: schedule.time });

      return {
        jobId,
        schedule: schedule.label,
        time: schedule.time,
        cronExpression,
      };
    });

    return {
      userId,
      frequency: userPref.notification_frequency,
      schedules: createdJobs,
    };
  } catch (error) {
    console.error("Error setting up user notifications:", error);
    return null;
  }
}

// Initialize all user schedules on server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    // Get all users with notification preferences
    const { data: users, error } = await schedulerService["supabase"]
      .from("user_preferences")
      .select("user_id")
      .not("fcm_token", "is", null);

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    // Set up notifications for each user
    for (const user of users) {
      const result = await setupUserNotificationSchedule(user.user_id);
      if (result) {
        console.log(
          `Successfully set up notifications for user ${user.user_id}`
        );
      }
    }
  } catch (error) {
    console.error("Error initializing notification schedules:", error);
  }
});
