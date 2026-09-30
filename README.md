# Location Landing Page

A Vercel-ready Next.js landing page that requests visitor location via the browser Geolocation API with full transparency and user consent.

## Quick Start

```bash
# Install dependencies
npm install

# Create your environment file
cp .env.example .env.local

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B — Git Integration

1. Push this repo to GitHub / GitLab / Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Add the environment variable below.
4. Click **Deploy**.

### Environment Variables

| Variable                    | Required | Default                  | Description                               |
| --------------------------- | -------- | ------------------------ | ----------------------------------------- |
| `NEXT_PUBLIC_REDIRECT_URL`  | No       | `https://www.google.com` | Where visitors are sent after completion   |

Set this in the Vercel dashboard under **Settings → Environment Variables**, or in your `.env.local` for local development.

---

## How It Works

1. Visitor sees a clean, transparent landing page with a **Continue** button.
2. A privacy notice explains that location will be requested.
3. Clicking **Continue** triggers the browser's Geolocation API permission prompt.
4. If the visitor **allows**, coordinates are sent to `/api/location` and logged server-side, then the visitor is redirected.
5. If the visitor **denies**, a friendly message appears with the option to continue without sharing.
6. The **Skip** button is always available to bypass location entirely.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── location/
│   │       └── route.ts      ← Server-side API endpoint
│   ├── globals.css            ← Design system & styles
│   ├── layout.tsx             ← Root layout with metadata
│   └── page.tsx               ← Landing page (client component)
.env.example                   ← Environment variable template
.env.local                     ← Your local environment (git-ignored)
vercel.json                    ← Vercel config with security headers
```

---

## Extending the API

The `/api/location` endpoint currently logs to the console. To forward data to a database or webhook, edit [`route.ts`](src/app/api/location/route.ts) — look for the `📍 LOCATION RECEIVED` comment block:

```ts
// Example: send to a webhook
await fetch(process.env.WEBHOOK_URL!, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ latitude, longitude, accuracy, timestamp }),
});
```

---

## Security

- **Input validation** — coordinates are range-checked (`-90..90`, `-180..180`), types are verified, payload size is limited.
- **Security headers** — `vercel.json` sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- **No IP collection** — the API does not read or store IP addresses.
- **Consent-first** — location is only requested after the user clicks Continue; the browser's native permission prompt is always shown.

---

## License

MIT
