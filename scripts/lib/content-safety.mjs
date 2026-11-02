// Content rules shared by the CI ownership check (scripts/ci/check-ownership.mjs)
// and the guest-content importer (scripts/fetch-guest-content.mjs). Plain .mjs,
// no dependencies, so it also runs as a copy in the public guest repo
// (cseacademic/public), whose CI has no node_modules.
//
// Post bodies are rendered as raw HTML (set:html) on the site's own origin, so
// script-capable HTML in Markdown is rejected.

export const MAX_IMAGE = 5 * 1024 * 1024; // mirrored by src/editor/publish.ts
export const MAX_MD = 1024 * 1024;

// Images only (no SVG: it can carry script).
export const MEDIA_NAME = /^[\w.-]+\.(webp|png|jpe?g|gif)$/i;

const HTML_RULES = [
  [/<\s*script\b/i, "<script>"],
  [/<[^>]+\son[a-z]+\s*=/i, "inline event handler (on…=)"],
  [/javascript\s*:/i, "javascript: URL"],
  [/vbscript\s*:/i, "vbscript: URL"],
  [/data\s*:\s*text\/html/i, "data:text/html URL"],
  [/<\s*(object|embed|form|meta|link|base|style)\b/i, "disallowed HTML element"],
  // The editor's YouTube block is the only iframe allowed (src/editor/youtube.ts).
  [/<\s*iframe\b(?![^>]*\ssrc="https:\/\/www\.youtube\.com\/embed\/[\w-]+")/i, "non-YouTube <iframe>"],
];

/** Problems with a Markdown file's text ([] when it's fine). */
export function htmlProblems(text) {
  return HTML_RULES.filter(([re]) => re.test(text)).map(([, what]) => `contains ${what}`);
}

// Same shape as GitHub logins.
const GITHUB_LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

const isStr = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const isHttps = (v) => typeof v === "string" && /^https:\/\/[^\s"'<>]+$/i.test(v);
const isOwnMedia = (v, handle) =>
  typeof v === "string" && v.startsWith(`/media/${handle}/`) && MEDIA_NAME.test(v.slice(`/media/${handle}/`.length));

/** A URL a post or profile of `handle` may point at for an image (og, avatar). */
export const isSafeImageUrl = (v, handle) => isHttps(v) || isOwnMedia(v, handle);

/**
 * Problems with an author profile (src/content/authors/<handle>.json), parsed.
 * Only the fields the site renders are checked; unknown fields are dropped by
 * the importer.
 */
export function authorProblems(profile, handle) {
  const out = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return ["not a JSON object"];
  if (profile.handle !== handle) out.push(`"handle" must be "${handle}"`);
  if (!isStr(profile.display_name, 80)) out.push(`"display_name" must be 1–80 characters`);
  if (profile.bio != null && !(typeof profile.bio === "string" && profile.bio.length <= 1000)) {
    out.push(`"bio" must be a string of at most 1000 characters`);
  }
  if (profile.avatar != null && !isSafeImageUrl(profile.avatar, handle)) {
    out.push(`"avatar" must be an https:// URL or /media/${handle}/<image>`);
  }
  if (profile.socials != null) {
    if (!Array.isArray(profile.socials) || profile.socials.length > 12) {
      out.push(`"socials" must be a list of at most 12 URLs`);
    } else if (!profile.socials.every(isHttps)) {
      out.push(`"socials" entries must be https:// URLs`);
    }
  }
  if (typeof profile.github !== "string" || !GITHUB_LOGIN.test(profile.github)) {
    out.push(`"github" must be a GitHub login`);
  }
  return out;
}
