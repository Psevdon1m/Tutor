import OpenAI from "openai";
import { Subject } from "../types/subject";
import { parseResponseJson } from "../utils/json-parser";

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
      Ukrainian: `${basePrompt} Ukrainian language. Focus on purification of vocabulary, grammar, and cultural context that would help students to speak natively Ukrainian and not mix it with russian (known as "russian loanwords", "russianisms" or "Surzhyk"). Generate questions that help students correctly speak Ukrainian using only Ukrainian words and not "russian loanwords", "russianisms" or "Surzhyk".
      Examples of words: 
      wrong - інакший, correct – інший;
      wrong - получати, correct – отримувати;
      wrong - хотя, correct – хоча;
      wrong - помниш, correct – пам'ятаєш;
      wrong - підстроюватися, correct – підлаштовуватися;
      wrong - все рівно, correct – все одно.
       Both question and answer should be in Ukrainian. 
      Answers should be concise with an example of usage of the word in context without any additional comments about why it is important to use Ukrainian words and not russian or Surzhyk. `,
      English: `${basePrompt} English language. Focus on purification of vocabulary, grammar, and practical usage. Generate questions that test understanding of English language concepts. Both question and answer should be in English.`,
      "Node.js": `${basePrompt} Node.js development. Focus on best practices, common patterns, and real-world scenarios. Generate questions about Node.js concepts, APIs, and problem-solving. Both question and answer should be in English.`,
      TypeScript: `${basePrompt} TypeScript programming. Focus on type system, interfaces, and TypeScript-specific features. Generate questions about TypeScript concepts and practical usage. Both question and answer should be in English.`,
    };

    return subjectSpecificPrompts[subject];
  }

  async generateQuestion(
    subject: Subject,
    previous_response_id?: string
  ): Promise<{ question: string; answer: string; response_id: string }> {
    try {
      // Create the input messages
      const input = [
        {
          role: "system",
          content: this.getSystemPrompt(subject),
        },
        {
          role: "user",
          content:
            "Generate a challenging question and its detailed answer. The response MUST be valid JSON with exactly two fields: 'question' and 'answer'.",
        },
      ];

      // Create the API call parameters
      const params: any = {
        model: "gpt-4o",
        input,
      };

      // Add previous_response_id if provided
      if (previous_response_id) {
        params.previous_response_id = previous_response_id;
      }

      // Make the API call
      const response = await this.openai.responses.create(params);

      // Process the response

      const messageContent = response.output_text || "{}";

      const result = parseResponseJson(messageContent);

      if (!result.question || !result.answer) {
        throw new Error("Invalid response format from OpenAI");
      }

      return {
        question: result.question,
        answer: result.answer,
        response_id: response.id,
      };
    } catch (error) {
      console.error("Error generating question:", error);
      throw error;
    }
  }
}
