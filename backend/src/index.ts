import express from "express";
import dotenv from "dotenv";
import { OpenAIService } from "./services/openai";
import { subjects, Subject } from "./types/subject";

dotenv.config();

const app = express();
app.use(express.json());

const openAIService = new OpenAIService();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
