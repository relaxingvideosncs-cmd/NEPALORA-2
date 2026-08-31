/**
 * Bulletproof JSON cleaner and extractor.
 * Automatically cleans:
 * 1. Markdown code fences (```json ... ``` or ``` ...)
 * 2. Conversational text before/after the JSON object
 * 3. Smart quotes from rich text editors (“” ‘’)
 * 4. Trailing commas before closing brackets/braces
 * 5. Single-line and multi-line comments
 */
export function cleanAndExtractJSON(rawInput: string): { cleaned: string; error?: string } {
  if (!rawInput || typeof rawInput !== 'string') {
    return { cleaned: '', error: 'Input is empty' }
  }

  let text = rawInput.trim()

  // 1. Remove markdown code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  // 2. Locate the outermost JSON object boundaries { ... }
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return {
      cleaned: text,
      error: 'Could not find a valid JSON object { ... } in the provided text.',
    }
  }

  // Extract only the JSON object part (discards any AI conversational text before/after)
  text = text.slice(firstBrace, lastBrace + 1).trim()

  // 3. Normalize smart/curly quotes to standard ASCII quotes
  text = text
    .replace(/[\u201C\u201D]/g, '"') // Curly double quotes
    .replace(/[\u2018\u2019]/g, "'") // Curly single quotes

  // 4. Remove single line comments // ... but not inside URLs (http:// or https://)
  text = text.replace(/(?<!https?:)\/\/[^\n]*/g, '')

  // 5. Remove trailing commas before } or ]
  text = text
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/,\s*([}\]])/g, '$1') // Run twice for nested trailing commas

  return { cleaned: text }
}

export function safeParseArticleJSON(rawInput: string): { success: boolean; data?: any; error?: string } {
  const { cleaned, error } = cleanAndExtractJSON(rawInput)

  if (error) {
    return { success: false, error }
  }

  try {
    const data = JSON.parse(cleaned)
    return { success: true, data }
  } catch (err: any) {
    // If standard parse failed, try one more aggressive cleanup for trailing commas
    try {
      const fixed = cleaned.replace(/,\s*([}\]])/g, '$1')
      const data = JSON.parse(fixed)
      return { success: true, data }
    } catch {
      return {
        success: false,
        error: `JSON syntax error: ${err.message}. Please check for unescaped quotes or invalid formatting.`,
      }
    }
  }
}
