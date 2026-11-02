// Handles an author may never take. Copy of src/lib/reserved-handles.mjs in the
// cse.ac site repo, plus the site owner's own handles (their posts live in the
// site repo, not here). Keep in sync when the site's list changes.
//
// Two sources of collisions:
// - Static route segments / root files: /<handle> would shadow (or be shadowed by)
//   a page or asset directory.
// - Infra subdomains: <handle>.cse.ac is served as the author's vanity host, so
//   labels with their own DNS / workers must stay out.

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "cdn",
  "static",
  "assets",
  "mail",
  "mx",
  "ns",
]);

export const RESERVED_HANDLES = new Set([
  ...RESERVED_SUBDOMAINS,
  // locale trees in dist/
  "ko",
  "en",
  // pages
  "page",
  "trends",
  "about",
  "write",
  "privacy",
  "terms",
  "404",
  // root asset / data directories
  "data",
  "media",
  "fonts",
  "images",
  "_astro",
  // retired routes still redirected by the worker
  "my",
  "login",
  "logout",
  "settings",
  "onboarding",
  "pending",
  "auth",
  "editor",
  "dashboard",
  // the site owner's handles
  "jun",
]);

export const HANDLE_PATTERN = /^[a-z0-9-]+$/;

/** Why a handle can't be used, or null when it's fine. */
export function handleProblem(handle) {
  if (!HANDLE_PATTERN.test(handle)) return "invalid";
  if (RESERVED_HANDLES.has(handle)) return "reserved";
  return null;
}
