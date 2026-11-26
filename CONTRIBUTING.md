# Contributing to dip-pdf

dip-pdf (LocalPDF) is vibe coded: much of its code is written with AI assistants. These rules make sure that AI-written code still gets a serious review before anyone trusts it.

## In short

1. Branch from `dev`. Never commit directly to `dev` or `main`.
2. Open a pull request **into `dev`**.
3. Say in the pull request whether it is vibe coded. It probably is, and that is fine: just say so.
4. Have the diff reviewed by frontier AI models at maximum reasoning effort, and post the result in the pull request.
5. Any change to JavaScript is reviewed by a human: **@motmot3000**.

> [!NOTE]
> GitHub cannot enforce these rules on this repository for now: it is private on the free plan, which has no protected branches, rulesets or automatic code owners. They rely on discipline, with the safeguards described below.

## Branches

| Branch | Purpose |
| --- | --- |
| `dev` | Integration branch and default branch. Every pull request targets `dev`. |
| `main` | Updated only by merging `dev` through a pull request, when the maintainer decides. |
| `feat/…`, `fix/…`, `docs/…`, `chore/…` | Short-lived working branches, created from `dev`. |

## Pull requests

- One focused change per pull request.
- Title in [Conventional Commits](https://www.conventionalcommits.org/) form: `type(scope): subject`.
- Fill in the pull request template: what changed, why, how to test it, the risks, and how AI was involved.
- The maintainer, @motmot3000, decides when to merge.

## Say whether it is vibe coded

Every pull request states how it was produced:

- **Vibe coded**: written mostly or entirely by an AI; a human did not read every line.
- **AI-assisted**: a human wrote, or fully read and understood, every line, with AI help.
- **No AI**.

Add the tool and model, for example "OpenCode with Claude Sonnet 5.5". Vibe coded pull requests get the `vibe-coded` label. Being vibe coded is fine; hiding it is not.

## AI review

Before the human review, run the diff through frontier models at **maximum reasoning effort**. Today that means Claude Opus 5.5, Gemini 4 Neon and GPT-6.2 Astra, or their current successors: model names change often, the point is to use the strongest reasoning models available, from different vendors.

1. Ideally use all three. If you cannot, say which ones you used.
2. Give each model the same prompt (below), the full diff and the files it touches.
3. Post one comment on the pull request: for each model, its name and effort level, then each finding with your decision (fixed, or rejected and why). Add the `ai-reviewed` label.
4. Check every finding yourself. Models are sometimes wrong, and sometimes too agreeable.

The AI review is advisory. It does not replace the human review.

Never give an AI service real documents (pupils, staff, administrative files). Review the code, not the data, and test with PDFs that contain no personal data.

### Review prompt

```text
You are reviewing a pull request to dip-pdf (LocalPDF), a browser-only PDF tool for
teachers at the DIP (Geneva). It is plain HTML, CSS and JavaScript with no build step,
and it uses the vendored libraries pdf-lib and PDF.js. The code is vibe coded (largely
AI-generated) and has not been fully reviewed by a human, so do not assume it is correct.

Review the diff below with maximum rigour. For each finding give: severity (blocker,
major, minor or nit), file and line, why it matters, and a concrete fix. Do not pad the
answer: if a category has no finding, say so.

1. Sovereignty and privacy: any network request (fetch, XHR, WebSocket, beacons, images,
   fonts or scripts loaded from a URL), CDN, telemetry, analytics, and any data kept
   beyond what is needed (localStorage, IndexedDB, cookies).
2. Security: DOM injection (innerHTML, insertAdjacentHTML, unsanitised file names or PDF
   metadata written to the DOM), object URLs never revoked, eval-like code, malicious or
   malformed PDFs, denial of service (huge files, many files, huge page counts).
3. Correctness: page selection, ordering, rotation, deletion, restore, splitting, and
   page-range parsing (`1-3,5,7-9`, empty means all pages, invalid, overlapping or
   out-of-range input); several input documents; encrypted, corrupt, 0-page and 1-page
   PDFs; output file names; repeated use without reloading the page.
4. Robustness and performance: memory use with large PDFs, a frozen interface, error
   handling and user-visible error messages, cleanup of resources.
5. Interface, accessibility and i18n: French and English parity for every string,
   keyboard use, focus handling, labels and ARIA, contrast, responsive layout.
6. Maintainability: dead code, duplicated logic, unclear naming, missing comments where
   the logic is subtle, vendored library versions and licence headers against
   THIRD_PARTY_NOTICES.md.

End with a verdict (approve, approve with changes, or request changes) and the three
most important things to fix.
```

## Human review of JavaScript

All `.js` files, and `index.html` which loads them, are owned by @motmot3000 (see [`.github/CODEOWNERS`](.github/CODEOWNERS)). A pull request that changes them needs his review before it is merged.

GitHub requests code owners automatically only on public repositories or paid plans. While this repository is private on the free plan, request the review yourself: add @motmot3000 as reviewer, or mention him in the pull request. The pull request template already does the second.

## Rules for the code

- **No network from the app**: no `fetch`, XHR, WebSocket or beacon; no CDN, remote font, script or image; no analytics or telemetry.
- **Nothing leaves the device**: PDFs are processed in the browser only, and `localStorage` holds interface preferences only.
- **Plain HTML, CSS and JavaScript**: no backend and no build step, unless the maintainer decides otherwise.
- **Vendored libraries** live in `js/`. When you update one, keep its upstream licence header and update `THIRD_PARTY_NOTICES.md`.

## Testing

There is no automated test yet. Test by hand in a current browser with a few PDFs (one page, many pages, several files, an encrypted or damaged file) and check import, reorder, rotate, delete, restore, split and download, in French and in English.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), in English: `type(scope): subject`, imperative mood, 50 characters or fewer, no final period. Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`. One coherent change per commit; add a body only when the reason is not obvious.
