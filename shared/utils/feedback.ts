export const FEEDBACK_COMMENT_MAX = 200

const SUSPICIOUS_PATTERNS: { pattern: RegExp; name: string }[] = [
  { pattern: /<\s*script/i, name: 'script_tag' },
  { pattern: /javascript:/i, name: 'javascript_protocol' },
  { pattern: /\bon\w+\s*=/i, name: 'event_handler' },
  { pattern: /vbscript:/i, name: 'vbscript_protocol' },
  { pattern: /data:text\/html/i, name: 'data_html' },
  { pattern: /\.\.\/|\.\.\\|\/etc\/passwd/i, name: 'path_traversal' },
  { pattern: /document\.cookie/i, name: 'cookie_access' },
  { pattern: /\bunion\s+select\b/i, name: 'sql_union' },
  { pattern: /\bdrop\s+table\b/i, name: 'sql_drop' },
  { pattern: /xp_cmdshell/i, name: 'sql_cmdshell' },
]

// Letters of any alphabet, digits, spaces and common punctuation. Typographic
// quotes are included because mobile keyboards insert ’ and “ ” by default.
const ALLOWED_COMMENT = /^[\p{L}\p{N}\s.,;:!?()'"’‘“”«»%€&@#+\-/]*$/u

export type CommentProblem = 'too_long' | 'invalid_characters' | 'suspicious'

export type CommentCheck =
  | { ok: true }
  | { ok: false; reason: CommentProblem; patterns: string[] }

export function checkFeedbackComment(comment: string): CommentCheck {
  if (comment.length > FEEDBACK_COMMENT_MAX) return { ok: false, reason: 'too_long', patterns: [] }
  if (!ALLOWED_COMMENT.test(comment)) return { ok: false, reason: 'invalid_characters', patterns: [] }
  const patterns = SUSPICIOUS_PATTERNS.filter(({ pattern }) => pattern.test(comment)).map(({ name }) => name)
  return patterns.length ? { ok: false, reason: 'suspicious', patterns } : { ok: true }
}

export const FEEDBACK_COMMENT_MESSAGES: Record<CommentProblem, string> = {
  too_long: `Massimo ${FEEDBACK_COMMENT_MAX} caratteri`,
  invalid_characters: 'Il commento contiene caratteri non ammessi',
  suspicious: 'Il commento contiene testo non ammesso',
}
