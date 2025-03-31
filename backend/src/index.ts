import express from "express";
import dotenv from "dotenv";
import { OpenAIService } from "./services/openai";
import { SchedulerService } from "./services/scheduler";
import { subjects, Subject } from "./types/subject";

dotenv.config();

const app = express();
app.use(express.json());

const openAIService = new OpenAIService();
const schedulerService = new SchedulerService();

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

    // if (!frequency) {
    //   return res.status(400).json({
    //     error: "Invalid frequency. Provide a frequency value.",
    //   });
    // }

    // Get private instance of scheduler for manual triggering
    const scheduler = new SchedulerService();
    scheduler["processUserNotification"](userPref);

    res.json({ message: "Notifications triggered successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
