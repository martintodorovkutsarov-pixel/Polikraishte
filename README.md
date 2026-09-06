# Поликраище — app for the village

A mobile app (React Native + Expo) with two sections:

- **Новини (News)** — read-only feed, automatically filled with articles about
  Поликраище gathered from the web.
- **Общност (Community)** — anyone can create an account and post text/photos
  for the village to see.

The project has three parts:

```
polikraishte-app/
  app/           the Expo mobile app (this is what you run to see the app)
  aggregator/    a small Node script that fetches news and stores it in Supabase
  supabase/      the database schema (run once)
  .github/workflows/fetch-news.yml   runs the aggregator automatically every hour
```

## 1. Create your Supabase project (free)

Supabase is what stores your users, posts, and news articles — think of it as
the app's backend, with no server for you to manage.

1. Go to [supabase.com](https://supabase.com), sign up, and create a new project.
2. Once it's created, open **SQL Editor** in the left sidebar, paste the entire
   contents of `supabase/schema.sql`, and click **Run**. This creates all the
   tables, security rules, and the storage bucket for post images.
3. Open **Project Settings -> API**. You'll need three values from this page:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (keep this one secret — never put it in the mobile app)

## 2. Run the mobile app

```bash
cd app
cp .env.example .env
# edit .env and paste in your Project URL and anon key from step 1

npm install
npx expo install --fix   # aligns every package version with your Expo SDK
npm start
```

This opens the Expo developer tools. Scan the QR code with the **Expo Go**
app (iOS/Android) on your phone to try it live, or press `i` / `a` in the
terminal to open an iOS/Android simulator if you have one set up.

Try it: sign up for an account (Общност tab -> Вход/Регистрация), then post
something. The News tab will be empty until you run the aggregator (next
step) at least once.

## 3. Run the news aggregator (fills the News tab)

```bash
cd aggregator
npm install

export SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # from step 1, NOT the anon key

npm run fetch
```

You should see it print how many articles it found. Reload the app and the
News tab will now show them.

`aggregator/sources.json` lists the RSS feeds it checks — right now that's a
Google News search for "Поликраище" (which already sweeps in most outlets
that mention the village) plus a local site that tags its Поликраище
coverage directly. Add more feed URLs to that file any time; no code changes
needed.

## 4. Make it run automatically, every hour

The repo includes `.github/workflows/fetch-news.yml`, a GitHub Actions
workflow that runs the aggregator on a schedule for you, for free, without
needing your own computer to be on.

1. Push this project to a GitHub repository.
2. In the repo, go to **Settings -> Secrets and variables -> Actions** and
   add two repository secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. That's it — it will run every hour on its own. You can also trigger it
   manually from the **Actions** tab (**Fetch village news -> Run workflow**)
   to test it immediately.

## 5. Moderation

Posts get a "Докладвай" (Report) button. Once a post collects 5 reports it's
automatically hidden from the feed pending your review — you can review
reported posts directly in Supabase's **Table Editor** (`post_reports` and
`posts` tables) and permanently delete anything that shouldn't be there.

## 6. Publishing to app stores (later)

For now, Expo Go is the fastest way to test the app on your own phone and to
let a few villagers try it. When you're ready to publish to the App Store /
Play Store, look into
[EAS Build](https://docs.expo.dev/build/introduction/) — Expo's build
service — and you'll want to add real app icons/splash screens
(`app/app.json` currently has no custom icon, so it uses Expo's default).

## Known limitations worth knowing about

- Article links from the Google News feed point through a Google redirect
  (this is how Google News RSS works) rather than straight to the original
  article — tapping still takes the reader to the right place, it just goes
  through Google first.
- There's no push notification for new posts/news yet — the feeds refresh
  when you pull-to-refresh or reopen the tab. Adding push notifications
  (`expo-notifications`) is a natural next step once the basics are working.
- Only text + a single photo per post for now — no comments/likes yet.
