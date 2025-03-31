import OpenAI from "openai";
import { Subject } from "../types/subject";

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private getSystemPrompt(subject: Subject): string {
    const basePrompt = "You are an experienced tutor specializing in";

    const subjectSpecificPrompts: Record<Subject, string> = {
      Ukrainian: `${basePrompt} Ukrainian language. Focus on grammar, vocabulary, and cultural context. Generate questions that help students understand Ukrainian language concepts.`,
      English: `${basePrompt} English language. Focus on grammar, vocabulary, and practical usage. Generate questions that test understanding of English language concepts.`,
      "Node.js": `${basePrompt} Node.js development. Focus on best practices, common patterns, and real-world scenarios. Generate questions about Node.js concepts, APIs, and problem-solving.`,
      TypeScript: `${basePrompt} TypeScript programming. Focus on type system, interfaces, and TypeScript-specific features. Generate questions about TypeScript concepts and practical usage.`,
    };

    return subjectSpecificPrompts[subject];
  }

  async generateQuestion(
    subject: Subject
  ): Promise<{ question: string; answer: string }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(subject),
          },
          {
            role: "user",
            content:
              "Generate a challenging question and its detailed answer. Format the response as JSON with 'question' and 'answer' fields.",
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      if (!result.question || !result.answer) {
        throw new Error("Invalid response format from OpenAI");
      }

      return {
        question: result.question,
        answer: result.answer,
      };
    } catch (error) {
      console.error("Error generating question:", error);
      throw error;
    }
  }
}
