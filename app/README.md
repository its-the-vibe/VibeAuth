# VibeAuth

A lightweight, modular OAuth 2.0 gateway running on Cloudflare Workers that delegates authentication to social identity providers.

## Local development

```sh
npm install
cp .dev.vars.example .dev.vars
# Replace the placeholder client credentials in .dev.vars with provider credentials.
npm run dev
```

The login page shows a provider only when its client ID and secret are set. Providers can also be hidden by setting the corresponding `*_ENABLED=false` in `.dev.vars`. To disable a provider by default, set its `enabled` property to `false` in `src/config/providers.ts`. Strava sign-in uses `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, and `SESSION_SECRET`; the callback creates a seven-day signed session cookie and redirects to the protected dashboard.

The Strava OAuth routes are implemented without persistent storage. Run `npm run check` to type-check the Worker. Deploy with `npm run deploy`.
