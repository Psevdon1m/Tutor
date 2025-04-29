const OpenAI = require("openai");

const { Subject } = require("../types/subject");
const { parseResponseJson } = require("../utils/json-parser");

export class OpenAIService {
  private openai: typeof OpenAI;
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
  private getSystemPromptWithContent(subject: typeof Subject): string {
    const basePrompt = "You are an experienced tutor/mentor specializing in";

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
 Both questions and answers should be in Ukrainian and concise.`;
    }

    // For other subjects, use the standard prompts
    const subjectSpecificPrompts: Record<
      Exclude<typeof Subject, "Ukrainian">,
      string
    > = {
      English: `${basePrompt} English language. Focus on grammar, vocabulary, and practical usage. Generate questions that test understanding of English language concepts. Help students prepare for IELTS exam C1 level.`,
      "Node.JS": `${basePrompt} Node.js development. Focus on best practices, common patterns, and real-world scenarios. Generate questions about Node.js concepts, event-driven architecture, event-loop, caviats, environments. Help frontend developers prepare for Node.js technical interview asking short questions. Code blocks should be enclosed in \`\`\` tags.`,
      TypeScript: `${basePrompt} TypeScript programming. Focus on type system, interfaces, and TypeScript-specific features. Generate questions about TypeScript concepts and practical usage. Help JavaScript developers prepare for TypeScript technical interview asking short questions. Code blocks should be enclosed in \`\`\` tags.`,
      JavaScript: `${basePrompt} JavaScript programming. Focus on best practices, common patterns, and real-world scenarios. Generate questions about JavaScript concepts, event-loop, caviats and gotchas. Use leetcode problems for arrays and objects. Help developers prepare for JavaScript technical interview asking short questions. Code blocks should be enclosed in \`\`\` tags.`,
      React: `${basePrompt} React programming. Focus on best practices, common patterns, and real-world scenarios. Generate questions about React concepts, APIs, fetching and storing data, and problem-solving. Help developers prepare for React technical interview asking short questions. Code blocks should be enclosed in \`\`\` tags.`,
      Vue: `${basePrompt} Vue programming. Focus on best practices, Vue 3 composition API, common patterns, and real-world scenarios. Generate questions about Vue concepts, Pinia, vue-router, typescript in components. Help develpers prepare for Vue technical interview asking short questions. Code blocks should be enclosed in \`\`\` tags.`,
    };

    // Since we already handled Ukrainian case above, we can return directly
    return subjectSpecificPrompts[
      subject as Exclude<typeof Subject, "Ukrainian">
    ];
  }

  /**
   * Generates a question and answer based on subject, using PDF URL for Ukrainian
   */
  async generateQuestion(
    subject: typeof Subject
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
