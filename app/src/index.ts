import { Hono } from "hono";
import { html, raw } from "hono/html";
import {
  getEnabledProviders,
  providerRegistry,
  type ProviderEnvironment,
} from "./config/providers";
import strava from "./routes/strava";

const app = new Hono<{ Bindings: ProviderEnvironment }>();

app.route("/", strava);

app.get("/", (c) => {
  const providers = getEnabledProviders(c.env);

  return c.html(html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sign in | VibeAuth</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
        <main class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div class="mb-8 text-center">
            <h1 class="text-3xl font-semibold tracking-tight">Sign in</h1>
            <p class="mt-2 text-sm text-slate-600">Choose an account to continue to VibeAuth.</p>
          </div>
          <div class="space-y-3">
            ${providers.length
              ? providers.map(
                  (provider) => html`<a
                    href="/auth/${provider.id}/login"
                    class="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${provider.colorClass ?? ""}"
                  >
                    ${raw(provider.iconSvg ?? "")}
                    <span>Continue with ${provider.buttonLabel ?? provider.name}</span>
                  </a>`,
                )
              : html`<p class="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                  No sign-in providers are currently configured.
                </p>`}
          </div>
        </main>
      </body>
    </html>`);
});

app.get("/login", (c) => c.redirect("/"));

app.get("/auth/:providerId/login", (c) => {
  const provider = getEnabledProviders(c.env).find(
    (enabledProvider) => enabledProvider.id === c.req.param("providerId"),
  );

  if (!provider) {
    return c.text("Provider not found or disabled.", 404);
  }

  return c.text(`Redirecting to ${provider.name} authorization...`);
});

app.get("/auth/:providerId/callback", (c) => {
  const provider = providerRegistry.find(
    (registeredProvider) => registeredProvider.id === c.req.param("providerId"),
  );

  if (!provider) {
    return c.text("Provider not found.", 404);
  }

  return c.text(`Callback handler for ${provider.name}`);
});

export default app;
