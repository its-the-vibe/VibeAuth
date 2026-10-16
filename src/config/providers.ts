export interface OAuthProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  iconSvg?: string;
  colorClass?: string;
  buttonLabel?: string;
}

export interface ProviderEnvironment {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_ENABLED?: string;
  META_CLIENT_ID?: string;
  META_CLIENT_SECRET?: string;
  META_ENABLED?: string;
  STRAVA_CLIENT_ID?: string;
  STRAVA_CLIENT_SECRET?: string;
  STRAVA_ENABLED?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_ENABLED?: string;
}

export const providerRegistry: readonly OAuthProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    enabled: true,
    colorClass: "border border-[#dadce0] bg-white text-[#3c4043] hover:bg-gray-50",
    iconSvg:
      '<svg aria-hidden="true" viewBox="0 0 48 48" class="h-5 w-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.02 47 31.91 47 24.55z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.93 23.93 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
  },
  {
    id: "meta",
    name: "Meta",
    enabled: true,
    buttonLabel: "Facebook",
    colorClass: "bg-[#0866ff] text-white hover:bg-[#075ce5]",
    iconSvg:
      '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 fill-current"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.09 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.88v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.09 24 12.07"/></svg>',
  },
  {
    id: "strava",
    name: "Strava",
    enabled: true,
    colorClass: "bg-[#fc4c02] text-white hover:bg-[#e64402]",
    iconSvg:
      '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 fill-current"><path d="m15.39 2.01-4.08 7.98h2.99l4.08-7.98zM7.93 9.99 0 24h5.98l4.08-7.98h-2.99l2.99-6.03z"/><path d="m15.39 2.01-4.08 7.98h2.99l4.08-7.98zM14.3 9.99 21.05 24H15.1l-4.09-7.98h2.99l-2.99-6.03z"/></svg>',
  },
  {
    id: "github",
    name: "GitHub",
    enabled: true,
    colorClass: "bg-[#24292f] text-white hover:bg-[#1b1f23]",
    iconSvg:
      '<svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5 fill-current"><path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.17 1.72 1.17 1 .1.76 2.2 3.2 1.56.1-.73.39-1.23.7-1.52-2.5-.28-5.14-1.25-5.14-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.13-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.64 5.27-5.15 5.55.4.35.75 1.03.75 2.08v3.09c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8z"/></svg>',
  },
];

export function getEnabledProviders(env: ProviderEnvironment): OAuthProviderConfig[] {
  return providerRegistry.filter((provider) => {
    const prefix = provider.id.toUpperCase();
    const enabled = env[`${prefix}_ENABLED` as keyof ProviderEnvironment];
    const clientId = env[`${prefix}_CLIENT_ID` as keyof ProviderEnvironment];
    const clientSecret = env[`${prefix}_CLIENT_SECRET` as keyof ProviderEnvironment];

    return (
      provider.enabled &&
      enabled?.toLowerCase() !== "false" &&
      Boolean(clientId?.trim()) &&
      Boolean(clientSecret?.trim())
    );
  });
}
