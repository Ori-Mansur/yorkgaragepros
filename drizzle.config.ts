import 'dotenv/config'; // This loads your .env file
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "turso", // Tell Drizzle you are using Turso
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});