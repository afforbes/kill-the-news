// Fetches BBC, Guardian and Daily Mail RSS feeds and writes headlines.json.
// Runs in GitHub Actions on a schedule; no dependencies (Node 20+).
import { readFile, writeFile } from 'node:fs/promises';

const FEEDS = [
  { source: 'BBC', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { source: 'Guardian', url: 'https://www.theguardian.com/uk/rss' },
  { source: 'Mail', url: 'https://www.dailymail.co.uk/news/index.rss' },
];
const PER_SOURCE = 30;
const OUT = 'headlines.json';

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchFeed({ source, url }) {
  const res = await fetch(url, { headers: { 'User-Agent': 'kill-the-news-bot (+https://github.com/afforbes/kill-the-news)' } });
  if (!res.ok) throw new Error(`${source}: HTTP ${res.status}`);
  const xml = await res.text();
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)];
  const seen = new Set();
  const out = [];
  for (const [item] of items) {
    const t = item.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    if (!t) continue;
    const text = decode(t[1]);
    if (text.length < 12 || seen.has(text)) continue;
    seen.add(text);
    out.push({ text, source });
    if (out.length >= PER_SOURCE) break;
  }
  if (!out.length) throw new Error(`${source}: no items parsed`);
  return out;
}

let previous = { headlines: [] };
try { previous = JSON.parse(await readFile(OUT, 'utf8')); } catch {}

const headlines = [];
for (const feed of FEEDS) {
  try {
    const got = await fetchFeed(feed);
    headlines.push(...got);
    console.log(`${feed.source}: ${got.length}`);
  } catch (e) {
    // keep the last good set for this source rather than losing it
    const kept = (previous.headlines || []).filter(h => h.source === feed.source);
    headlines.push(...kept);
    console.warn(`${e.message} — kept ${kept.length} previous`);
  }
}

const same = JSON.stringify(headlines) === JSON.stringify(previous.headlines);
if (same) {
  console.log('No change.');
} else if (!headlines.length) {
  console.error('Nothing fetched and nothing to keep.');
  process.exit(1);
} else {
  await writeFile(OUT, JSON.stringify({ updated: new Date().toISOString(), headlines }, null, 1) + '\n');
  console.log(`Wrote ${headlines.length} headlines.`);
}
