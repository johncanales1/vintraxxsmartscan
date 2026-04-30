/**
 * escape-html — minimal HTML-entity escaper for user-supplied text that we
 * interpolate into outbound email templates.
 *
 * CRITICAL #8 background: previously the dealer/schedule/admin email
 * builders did `${data.name}` directly inside a `<div>`. A malicious user
 * submitting `<script>...` or `<a href="phishing">` shipped that markup to
 * recipients verbatim — at minimum a phishing vector, at worst a way to
 * smuggle CSS/JS into operator inboxes.
 *
 * We deliberately avoid pulling in a full templating library: the surface
 * area is small (a few HTML mail templates), and a 5-character replace is
 * easy to audit. If we ever need a full HTML sanitiser (e.g. dealers can
 * insert rich-text bodies), switch to `sanitize-html` and DROP this file.
 *
 * Standard set per the OWASP HTML escaping rule. We intentionally do NOT
 * encode `/` since none of our templates put user values inside `<script>`
 * blocks or attribute URLs without their own quoting.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const HTML_ESCAPE_RE = /[&<>"']/g;

/**
 * Escape a value for safe embedding inside an HTML element body or attribute.
 *
 * Accepts `unknown` so callers don't have to coerce to string at every site
 * — `null`, `undefined`, numbers and booleans are converted to a safe empty
 * or printable representation.
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input).replace(HTML_ESCAPE_RE, (c) => HTML_ESCAPE_MAP[c] ?? c);
}
