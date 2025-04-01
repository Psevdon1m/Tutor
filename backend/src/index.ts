import express from "express";
import dotenv from "dotenv";
import { OpenAIService } from "./services/openai";
import { SchedulerService } from "./services/scheduler";
import { subjects, Subject } from "./types/subject";
import cron from "node-cron";

dotenv.config();

const app = express();
app.use(express.json());

const openAIService = new OpenAIService();
const schedulerService = new SchedulerService();

// Store active cron jobs with their scheduled times
const activeCronJobs = new Map<
  string,
  { job: cron.ScheduledTask; time: string }
>();

// Set up the scheduler
schedulerService.setupSchedules();

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
    const { time, userId, jobId = "default" } = req.body;

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
            userPreferences.map(async (userPref) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
