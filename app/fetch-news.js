// Fetches news about Поликраище from the RSS feeds listed in sources.json,
// deduplicates them, and upserts them into the Supabase `news_articles` table.
//
// Run manually:   npm run fetch   (inside the aggregator/ folder)
// Run on a schedule: see ../.github/workflows/fetch-news.yml
//
// Required environment variables:
//   SUPABASE_URL           - your project's URL (Project Settings -> API)
//   SUPABASE_SERVICE_ROLE_KEY - the *service role* key (NOT the anon key —
//                                this script needs to bypass RLS to write)

import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { feeds, keywords } = JSON.parse(
  readFileSync(join(__dirname, "sources.json"), "utf-8")
);

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function matchesKeywords(text) {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

async function fetchFeed(feed) {
  console.log(`Fetching: ${feed.name}`);
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PolikraishteNewsBot/1.0)" },
  });
  if (!res.ok) {
    console.warn(`  -> HTTP ${res.status}, skipping this feed`);
    return [];
  }
  const xml = await res.text();
  const parsed = xmlParser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item ?? [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .filter(Boolean)
    .map((item) => {
      const title = stripHtml(item.title);
      const summary = stripHtml(item.description);
      const source =
        (typeof item.source === "object" ? item.source["#text"] : item.source) ||
        feed.name;
      return {
        title,
        url: item.link,
        source,
        summary: summary || null,
        image_url: item?.enclosure?.["@_url"] || null,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      };
    })
    .filter((item) => item.title && item.url)
    .filter((item) =>
      feed.filterKeywords === false
        ? true
        : matchesKeywords(`${item.title} ${item.summary ?? ""}`)
    );
}

async function main() {
  const results = await Promise.allSettled(feeds.map(fetchFeed));

  const allItems = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`  -> ${result.value.length} matching item(s) from ${feeds[i].name}`);
      allItems.push(...result.value);
    } else {
      console.warn(`  -> failed to fetch ${feeds[i].name}: ${result.reason}`);
    }
  });

  const byUrl = new Map();
  for (const item of allItems) {
    if (!byUrl.has(item.url)) byUrl.set(item.url, item);
  }
  const uniqueItems = [...byUrl.values()];

  if (uniqueItems.length === 0) {
    console.log("No new items found across any feed.");
    return;
  }

  const { data, error } = await supabase
    .from("news_articles")
    .upsert(uniqueItems, { onConflict: "url" })
    .select("id");

  if (error) {
    console.error("Supabase upsert failed:", error);
    process.exit(1);
  }

  console.log(
    `Done. ${uniqueItems.length} unique item(s) fetched, ${data?.length ?? 0} saved to the database.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
