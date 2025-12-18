/**
 * Sanitizes error messages for user-facing display.
 * Replaces technical API errors with friendly, generic messages.
 */
export function sanitizeErrorMessage(error: any): string {
  const errorMessage = error.response?.data?.message || error.message || '';

  // List of technical error patterns to hide from users
  const technicalErrorPatterns = [
    /API key/i,
    /api.*key/i,
    /expired.*key/i,
    /renew.*key/i,
    /authentication.*failed/i,
    /unauthorized/i,
    /INVALID_ARGUMENT/i,
    /googleapis\.com/i,
    /generativelanguage/i,
    /API_KEY_INVALID/i,
  ];

  // Check if error message contains any technical patterns
  const isTechnicalError = technicalErrorPatterns.some((pattern) =>
    pattern.test(errorMessage)
  );

  // Return a generic, user-friendly message if technical error detected
  if (isTechnicalError) {
    return 'We encountered an issue generating your content. Please try again in a moment.';
  }

  // Return the original message if it's already user-friendly
  return errorMessage || 'Something went wrong. Please try again.';
}
