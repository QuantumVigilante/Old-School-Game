/**
 * @fileoverview Input sanitization utilities.
 * Prevents prompt injection and XSS when sending player input to Gemini API.
 * SECURITY: All user-facing text (voice transcripts, NPC chat) must pass through these.
 */

/** Characters and patterns that could be used for prompt injection */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /you\s+are\s+now/gi,
  /system\s*:\s*/gi,
  /\bpretend\b.*\byou\b/gi,
  /```[\s\S]*```/g,
  /<script[\s\S]*?<\/script>/gi,
  /<[^>]+>/g, // Strip all HTML tags
];

/**
 * Sanitizes player text input before sending to Gemini API.
 * Removes prompt injection attempts, HTML tags, and excessive whitespace.
 * @param {string} input - Raw player input (e.g., voice transcript or chat text)
 * @param {number} [maxLength=200] - Maximum allowed length
 * @returns {string} Sanitized input safe for API consumption
 */
export function sanitizeInput(input, maxLength = 200) {
  if (typeof input !== 'string') return '';

  let cleaned = input;

  // Apply each injection pattern
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Enforce length limit
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Validates that a string contains only safe characters for game context.
 * @param {string} input - Text to validate
 * @returns {boolean} True if input is safe
 */
export function isCleanInput(input) {
  if (typeof input !== 'string' || input.length === 0) return false;
  // Allow alphanumeric, basic punctuation, spaces
  return /^[a-zA-Z0-9\s.,!?'-]+$/.test(input);
}
