# AGENTS.md

Instructions for AI coding agents working on dip-pdf (LocalPDF). The full rules are in [CONTRIBUTING.md](CONTRIBUTING.md); these are the ones you must not break.

## Workflow

- Never commit or push to `dev` or `main`. Create a branch from `dev` (`feat/…`, `fix/…`, `docs/…`, `chore/…`) and open a pull request into `dev`.
- Do not merge your own pull request: the maintainer, @motmot3000, decides.
- The pull request says that it is vibe coded, with your tool and model, and fills in the template: what, why, how to test, risks.
- Commit messages and pull request titles: Conventional Commits, in English, imperative mood, 50 characters or fewer. One focused change per pull request.
- Add files by name, read `git diff --staged` before committing, and never commit secrets, tokens or personal data.

## Code

- The app never uses the network: no `fetch`, XHR, WebSocket or beacon, no CDN, remote font, script or image, no telemetry. PDFs stay in the browser.
- Plain HTML, CSS and JavaScript, no build step. Do not add a dependency, a framework or a bundler unless asked.
- Vendored libraries in `js/` change only on request. Keep the upstream licence header and update `THIRD_PARTY_NOTICES.md`.
- Any change to a `.js` file or to `index.html` needs a human review by @motmot3000: say so in the pull request.

## Data and testing

- Never use real documents (pupils, staff, administrative files) as test data, and never send them to an AI service.
- There is no automated test: say in the pull request how you tested by hand (browser, PDFs used, French and English).
