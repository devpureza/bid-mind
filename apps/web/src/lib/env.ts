// Env exposta no frontend (apenas NEXT_PUBLIC_*) e env de servidor usada
// pelas route handlers (/api/auth/*). A `API_URL` é usada apenas server-side.

export const serverEnv = {
  API_URL: process.env.API_URL ?? "http://localhost:3001",
  GOOGLE_OAUTH_ENABLED: !!process.env.GOOGLE_OAUTH_CLIENT_ID,
};

export const publicEnv = {
  GOOGLE_OAUTH_ENABLED: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true",
};
