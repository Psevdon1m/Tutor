/**
 * Extracts and parses JSON from a string that might contain code blocks and escape characters
 * @param rawString The raw string containing JSON possibly wrapped in code blocks
 * @returns Parsed JSON object
 */
export function parseResponseJson(rawString: string): any {
  try {
    // Try to directly parse first
    try {
      return JSON.parse(rawString);
    } catch {
      // Proceed with extraction methods
    }

    // Method 1: Extract from markdown code blocks
    const jsonBlockRegex = /```(?:json)?\n([\s\S]*?)\n```/;
    const match = rawString.match(jsonBlockRegex);

    if (match) {
      return JSON.parse(match[1]);
    }

    // Method 2: Look for JSON-like content between curly braces
    const potentialJson = rawString.match(/\{[\s\S]*\}/);
    if (potentialJson) {
      return JSON.parse(potentialJson[0]);
    }

    // If we got here, none of the methods worked
    throw new Error("Could not extract JSON from response");
  } catch (error: any) {
    console.error("Error parsing JSON response:", error);
    throw new Error(`Failed to parse JSON from response: ${error.message}`);
  }
}
