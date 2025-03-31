const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

/**
 * Extracts text content from a PDF file
 * @param filePath Path to the PDF file
 * @returns Promise with the extracted text content
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);

    // Parse the PDF
    const data = await pdfParse(dataBuffer);

    // Return the text content
    return data.text;
  } catch (error: any) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Gets the path to the Ukrainian knowledge base PDF
 * @returns Absolute path to the Ukrainian knowledge base PDF
 */
export function getUkrainianKnowledgeBasePath(): string {
  return path.resolve(__dirname, "../../assets/knowledge-base/source.pdf");
}
