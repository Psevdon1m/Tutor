import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { OpenAIService } from "./services/openai";
import { SchedulerService } from "./services/scheduler";
import { subjects, Subject } from "./types/subject";
import cron from "node-cron";

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || [
    "http://localhost:3000",
    "http://localhost:3001",
  ],
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

// Set up the scheduler
// schedulerService.setupSchedules();

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
app.post("/api/trigger-notifications", async (req, res) => {
  try {
    const { userPref } = req.body;

    // Get private instance of scheduler for manual triggering
    const scheduler = new SchedulerService();
    scheduler["processUserNotification"](userPref);

    res.json({ message: "Notifications triggered successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to validate time format
function isValidTime(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
}

// Helper function to convert time to cron expression
function timeToCronExpression(time: string): string {
  const [hours, minutes] = time.split(":");
  // Ensure hours and minutes are properly padded
  const cronExp = `${parseInt(minutes)} ${parseInt(hours)} * * *`;
  console.log(`Creating cron expression for ${time} -> ${cronExp}`);
  return cronExp;
}

// New endpoint to set up a daily cron job for notifications
app.post("/api/test-cron-notification", async (req, res) => {
  try {
    const { time, user_id: userId, jobId = "default" } = req.body;

    // Validate time format (HH:mm)
    if (!time || !isValidTime(time)) {
      return res.status(400).json({
        error:
          "Invalid time format. Please provide time in HH:mm format (24-hour)",
      });
    }

    // Stop existing cron job with the same ID if it exists
    if (activeCronJobs.has(jobId)) {
      activeCronJobs.get(jobId)?.job.stop();
      activeCronJobs.delete(jobId);
      console.log(`Stopped existing cron job: ${jobId}`);
    }

    // Create the cron expression for the specified time
    const cronExpression = timeToCronExpression(time);
    console.log(
      `Setting up cron job ${jobId} with expression: ${cronExpression}`
    );

    // Set up the cron job
    const job = cron.schedule(
      cronExpression,
      async () => {
        console.log(
          `Executing cron job ${jobId} at ${new Date().toISOString()}`
        );
        try {
          // Get user preferences if userId is provided
          let userQuery = schedulerService["supabase"]
            .from("user_preferences")
            .select("*")
            .not("fcm_token", "is", null);

          if (userId) {
            userQuery = userQuery.eq("user_id", userId);
          }

          const { data: userPreferences, error: userError } = await userQuery;

          if (userError) {
            console.error(`Cron job ${jobId} error:`, userError);
            return;
          }

          if (!userPreferences || userPreferences.length === 0) {
            console.log(`Cron job ${jobId}: No eligible users found`);
            return;
          }

          console.log(`Found ${userPreferences.length} users to notify`);

          // Process notifications for found users in parallel
          await Promise.all(
            userPreferences.map(async (userPref: any) => {
              try {
                await schedulerService["processUserNotification"](userPref);
                console.log(
                  `Cron job ${jobId}: Processed notification for user ${userPref.user_id}`
                );
              } catch (error) {
                console.error(
                  `Cron job ${jobId}: Error processing user ${userPref.user_id}:`,
                  error
                );
              }
            })
          );
        } catch (error) {
          console.error(`Cron job ${jobId} execution error:`, error);
        }
      },
      {
        scheduled: true,
        timezone: "UTC", // Explicitly set timezone to UTC
      }
    );

    // Store the job with its time
    activeCronJobs.set(jobId, { job, time });

    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(
      parseInt(time.split(":")[0]),
      parseInt(time.split(":")[1]),
      0,
      0
    );
    if (nextRun < now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    res.json({
      message: "Cron job scheduled successfully",
      details: {
        jobId,
        time,
        cronExpression,
        userId: userId || "all users",
        scheduledTime: time,
        currentServerTime: now.toISOString(),
        nextExpectedRun: nextRun.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Endpoint to list all active cron jobs
app.get("/api/cron-jobs", (req, res) => {
  const jobs = Array.from(activeCronJobs.entries()).map(([jobId, data]) => ({
    jobId,
    scheduledTime: data.time,
  }));
  res.json(jobs);
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
      case 3: // Three times a day
        schedules.push(
          { time: "10:40", label: "morning" },
          { time: "11:00", label: "afternoon" },
          { time: "11:25", label: "evening" }
        );
        break;
      case 2: // Twice a day
        schedules.push(
          { time: "10:40", label: "morning" },
          { time: "11:00", label: "afternoon" }
        );
        break;
      case 1: // Once a day
        schedules.push({ time: "10:40", label: "morning" });
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
