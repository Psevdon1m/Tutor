import OpenAI from "openai";
import { Subject } from "../types/subject";
import { parseResponseJson } from "../utils/json-parser";

export class OpenAIService {
  private openai: OpenAI;
  private ukrainianPdfUrl: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    // URL to the Ukrainian PDF file - replace with your actual hosted PDF URL
    this.ukrainianPdfUrl =
      process.env.UKRAINIAN_PDF_URL ||
      "https://shron1.chtyvo.org.ua/Serbenska_Oleksandra/Antysurzhyk_Vchymosia_vvichlyvo_povodytys_i_pravylno_hovoryty.pdf?";
  }

  /**
   * Gets the system prompt for a subject, including PDF URL for Ukrainian
   */
  private getSystemPromptWithContent(subject: Subject): string {
    const basePrompt = "You are an experienced tutor specializing in";

    // For Ukrainian, include the PDF URL
    if (subject === "Ukrainian") {
      return `${basePrompt} Ukrainian language. Focus on grammar, vocabulary, and cultural context.
      
Please analyze surzhyk words from this list: ${this.ukrainianPdfUrl} and their correct translation in Ukrainian. Each pair is divided by '-' sign
Example: резина – ґума.
First word is surzhyk word, second is correct translation in Ukrainian.
Generate questions and answers that:
-  help students purify Ukrainian language from surzhyk words
- give examples of how to use ukrainian words instead of russian words or russian loanwords.
- most used russian words, loanwords or surzhyk  should have correct translation in Ukrainian.
 Both questions and answers should be in Ukrainian.`;
    }

    // For other subjects, use the standard prompts
    const subjectSpecificPrompts: Record<
      Exclude<Subject, "Ukrainian">,
      string
    > = {
      English: `${basePrompt} English language. Focus on grammar, vocabulary, and practical usage. Generate questions that test understanding of English language concepts. Help students prepare for IELTS exam C1 level.`,
      "Node.js": `${basePrompt} Node.js development. Focus on best practices, common patterns, and real-world scenarios. Generate questions about Node.js concepts, APIs, and problem-solving. Help students prepare for Node.js technical interview.`,
      TypeScript: `${basePrompt} TypeScript programming. Focus on type system, interfaces, and TypeScript-specific features. Generate questions about TypeScript concepts and practical usage. Help students prepare for TypeScript technical interview.`,
    };

    // Since we already handled Ukrainian case above, we can return directly
    return subjectSpecificPrompts[subject as Exclude<Subject, "Ukrainian">];
  }

  /**
   * Generates a question and answer based on subject, using PDF URL for Ukrainian
   */
  async generateQuestion(
    subject: Subject
  ): Promise<{ question: string; answer: string; response_id: string }> {
    try {
      // Get the appropriate prompt with content
      const systemPrompt = this.getSystemPromptWithContent(subject);

      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: [
          {
            role: "developer",
            content: systemPrompt,
          },
          {
            role: "user",
            content:
              "Generate a challenging question and its detailed answer. Format the response as JSON with 'question' and 'answer' fields.",
          },
        ],
      });
      console.log({ prompt: systemPrompt });
      console.log({ output_text: response.output_text });

      const result = parseResponseJson(response.output_text);

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
