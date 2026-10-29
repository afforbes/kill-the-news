# Kill the News

A three.js browser game. Real headlines from the BBC, the Guardian and the Daily Mail fly at you; tap them to destroy them before they hit. The grimmer the headline, the more taps it takes. It starts slow and gets faster.

## How the headlines get here

Browsers can't read the news sites' RSS feeds directly (no CORS headers), so a GitHub Action does it:

- `.github/workflows/headlines.yml` runs every 30 minutes (and on demand from the Actions tab).
- `scripts/fetch-headlines.mjs` fetches the three feeds and writes `headlines.json`, committing only when the headlines change. If one feed fails, that paper's previous headlines are kept.
- `index.html` loads `headlines.json` from the same site. With no file, it falls back to invented sample headlines.

Players can also paste their own headlines from the start screen.

## Setup

1. **Settings → Pages**: Source "Deploy from a branch", branch `main`, folder `/ (root)`.
2. **Settings → Actions → General → Workflow permissions**: "Read and write permissions".
3. **Actions → Update headlines → Run workflow** to fetch the first batch.

GitHub pauses scheduled workflows on public repos after 60 days without activity. If headlines stop updating, re-enable the workflow from the Actions tab.

## Severity

Each headline is scored 1–6 from its words (deaths, war and disasters score high; politics and prices in the middle; animals and celebrities low). That number is how many taps it takes and how much damage it does if it reaches you. The keyword list is `WEIGHTS` in `index.html`.
