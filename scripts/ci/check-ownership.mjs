// CI gate for guest-post pull requests to cseacademic/public (typically opened
// by the cse.ac /write editor from the author's fork): an author may only touch
// their own content. Same rules as the site repo's check, plus a frontmatter
// sanity check (this repo has no site build to catch broken posts).
//
// Allowed, for exactly one handle h per PR:
//   src/content/posts/h/<slug>/(ko|en).md
//   public/media/h/<name>.(webp|png|jpg|jpeg|gif)     (no SVG: it can carry script)
//   src/content/authors/h.json
// and h must belong to the PR author:
//   - existing author: authors/h.json on the base branch has github == PR author,
//     and the PR doesn't change its `handle` / `github` fields
//   - new author: the PR adds authors/h.json with handle == h, github == PR author,
//     and h is a valid, unreserved, unused handle
// Post bodies are rendered as raw HTML (set:html) on the site's own origin, so
// script-capable HTML in Markdown is rejected too.
//
// Maintainers (author_association OWNER/MEMBER/COLLABORATOR) are exempt.
//
// Env: PR_AUTHOR, AUTHOR_ASSOCIATION, BASE_SHA (set by .github/workflows/pr.yml)
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { handleProblem } from "../lib/reserved-handles.mjs";
import { authorProblems, htmlProblems, MAX_IMAGE, MAX_MD } from "../lib/content-safety.mjs";

const { PR_AUTHOR = "", AUTHOR_ASSOCIATION = "", BASE_SHA = "", GITHUB_STEP_SUMMARY } = process.env;

const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 << 20 });
const gitBuf = (...args) => execFileSync("git", args, { maxBuffer: 64 << 20 });
const exists = (rev, path) => {
  try {
    execFileSync("git", ["cat-file", "-e", `${rev}:${path}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const readJson = (rev, path) => JSON.parse(git("show", `${rev}:${path}`));

const errors = [];
const summary = (line) => GITHUB_STEP_SUMMARY && appendFileSync(GITHUB_STEP_SUMMARY, line + "\n");

function finish() {
  if (errors.length) {
    console.error("Ownership check failed:\n- " + errors.join("\n- "));
    summary("### ❌ Ownership check\n" + errors.map((e) => `- ${e}`).join("\n"));
    process.exit(1);
  }
  console.log("Ownership check passed.");
  summary("### ✅ Ownership check passed");
}

if (["OWNER", "MEMBER", "COLLABORATOR"].includes(AUTHOR_ASSOCIATION)) {
  console.log(`Maintainer (${AUTHOR_ASSOCIATION}) — skipping ownership check.`);
  process.exit(0);
}
if (!PR_AUTHOR || !BASE_SHA) {
  console.error("PR_AUTHOR and BASE_SHA are required.");
  process.exit(1);
}

const changes = git("diff", "--name-status", "--no-renames", `${BASE_SHA}...HEAD`)
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [status, path] = line.split("\t");
    return { status, path };
  });

const RULES = [
  { kind: "post", re: /^src\/content\/posts\/([^/]+)\/([a-z0-9-]+)\/(ko|en)\.md$/ },
  { kind: "media", re: /^public\/media\/([^/]+)\/[^/]+\.(webp|png|jpe?g|gif)$/i },
  { kind: "author", re: /^src\/content\/authors\/([^/]+)\.json$/ },
];

const handles = new Set();
for (const c of changes) {
  const rule = RULES.find((r) => r.re.test(c.path));
  if (!rule) {
    errors.push(`${c.path}: outside the author content area`);
    continue;
  }
  const handle = c.path.match(rule.re)[1];
  handles.add(handle);
  if (c.status === "D") continue;

  const size = Number(git("cat-file", "-s", `HEAD:${c.path}`));
  if (rule.kind === "media" && size > MAX_IMAGE) errors.push(`${c.path}: larger than 5 MB`);
  if (rule.kind === "post") {
    if (size > MAX_MD) errors.push(`${c.path}: larger than 1 MB`);
    const text = gitBuf("show", `HEAD:${c.path}`).toString("utf8");
    for (const problem of htmlProblems(text)) errors.push(`${c.path}: ${problem}`);
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!fm) errors.push(`${c.path}: missing frontmatter (--- … ---)`);
    else {
      if (!/^title:\s*\S/m.test(fm[1])) errors.push(`${c.path}: frontmatter needs a title`);
      if (!/^date:\s*"?\d{4}-\d{2}-\d{2}/m.test(fm[1])) errors.push(`${c.path}: frontmatter needs a date (YYYY-MM-DD)`);
    }
  }
  if (rule.kind === "author") {
    let profile = null;
    try {
      profile = readJson("HEAD", c.path);
    } catch {
      errors.push(`${c.path}: not valid JSON`);
    }
    if (profile) for (const p of authorProblems(profile, handle)) errors.push(`${c.path}: ${p}`);
  }
}

if (handles.size > 1) errors.push(`touches more than one author: ${[...handles].join(", ")}`);

for (const handle of handles) {
  const path = `src/content/authors/${handle}.json`;
  if (exists(BASE_SHA, path)) {
    const base = readJson(BASE_SHA, path);
    if (!base.github) {
      errors.push(`${handle}: no GitHub login on file yet — a maintainer must link it first`);
    } else if (base.github.toLowerCase() !== PR_AUTHOR.toLowerCase()) {
      errors.push(`${handle} belongs to @${base.github}, not @${PR_AUTHOR}`);
    }
    if (exists("HEAD", path)) {
      const head = readJson("HEAD", path);
      if (head.handle !== base.handle || (head.github ?? "") !== (base.github ?? "")) {
        errors.push(`${path}: "handle" and "github" can't be changed in a PR`);
      }
    } else {
      errors.push(`${path}: an author profile can't be deleted in a PR`);
    }
  } else {
    const problem = handleProblem(handle);
    if (problem) errors.push(`${handle}: handle is ${problem}`);
    if (!exists("HEAD", path)) {
      errors.push(`${handle}: new author must add ${path}`);
    } else {
      const head = readJson("HEAD", path);
      if (head.handle !== handle) errors.push(`${path}: "handle" must be "${handle}"`);
      if ((head.github ?? "").toLowerCase() !== PR_AUTHOR.toLowerCase()) {
        errors.push(`${path}: "github" must be "${PR_AUTHOR}"`);
      }
      summary(`New author: \`${handle}\` (@${PR_AUTHOR}) — merging approves them.`);
    }
  }
}

finish();
